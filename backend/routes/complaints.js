const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Officer = require('../models/Officer');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// GVMC Zones center coordinate mappings
const GVMC_ZONES = [
  { name: "Bheemunipatnam Zone", lat: 17.8900, lng: 83.4450 },
  { name: "Madhurawada Zone", lat: 17.7980, lng: 83.3440 },
  { name: "East Zone", lat: 17.7200, lng: 83.3150 },
  { name: "North Zone", lat: 17.7400, lng: 83.2900 },
  { name: "South Zone", lat: 17.6900, lng: 83.2900 },
  { name: "West Zone", lat: 17.7200, lng: 83.2500 },
  { name: "Pendurthi Zone", lat: 17.7800, lng: 83.1800 },
  { name: "Gajuwaka Zone", lat: 17.6900, lng: 83.2100 },
  { name: "Aganampudi Zone", lat: 17.6500, lng: 83.1300 },
  { name: "Anakapalli Zone", lat: 17.6890, lng: 83.0020 }
];

// Haversine distance calculator to detect nearest GVMC Zone
const calculateNearestZone = (lat, lng) => {
  let nearestZone = GVMC_ZONES[2].name; // default East Zone
  let minDistance = Infinity;

  const toRad = (value) => (value * Math.PI) / 180;

  GVMC_ZONES.forEach(zone => {
    const dLat = toRad(zone.lat - lat);
    const dLng = toRad(zone.lng - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(zone.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km

    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone.name;
    }
  });

  return nearestZone;
};

// @route   POST /api/complaints
// @desc    Submit a new complaint with media uploads and run smart routing
// @access  Private (Citizen only)
router.post('/', authMiddleware('citizen'), upload.array('media', 5), async (req, res) => {
  const { title, description, category, department, latitude, longitude, address, priority, citizenName, citizenPhone } = req.body;

  if (!title || !description || !category || !department || !latitude || !longitude) {
    return res.status(400).json({ message: 'All required fields must be supplied.' });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // 1. Detect nearest GVMC zone using Geolocation mapping
    const detectedZone = calculateNearestZone(lat, lng);

    // 2. Routing: Find officer registered for this department and zone
    const matchingOfficer = await Officer.findOne({
      department,
      zone: detectedZone,
      status: 'active'
    });

    // Generate unique tracking number (GVMC-YYYY-XXXXXX)
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const trackingId = `GVMC-2026-${randomDigits}`;

    // Collect uploaded media URLs
    const mediaUrls = [];
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        // save relative path accessible by frontend static assets
        mediaUrls.push(`/uploads/${file.filename}`);
      });
    }

    const officerId = matchingOfficer ? matchingOfficer._id : null;
    const officerName = matchingOfficer ? matchingOfficer.name : 'Pending Department Assignment';
    const status = matchingOfficer ? 'Assigned' : 'Received';

    const complaintData = {
      trackingId,
      title,
      description,
      category,
      department,
      zone: detectedZone,
      location: {
        latitude: lat,
        longitude: lng,
        address: address || 'Detected Location, Visakhapatnam'
      },
      priority: priority || 'Medium',
      status,
      citizenId: req.user.id,
      citizenName: citizenName || req.user.name,
      citizenPhone: citizenPhone || '',
      officerId,
      officerName,
      mediaUrls,
      timeline: [
        {
          status: 'Submitted',
          remarks: 'Complaint registered by citizen.',
          updatedBy: req.user.name
        }
      ]
    };

    if (matchingOfficer) {
      complaintData.timeline.push({
        status: 'Assigned',
        remarks: `Complaint automatically assigned to ${matchingOfficer.name}.`,
        updatedBy: 'CivicMind AI Router'
      });
    }

    const complaint = await Complaint.create(complaintData);

    // Create notifications
    await Notification.create({
      userId: req.user.id,
      title: 'Complaint Registered',
      message: `Your complaint has been logged. Tracking ID: ${trackingId}`
    });

    if (matchingOfficer) {
      await Notification.create({
        userId: matchingOfficer._id,
        title: 'New Complaint Assigned',
        message: `Grievance ${trackingId} has been auto-routed to your department dashboard.`
      });
    }

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating complaint.' });
  }
});

// @route   GET /api/complaints/my
// @desc    Get all complaints reported by the logged in citizen
// @access  Private (Citizen)
router.get('/my', authMiddleware('citizen'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizenId: req.user.id });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user complaints.' });
  }
});

// @route   GET /api/complaints/assigned
// @desc    Get complaints assigned to the logged in department officer
// @access  Public (Originally Private)
router.get('/assigned', authMiddleware('officer'), async (req, res) => {
  try {
    const { department, zone } = req.query;
    let query = {};
    
    if (department && department !== 'All') {
      query.department = department;
    }
    if (zone && zone !== 'All') {
      query.zone = zone;
    }

    const complaints = await Complaint.find(query);
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching officer complaints.' });
  }
});

// @route   GET /api/complaints/tracking/:trackingId
// @desc    Retrieve complaint lifecycle data publicly via tracking ID
// @access  Public
router.get('/tracking/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.body.trackingId || req.params.trackingId });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint tracking ID not found.' });
    }
    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving tracking data.' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get detailed complaint status
// @access  Public (Originally Private)
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Auth verification bypassed for public access
    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching complaint.' });
  }
});

// @route   PATCH /api/complaints/:id/status
// @desc    Update complaint status (Received ➔ In Progress ➔ Resolved ➔ Closed) and upload progress photos
// @access  Private (Officer, Admin)
router.patch('/:id/status', authMiddleware(['officer', 'admin']), upload.array('progressPhotos', 3), async (req, res) => {
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Please provide status update.' });
  }

  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Verify officer assignment bypassed for public access

    // Process progress proof photos
    const newPhotos = [];
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        newPhotos.push(`/uploads/${file.filename}`);
      });
    }

    // Update object building
    const updateObj = { status };
    if (remarks) {
      updateObj.remarks = remarks;
    }

    const pushObj = {
      timeline: {
        status,
        remarks: remarks || `Complaint status updated to ${status}.`,
        updatedBy: req.user.name
      }
    };

    if (newPhotos.length) {
      pushObj.progressPhotos = { $each: newPhotos }; // local db handler or mongoose handler
    }

    // Run updates
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateObj,
        $push: {
          timeline: {
            status,
            remarks: remarks || `Complaint status updated to ${status}.`,
            updatedBy: req.user.name,
            updatedAt: new Date()
          },
          ...(newPhotos.length && { progressPhotos: { $each: newPhotos } }) // standard mongoose syntax
        }
      },
      { new: true }
    );

    // If localDB was used, we also handle updating the arrays manually within the wrapper
    // which our ModelWrapper class already supports!

    // Notify citizen about the update
    await Notification.create({
      userId: complaint.citizenId || '60c72b2f9b1d8a2c28654877',
      title: `Complaint Status: ${status}`,
      message: `Your grievance ${complaint.trackingId} has been updated to "${status}". Remarks: ${remarks || 'None'}`
    });

    res.json(updatedComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating complaint.' });
  }
});

module.exports = router;
