const express = require("express");
const GhostPost = require("../models/GhostPost");
const socketManager = require("../socket");

const router = express.Router();

// GET /api/ghost  (Express 5: handle both with and without trailing slash)
router.get(["/", ""], async (_req, res) => {
  const posts = await GhostPost.find({ expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(posts);
});

// POST /api/ghost
router.post(["/", ""], async (req, res) => {
  const { text, ttlHours = 24 } = req.body;
  if (!text?.trim())
    return res.status(400).json({ error: "Text is required." });
  if (text.trim().length > 500)
    return res.status(400).json({ error: "Max 500 characters." });

  const ttl = Math.min(Math.max(Number(ttlHours) || 24, 1), 168);
  const expiresAt = new Date(Date.now() + ttl * 3600000);

  const post = await GhostPost.create({ text: text.trim(), expiresAt, ttlHours: ttl });
  
  try {
    socketManager.getIO().emit("ghost_update");
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }

  res.status(201).json(post);
});

module.exports = router;
