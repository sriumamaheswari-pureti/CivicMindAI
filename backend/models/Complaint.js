const mongoose = require('mongoose');
const ModelWrapper = require('./dbWrapper');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  remarks: { type: String },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  department: { type: String, required: true },
  zone: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { 
    type: String, 
    enum: ['Submitted', 'Received', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted' 
  },
  citizenId: { type: String, required: true },
  citizenName: { type: String },
  citizenPhone: { type: String },
  officerId: { type: String },
  officerName: { type: String },
  mediaUrls: [{ type: String }],
  remarks: { type: String },
  progressPhotos: [{ type: String }],
  timeline: [timelineSchema],
  createdAt: { type: Date, default: Date.now }
});

const MongooseComplaint = mongoose.model('Complaint', complaintSchema);
const Complaint = new ModelWrapper('complaints', MongooseComplaint);

module.exports = Complaint;
