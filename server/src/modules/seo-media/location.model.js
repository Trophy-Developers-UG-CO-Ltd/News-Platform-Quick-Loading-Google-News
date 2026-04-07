/**
 * Local SEO — Location model
 * Stores multi-location data for LocalBusiness schema and store locator.
 * @module modules/local-seo/location.model
 */

const mongoose = require('mongoose');

const openingHoursSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: [String], default: [] },  // ['Monday', 'Tuesday', ...]
    opens:     { type: String, default: '09:00' },
    closes:    { type: String, default: '17:00' },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    description:  { type: String, trim: true, default: '' },
    phone:        { type: String, trim: true, default: '' },
    email:        { type: String, trim: true, default: '' },
    website:      { type: String, trim: true, default: '' },
    type:         { type: String, default: 'LocalBusiness' },  // LocalBusiness, Store, etc.

    address: {
      street:     { type: String, trim: true, default: '' },
      city:       { type: String, trim: true, default: '' },
      region:     { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country:    { type: String, trim: true, default: 'ZA' },
    },

    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    openingHours: {
      type: [openingHoursSchema],
      default: [],
    },

    images:  { type: [String], default: [] },
    mapEmbed: { type: String, trim: true, default: '' },

    priceRange: { type: String, trim: true, default: '' },  // e.g. "$$"
    servesCuisine: { type: [String], default: [] },
    areaServed:    { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    isPrimary:{ type: Boolean, default: false },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Location = mongoose.model('SeoLocation', locationSchema, 'seo_locations');
module.exports = Location;

// MukonoTalks

