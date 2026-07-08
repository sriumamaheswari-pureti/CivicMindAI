const mongoose = require('mongoose');
const ModelWrapper = require('./dbWrapper');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'citizen' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseUser = mongoose.model('User', userSchema);
const User = new ModelWrapper('users', MongooseUser);

module.exports = User;
