
const express = require("express");
const Article = require("../models/article.model");
const { slugify } = require("../utils/slugify");
const { setCache, getCache, redis } = require("../config/redis");

const router = express.Router();

// CREATE ARTICLE
router.post("/", async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ message: "Category is required" });
    }
    const slug = slugify(title);
    const article = await Article.create({
      title,
      content,
      slug,
      categoryId
    });
    // invalidate cache
    if (redis && redis.del) {
      await redis.del("homepage:categories");
    }
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
