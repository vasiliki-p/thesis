const express = require("express");
const router = express.Router();
const db = require("../db"); // Κρατάμε τη βάση για το chatbot ή άλλα δεδομένα
const Groq = require("groq-sdk");
const axios = require("axios");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, '..', '.env') });

let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) { 
    console.warn("Groq Init Warning: API Key missing."); 
}

// Έξυπνες προτάσεις με χρήση Google Places API & AI
router.post("/suggest", async (req, res) => {
  const { interests, location, budget, weather } = req.body; 

  try {
    // 1. Δημιουργία του ερωτήματος για την Google (π.χ. "Καφέ in Αθήνα")
    const searchQuery = `${interests || 'αξιοθέατα και διασκέδαση'} in ${location || 'Ελλάδα'}`;

    // 2. Κλήση στο Google Places API (New)
    const googleResponse = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: searchQuery,
        maxResultCount: 15 // Φέρνουμε 15 αληθινά μαγαζιά/μέρη
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          // Ζητάμε συγκεκριμένα πεδία για να μην μας χρεώσει έξτρα η Google
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.priceLevel,places.types,places.rating'
        }
      }
    );

    const places = googleResponse.data.places || [];

    if (places.length === 0) {
        return res.json({ suggestions: [] });
    }

    // 3. Μετατροπή των δεδομένων της Google στη μορφή που περιμένει το React Frontend σου
    const liveActivities = places.map(place => {
      // Μετατροπή του Google priceLevel (PRICE_LEVEL_INEXPENSIVE κλπ) σε εκτιμώμενο κόστος
      let estimatedCost = 0;
      if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") estimatedCost = 10;
      if (place.priceLevel === "PRICE_LEVEL_MODERATE") estimatedCost = 30;
      if (place.priceLevel === "PRICE_LEVEL_EXPENSIVE") estimatedCost = 60;
      if (place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") estimatedCost = 100;

      return {
        id: place.id, // Χρησιμοποιούμε το αληθινό Google Place ID
        title: place.displayName?.text || "Άγνωστο μέρος",
        location: place.formattedAddress,
        cost: estimatedCost,
        category: (place.types && place.types[0]) || "Δραστηριότητα",
        tags: place.types ? place.types.join(", ") : "",
        rating: place.rating || 0,
        // Για την ώρα βάζουμε ένα τυχαίο fallback, μετά μπορούμε να τραβήξουμε τις αληθινές photos της Google!
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(place.displayName?.text || 'P')}&background=random` 
      };
    });

    // Φιλτράρισμα βάσει του Budget του χρήστη (αν έχει ορίσει)
    let filteredActs = liveActivities;
    if (budget && !isNaN(budget)) {
        const maxBudget = Number(budget);
        filteredActs = filteredActs.filter(a => a.cost <= maxBudget);
    }

    if (filteredActs.length === 0) {
        return res.json({ suggestions: [] });
    }

    // 4. Στέλνουμε τα ζωντανά δεδομένα στο LLaMA για τελική βαθμολόγηση με βάση τον καιρό!
    const simpleActs = filteredActs.map(a => ({
        id: a.id, 
        title: a.title, 
        tags: a.tags
    }));

    const systemPrompt = `
      Είσαι ο "Pyxis AI", ένας κορυφαίος ταξιδιωτικός σύμβουλος.
      Βαθμολόγησε (ai_score 50-100) τις παρακάτω πραγματικές τοποθεσίες με βάση ΜΟΝΟ τον Καιρό και τα Ενδιαφέροντα του χρήστη.

      ΚΑΝΟΝΕΣ:
      1. ΚΑΙΡΟΣ: Αν ο καιρός είναι βροχερός, προτίμησε μουσεία/καφέ/εστιατόρια. Αν έχει ήλιο, προτίμησε πάρκα/παραλίες.
      2. Επιστροφή ΑΥΣΤΗΡΑ σε JSON object.
      3. Για κάθε πρόταση γράψε ένα reason (ελληνικά, max 15 λέξεις) γιατί ταιριάζει.

      ΜΟΡΦΗ JSON:
      {
        "matches": [
          { "id": "ChI...", "ai_score": 95, "reason": "Τέλειο καφέ για να χαλαρώσεις ενώ βρέχει έξω!" }
        ]
      }
    `;

    const userPrompt = `Δεδομένα: Καιρός: "${weather || 'Clear'}", Ενδιαφέροντα: "${interests || 'Βόλτα'}", Δραστηριότητες: ${JSON.stringify(simpleActs)}`;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: "openai/gpt-oss-120b", // Το μοντέλο που έχεις ορίσει
        temperature: 0.1, 
        response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    // 5. Ενώνουμε τις βαθμολογίες του AI με τα πλήρη δεδομένα της Google
    const finalSug = (parsed.matches || []).map(match => {
        const activity = filteredActs.find(a => a.id === match.id);
        return activity ? { ...activity, ai_score: match.ai_score, ai_reason: match.reason } : null;
    }).filter(a => a !== null);

    finalSug.sort((a, b) => b.ai_score - a.ai_score);
    res.json({ suggestions: finalSug });

  } catch (err) {
    console.error("Σφάλμα:", err.response ? err.response.data : err.message);
    res.json({ suggestions: [], error: "Αποτυχία ανάκτησης δεδομένων" });
  }
});

// λειτουργία chatbot
router.post("/chatbot", async (req, res) => {
    const { message } = req.body;
    
    try {
        const [activities] = await db.query("SELECT id, title, location FROM activities");
        
        // φτιάχνουμε μια λίστα με τα links για το prompt
        const activitiesList = activities.map(a => `- ${a.title} (Περιοχή: ${a.location}) -> LINK: {{LINK:/activities/${a.id}}}`).join("\n");

       const systemPrompt = `
          Είσαι ο Pyxis, ένας ταξιδιωτικός βοηθός.
          ΜΙΛΑΣ ΑΥΣΤΗΡΑ ΚΑΙ ΜΟΝΟ ΕΛΛΗΝΙΚΑ. ΑΠΑΓΟΡΕΥΕΤΑΙ ΝΑ ΧΡΗΣΙΜΟΠΟΙΗΣΕΙΣ ΑΓΓΛΙΚΑ, ΙΝΔΙΚΑ Η ΑΛΛΕΣ ΓΛΩΣΣΕΣ.

          ΛΙΣΤΑ ΔΙΑΘΕΣΙΜΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ (ΑΠΑΓΟΡΕΥΕΤΑΙ ΝΑ ΠΡΟΤΕΙΝΕΙΣ ΚΑΤΙ ΠΟΥ ΔΕΝ ΕΙΝΑΙ ΕΔΩ):
          ${activitiesList}

          ΚΑΝΟΝΕΣ:
          1. Αν ο χρήστης ζητήσει μια περιοχή (π.χ. Καλαμάτα) και δεν βλέπεις τη λέξη αυτή στην παραπάνω λίστα, ΠΕΣ ΜΟΝΟ: "Δυστυχώς δεν έχω προτάσεις για αυτή την περιοχή."
          2. ΑΠΑΓΟΡΕΥΕΤΑΙ να προτείνεις μέρη από άλλες πόλεις αν δεν βρεις αυτό που ζητάει.
          3. ΠΟΤΕ μην γράφεις τη λέξη "ID" ή νούμερα όπως "ID: 11".
          4. ΟΤΑΝ προτείνεις κάτι, αντέγραψε ακριβώς το LINK δίπλα στο όνομα. Παράδειγμα: "Σου προτείνω το Κάστρο {{LINK:/activities/11}}"
          5. ΟΤΑΝ προτείνεις 2 ή περισσότερες δραστηριότητες, να τις παρουσιάζεις ΠΑΝΤΑ σε μορφή λίστας (με μια παύλα "-" στην αρχή).Πρέπει ΑΥΣΤΗΡΑ να βάζεις την κάθε δραστηριότητα σε νέα γραμμή.
        `;

        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],

    model: "openai/gpt-oss-120b",
            temperature: 0.0 // απόλυτη υπακοή στους κανόνες, καθόλου φαντασία
        });

        res.json({ reply: response.choices[0]?.message?.content });

    } catch (e) { 
        res.json({ reply: "Παρουσιάστηκε πρόβλημα στη σύνδεση." }); 
    }
});
module.exports = router;
