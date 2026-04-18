require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const socketManager = require("./socket");
const { startLifecycleEngine } = require("./jobs/lifecycle");

const authRoutes = require("./routes/auth");
const capsuleRoutes = require("./routes/capsules");
const vaultRoutes = require("./routes/vault");
const friendRoutes = require("./routes/friends");
const ghostRoutes = require("./routes/ghostwall");
const notificationRoutes = require("./routes/notifications");
const insightsRoutes = require("./routes/insights");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketManager.init(server);
const PORT = Number(process.env.PORT) || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/capsules", capsuleRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/ghost", ghostRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/insights", insightsRoutes);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error." });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        family: 4,
      });
      console.log("[DB] Connected to MongoDB Atlas.");
    } else {
      console.warn("[DB] MONGODB_URI not set — data will not persist.");
    }

    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      startLifecycleEngine();
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();
