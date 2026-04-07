const heroService = require("./hero.service")
const path = require('path');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { v4: uuidv4 } = require('uuid');
const { upload } = require('../../middlewares/upload.middleware');
const { uploadFile } = require('../../services/storage.service');
const {
  createHeroSchema,
  updateHeroSchema,
} = require("./hero.validation")

// Reuse shared upload middleware (memory storage, auto-routes to local or R2)
exports.upload = upload;

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }
  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  const key = `hero/${uuidv4()}${ext}`;
  const url = await uploadFile(req.file.buffer, key, req.file.mimetype);
  res.json({ success: true, url, key });
});

exports.createHero = asyncHandler(async (req, res) => {
  try {
    const { error } = createHeroSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })

    const hero = await heroService.createHero(req.body)
    res.status(201).json(hero)
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
});

exports.getActiveHeroes = asyncHandler(async (req, res) => {
  try {
    const heroes = await heroService.getActiveHeroes()
    res.json(heroes)
  } catch (err) {
    console.error('getActiveHeroes error:', err)
    res.status(500).json({ message: "Server Error", error: err.message })
  }
});

exports.getAllHeroes = asyncHandler(async (req, res) => {
  try {
    const heroes = await heroService.getAllHeroes()
    res.json(heroes)
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
});

exports.updateHero = asyncHandler(async (req, res) => {
  try {
    const { error } = updateHeroSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })

    const hero = await heroService.updateHero(req.params.id, req.body)
    res.json(hero)
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
});

exports.deleteHero = asyncHandler(async (req, res) => {
  try {
    await heroService.deleteHero(req.params.id)
    res.json({ message: "Deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
});
