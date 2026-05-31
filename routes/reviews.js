// routes/reviews.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Παίρνει όλες τις αξιολογήσεις
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT reviews.*, users.username AS username, activities.title AS activity_title
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      JOIN activities ON reviews.activity_id = activities.id
      ORDER BY reviews.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Παίρνει αξιολογήσεις για μια συγκεκριμένη δραστηριότητα
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
    res.status(500).json({ error: err.message });
  }
});

// ✅ Προσθήκη νέας αξιολόγησης
router.post('/', async (req, res) => {
  try {
    const { user_id, activity_id, rating, comment } = req.body;
    if (!user_id || !activity_id || !rating)
      return res.status(400).json({ error: 'Missing required fields' });

    const [result] = await db.query(
      `INSERT INTO reviews (user_id, activity_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [user_id, activity_id, rating, comment]
    );

    res.json({ message: 'Review added successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
