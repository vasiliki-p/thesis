const express = require("express");
const router = express.Router();
const db = require("../db"); 
const authenticateToken = require("../middleware/auth"); 

// όλα τα routes εδώ θέλουν login
router.use(authenticateToken);

// τσεκάρουμε αν το έχει ήδη στα αγαπημένα
router.get("/check", async (req, res) => {
  const { activity_id } = req.query;
  const user_id = req.user.id; // με ασφάλεια από το JWT token

  if (!activity_id) {
    return res.status(400).json({ error: "Λείπει η παράμετρος activity_id" });
  }

  try {
    const [data] = await db.query(
      "SELECT * FROM favourites WHERE user_id = ? AND activity_id = ?",
      [user_id, activity_id]
    );
    // αν βρήκε έστω και ένα αποτέλεσμα, επιστρέφει true
    res.json({ isLiked: data.length > 0 });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

// προσθήκη στα αγαπημένα
router.post("/add", async (req, res) => {
  const { activity_id } = req.body;
  const user_id = req.user.id; // JWT token

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

// αφαίρεση από τα αγαπημένα
router.delete("/remove", async (req, res) => {
  const { activity_id } = req.body;
  const user_id = req.user.id; //  από το JWT token

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

// φέρνουμε όλα τα αγαπημένα του χρήστη
router.get("/", async (req, res) => {
  const user_id = req.user.id; 
  try {
    const [data] = await db.query(
      "SELECT activity_id FROM favourites WHERE user_id = ?", 
      [user_id]
    );
    const ids = data.map(row => row.activity_id);
    res.json(ids); 
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

module.exports = router;