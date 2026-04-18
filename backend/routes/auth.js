const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required." });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing)
    return res.status(409).json({ error: "Username or email already in use." });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });
  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials." });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid credentials." });

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
