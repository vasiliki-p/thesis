const express = require("express");
const router = express.Router();
const db = require("../db");
// Κάνουμε import το middleware που φτιάξαμε
const authenticateToken = require("../middleware/auth"); 

// ✅ Φέρνει στοιχεία χρήστη από τη βάση
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, location, interests, budget FROM users WHERE id = ?",
      [req.user.id] // Το ID έρχεται με ασφάλεια από το token
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

// ✅ Ενημέρωση στοιχείων προφίλ
router.put("/profile", authenticateToken, async (req, res) => {
  const { location, interests, budget } = req.body;
  try {
    await db.query(
      "UPDATE users SET location = ?, interests = ?, budget = ? WHERE id = ?",
      [location, interests, budget, req.user.id] // Το ID από το token
    );
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση προφίλ", details: err.message });
  }
});

module.exports = router;