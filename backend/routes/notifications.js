const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch notifications." });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Not found." });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: "Could not update notification." });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "All marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Could not update notifications." });
  }
});

module.exports = router;
