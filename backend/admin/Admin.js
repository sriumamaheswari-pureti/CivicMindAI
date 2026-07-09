const mongoose = require('mongoose');
const ModelWrapper = require('../models/dbWrapper');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseAdmin = mongoose.model('Admin', adminSchema);
const Admin = new ModelWrapper('admins', MongooseAdmin);

module.exports = Admin;
