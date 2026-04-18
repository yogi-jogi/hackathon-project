const express = require("express");
const User = require("../models/User");
const Capsule = require("../models/Capsule");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/friends/search?q=
router.get("/search", auth, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
    _id: { $ne: req.user._id },
  })
    .select("username email")
    .limit(10);

  res.json(users);
});

// POST /api/friends/send/:capsuleId — send capsule to a friend
router.post("/send/:capsuleId", auth, async (req, res) => {
  const { recipientId } = req.body;
  if (!recipientId)
    return res.status(400).json({ error: "Recipient ID required." });

  const capsule = await Capsule.findById(req.params.capsuleId);
  if (!capsule) return res.status(404).json({ error: "Capsule not found." });
  if (capsule.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not authorized." });

  const recipient = await User.findById(recipientId);
  if (!recipient) return res.status(404).json({ error: "Recipient not found." });

  if (!capsule.recipients.map((r) => r.toString()).includes(recipientId)) {
    capsule.recipients.push(recipientId);
    await capsule.save();
  }

  res.json({ message: `Capsule shared with ${recipient.username}.` });
});

// GET /api/friends/status/:capsuleId — view seen/destroyed status
router.get("/status/:capsuleId", auth, async (req, res) => {
  const capsule = await Capsule.findById(req.params.capsuleId)
    .populate("viewedBy", "username email")
    .populate("recipients", "username email");

  if (!capsule) return res.status(404).json({ error: "Capsule not found." });
  if (capsule.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not authorized." });

  res.json({
    recipients: capsule.recipients,
    viewedBy: capsule.viewedBy,
    status: capsule.status,
  });
});

module.exports = router;
