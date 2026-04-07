/**
 * Cart controller
 * @module modules/cart/cart.controller
 */

const cartService = require('./cart.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

const getCart = asyncHandler(async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const addToCart = asyncHandler(async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, productId, variantId, quantity || 1);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const updateCartItem = asyncHandler(async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user._id, req.params.itemId, quantity);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const cart = await cartService.removeFromCart(req.user._id, req.params.itemId);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const clearCart = asyncHandler(async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };

// MukonoTalks

