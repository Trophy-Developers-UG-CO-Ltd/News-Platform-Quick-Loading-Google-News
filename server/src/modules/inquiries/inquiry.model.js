/**
 * Inquiry / Request-for-Quote Model
 * Tracks all B2B quote requests and inquiries
 * @module modules/inquiries/inquiry.model
 */

const mongoose = require('mongoose');

const inquiryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },
    sku: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    inquiryNumber: {
      type: String,
      unique: true,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      index: true,
    },

    contactName: {
      type: String,
      required: true,
    },

    contactEmail: {
      type: String,
      required: true,
    },

    contactPhone: {
      type: String,
      default: null,
    },

    items: {
      type: [inquiryItemSchema],
      validate: [v => v.length > 0, 'At least one item is required'],
    },

    message: {
      type: String,
      maxlength: 5000,
      default: '',
    },

    industry: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired'],
      default: 'new',
      index: true,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    quotedAmount: {
      type: Number,
      default: null,
    },

    quotedAt: {
      type: Date,
      default: null,
    },

    validUntil: {
      type: Date,
      default: null,
    },

    deliveryDestination: {
      type: String,
      default: null,
    },

    requiredByDate: {
      type: Date,
      default: null,
    },

    paymentTerms: {
      type: String,
      enum: ['advance', 'net-30', 'net-60', 'net-90', 'letter-of-credit', 'other', null],
      default: null,
    },

    budgetRange: {
      type: String,
      default: null,
    },

    adminNotes: {
      type: String,
      default: '',
    },

    convertedToOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ companyName: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

// Auto-generate inquiry number
inquirySchema.pre('validate', function (next) {
  if (!this.inquiryNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.inquiryNumber = `RFQ-${timestamp}-${random}`;
  }
  next();
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;

// MukonoTalks

