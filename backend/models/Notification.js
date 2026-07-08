const mongoose = require('mongoose');
const ModelWrapper = require('./dbWrapper');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const MongooseNotification = mongoose.model('Notification', notificationSchema);
const Notification = new ModelWrapper('notifications', MongooseNotification);

module.exports = Notification;
