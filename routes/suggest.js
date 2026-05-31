const express = require("express");
const router = express.Router();
const db = require("../db");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const aiModel = "phi3:latest";

router.post("/", async (req, res) => {
    const { interests, budget, location, weather } = req.body;

    try {
        // Φέρνει όλες τις δραστηριότητες από τη βάση
        const [activities] = await db.query("SELECT id, title, category, location, cost, description FROM activities");

        // Δημιουργία ορισμού για το AI
        const aiPrompt = `
You are a ranking AI system.

Rank the following activities and return ONLY JSON array sorted DESC by score.

ACTIVITIES:
${JSON.stringify(activities)}

USER:
- Interests: ${interests}
- Budget: ${budget}
- Location: ${location}ue
- Weather: ${weather}

Ranking Rules:
- +40 points if category or title text includes a matching interest.
- +30 points if located in the same city (exact match).
- +20 points if cost <= budget.
- +10 bonus if the weather contains "rain" or "bad" and activity is NOT outdoor/nature.
- Add small natural randomized variance between 1 and 3 to avoid identical scores.

Return ONLY JSON like:
[
  {
    "id": 3,
    "title": "",
    "location": "",
    "cost": "",
    "description": "",
    "score": 89
  }
]

Return top 5 suggestions only.
NO TEXT OUTSIDE JSON.
`;

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: aiModel,
                prompt: aiPrompt,
                stream: false,
            }),
        });

        const aiResult = await response.json();
        const aiText = aiResult.response;

        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.json({
                warning: "⚠ Το AI επέστρεψε μη έγκυρο JSON .",
                suggestions: []
            });
        }

        const suggestions = JSON.parse(jsonMatch[0]);
        res.json({ suggestions });

    } catch (err) {
        console.error("AI ERROR:", err);
        return res.status(500).json({
            error: "⚠ Το ΑΙ επέστρεψε μη έγκυρο JSON .",
            suggestions: []
        });
    }
});

module.exports = router;
