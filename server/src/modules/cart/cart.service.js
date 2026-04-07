/**
 * Cart service layer
 * @module modules/cart/cart.service
 */

const Cart = require('./cart.model');
const Product = require('../products/product.model');

/**
 * Get user's cart with populated product data
 */
const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(
    'items.product',
    'title slug price stock images variants isActive'
  );

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

/**
 * Add item to cart
 */
const addToCart = async (userId, productId, variantId, quantity) => {
  // Validate product exists and is active
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    const error = new Error('Product not found or unavailable');
    error.statusCode = 404;
    throw error;
  }

  // Validate stock
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) {
      const error = new Error('Variant not found');
      error.statusCode = 404;
      throw error;
    }
    if (variant.stock < quantity) {
      const error = new Error('Insufficient stock for this variant');
      error.statusCode = 400;
      throw error;
    }
  } else {
    if (product.stock < quantity) {
      const error = new Error('Insufficient stock');
      error.statusCode = 400;
      throw error;
    }
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  // Check if item already exists
  const existingIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      (item.variant ? item.variant.toString() : null) === variantId
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, variant: variantId, quantity });
  }

  await cart.save();

  return getCart(userId);
};

/**
 * Update item quantity in cart
 */
const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    const error = new Error('Cart not found');
    error.statusCode = 404;
    throw error;
  }

  const item = cart.items.id(itemId);
  if (!item) {
    const error = new Error('Item not found in cart');
    error.statusCode = 404;
    throw error;
  }

  if (quantity <= 0) {
    cart.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();

  return getCart(userId);
};

/**
 * Remove item from cart
 */
const removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    const error = new Error('Cart not found');
    error.statusCode = 404;
    throw error;
  }

  cart.items.pull(itemId);
  await cart.save();

  return getCart(userId);
};

/**
 * Clear entire cart
 */
const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
  return { message: 'Cart cleared' };
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };

// MukonoTalks

