/**
 * Admin dashboard service
 * Aggregated data for admin panel
 * @module modules/admin/admin.service
 */

const User = require('../auth/auth.model');
const Order = require('../orders/order.model');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalOrders,
    pendingOrders,
    totalRevenue,
    recentOrders,
    pendingApprovals,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email companyName'),
    User.countDocuments({ isApproved: false }),
  ]);

  return {
    totalUsers,
    totalOrders,
    pendingOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    recentOrders,
    pendingApprovals,
  };
};

module.exports = { getDashboardStats };

// MukonoTalks

