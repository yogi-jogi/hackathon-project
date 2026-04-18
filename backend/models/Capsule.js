const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    title: { type: String, default: "Untitled Capsule", maxlength: 100 },
    text: { type: String, default: "" },
    isEncrypted: { type: Boolean, default: false },
    encryptionIv: { type: String, default: null },
    encryptionSalt: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaType: {
      type: String,
      enum: ["image", "audio", "video", null],
      default: null,
    },
    rule: {
      type: String,
      enum: ["timed", "one-view", "auto-expire", "none"],
      default: "none",
    },
    unlockTime: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "locked", "unlocked", "expired", "destroyed"],
      default: "locked",
    },
    tags: [{ type: String }],
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGhostPost: { type: Boolean, default: false },
    shareToken: { type: String, default: null, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Capsule", capsuleSchema);
