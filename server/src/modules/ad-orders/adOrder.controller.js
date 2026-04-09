// AdOrder Controller
const AdOrder = require('./adOrder.model');

// POST /api/v1/ad-orders
exports.submitAdOrder = async (req, res) => {
  try {
    const { clientName, email, adImage, targetUrl, slot, budget } = req.body;
    if (!clientName || !email || !adImage || !targetUrl || !slot || !budget) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    // For simplicity, 1 UGX = 1 impression
    const impressionsPurchased = Number(budget);
    const adOrder = await AdOrder.create({
      clientName, email, adImage, targetUrl, slot, budget, impressionsPurchased
    });
    res.status(201).json({ success: true, data: adOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ad-orders (admin)
exports.listAdOrders = async (req, res) => {
  try {
    const orders = await AdOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/ad-orders/:id (admin approve/reject)
exports.updateAdOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await AdOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ads?slot=hero (smart delivery)
exports.getActiveAds = async (req, res) => {
  try {
    const { slot } = req.query;
    const ads = await AdOrder.find({
      slot,
      status: 'active',
      $expr: { $lt: ["$impressionsUsed", "$impressionsPurchased"] }
    });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
