const mongoose = require('mongoose');

const adOrderSchema = new mongoose.Schema({
  clientName: { type: String, required: true, trim: true, maxlength: 100 },
  businessName: { type: String, trim: true, maxlength: 140, default: '' },
  email: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  headline: { type: String, trim: true, maxlength: 90, default: '' },
  description: { type: String, trim: true, maxlength: 220, default: '' },
  ctaLabel: { type: String, trim: true, maxlength: 40, default: 'Learn more' },
  adImage: { type: String, required: true, trim: true },
  targetUrl: { type: String, required: true, trim: true },
  slot: {
    type: String,
    enum: ['hero', 'sidebar', 'inline', 'news_top', 'news_in_feed', 'article_inline', 'article_footer'],
    required: true,
    index: true,
  },
  budget: { type: Number, required: true, min: 0 },
  budgetUsd: { type: Number, required: true, min: 0 },
  currency: { type: String, trim: true, default: 'usd', maxlength: 10 },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'flutterwave', 'mtn_momo', 'airtel_money'],
    default: 'stripe',
    index: true,
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'flutterwave'],
    default: 'stripe',
  },
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'approved', 'active', 'paused', 'rejected', 'exhausted', 'completed'],
    default: 'pending_payment',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  checkoutSessionId: { type: String, trim: true, default: '' },
  stripePaymentIntentId: { type: String, trim: true, default: '' },
  paymentReference: { type: String, trim: true, default: '' },
  providerTransactionId: { type: String, trim: true, default: '' },
  impressionsPurchased: { type: Number, required: true, min: 0 },
  impressionsUsed: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  paidAt: { type: Date, default: null },
  startAt: { type: Date, default: null },
  endAt: { type: Date, default: null },
  lastServedAt: { type: Date, default: null },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
}, { timestamps: true });

adOrderSchema.index({ slot: 1, status: 1, paymentStatus: 1 });
adOrderSchema.index({ checkoutSessionId: 1 }, { sparse: true });
adOrderSchema.index({ paymentReference: 1 }, { sparse: true });

module.exports = mongoose.model('AdOrder', adOrderSchema);
