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

    // 2: CHATBOT (Context Aware)
router.post("/chatbot", async (req, res) => {
    const { message } = req.body;
    
    try {
        const [activities] = await db.query("SELECT id, title, location FROM activities");
        const activitiesList = activities.map(a => `"${a.title}" (Περιοχή: ${a.location}, ID:${a.id})`).join(" | ");

        // ΝΕΟ, ΑΠΟΛΥΤΑ ΑΥΣΤΗΡΟ PROMPT
        const systemPrompt = `
          Είσαι ο έξυπνος οδηγός της εφαρμογής Pyxis. 
          ΔΙΑΘΕΣΙΜΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΣΤΗ ΒΑΣΗ: ${activitiesList}
          
          ΑΥΣΤΗΡΟΤΕΡΟΙ ΚΑΝΟΝΕΣ ΠΟΥ ΠΡΕΠΕΙ ΝΑ ΤΗΡΗΣΕΙΣ ΟΠΩΣΔΗΠΟΤΕ:
          1. Αν ο χρήστης ζητήσει προτάσεις για μια περιοχή/πόλη (π.χ. Καλαμάτα) και ΔΕΝ βλέπεις δραστηριότητες για αυτή την πόλη στη λίστα σου, ΑΠΑΓΟΡΕΥΕΤΑΙ να προτείνεις δραστηριότητες από άλλες πόλεις (π.χ. Πάτρα). Πες ΑΠΛΑ: "Δυστυχώς δεν έχω ακόμα προτάσεις για αυτή την περιοχή." και σταμάτα εκεί. Μην προσπαθήσεις να δικαιολογηθείς.
          2. ΓΙΑ ΚΑΘΕ πρόταση που κάνεις, ΑΠΑΓΟΡΕΥΕΤΑΙ να γράφεις "(ID: 12)" μέσα στο κείμενο. ΑΝΤΙ ΓΙΑ ΑΥΤΟ, πρέπει υποχρεωτικά να κολλάς το tag {{LINK:/activities/ID}} δίπλα από το όνομα της δραστηριότητας.
          Παράδειγμα ΣΩΣΤΗΣ απάντησης: "Θα σου πρότεινα να πας στο Κάστρο για ηλιοβασίλεμα {{LINK:/activities/11}} ή για πεζοπορία {{LINK:/activities/15}}."
          Παράδειγμα ΛΑΘΟΣ απάντησης: "Πήγαινε στο Κάστρο (ID: 11)."
          3. Απάντησε στα Ελληνικά, σύντομα και φιλικά.
        `;

        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.0 // Το βάζουμε στο 0 για να ακολουθεί τους κανόνες σαν ρομπότ, χωρίς "φαντασία"
        });

        res.json({ reply: response.choices[0]?.message?.content });

    } catch (e) { 
        res.json({ reply: "Παρουσιάστηκε πρόβλημα στη σύνδεση." }); 
    }
});

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