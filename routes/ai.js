const express = require("express");
const router = express.Router();
const db = require("../db");
const Groq = require("groq-sdk");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, '..', '.env') });

let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) { 
    console.warn("Groq Init Warning: API Key missing."); 
}

// 1: SMART SUGGESTIONS (Hybrid RAG: JS Filtering + AI Semantic Matching)
router.post("/suggest", async (req, res) => {
  const { interests, location, budget, weather } = req.body; 

  try {
    // 1. Φέρνουμε όλες τις δραστηριότητες από τη βάση
    const [allActivities] = await db.query("SELECT * FROM activities");

    // ==========================================
    // ΒΗΜΑ 1: PRE-FILTERING (Ο Αυστηρός Κόφτης της JavaScript)
    // ==========================================
    let filteredActivities = allActivities;
// Έξυπνος Κόφτης Τοποθεσίας (Αγνοεί τόνους και κεφαλαία)
    if (location) {
        // Συνάρτηση που αφαιρεί τόνους και κάνει τα γράμματα πεζά
        const normalizeGreek = (text) => {
            return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        };

        const locClean = normalizeGreek(location).trim();
        
        filteredActivities = filteredActivities.filter(a => {
            const dbLocClean = normalizeGreek(a.location);
            return dbLocClean.includes(locClean) || locClean.includes(dbLocClean);
        });
    }
    // Κόφτης Budget: Κρατάει ΜΟΝΟ όσα κοστίζουν ίσα ή λιγότερα από το όριο
    if (budget && !isNaN(budget)) {
        const maxBudget = Number(budget);
        filteredActivities = filteredActivities.filter(a => Number(a.cost) <= maxBudget);
    }

    // Αν μετά τον κόφτη δεν έμεινε τίποτα (π.χ. έψαξε "Καβάλα"), επιστρέφουμε αμέσως κενό!
    // Γλιτώνουμε και χρόνο, και τζάμπα AI Tokens.
    if (filteredActivities.length === 0) {
        return res.json({ suggestions: [] });
    }

    // Κρατάμε μόνο τα απαραίτητα για την AI για όσα ΕΠΙΒΙΩΣΑΝ
    const simplifiedActivities = filteredActivities.map(a => ({
        id: a.id, 
        title: a.title, 
        outdoor: a.outdoor, 
        tags: a.tags
    }));

    // ==========================================
    // ΒΗΜΑ 2: SYSTEM PROMPT (Μόνο Vibe & Καιρός πλέον)
    // ==========================================
    const systemPrompt = `
      Είσαι ο "Pyxis AI", ένας κορυφαίος ταξιδιωτικός σύμβουλος για την Ελλάδα.
      ΣΗΜΑΝΤΙΚΟ: Τα δεδομένα που λαμβάνεις έχουν ΗΔΗ περάσει από αυστηρό έλεγχο budget και τοποθεσίας. Μην ασχολείσαι με αυτούς τους παράγοντες.

      Ο ΡΟΛΟΣ ΣΟΥ:
      Βαθμολόγησε (ai_score 50-100) τις διαθέσιμες δραστηριότητες με βάση ΜΟΝΟ τον Καιρό και τα Ενδιαφέροντα του χρήστη.

      ΚΑΝΟΝΕΣ ΒΑΘΜΟΛΟΓΗΣΗΣ:
      1. ΚΑΙΡΟΣ: Αν ο καιρός είναι "Rain", "Snow" ή "Thunderstorm", δώσε μεγάλο bonus (+30) σε δραστηριότητες εσωτερικού χώρου (outdoor=0) και ποινή (-30) σε εξωτερικού (outdoor=1).
      2. ΕΝΔΙΑΦΕΡΟΝΤΑ: Ταίριαξε σημασιολογικά τα ενδιαφέροντα του χρήστη με τα "tags" ή τον τίτλο της δραστηριότητας (+40 πόντους για τέλειο ταίριασμα).

      ΚΑΝΟΝΕΣ ΕΞΟΔΟΥ:
      - Πρέπει να επιστρέψεις ΑΥΣΤΗΡΑ ένα JSON object.
      - Για κάθε πρόταση, γράψε έναν ελκυστικό, φιλικό λόγο (reason) στα Ελληνικά (max 15 λέξεις) που να εξηγεί ΓΙΑΤΙ ταιριάζει στον χρήστη.
      - Επέστρεψε ΜΟΝΟ όσες δραστηριότητες έχουν ai_score >= 50.

      ΜΟΡΦΗ JSON ΠΟΥ ΑΠΑΙΤΕΙΤΑΙ:
      {
        "matches": [
          { "id": 1, "ai_score": 95, "reason": "Ιδανικό για βροχερή μέρα και ταιριάζει τέλεια στην αγάπη σου για την ιστορία!" }
        ]
      }
    `;

    // ==========================================
    // ΒΗΜΑ 3: USER PROMPT & ΚΛΗΣΗ AI
    // ==========================================
    const userPrompt = `
      ΔΕΔΟΜΕΝΑ ΧΡΗΣΤΗ:
      - Καιρός: "${weather || 'Clear'}"
      - Ενδιαφέροντα / Διάθεση: "${interests || 'Οτιδήποτε ενδιαφέρον'}"
      
      ΔΙΑΘΕΣΙΜΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ (JSON):
      ${JSON.stringify(simplifiedActivities)}
    `;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, 
        response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
    // Ενώνουμε την απάντηση του AI με τα πλήρη δεδομένα
    const finalSuggestions = (parsed.matches || []).map(match => {
        const activity = allActivities.find(a => a.id === match.id);
        return activity ? { ...activity, ai_score: match.ai_score, ai_reason: match.reason } : null;
    }).filter(a => a !== null);

    // Ταξινομούμε φθίνουσα βάσει του ai_score
    finalSuggestions.sort((a, b) => b.ai_score - a.ai_score);

    res.json({ suggestions: finalSuggestions });

  } catch (err) {
    console.error("Groq Error:", err);
    res.json({ suggestions: [], error: "AI matching failed" });
  }
});

// 2: CHATBOT (Context Aware)
router.post("/chatbot", async (req, res) => {
    const { message } = req.body;
    
    try {
        const [activities] = await db.query("SELECT id, title FROM activities");
        const activitiesList = activities.map(a => `${a.title} (ID:${a.id})`).join(", ");

        const systemPrompt = `
          Είσαι ο έξυπνος οδηγός της εφαρμογής. 
          ΔΙΑΘΕΣΙΜΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ: ${activitiesList}
          ΚΑΝΟΝΑΣ: Όταν προτείνεις κάτι, βάλε στο τέλος το tag: {{LINK:/activities/ID}}.
          Απάντησε στα Ελληνικά, σύντομα και φιλικά.
        `;

        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
        });

        res.json({ reply: response.choices[0]?.message?.content });

    } catch (e) { 
        res.json({ reply: "Παρουσιάστηκε πρόβλημα στη σύνδεση." }); 
    }
});

module.exports = router;