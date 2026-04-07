/**
 * Order routes
 * @module modules/orders/order.routes
 */

const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateOrderStatusSchema, getOrdersQuerySchema } = require('./order.validation');

// User routes
router.get('/', protect, validate(getOrdersQuerySchema), orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), validate(getOrdersQuerySchema), orderController.getAllOrders);
router.put('/:id/status', protect, authorize('admin'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;

// MukonoTalks

