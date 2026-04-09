// Personalization Routes
const express = require('express');
const router = express.Router();
const controller = require('./personalization.controller');

router.post('/personalized-feed', controller.getPersonalizedFeed);
router.post('/track-interaction', controller.trackInteraction);

module.exports = router;
