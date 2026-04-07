/**
 * Cart routes
 * @module modules/cart/cart.routes
 */

const express = require('express');
const router = express.Router();

const cartController = require('./cart.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('./cart.validation');

// All cart routes require authentication
router.use(protect);

router.get('/', cartController.getCart);
router.post('/', validate(addToCartSchema), cartController.addToCart);
router.put('/:itemId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;

// MukonoTalks

