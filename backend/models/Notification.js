const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["unlock", "expire", "destroy", "received", "system"], required: true },
  message: { type: String, required: true },
  capsuleId: { type: mongoose.Schema.Types.ObjectId, ref: "Capsule", default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", NotificationSchema);
