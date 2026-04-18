const mongoose = require("mongoose");

const ghostPostSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 500 },
    expiresAt: { type: Date, required: true },
    viewCount: { type: Number, default: 0 },
    ttlHours: { type: Number, default: 24 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GhostPost", ghostPostSchema);
