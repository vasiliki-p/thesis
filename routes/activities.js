const express = require("express");
const router = express.Router();
const db = require("../db");
const axios = require("axios"); // Απαραίτητο για την επικοινωνία με την Google

// γρήγορο τεστ για να δούμε ολα τα activities από τη βάση
router.get("/test", async (req, res) => {
  const [data] = await db.query("SELECT COUNT(*) as total FROM activities");
  res.json(data);
});

// φέρνουμε όλη τη λίστα με τις δραστηριότητες (από την τοπική βάση)
router.get("/", async (req, res) => {
  const [data] = await db.query("SELECT * FROM activities");
  res.json(data);
});

// φέρνουμε λεπτομέρειες για μία συγκεκριμένη δραστηριότητα
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Έλεγχος: Αν το ID ξεκινάει από 'ChI', είναι πραγματικό μέρος από την Google!
    if (id.startsWith("ChI")) {
        const googleResponse = await axios.get(
            `https://places.googleapis.com/v1/places/${id}`,
            {
                headers: {
                    'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'id,displayName,formattedAddress,priceLevel,types,rating,photos'
                }
            }
        );
        
        const place = googleResponse.data;
        
        // Υπολογισμός Κόστους
        let estimatedCost = 0;
        if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") estimatedCost = 10;
        if (place.priceLevel === "PRICE_LEVEL_MODERATE") estimatedCost = 30;
        if (place.priceLevel === "PRICE_LEVEL_EXPENSIVE") estimatedCost = 60;
        if (place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") estimatedCost = 100;

        // Φέρνουμε μεγάλη φωτογραφία για το banner του React (800x1200)
        let imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(place.displayName?.text || 'P')}&background=random`; 
        if (place.photos && place.photos.length > 0) {
            const photoName = place.photos[0].name;
            imageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        }

        // Προσαρμογή στη μορφή που περιμένει το Frontend (ActivityDetailsPage)
        const activity = {
            id: place.id,
            title: place.displayName?.text || "Άγνωστο μέρος",
            location: place.formattedAddress,
            cost: estimatedCost,
            category: (place.types && place.types[0]) || "Δραστηριότητα",
            tags: place.types ? place.types.join(", ") : "",
            rating: place.rating || 0,
            image_url: imageUrl,
            duration: "2-3 ώρες" // Προεπιλογή, η Google δεν παρέχει απευθείας διάρκεια
        };
        
        return res.json(activity);
    }

    // 2. Αν ΔΕΝ είναι Google ID, ψάχνουμε κανονικά στη MySQL βάση σου
    const [data] = await db.query("SELECT * FROM activities WHERE id = ?", [id]);

    if (data.length === 0) {
      return res.status(404).json({ message: "Η δραστηριότητα δεν βρέθηκε" });
    }
    
    res.json(data[0]);

  } catch (error) {
    console.error("Σφάλμα στον server:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

module.exports = router;