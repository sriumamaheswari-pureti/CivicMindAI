const mongoose = require('mongoose');
const ModelWrapper = require('./dbWrapper');

const chatHistorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const MongooseChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
const ChatHistory = new ModelWrapper('chatHistories', MongooseChatHistory);

module.exports = ChatHistory;
