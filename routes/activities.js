const express = require("express");
const router = express.Router();
const db = require("../db");

// γρήγορο τεστ για να δούμε ολα τα activities από τη βάση
router.get("/test", async (req, res) => {
  const [data] = await db.query("SELECT COUNT(*) as total FROM activities");
  res.json(data);
});


// φέρνουμε όλη τη λίστα με τις δραστηριότητες
router.get("/", async (req, res) => {
  const [data] = await db.query("SELECT * FROM activities");
  res.json(data);
});

// φέρνουμε λεπτομέρειες για μία συγκεκριμένη δραστηριότητα
router.get("/:id", async (req, res) => {
  try {
    const activityId = req.params.id;
    const [data] = await db.query("SELECT * FROM activities WHERE id = ?", [activityId]);

    // αν το id δεν υπάρχει στη βάση
    if (data.length === 0) {
      return res.status(404).json({ message: "Η δραστηριότητα δεν βρέθηκε" });
    }
    res.json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

module.exports = router;