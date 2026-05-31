const express = require("express");
const router = express.Router();
const db = require("../db"); 

// 1. Ελεγχος (GET)
router.get("/check", async (req, res) => {
  const { user_id, activity_id } = req.query;
  if (!user_id || !activity_id) return res.json({ isLiked: false });

  try {
    const [rows] = await db.query(
      "SELECT * FROM favourites WHERE user_id = ? AND activity_id = ?",
      [user_id, activity_id]
    );
    res.json({ isLiked: rows.length > 0 });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. Προσθήκη (POST)
router.post("/add", async (req, res) => {
  const { user_id, activity_id } = req.body;
  try {
    await db.query("INSERT IGNORE INTO favourites (user_id, activity_id) VALUES (?, ?)", [user_id, activity_id]);
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Αφαίρεση (DELETE)
router.delete("/remove", async (req, res) => {
  const { user_id, activity_id } = req.body;
  try {
    await db.query("DELETE FROM favourites WHERE user_id = ? AND activity_id = ?", [user_id, activity_id]);
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. Λήψη όλων των αγαπημένων ενός χρήστη (GET /:user_id)
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    // Επιλέγουμε μόνο το activity_id
    const [rows] = await db.query(
      "SELECT activity_id FROM favourites WHERE user_id = ?", 
      [user_id]
    );
    
    // --- Η ΔΙΟΡΘΩΣΗ ΕΙΝΑΙ ΕΔΩ ---
    // Μετατρέπουμε το [{ activity_id: 1 }, { activity_id: 5 }] σε [1, 5]
    const ids = rows.map(row => row.activity_id);
    
    res.json(ids); // Στέλνουμε καθαρή λίστα αριθμών
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
module.exports = router;