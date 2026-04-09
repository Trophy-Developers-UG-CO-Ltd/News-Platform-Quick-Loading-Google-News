// AdOrder Model for ad marketplace
const mongoose = require('mongoose');

const adOrderSchema = new mongoose.Schema({
  clientName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, maxlength: 120 },
  adImage: { type: String, required: true, trim: true },
  targetUrl: { type: String, required: true, trim: true },
  slot: { type: String, enum: ['hero', 'sidebar', 'inline'], required: true },
  budget: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'active', 'rejected', 'exhausted'], default: 'pending', index: true },
  impressionsPurchased: { type: Number, required: true, min: 0 },
  impressionsUsed: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', trim: true },
}, { timestamps: true });

adOrderSchema.index({ slot: 1, status: 1 });

module.exports = mongoose.model('AdOrder', adOrderSchema);
