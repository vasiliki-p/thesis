const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth'); 
const activitiesRoutes = require('./routes/activities');
const reviewsRoutes = require('./routes/reviews');
const aiRoutes = require('./routes/ai'); 
const userRoutes = require('./routes/user');
const favouritesRoute = require("./routes/favourites");
const groupRoutes = require('./routes/group');
const historyRoute = require('./routes/history');

const authenticateToken = require('./middleware/auth'); 

const db = require('./db');

const app = express();
dotenv.config();

// Δημιουργία HTTP Server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// κρατάει τους χρήστες που είναι online ανά δραστηριότητα
let publicLobbies = {}; 

app.get('/api/lobbies/active', (req, res) => {
    // Φιλτράρουμε τα lobbies που έχουν τουλάχιστον έναν χρήστη μέσα
    const active = Object.keys(publicLobbies)
        .filter(id => publicLobbies[id].length > 0)
        .map(id => ({
            activityId: id,
            members: publicLobbies[id], // Επιστρέφει array με {id, name}
            activityTitle: "Δραστηριότητα #" + id 
        }));
    res.json(active);
});

app.get('/api/lobby/:activityId', (req, res) => {
    const members = publicLobbies[req.params.activityId] || [];
    res.json(members);
});

app.get('/api/lobby/messages/:activityId', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT user_name as user, message_text as text, created_at as time, user_id as userId FROM lobby_messages WHERE activity_id = ? ORDER BY created_at ASC",
            [String(req.params.activityId)]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση μηνυμάτων" });
    }
});

app.post('/api/lobby/join', authenticateToken, (req, res) => {
    const { activityId, userName } = req.body; // Σβήσαμε το userId από εδώ
    const userId = req.user.id; // Το παίρνουμε με ασφάλεια από το Token!
    
    if (!activityId || activityId === "undefined") {
        return res.status(400).json({ error: "Missing or Invalid Activity ID" });
    }

    if (!publicLobbies[activityId]) {
        publicLobbies[activityId] = [];
    }
    
    // Μετατρέπουμε τα ID σε String για ασφαλή σύγκριση
    const exists = publicLobbies[activityId].find(u => String(u.id) === String(userId));
    if (!exists) {
        publicLobbies[activityId].push({ 
            id: String(userId), 
            name: userName, 
            joinedAt: new Date() 
        });
    }
    
    console.log(`User ${userName} joined Lobby ${activityId}`);
    res.json({ success: true, members: publicLobbies[activityId] });
});

// Real-time Chat
io.on('connection', (socket) => {

    socket.on("join-lobby", ({ activityId, userId, userName }) => {
        if (!activityId || !userId) return;

        socket.join(`lobby_${activityId}`);
        socket.currentLobby = activityId;
        //πάντα String
        socket.userId = String(userId); 

        if (!publicLobbies[activityId]) publicLobbies[activityId] = [];

        setTimeout(() => {
            // καθαρισμός διπλότυπων με σύγκριση String
            publicLobbies[activityId] = publicLobbies[activityId].filter(u => String(u.id) !== String(userId));
            
            // προσθήκη χρήστη στη λίστα
            publicLobbies[activityId].push({ id: String(userId), name: userName });

            // ενημέρωση όλων για τη νέα λίστα συμμετεχόντων
            io.emit("lobby-updated", { 
                activityId, 
                members: publicLobbies[activityId] 
            });
        }, 100);
    });

    socket.on("leave-lobby", async ({ activityId, userId }) => { 
        if (publicLobbies[activityId]) {
            // βρίσκουμε ποιος χρήστης φεύγει για να τυπώσουμε το μήνυμα
            const userLeaving = publicLobbies[activityId].find(u => String(u.id) === String(userId));
            if (userLeaving) {
                console.log(`User ${userLeaving.name} left Lobby ${activityId}`);
            }

            // αφαιρούμε τον χρήστη από τη λίστα
            publicLobbies[activityId] = publicLobbies[activityId].filter(u => String(u.id) !== String(userId));
            
            // ενημερώνουμε τους υπόλοιπους ότι κάποιος έφυγε
            io.emit("lobby-updated", { 
                activityId, 
                members: publicLobbies[activityId] 
            });
            
            // βγάζουμε το socket από το συγκεκριμένο δωμάτιο
            socket.leave(`lobby_${activityId}`);

            // αν το δωμάτιο άδειασε το διαγράφουμε
            if (publicLobbies[activityId].length === 0) {
                console.log(`Lobby ${activityId} is now empty. Self-destructing... `);
                delete publicLobbies[activityId]; // Διαγραφή από τη μνήμη

                try {
                    // διαγραφή από τη βάση 
                    await db.query("DELETE FROM group_sessions WHERE session_id = ?", [String(activityId)]);
                } catch (err) {
                    console.error("Error deleting empty lobby from DB:", err);
                }
            }
        }
    });

    socket.on("send-message", async (data) => {
        // προώθηση σε όλους
        io.to(`lobby_${data.activityId}`).emit("receive-message", data);
        
        try {
            // αποθήκευση στη βάση
            await db.query(
                "INSERT INTO lobby_messages (activity_id, user_id, user_name, message_text) VALUES (?, ?, ?, ?)",
                [data.activityId, data.userId, data.user, data.text]
            );
        } catch (err) {
            console.error("Database Save Error:", err);
        }
    });

    socket.on('disconnect', async () => { 
        if (socket.currentLobby && publicLobbies[socket.currentLobby]) {
            const activityId = socket.currentLobby;

            // βρίσκουμε ποιος χρήστης αποσυνδέθηκε ξαφνικά
            const userLeaving = publicLobbies[activityId].find(u => String(u.id) === String(socket.userId));
            if (userLeaving) {
                console.log(`User ${userLeaving.name} left Lobby ${activityId} (Disconnected)`);
            }

            // αφαίρεση χρήστη
            publicLobbies[activityId] = publicLobbies[activityId].filter(u => String(u.id) !== String(socket.userId));
            
            // ενημέρωση υπολοίπων
            io.emit("lobby-updated", { 
                activityId: activityId, 
                members: publicLobbies[activityId] 
            });

            //αν το δωμάτιο άδειασε επειδή έκλεισε το tab
            if (publicLobbies[activityId].length === 0) {
                console.log(`Lobby ${activityId} is now empty after disconnect. Self-destructing... 💥`);
                delete publicLobbies[activityId]; // διαγραφή από τη μνήμη

                try {
                    // διαγραφή από τη βάση
                    await db.query("DELETE FROM group_sessions WHERE session_id = ?", [String(activityId)]);
                } catch (err) {
                    console.error("Error deleting empty lobby from DB:", err);
                }
            }
        }
    });
});


// api endpoints 
app.use('/api', authRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/user', userRoutes);
app.use("/api/favourites", favouritesRoute);
app.use("/api/history", historyRoute);
app.use('/api/group', groupRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    }
    next(); 
  });
} else {
  app.get('/', (req, res) => {
    res.send('Pyxis Backend is running correctly!');
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
});