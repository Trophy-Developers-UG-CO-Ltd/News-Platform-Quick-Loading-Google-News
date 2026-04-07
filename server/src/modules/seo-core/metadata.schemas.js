/**
 * SEO Metadata — sub-schema definitions
 * Mongoose sub-schemas for OpenGraph, Twitter, robots, and score history.
 * Imported by metadata.model.js to keep the main schema file concise.
 * @module modules/seo-core/metadata.schemas
 */

'use strict';

const mongoose = require('mongoose');

const openGraphSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 320 },
    image:       { type: String, trim: true },
    imageAlt:    { type: String, trim: true, maxlength: 200 },
    type:        { type: String, trim: true, default: 'website' },
    url:         { type: String, trim: true },
  },
  { _id: false }
);

const twitterSchema = new mongoose.Schema(
  {
    card:        { type: String, enum: ['summary', 'summary_large_image', 'app', 'player'], default: 'summary_large_image' },
    title:       { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 320 },
    image:       { type: String, trim: true },
    imageAlt:    { type: String, trim: true, maxlength: 200 },
    site:        { type: String, trim: true },
    creator:     { type: String, trim: true },
  },
  { _id: false }
);

const robotsSchema = new mongoose.Schema(
  {
    index:           { type: Boolean, default: true },
    follow:          { type: Boolean, default: true },
    nosnippet:       { type: Boolean, default: false },
    noarchive:       { type: Boolean, default: false },
    noimageindex:    { type: Boolean, default: false },
    maxSnippet:      { type: Number,  default: -1 },
    maxImagePreview: { type: String,  enum: ['none', 'standard', 'large'], default: 'large' },
    maxVideoPreview: { type: Number,  default: -1 },
  },
  { _id: false }
);

const scoreHistorySchema = new mongoose.Schema(
  {
    score:       { type: Number },
    readability: { type: Number },
    recordedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = { openGraphSchema, twitterSchema, robotsSchema, scoreHistorySchema };

// MukonoTalks

