/**
 * Order service layer
 * Business logic for order lifecycle
 * Orders are ONLY created after verified payment
 * @module modules/orders/order.service
 */

const Order = require('./order.model');
const Product = require('../products/product.model');
const { paginate, paginationMeta } = require('../../utils/helpers');

/**
 * Validate cart items server-side — NEVER trust frontend totals
 * @param {Array} items - Cart items from client
 * @returns {Object} Validated items with server-side prices and total
 */
const validateCartItems = async (items) => {
  if (!items || items.length === 0) {
    const error = new Error('Cart is empty');
    error.statusCode = 400;
    throw error;
  }

  const validatedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 400;
      throw error;
    }

    let price;
    let sku = '';
    let variantId = null;

    // Check variant pricing
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (!variant) {
        const error = new Error(`Variant not found for product: ${product.title}`);
        error.statusCode = 400;
        throw error;
      }
      price = variant.price || product.price;
      sku = variant.sku;
      variantId = variant._id;

      // Check variant stock
      if (variant.stock < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.title} (${variant.size})`);
        error.statusCode = 400;
        throw error;
      }
    } else {
      price = product.price;
      // Check product stock
      if (product.stock < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.title}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (!price || price <= 0) {
      const error = new Error(`Invalid price for product: ${product.title}`);
      error.statusCode = 400;
      throw error;
    }

    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    validatedItems.push({
      product: product._id,
      variant: variantId,
      title: product.title,
      sku,
      quantity: item.quantity,
      price,
      total: lineTotal,
    });
  }

  return { validatedItems, subtotal };
};

/**
 * Create order from validated payment
 * @param {Object} orderData - Order data with validated items
 * @returns {Object} Created order
 */
const createOrder = async (orderData) => {
  const order = await Order.create(orderData);
  return order;
};

/**
 * Get user orders
 */
const getUserOrders = async (userId, query) => {
  const { page, limit, skip } = paginate(query.page, query.limit);

  const filter = { user: userId };
  if (query.status) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'title slug images'),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: paginationMeta(total, page, limit),
  };
};

/**
 * Get single order by ID (user must own the order)
 */
const getOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate('items.product', 'title slug images');

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Security: user can only view own orders
  if (order.user.toString() !== userId.toString()) {
    const error = new Error('Not authorized to view this order');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

/**
 * Get all orders (admin)
 */
const getAllOrders = async (query) => {
  const { page, limit, skip } = paginate(query.page, query.limit);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.userId) filter.user = query.userId;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email companyName')
      .populate('items.product', 'title slug'),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: paginationMeta(total, page, limit),
  };
};

/**
 * Update order status (admin)
 */
const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  const update = { status, ...additionalData };

  if (status === 'shipped') update.shippedAt = new Date();
  if (status === 'delivered') update.deliveredAt = new Date();
  if (status === 'canceled') update.canceledAt = new Date();

  const order = await Order.findByIdAndUpdate(orderId, update, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Mark order as paid (called by webhook ONLY)
 */
const markOrderPaid = async (paymentIntentId) => {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!order) {
    const error = new Error('Order not found for payment intent');
    error.statusCode = 404;
    throw error;
  }

  // Prevent duplicate processing
  if (order.webhookProcessed) {
    return order;
  }

  order.status = 'paid';
  order.paidAt = new Date();
  order.webhookProcessed = true;
  await order.save();

  return order;
};

module.exports = {
  validateCartItems,
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markOrderPaid,
};

// MukonoTalks

