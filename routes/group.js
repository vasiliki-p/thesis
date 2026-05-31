const express = require('express');
const router = express.Router();
const db = require('../db'); 

// --- 1. ΔΗΜΙΟΥΡΓΙΑ ΝΕΑΣ ΠΑΡΕΑΣ (Session) ---
router.post('/create', async (req, res) => {
    // Πλέον παίρνουμε και τα στοιχεία του ραντάρ!
    const { hostId, isPublic, lobbyName, lobbyType, lobbyLocation } = req.body;
    const pin = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const publicFlag = isPublic ? 1 : 0; // 1 = Ανοιχτό, 0 = Κλειστό (Private)
        
        await db.query(
            'INSERT INTO group_sessions (session_id, host_id, is_public, name, type, location) VALUES (?, ?, ?, ?, ?, ?)', 
            [pin, hostId, publicFlag, lobbyName, lobbyType, lobbyLocation]
        );
        res.json({ success: true, pin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Αποτυχία δημιουργίας session' });
    }
});


// --- 1.5 ΕΥΡΕΣΗ ΑΝΟΙΧΤΩΝ LOBBIES ΓΙΑ ΤΟ ΡΑΝΤΑΡ ---
router.get('/active', async (req, res) => {
    try {
        // Ψάχνουμε ΜΟΝΟ τα ανοιχτά (is_public = 1) και μετράμε πόσα άτομα ψήφισαν ήδη
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
        res.status(500).json({ error: 'Αποτυχία φόρτωσης ανοιχτών lobbies' });
    }
});

// --- 2. ΨΗΦΟΦΟΡΙΑ & ΕΛΕΓΧΟΣ MATCH (Δυναμικός Αλγόριθμος) ---
router.post('/vote', async (req, res) => {
    const { sessionId, userId, activityId, voteType } = req.body;
    
    // 1. ΜΗΔΕΝΙΣΜΟΣ: Κάθε φορά που κάποιος ψηφίζει, ξεκινάμε με το match στο false!
    let isMatch = false; 
    
    try {
      // 2. Αποθήκευση της ψήφου στη βάση (Αν υπάρχει ήδη, την κάνει Update)
        await db.query(`
            INSERT INTO group_votes (session_id, user_id, activity_id, vote_type) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE vote_type = ?
        `, [sessionId, userId, activityId, voteType, voteType]);

        // 3. Ελέγχουμε για Match ΜΟΝΟ αν η ψήφος ήταν 'like'
        if (voteType === 'like') {
            
            // Α) Πόσα άτομα ψηφίζουν συνολικά σε αυτό το PIN;
            const [totalUsersRes] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as totalUsers 
                FROM group_votes 
                WHERE session_id = ?
            `, [sessionId]);
            const totalUsers = totalUsersRes[0].totalUsers;

            // Β) Πόσα "Like" έχει πάρει η ΣΥΓΚΕΚΡΙΜΕΝΗ δραστηριότητα;
            const [likesRes] = await db.query(`
                SELECT COUNT(*) as totalLikes 
                FROM group_votes 
                WHERE session_id = ? AND activity_id = ? AND vote_type = 'like'
            `, [sessionId, activityId]);
            const totalLikes = likesRes[0].totalLikes;

            // Γ) ΟΜΟΦΩΝΙΑ: Πρέπει να υπάρχουν πάνω από 1 άτομα ΣΥΝΟΛΙΚΑ στο δωμάτιο 
            // (για να μην βγάζει match όταν είσαι μόνος σου) ΚΑΙ όλοι να πάτησαν Like!
            if (totalUsers > 1 && totalLikes === totalUsers) { 
                isMatch = true;
            }
        }
        
        // 4. Επιστροφή αποτελέσματος στο Frontend
        res.json({ success: true, match: isMatch });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Σφάλμα κατά την ψήφο' });
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
        res.status(500).json({ error: 'Fail' });
    }
});

// --- 4. ΠΛΗΡΟΦΟΡΙΕΣ LOBBY (ΓΙΑ ΤΟΝ ΤΙΤΛΟ ΣΤΟ CHAT) ---
router.get('/info/:pin', async (req, res) => {
    try {
        const [lobby] = await db.query(
            'SELECT name FROM group_sessions WHERE session_id = ?', 
            [req.params.pin]
        );
        
        if (lobby.length > 0) {
            // Το επιστρέφουμε ως "title" για να ταιριάζει με το Frontend
            res.json({ title: lobby[0].name }); 
        } else {
            res.status(404).json({ error: 'Το Lobby δεν βρέθηκε' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Σφάλμα κατά την αναζήτηση πληροφοριών' });
    }
});

module.exports = router;