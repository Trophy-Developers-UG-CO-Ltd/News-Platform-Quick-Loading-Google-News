// Analytics Routes for Interaction Analytics
const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');

router.get('/analytics/interactions/summary', controller.getInteractionSummary);

module.exports = router;
