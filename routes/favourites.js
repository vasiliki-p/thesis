const express = require("express");
const router = express.Router();
const db = require("../db"); 
const authenticateToken = require("../middleware/auth"); // Εισαγωγή middleware

// Εφαρμογή του middleware σε ΟΛΑ τα παρακάτω routes του αρχείου
router.use(authenticateToken);

// 1. Έλεγχος (GET)
router.get("/check", async (req, res) => {
  const { activity_id } = req.query;
  const user_id = req.user.id; // Προέρχεται με ασφάλεια από το JWT token

  if (!activity_id) {
    return res.status(400).json({ error: "Λείπει η παράμετρος activity_id" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM favourites WHERE user_id = ? AND activity_id = ?",
      [user_id, activity_id]
    );
    res.json({ isLiked: rows.length > 0 });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

// 2. Προσθήκη (POST)
router.post("/add", async (req, res) => {
  const { activity_id } = req.body;
  const user_id = req.user.id; // Προέρχεται από το JWT token

  if (!activity_id) {
    return res.status(400).json({ error: "Λείπει το activity_id" });
  }

  try {
    await db.query("INSERT IGNORE INTO favourites (user_id, activity_id) VALUES (?, ?)", [user_id, activity_id]);
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: "Αποτυχία προσθήκης στα αγαπημένα", details: err.message });
  }
});

// 3. Αφαίρεση (DELETE)
router.delete("/remove", async (req, res) => {
  const { activity_id } = req.body;
  const user_id = req.user.id; // Προέρχεται από το JWT token

  if (!activity_id) {
    return res.status(400).json({ error: "Λείπει το activity_id" });
  }

  try {
    await db.query("DELETE FROM favourites WHERE user_id = ? AND activity_id = ?", [user_id, activity_id]);
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ error: "Αποτυχία αφαίρεσης από τα αγαπημένα", details: err.message });
  }
});

// 4. Λήψη όλων των αγαπημένων του συνδεδεμένου χρήστη
router.get("/", async (req, res) => {
  const user_id = req.user.id; // Ασφαλές, κανείς δεν μπορεί να ζητήσει αγαπημένα άλλου χρήστη άλλαζοντας το URL
  try {
    const [rows] = await db.query(
      "SELECT activity_id FROM favourites WHERE user_id = ?", 
      [user_id]
    );
    const ids = rows.map(row => row.activity_id);
    res.json(ids); 
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

module.exports = router;