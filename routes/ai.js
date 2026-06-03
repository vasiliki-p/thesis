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

// έξυπνες προτάσεις με βάση τον καιρό και τα ενδιαφέροντα
router.post("/suggest", async (req, res) => {
  const { interests, location, budget, weather } = req.body; 

  try {
    // φέρνουμε όλες τις δραστηριότητες από τη βάση
    const [activities] = await db.query("SELECT * FROM activities");

    let filteredActs = activities;

    // φίλτρο για τοποθεσία (αγνοούμε τόνους και κεφαλαία)
    if (location) {
        // συνάρτηση που αφαιρεί τόνους και κάνει τα γράμματα πεζά
        const normalize = (text) => {
            return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        };

        const locClean = normalize(location).trim();
        
        filteredActs = filteredActs.filter(a => {
            const dbLocClean = normalize(a.location);
            return dbLocClean.includes(locClean) || locClean.includes(dbLocClean);
        });
    }

    // φίλτρο για budget (όσα κοστίζουν ίσα ή λιγότερα από το όριο)
    if (budget && !isNaN(budget)) {
        const maxBudget = Number(budget);
        filteredActs = filteredActs.filter(a => Number(a.cost) <= maxBudget);
    }
    // αν δεν βρέθηκε τίποτα σταματάμε εδώ για οικονομία στα tokens της AI

    if (filteredActs.length === 0) {
        return res.json({ suggestions: [] });
    }

    // κρατάμε μόνο τα βασικά για να μην μπερδευτεί το μοντέλο
    const simpleActs = filteredActs.map(a => ({
        id: a.id, 
        title: a.title, 
        outdoor: a.outdoor, 
        tags: a.tags
    }));

    // οδηγίες προς την AI
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

    const userPrompt = `
      ΔΕΔΟΜΕΝΑ ΧΡΗΣΤΗ:
      - Καιρός: "${weather || 'Clear'}"
      - Ενδιαφέροντα / Διάθεση: "${interests || 'Οτιδήποτε ενδιαφέρον'}"
      
      ΔΙΑΘΕΣΙΜΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ (JSON):
      ${JSON.stringify(simpleActs)}
    `;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, 
        response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    // ενώνουμε τα αποτελέσματα του AI με τα πλήρη δεδομένα της βάσης μας
    const finalSug = (parsed.matches || []).map(match => {
        const activity = filteredActs.find(a => a.id === match.id);
        return activity ? { ...activity, ai_score: match.ai_score, ai_reason: match.reason } : null;
    }).filter(a => a !== null);

    // ταξινόμηση φθίνουσα βάσει του ai_score
    
    finalSug.sort((a, b) => b.ai_score - a.ai_score);

    res.json({ suggestions: finalSug });

  } catch (err) {
    console.error("Groq Error:", err);
    res.json({ suggestions: [], error: "AI matching failed" });
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
        `;

        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.0 // 0.0 = απόλυτη υπακοή στους κανόνες, καθόλου φαντασία.
        });

        res.json({ reply: response.choices[0]?.message?.content });

    } catch (e) { 
        res.json({ reply: "Παρουσιάστηκε πρόβλημα στη σύνδεση." }); 
    }
});
module.exports = router;