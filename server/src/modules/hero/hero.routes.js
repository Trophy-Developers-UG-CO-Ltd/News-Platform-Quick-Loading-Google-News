const express = require("express")
const router = express.Router()
const heroController = require("./hero.controller")
const { protect } = require("../../middlewares/auth.middleware")
const { authorize } = require("../../middlewares/role.middleware")

// Public: only active heroes
router.get("/active", heroController.getActiveHeroes)

// Admin-only: CRUD operations (server-side enforced)
router.post("/upload", protect, authorize('admin'), heroController.upload.single('image'), heroController.uploadImage)
router.post("/", protect, authorize('admin'), heroController.createHero)
router.get("/", protect, authorize('admin'), heroController.getAllHeroes)
router.put("/:id", protect, authorize('admin'), heroController.updateHero)
router.delete("/:id", protect, authorize('admin'), heroController.deleteHero)

module.exports = router