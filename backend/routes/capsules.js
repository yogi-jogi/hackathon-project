const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Capsule = require("../models/Capsule");
const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg","image/png","image/gif","image/webp",
      "audio/mpeg","audio/wav","audio/webm","audio/ogg",
      "video/mp4","video/webm","video/quicktime",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

function detectMediaType(mimetype, filename = "") {
  if (mimetype && mimetype.startsWith("image/")) return "image";
  if (mimetype && mimetype.startsWith("audio/")) return "audio";
  if (mimetype && mimetype.startsWith("video/")) return "video";
  
  const ext = filename.split(".").pop().toLowerCase();
  const images = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const audios = ["mp3", "wav", "ogg", "m4a"];
  const videos = ["mp4", "webm", "mov", "avi"];
  
  if (images.includes(ext)) return "image";
  if (audios.includes(ext)) return "audio";
  if (videos.includes(ext)) return "video";
  
  return null;
}

// POST /api/capsules — create
router.post(["/", ""], auth, upload.single("media"), async (req, res) => {
  const { title, text, rule, unlockTime, expireDuration, isEncrypted, encryptionIv, encryptionSalt, mediaType } = req.body;
  const isDraft = req.body.isDraft === "true" || req.body.isDraft === true;

  if (!isDraft) {
    if (!title || !title.trim())
      return res.status(400).json({ error: "Title is required." });
    if (!rule || !["timed", "one-view", "auto-expire"].includes(rule))
      return res.status(400).json({ error: "Invalid capsule rule." });
    if (!text && !req.file)
      return res.status(400).json({ error: "Capsule must have text or media." });
  }

  const capsuleData = {
    owner: req.user._id,
    title: title?.trim(),
    text: text?.trim() || "",
    isEncrypted: isEncrypted === "true" || isEncrypted === true,
    encryptionIv: encryptionIv || null,
    encryptionSalt: encryptionSalt || null,
    rule: rule || "none",
    status: isDraft ? "draft" : "locked",
    shareToken: uuidv4(),
  };

  if (req.file) {
    capsuleData.mediaUrl = `/uploads/${req.file.filename}`;
    capsuleData.mediaType = mediaType || detectMediaType(req.file.mimetype, req.file.originalname);
  }

  if (rule === "timed") {
    if (!unlockTime)
      return res.status(400).json({ error: "Unlock time required." });
    const unlock = new Date(unlockTime);
    if (isNaN(unlock.getTime()) || unlock <= new Date())
      return res.status(400).json({ error: "Unlock time must be in the future." });
    capsuleData.unlockTime = unlock;
  }

  if (rule === "auto-expire") {
    const hours = Number(expireDuration);
    if (!hours || isNaN(hours) || hours <= 0)
      return res.status(400).json({ error: "Expire duration (hours) required." });
      
    if (unlockTime) {
      const unlock = new Date(unlockTime);
      if (isNaN(unlock.getTime()) || unlock <= new Date())
        return res.status(400).json({ error: "Unlock time must be in the future." });
      capsuleData.unlockTime = unlock;
      capsuleData.expiresAt = new Date(unlock.getTime() + hours * 3600000);
    } else {
      capsuleData.expiresAt = new Date(Date.now() + hours * 3600000);
      if (!isDraft) capsuleData.status = "unlocked";
    }
  }

  if (rule === "one-view" && !isDraft) {
    capsuleData.status = "unlocked"; // one-view capsules are unlocked by default, destroyed on view
  }

  const capsule = await Capsule.create(capsuleData);
  res.status(201).json({ message: "Capsule created.", capsule });
});

