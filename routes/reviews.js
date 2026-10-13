const express = require("express");
const router = express.Router();
const db = require("../db");
const axios = require("axios");

// Φέρνουμε τις κριτικές για μια δραστηριότητα (GET /api/reviews/:activityId)
router.get("/:activityId", async (req, res) => {
    const { activityId } = req.params;

    try {
        let allReviews = [];

        // 1. Αν είναι αληθινό μέρος, ζητάμε τις κριτικές από την Google
        if (activityId.startsWith("ChI")) {
            const googleResponse = await axios.get(
                `https://places.googleapis.com/v1/places/${activityId}`,
                {
                    headers: {
                        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
                        'X-Goog-FieldMask': 'reviews' // Ζητάμε ΜΟΝΟ το πεδίο των κριτικών
                    }
                }
            );

            const googleReviews = googleResponse.data.reviews || [];

            // Μετατρέπουμε τις κριτικές της Google στη μορφή της βάσης σου
            const formattedGoogleReviews = googleReviews.map((review, index) => ({
                id: `google_${index}`, // Ψεύτικο ID για το React
                activity_id: activityId,
                user_name: review.authorAttribution?.displayName || "Χρήστης Google",
                rating: review.rating,
                comment: review.text?.text || "",
                // Αν η Google δίνει χρόνο τον κρατάμε, αλλιώς βάζουμε το τρέχον
                created_at: review.publishTime || new Date().toISOString() 
            }));

            // Προσθέτουμε τις κριτικές της Google στη λίστα μας
            allReviews = [...formattedGoogleReviews];
        }

        // 2. Ζητάμε και τις τοπικές κριτικές (αν υπάρχουν χρήστες του Pyxis που σχολίασαν)
        const [localReviews] = await db.query(
            "SELECT * FROM reviews WHERE activity_id = ? ORDER BY created_at DESC", 
            [activityId]
        );

        // Ενώνουμε τις κριτικές της Google με αυτές των χρηστών σου (αν υπάρχουν)
        allReviews = [...localReviews, ...allReviews];
        
        res.json(allReviews);

    } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση κριτικών:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Σφάλμα διακομιστή" });
    }
});

// Προσθήκη νέας κριτικής από χρήστη του Pyxis (POST /api/reviews)
router.post("/", async (req, res) => {
    // Ανάλογα με τα πεδία που έχεις στον πίνακά σου (πχ. name, user_name, text, comment κλπ)
    const { activity_id, user_name, rating, comment } = req.body; 
    
    try {
        // Αποθηκεύουμε στη βάση μας το σχόλιο, ακόμα και αν το μαγαζί είναι από την Google!
        const [result] = await db.query(
            "INSERT INTO reviews (activity_id, user_name, rating, comment) VALUES (?, ?, ?, ?)",
            [activity_id, user_name, rating, comment]
        );
        
        res.json({ id: result.insertId, activity_id, user_name, rating, comment });
    } catch (error) {
        console.error("Σφάλμα κατά την προσθήκη κριτικής:", error);
        res.status(500).json({ error: "Σφάλμα διακομιστή κατά την αποθήκευση." });
    }
});

module.exports = router;