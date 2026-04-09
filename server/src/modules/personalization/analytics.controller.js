// Analytics Controller for Interaction Analytics
const Interaction = require('./interaction.model');

// GET /api/analytics/interactions/summary
exports.getInteractionSummary = async (req, res) => {
  try {
    // Aggregate by type
    const byType = await Interaction.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top articles by views/clicks
    const topArticles = await Interaction.aggregate([
      { $match: { type: { $in: ["view", "click"] } } },
      { $group: { _id: { articleId: "$articleId", type: "$type" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Recent interactions
    const recent = await Interaction.find().sort({ createdAt: -1 }).limit(20).lean();

    res.json({
      success: true,
      byType,
      topArticles,
      recent
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
