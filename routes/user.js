// routes/user.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware για έλεγχο token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ✅ Φέρνει στοιχεία χρήστη από τη βάση
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, location, interests, budget FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Ενημέρωση στοιχείων προφίλ
router.put("/profile", authenticateToken, async (req, res) => {
  const { location, interests, budget } = req.body;
  try {
    await db.query(
      "UPDATE users SET location = ?, interests = ?, budget = ? WHERE id = ?",
      [location, interests, budget, req.user.id]
    );
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
