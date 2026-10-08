const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth"); 

// φέρνουμε τα στοιχεία του συνδεδεμένου χρήστη
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT id, username, email, location, interests, budget FROM users WHERE id = ?",
      [req.user.id] // Το ID έρχεται με ασφάλεια από το token
    );
    if (data.length === 0) return res.status(404).json({ error: "Δεν βρέθηκε ο χρήστης" });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα βάσης δεδομένων", details: err.message });
  }
});

// Ενημέρωση στοιχείων προφίλ
router.put("/profile", authenticateToken, async (req, res) => {
  const { location, interests, budget } = req.body;
  try {
    await db.query(
      "UPDATE users SET location = ?, interests = ?, budget = ? WHERE id = ?",
      [location, interests, budget, req.user.id] // Το ID από το token
    );
    res.json({ message: "Το προφίλ ενημερώθηκε επιτυχώς" });
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση προφίλ", details: err.message });
  }
});

// Endpoint για οριστική διαγραφή λογαριασμού
router.delete('/delete', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Η διαγραφή του χρήστη από τον πίνακα users. 
        // Αν έχεις ρυθμίσει σωστά τα Foreign Keys με "ON DELETE CASCADE" στη βάση σου[cite: 34], 
        // αυτό θα διαγράψει αυτόματα και το ιστορικό, τις κριτικές και τις ψήφους του.
        await db.query("DELETE FROM users WHERE id = ?", [userId]);

        res.json({ success: true, message: "Ο λογαριασμός διαγράφηκε επιτυχώς." });
    } catch (error) {
        console.error("Σφάλμα κατά τη διαγραφή λογαριασμού:", error);
        res.status(500).json({ error: "Αδυναμία διαγραφής λογαριασμού." });
    }
});

module.exports = router;