const express = require("express");
const Capsule = require("../models/Capsule");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/vault
router.get(["/", ""], auth, async (req, res) => {
  const capsules = await Capsule.find({
    $or: [{ owner: req.user._id }, { recipients: req.user._id }],
    isGhostPost: false,
  })
    .populate("owner", "username email")
    .populate("recipients", "username email")
    .sort({ createdAt: -1 });

  const grouped = {
    draft: capsules.filter((c) => c.status === "draft"),
    locked: capsules.filter((c) => c.status === "locked"),
    unlocked: capsules.filter((c) => c.status === "unlocked"),
    expired: capsules.filter((c) => c.status === "expired"),
    destroyed: capsules.filter((c) => c.status === "destroyed"),
  };

  res.json(grouped);
});

module.exports = router;
