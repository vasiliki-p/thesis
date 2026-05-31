const express = require("express");
const router = express.Router();
const db = require("../db"); // Βεβαιώσου ότι το path για το db είναι σωστό

// 1. Καταγραφή ενέργειας (POST /api/history)
router.post("/", async (req, res) => {
  const { user_id, activity_id, event } = req.body;
  if (!user_id || !activity_id) return res.sendStatus(400);

  try {
    // Καταγράφουμε την επίσκεψη
    await db.query(
      "INSERT INTO user_history (user_id, activity_id, event) VALUES (?, ?, ?)",
      [user_id, activity_id, event || 'view']
    );
    res.json({ message: "Logged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Db error" });
  }
});

// 2. Λήψη ιστορικού χρήστη (GET /api/history/:user_id)
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    // Χρησιμοποιούμε GROUP BY για να πάρουμε κάθε δραστηριότητα ΜΙΑ φορά
    // και MAX(event_time) για να κρατήσουμε την πιο πρόσφατη ώρα επίσκεψης.
    const sql = `
      SELECT a.*, MAX(h.event_time) as event_time 
      FROM user_history h
      JOIN activities a ON h.activity_id = a.id
      WHERE h.user_id = ?
      GROUP BY h.activity_id
      ORDER BY event_time DESC
      LIMIT 10
    `;
    
    const [rows] = await db.query(sql, [user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Db error" });
  }
});

module.exports = router;