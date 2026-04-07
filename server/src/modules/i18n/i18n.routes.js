/**
 * i18n routes
 * Public language resolution endpoints.
 * No authentication required — called by frontend on first page load.
 * @module modules/i18n/i18n.routes
 */

'use strict';

const express = require('express');
const router = express.Router();
const { resolve } = require('./i18n.controller');

/**
 * GET /api/i18n/resolve
 * Returns resolved language + country for this request based on:
 *   URL param → cookie → CF-IPCountry → Accept-Language → default (en)
 */
router.get('/resolve', resolve);

module.exports = router;

// MukonoTalks

