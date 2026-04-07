/**
 * Order controller
 * Enterprise audit logging on status changes
 * @module modules/orders/order.controller
 */

const orderService = require('./order.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  try {
    const result = await orderService.getUserOrders(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private (owner only)
 */
const getOrderById = asyncHandler(async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders/admin/all
 * @access  Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Update order status (admin)
 * @route   PUT /api/orders/:id/status
 * @access  Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status, trackingNumber, cancelReason } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, {
      trackingNumber,
      cancelReason,
    });

    AuditService.log({
      action: 'ORDER_STATUS_CHANGE',
      req,
      targetModel: 'Order',
      targetId: req.params.id,
      targetIdentifier: order.orderNumber,
      changes: { after: { status, trackingNumber, cancelReason } },
      metadata: { previousStatus: order.statusTimeline?.slice(-2, -1)[0]?.status },
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = { getMyOrders, getOrderById, getAllOrders, updateOrderStatus };

// MukonoTalks

