// Personalization Controller
const Article = require('../articles/article.model');

// POST /api/personalized-feed
exports.getPersonalizedFeed = async (req, res) => {
  try {
    const { categories = [], tags = [] } = req.body;
    const filter = {
      publishStatus: 'published',
    };
    if (categories.length) filter.category = { $in: categories };
    if (tags.length) filter.tags = { $in: tags };
    const articles = await Article.find(filter)
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/track-interaction
const Interaction = require('./interaction.model');
exports.trackInteraction = async (req, res) => {
  try {
    const { type, articleId, meta } = req.body;
    const userId = req.user?._id || null;
    await Interaction.create({
      type,
      articleId,
      userId,
      meta,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
