const cron = require("node-cron");
const Capsule = require("../models/Capsule");
const GhostPost = require("../models/GhostPost");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/email");
const socketManager = require("../socket");

function startLifecycleEngine() {
  // Every minute: unlock timed capsules whose unlock time has passed
  cron.schedule("* * * * *", async () => {
    try {
      const toUnlock = await Capsule.find({ status: "locked", unlockTime: { $lte: new Date() } }).populate("owner recipients");
      if (toUnlock.length > 0) {
        const ids = toUnlock.map(c => c._id);
        await Capsule.updateMany({ _id: { $in: ids } }, { $set: { status: "unlocked" } });
        
        for (const c of toUnlock) {
          const title = c.title || "A sealed capsule";
          const usersToNotify = [c.owner, ...c.recipients];
          
          for (const u of usersToNotify) {
            if (!u) continue;
            await Notification.create({
              user: u._id,
              type: "unlock",
              message: `Your capsule "${title}" has been unlocked!`,
              capsuleId: c._id
            });
            await sendEmail(u.email, `Capsule Unlocked: ${title}`, `Good news! "${title}" is now available to view.`);
          }
        }

        console.log(`[Lifecycle] Unlocked ${ids.length} capsule(s) and sent notifications.`);
        try {
          socketManager.getIO().emit("vault_update");
          socketManager.getIO().emit("new_notification");
        } catch(e) {}
      }
    } catch (err) {
      console.error("[Lifecycle] Unlock error:", err.message);
    }
  });

  // Every minute: expire auto-expire capsules
  cron.schedule("* * * * *", async () => {
    try {
      const toExpire = await Capsule.find({
        rule: "auto-expire",
        status: { $nin: ["expired", "destroyed"] },
        expiresAt: { $lte: new Date() },
      });
      if (toExpire.length > 0) {
        const ids = toExpire.map(c => c._id);
        await Capsule.updateMany({ _id: { $in: ids } }, { $set: { status: "expired" } });
        console.log(`[Lifecycle] Expired ${ids.length} capsule(s).`);
        try {
          socketManager.getIO().emit("vault_update");
          socketManager.getIO().emit("new_notification");
        } catch(e) {}
      }
    } catch (err) {
      console.error("[Lifecycle] Expire error:", err.message);
    }
  });

  // Every hour: purge expired ghost posts
  cron.schedule("0 * * * *", async () => {
    try {
      const toDelete = await GhostPost.find({ expiresAt: { $lte: new Date() } });
      if (toDelete.length > 0) {
        const ids = toDelete.map(p => p._id);
        await GhostPost.deleteMany({ _id: { $in: ids } });
        console.log(`[Lifecycle] Deleted ${ids.length} ghost post(s).`);
        try {
          socketManager.getIO().emit("ghost_update");
        } catch(e) {}
      }
    } catch (err) {
      console.error("[Lifecycle] Ghost cleanup error:", err.message);
    }
  });

  // Every 5 minutes: hard-delete any one-view capsules stuck in "destroyed" status
  // (safety net for capsules that weren't purged inline)
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await Capsule.deleteMany({
        rule: "one-view",
        status: "destroyed",
      });
      if (result.deletedCount > 0) {
        console.log(`[Lifecycle] Purged ${result.deletedCount} destroyed one-view capsule(s).`);
        try { socketManager.getIO().emit("vault_update"); } catch(e) {}
      }
    } catch (err) {
      console.error("[Lifecycle] One-view purge error:", err.message);
    }
  });

  console.log("[Lifecycle] Engine started.");
}

module.exports = { startLifecycleEngine };
