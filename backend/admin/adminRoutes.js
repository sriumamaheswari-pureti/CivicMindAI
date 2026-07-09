const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Officer = require('../models/Officer');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/admin/analytics
// @desc    Get dashboard metrics (Total, Resolved, Pending, Dept stats, Zone stats)
// @access  Private (Admin only)
router.get('/analytics', authMiddleware('admin'), async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const pending = await Complaint.countDocuments({ status: { $in: ['Submitted', 'Received', 'Assigned', 'In Progress'] } });
    const citizensCount = await User.countDocuments({ role: 'citizen' });
    const officersCount = await Officer.countDocuments({ role: 'officer' });

    // Fetch all complaints to perform grouping in JS (handles local DB fallback beautifully)
    const complaints = await Complaint.find();

    // Group by department
    const deptStats = {};
    // Initialize department stats keys
    const deptList = [
      "Engineering Department", "Public Health & Sanitation Department",
      "Town Planning Department", "Water Supply Department", "Electrical Department",
      "Parks & Horticulture Department", "Revenue Department", "Health Department",
      "Urban Community Development", "Estate Department", "Finance & Accounts",
      "Information Technology Department", "Urban Biodiversity & Environment", "Disaster Management"
    ];
    deptList.forEach(d => { deptStats[d] = 0; });
    
    // Group by zone
    const zoneStats = {};
    const zoneList = [
      "Bheemunipatnam Zone", "Madhurawada Zone", "East Zone", "North Zone",
      "South Zone", "West Zone", "Pendurthi Zone", "Gajuwaka Zone",
      "Aganampudi Zone", "Anakapalli Zone"
    ];
    zoneList.forEach(z => { zoneStats[z] = 0; });

    let totalResolutionTimeMs = 0;
    let resolvedCountForAvg = 0;

    complaints.forEach(c => {
      // Increment department count
      if (deptStats[c.department] !== undefined) {
        deptStats[c.department]++;
      } else {
        deptStats[c.department] = 1;
      }

      // Increment zone count
      if (zoneStats[c.zone] !== undefined) {
        zoneStats[c.zone]++;
      } else {
        zoneStats[c.zone] = 1;
      }

      // Calculate resolution time
      if (['Resolved', 'Closed'].includes(c.status) && c.timeline) {
        const submitted = c.timeline.find(t => t.status === 'Submitted');
        const resolvedNode = c.timeline.find(t => t.status === 'Resolved' || t.status === 'Closed');
        if (submitted && resolvedNode) {
          const subDate = new Date(submitted.updatedAt || c.createdAt);
          const resDate = new Date(resolvedNode.updatedAt);
          const diff = resDate - subDate;
          if (diff > 0) {
            totalResolutionTimeMs += diff;
            resolvedCountForAvg++;
          }
        }
      }
    });

    const averageResolutionTimeHours = resolvedCountForAvg > 0
      ? Math.round((totalResolutionTimeMs / (1000 * 60 * 60 * resolvedCountForAvg)) * 10) / 10
      : 24.8; // default mock benchmark average if none resolved yet

    // Format departments for charts
    const formattedDeptStats = Object.keys(deptStats).map(key => ({
      name: key.replace(" Department", ""),
      value: deptStats[key]
    })).filter(item => item.value > 0 || deptList.slice(0, 5).map(d => d.replace(" Department", "")).includes(item.name));

    // Format zones for charts
    const formattedZoneStats = Object.keys(zoneStats).map(key => ({
      name: key.replace(" Zone", ""),
      value: zoneStats[key]
    }));

    // Geolocation coordinates of all complaints for heatmap
    const heatmapPoints = complaints.map(c => ({
      lat: c.location.latitude,
      lng: c.location.longitude,
      intensity: c.priority === 'High' ? 1.0 : c.priority === 'Medium' ? 0.6 : 0.3,
      title: c.title,
      trackingId: c.trackingId,
      status: c.status
    }));

    res.json({
      total,
      resolved,
      pending,
      citizensCount,
      officersCount,
      averageResolutionTimeHours,
      deptStats: formattedDeptStats,
      zoneStats: formattedZoneStats,
      heatmapPoints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
});

// @route   GET /api/admin/officers
// @desc    Get list of all departments heads/officers
// @access  Private (Admin only)
router.get('/officers', authMiddleware('admin'), async (req, res) => {
  try {
    const officers = await Officer.find();
    // Exclude password hash from response
    const safeOfficers = officers.map(o => ({
      id: o._id,
      name: o.name,
      email: o.email,
      phone: o.phone,
      department: o.department,
      zone: o.zone,
      status: o.status,
      createdAt: o.createdAt
    }));
    res.json(safeOfficers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving officers list.' });
  }
});

// @route   POST /api/admin/officers
// @desc    Register a new department officer
// @access  Private (Admin only)
router.post('/officers', authMiddleware('admin'), async (req, res) => {
  const { name, email, phone, department, zone, password } = req.body;

  if (!name || !email || !phone || !department || !zone || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check if officer already exists
    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) {
      return res.status(400).json({ message: 'An officer already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newOfficer = await Officer.create({
      name,
      email,
      phone,
      department,
      zone,
      passwordHash,
      role: 'officer',
      status: 'active'
    });

    res.status(201).json({
      message: 'Officer registered successfully.',
      officer: {
        id: newOfficer._id,
        name: newOfficer.name,
        email: newOfficer.email,
        phone: newOfficer.phone,
        department: newOfficer.department,
        zone: newOfficer.zone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during officer registration.' });
  }
});

// @route   PATCH /api/admin/officers/:id/status
// @desc    Activate/Deactivate officer status
// @access  Private (Admin only)
router.patch('/officers/:id/status', authMiddleware('admin'), async (req, res) => {
  const { status } = req.body; // 'active' or 'inactive'
  
  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const updatedOfficer = await Officer.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!updatedOfficer) {
      return res.status(404).json({ message: 'Officer not found.' });
    }

    res.json({ message: `Officer account status updated to ${status}.`, officer: updatedOfficer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating officer status.' });
  }
});

// @route   GET /api/admin/complaints
// @desc    Get all complaints in GVMC
// @access  Private (Admin only)
router.get('/complaints', authMiddleware('admin'), async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving complaints.' });
  }
});

module.exports = router;
