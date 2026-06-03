const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

// όλα τα routes εδώ θέλουν login
router.use(authenticateToken);

// καταγραφή ιστορικού (π.χ. όταν βλέπει μια δραστηριότητα)
router.post("/", async (req, res) => {
  const { activity_id, event } = req.body;
  const user_id = req.user.id; 

  if (!activity_id) {
    return res.status(400).json({ error: "Λείπει το activity_id" });
  }

  try {
    await db.query(
      "INSERT INTO user_history (user_id, activity_id, event) VALUES (?, ?, ?)",
      [user_id, activity_id, event || 'view']
    );
    res.json({ message: "Logged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

// φέρνουμε το ιστορικό του χρήστη
router.get("/", async (req, res) => {
  const user_id = req.user.id; 
  try {
    const sql = `
      SELECT a.*, MAX(h.event_time) as event_time 
      FROM user_history h
      JOIN activities a ON h.activity_id = a.id
      WHERE h.user_id = ?
      GROUP BY h.activity_id
      ORDER BY event_time DESC
      LIMIT 10
    `;
    
    const [data] = await db.query(sql, [user_id]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

module.exports = router;