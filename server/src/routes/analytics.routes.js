const express = require("express");
const router = express.Router();

// Simple analytics dashboard endpoint (stub)
router.get("/dashboard", async (req, res) => {
  // TODO: Replace with real analytics logic
  res.json({
    status: "ok",
    message: "Analytics dashboard endpoint is working.",
    data: {
      users: 0,
      articles: 0,
      categories: 0,
      // Add more analytics fields as needed
    }
  });
});

module.exports = router;
