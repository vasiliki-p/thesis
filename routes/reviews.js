const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require("../middleware/auth"); // Το middleware μας

// ✅ Παίρνει όλες τις αξιολογήσεις (Είναι ανοιχτό για να τις βλέπουν όλοι)
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT reviews.*, users.username AS username, activities.title AS activity_title
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      ORDER BY reviews.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα κατά τη φόρτωση των αξιολογήσεων", details: err.message });
  }
});

// ✅ Παίρνει αξιολογήσεις για μια συγκεκριμένη δραστηριότητα (Ανοιχτό)
router.get('/:activity_id', async (req, res) => {
  try {
    const activityId = req.params.activity_id;
    const [results] = await db.query(`
      SELECT reviews.*, users.username AS username
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      WHERE reviews.activity_id = ?
      ORDER BY reviews.created_at DESC
    `, [activityId]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα κατά τη φόρτωση της δραστηριότητας", details: err.message });
  }
});

// ✅ Προσθήκη νέας αξιολόγησης (ΠΡΟΣΤΑΤΕΥΜΕΝΟ: Μόνο για συνδεδεμένους χρήστες)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Το user_id το βγάζουμε από το body! Το παίρνουμε από το req.user.id
    const { activity_id, rating, comment } = req.body;
    const user_id = req.user.id; 

    if (!activity_id || !rating) {
      return res.status(400).json({ error: 'Λείπουν υποχρεωτικά πεδία' });
    }

    const [result] = await db.query(
      `INSERT INTO reviews (user_id, activity_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [user_id, activity_id, rating, comment]
    );

    res.json({ message: 'Η αξιολόγηση προστέθηκε επιτυχώς', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Αποτυχία προσθήκης αξιολόγησης", details: err.message });
  }
});

module.exports = router;