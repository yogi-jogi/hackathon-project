const express = require("express");
const Capsule = require("../models/Capsule");
const auth = require("../middleware/auth");
const { runInsights } = require("../services/ai");

const router = express.Router();

// GET /api/insights
router.get("/", auth, async (req, res) => {
  try {
    const uid = req.user._id;

    // Fetch all capsules for this user
    const capsules = await Capsule.find({
      $or: [{ owner: uid }, { recipients: uid }],
      isGhostPost: false,
    });

    // 1. Time Travel Forecast (count capsules unlocking this year)
    const currentYear = new Date().getFullYear();
    const unlockingThisYear = capsules.filter(c => 
      c.status === "locked" && 
      c.rule === "timed" && 
      c.unlockTime && 
      new Date(c.unlockTime).getFullYear() === currentYear
    ).length;

    // 2. Total Locked vs Unlocked
    const totalLocked = capsules.filter(c => c.status === "locked").length;
    const totalUnlocked = capsules.filter(c => c.status === "unlocked").length;
    const totalEncrypted = capsules.filter(c => c.isEncrypted).length;

    // 3. AI Analysis (only runs on unlocked unencrypted capsules)
    const aiData = runInsights(capsules);

    res.json({
      timeTravel: {
        unlockingThisYear,
        totalLocked,
        totalUnlocked,
        totalEncrypted
      },
      aiAnalysis: aiData
    });

  } catch (err) {
    console.error("[Insights Error]", err);
    res.status(500).json({ error: "Could not generate insights." });
  }
});

module.exports = router;