// PUT /api/capsules/:id — update draft
router.put("/:id", auth, upload.single("media"), async (req, res) => {
  const capsule = await Capsule.findById(req.params.id);
  if (!capsule) return res.status(404).json({ error: "Capsule not found." });
  if (capsule.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Access denied." });
  if (capsule.status !== "draft") return res.status(400).json({ error: "Only drafts can be edited. This capsule has already been sealed." });

  const { title, text, rule, unlockTime, expireDuration, isEncrypted, encryptionIv, encryptionSalt, mediaType } = req.body;
  const isDraft = req.body.isDraft === "true" || req.body.isDraft === true;

  if (!isDraft) {
    if (!title && !capsule.title)
      return res.status(400).json({ error: "Title is required." });
    if (!rule || !["timed", "one-view", "auto-expire"].includes(rule))
      return res.status(400).json({ error: "Invalid capsule rule." });
    if (!text && !req.file && !capsule.mediaUrl)
      return res.status(400).json({ error: "Capsule must have text or media." });
  }

  if (title !== undefined) capsule.title = title.trim();
  if (text !== undefined) capsule.text = text.trim();
  if (rule !== undefined) capsule.rule = rule;
  
  if (isEncrypted !== undefined) {
    capsule.isEncrypted = isEncrypted === "true" || isEncrypted === true;
    capsule.encryptionIv = encryptionIv || null;
    capsule.encryptionSalt = encryptionSalt || null;
  }



  if (req.file) {
    capsule.mediaUrl = `/uploads/${req.file.filename}`;
    capsule.mediaType = mediaType || detectMediaType(req.file.mimetype, req.file.originalname);
  }

  if (rule === "timed" && unlockTime) {
    const unlock = new Date(unlockTime);
    if (!isNaN(unlock.getTime()) && unlock > new Date()) {
      capsule.unlockTime = unlock;
    } else if (!isDraft) {
      return res.status(400).json({ error: "Unlock time must be in the future." });
    }
  }

  if (rule === "auto-expire" && expireDuration) {
    const hours = Number(expireDuration);
    if (hours && !isNaN(hours) && hours > 0) {
      if (unlockTime) {
        const unlock = new Date(unlockTime);
        if (!isNaN(unlock.getTime()) && unlock > new Date()) {
          capsule.unlockTime = unlock;
          capsule.expiresAt = new Date(unlock.getTime() + hours * 3600000);
        } else if (!isDraft) {
          return res.status(400).json({ error: "Unlock time must be in the future." });
        }
      } else {
        capsule.expiresAt = new Date(Date.now() + hours * 3600000);
        capsule.unlockTime = null;
      }
    } else if (!isDraft) {
      return res.status(400).json({ error: "Expire duration (hours) required." });
    }
  }

  if (!isDraft) {
    capsule.status = (capsule.rule === "one-view" || (capsule.rule === "auto-expire" && !capsule.unlockTime)) ? "unlocked" : "locked";
  }

  await capsule.save();
  res.json({ message: "Capsule updated.", capsule });
});

// GET /api/capsules/share/:token — open via public share link
router.get("/share/:token", async (req, res) => {
  const capsule = await Capsule.findOne({ shareToken: req.params.token }).populate("owner", "username");
  if (!capsule) return res.status(410).json({ error: "This capsule has already been viewed and destroyed." });

  if (capsule.status === "destroyed") {
    // Check 30-second grace period for React StrictMode
    const GRACE_PERIOD_MS = 30 * 1000;
    if (capsule.rule === "one-view" && capsule.updatedAt && (Date.now() - capsule.updatedAt.getTime() < GRACE_PERIOD_MS)) {
      return res.json(capsule);
    }
    // Already seen once — return 410 so frontend shows Destroyed screen
    return res.status(410).json({ error: "This one-view capsule has already been seen and destroyed." });
  }
  if (capsule.status === "expired") return res.status(410).json({ error: "This capsule has expired." });

  if (capsule.status === "locked") {
    if (capsule.rule === "timed" && capsule.unlockTime && new Date() >= capsule.unlockTime) {
      capsule.status = "unlocked";
      await capsule.save();
    } else {
      return res.status(423).json({ error: "Capsule is still locked.", unlockTime: capsule.unlockTime });
    }
  }

  if (capsule.rule === "one-view") {
    // Atomically mark destroyed — do NOT delete yet so second visit can show "Destroyed" screen
    await Capsule.updateOne({ _id: capsule._id }, { $set: { status: "destroyed" } });
    // Return data for this first (and only) view
    return res.json(capsule);
  }

  res.json(capsule);
});

// GET /api/capsules/:id — open by ID (authenticated)
router.get("/:id", auth, async (req, res) => {
  const capsule = await Capsule.findById(req.params.id).populate("owner", "username");
  if (!capsule) {
    return res.status(410).json({ error: "This one-view capsule has already been seen and destroyed." });
  }

  const uid = req.user._id.toString();
  const isOwner = capsule.owner._id.toString() === uid;
  const isRecipient = capsule.recipients.map((r) => r.toString()).includes(uid);

  if (!isOwner && !isRecipient)
    return res.status(403).json({ error: "Access denied." });

  // ── One-view logic ────────────────────────────────────────────────────────
  if (capsule.rule === "one-view") {
    const GRACE_PERIOD_MS = 30 * 1000;
    const now = Date.now();

    if (capsule.status === "destroyed") {
      if (capsule.updatedAt && (now - capsule.updatedAt.getTime() < GRACE_PERIOD_MS)) {
        return res.json(capsule);
      }
      // Already consumed by someone — show Destroyed screen
      return res.status(410).json({ error: "This one-view capsule has already been seen and destroyed." });
    }

    const alreadyViewed = capsule.viewedBy.some(v => v.toString() === uid);
    if (alreadyViewed) {
      if (capsule.updatedAt && (now - capsule.updatedAt.getTime() < GRACE_PERIOD_MS)) {
        return res.json(capsule);
      }
      // This specific viewer already consumed it
      await Capsule.updateOne({ _id: capsule._id }, { $set: { status: "destroyed" } });
      return res.status(410).json({ error: "This one-view capsule has already been seen and destroyed." });
    }

    // First view — atomically mark destroyed + record viewer
    const updated = await Capsule.findOneAndUpdate(
      { _id: capsule._id, viewedBy: { $ne: req.user._id }, status: { $ne: "destroyed" } },
      { $addToSet: { viewedBy: req.user._id }, $set: { status: "destroyed" } },
      { new: true }
    );

    if (!updated) {
      // Race condition: another request beat us. Check grace period.
      const freshCapsule = await Capsule.findById(capsule._id);
      if (freshCapsule && freshCapsule.updatedAt && (now - freshCapsule.updatedAt.getTime() < GRACE_PERIOD_MS)) {
        return res.json(freshCapsule);
      }
      return res.status(410).json({ error: "This one-view capsule has already been seen and destroyed." });
    }

    // Return the capsule data for this one and only view
    return res.json(capsule);
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (capsule.status === "destroyed")
    return res.status(410).json({ error: "This capsule has been destroyed." });
  if (capsule.status === "expired")
    return res.status(410).json({ error: "Capsule expired." });

  if (capsule.status === "locked") {
    if (capsule.rule === "timed" && capsule.unlockTime && new Date() >= capsule.unlockTime) {
      capsule.status = "unlocked";
      await capsule.save();
    } else {
      return res.status(423).json({ error: "Capsule is still locked.", unlockTime: capsule.unlockTime, capsule });
    }
  }

  // Non-one-view: track viewedBy normally
  if (!capsule.viewedBy.some(v => v.toString() === uid)) {
    await Capsule.updateOne(
      { _id: capsule._id },
      { $addToSet: { viewedBy: req.user._id } }
    );
  }

  res.json(capsule);
});

// DELETE /api/capsules/:id
router.delete("/:id", auth, async (req, res) => {
  const capsule = await Capsule.findById(req.params.id);
  if (!capsule) return res.status(404).json({ error: "Capsule not found." });
  if (capsule.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not authorized." });
  await capsule.deleteOne();
  res.json({ message: "Capsule deleted." });
});

module.exports = router;
