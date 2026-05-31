const express = require('express');
const router = express.Router();
const db = require('../db'); 
const authenticateToken = require("../middleware/auth"); // Το βάζουμε και εδώ!

// Προστατεύουμε όλες τις διαδρομές των groups (μόνο συνδεδεμένοι χρήστες)
router.use(authenticateToken);

// --- 1. ΔΗΜΙΟΥΡΓΙΑ ΝΕΑΣ ΠΑΡΕΑΣ (Session) ---
router.post('/create', async (req, res) => {
    // ΣΒΗΣΑΜΕ το hostId από το body. Το παίρνουμε με ασφάλεια από το token (req.user.id)
    const { isPublic, lobbyName, lobbyType, lobbyLocation } = req.body;
    const hostId = req.user.id; 
    const pin = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const publicFlag = isPublic ? 1 : 0;
        
        await db.query(
            'INSERT INTO group_sessions (session_id, host_id, is_public, name, type, location) VALUES (?, ?, ?, ?, ?, ?)', 
            [pin, hostId, publicFlag, lobbyName, lobbyType, lobbyLocation]
        );
        res.json({ success: true, pin });
    } catch (error) {
        console.error(error);
        // Ενιαίο Error Handling (Βήμα 3)
        res.status(500).json({ error: 'Αποτυχία δημιουργίας session', details: error.message });
    }
});


// --- 1.5 ΕΥΡΕΣΗ ΑΝΟΙΧΤΩΝ LOBBIES ΓΙΑ ΤΟ ΡΑΝΤΑΡ ---
router.get('/active', async (req, res) => {
    try {
        const [lobbies] = await db.query(`
            SELECT 
                s.session_id as pin, 
                s.name, 
                s.type, 
                s.location,
                COUNT(DISTINCT v.user_id) as users_count
            FROM group_sessions s
            LEFT JOIN group_votes v ON s.session_id = v.session_id
            WHERE s.is_public = 1
            GROUP BY s.session_id
            LIMIT 10
        `);
        res.json(lobbies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Αποτυχία φόρτωσης ανοιχτών lobbies', details: error.message });
    }
});

// --- 2. ΨΗΦΟΦΟΡΙΑ & ΕΛΕΓΧΟΣ MATCH (Δυναμικός Αλγόριθμος) ---
router.post('/vote', async (req, res) => {
    // ΣΒΗΣΑΜΕ το userId από το body!
    const { sessionId, activityId, voteType } = req.body;
    const userId = req.user.id; // Το παίρνουμε από το token
    
    let isMatch = false; 
    
    try {
        await db.query(`
            INSERT INTO group_votes (session_id, user_id, activity_id, vote_type) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE vote_type = ?
        `, [sessionId, userId, activityId, voteType, voteType]);

        if (voteType === 'like') {
            const [totalUsersRes] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as totalUsers 
                FROM group_votes 
                WHERE session_id = ?
            `, [sessionId]);
            const totalUsers = totalUsersRes[0].totalUsers;

            const [likesRes] = await db.query(`
                SELECT COUNT(*) as totalLikes 
                FROM group_votes 
                WHERE session_id = ? AND activity_id = ? AND vote_type = 'like'
            `, [sessionId, activityId]);
            const totalLikes = likesRes[0].totalLikes;

            if (totalUsers > 1 && totalLikes === totalUsers) { 
                isMatch = true;
            }
        }
        
        res.json({ success: true, match: isMatch });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Σφάλμα κατά την ψήφο', details: error.message });
    }
});

// --- 3. SESSION SUMMARY (Η δική σου διαδρομή) ---
router.get('/session-summary/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const [summary] = await db.query(`
            SELECT a.title, v.vote_type, COUNT(v.user_id) as vote_count
            FROM group_votes v
            JOIN activities a ON v.activity_id = a.id
            WHERE v.session_id = ?
            GROUP BY v.activity_id, v.vote_type
        `, [sessionId]);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Αποτυχία φόρτωσης σύνοψης', details: error.message });
    }
});

// --- 4. ΠΛΗΡΟΦΟΡΙΕΣ LOBBY ---
router.get('/info/:pin', async (req, res) => {
    try {
        const [lobby] = await db.query(
            'SELECT name FROM group_sessions WHERE session_id = ?', 
            [req.params.pin]
        );
        
        if (lobby.length > 0) {
            res.json({ title: lobby[0].name }); 
        } else {
            res.status(404).json({ error: 'Το Lobby δεν βρέθηκε' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Σφάλμα κατά την αναζήτηση πληροφοριών', details: error.message });
    }
});

module.exports = router;