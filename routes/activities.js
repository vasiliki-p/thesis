const express = require("express");
const router = express.Router();
const db = require("../db");

// Test route
router.get("/test", async (req, res) => {
  const [rows] = await db.query("SELECT COUNT(*) as total FROM activities");
  res.json(rows);
});

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM activities");
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  try {
    const activityId = req.params.id;
    const [rows] = await db.query("SELECT * FROM activities WHERE id = ?", [activityId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Η δραστηριότητα δεν βρέθηκε" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

module.exports = router;