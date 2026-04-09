
const express = require("express");
const Category = require("../models/category.model");
const Article = require("../models/article.model");
const { slugify } = require("../utils/slugify");
const { setCache, getCache, redis } = require("../config/redis");

const router = express.Router();

// CREATE CATEGORY
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const slug = slugify(name);
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Category exists" });
    }
    const category = await Category.create({ name, slug });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CATEGORIES WITH ARTICLES (HOMEPAGE)
router.get("/with-articles", async (req, res) => {
  try {
    const cacheKey = "homepage:categories";
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "articles",
          localField: "_id",
          foreignField: "categoryId",
          as: "articles"
        }
      },
      {
        $match: {
          "articles.0": { $exists: true }
        }
      }
    ]);
    await setCache(cacheKey, categories, 60);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CATEGORY BY SLUG
router.get(":slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }
    const articles = await Article.find({
      categoryId: category._id,
      published: true
    }).sort({ createdAt: -1 });
    res.json({ category, articles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
