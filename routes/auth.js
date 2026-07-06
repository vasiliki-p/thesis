const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// Εγγραφή νέου χρήστη  
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Ελλειπή Πεδία" });
  }

  try {
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Το email χρησιμοποιείται ήδη" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

const [result] = await db.query(
      `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    const token = jwt.sign(
      { id: userId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );


res.json({ 
        message: "Ο χρήστης εγγράφηκε επιτυχώς!",
        token,
        user: { id: userId, username, email }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Σφάλμα Σύνδεσης" });
  }
});

// Σύνδεση χρήστη  
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Ελλειπή Πεδία" });
  }

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Μη έγκυρα διαπιστευτήρια" });
    }

    const user = users[0];

    //αυστηρός έλεγχος με bcrypt
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Μη έγκυρα διαπιστευτήρια" });
    }

    // Δημιουργεί το JWT token με τα στοιχεία του χρήστη και το υπογράφει με το μυστικό κλειδί. 
    // Το token λήγει σε 12 ώρες
    const token = jwt.sign(    
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Σφάλμα Σύνδεσης" });
  }
});

module.exports = router;