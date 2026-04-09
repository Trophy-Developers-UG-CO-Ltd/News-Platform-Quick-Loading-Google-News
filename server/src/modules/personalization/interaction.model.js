// Interaction model for persistent tracking
const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'view', 'click', 'scroll'
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  meta: { type: Object },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Interaction', interactionSchema);
