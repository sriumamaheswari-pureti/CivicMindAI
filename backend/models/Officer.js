const mongoose = require('mongoose');
const ModelWrapper = require('./dbWrapper');

const officerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  department: { type: String, required: true },
  zone: { type: String, required: true }, // GVMC Zone
  role: { type: String, default: 'officer' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseOfficer = mongoose.model('Officer', officerSchema);
const Officer = new ModelWrapper('officers', MongooseOfficer);

module.exports = Officer;
