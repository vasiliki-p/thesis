const mysql = require('mysql2/promise');
require('dotenv').config();

// 1. Συγκεντρώνουμε όλες τις βασικές ρυθμίσεις σε μια μεταβλητή (dbConfig)
const dbConfig = {
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 2. Ελέγχουμε πού βρισκόμαστε. Βάζουμε το SSL ΜΟΝΟ αν τρέχει στο Render
if (process.env.NODE_ENV === 'production') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

// 3. Δημιουργούμε τη σύνδεση (pool) βάζοντας μέσα το έτοιμο dbConfig
const db = mysql.createPool(dbConfig);

// --- TEST ΣΥΝΔΕΣΗΣ ---
db.getConnection()
    .then(connection => {
        console.log("✅ ΕΠΙΤΥΧΗΣ ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΒΑΣΗ (db.js)");
        connection.release(); // Την αφήνουμε ελεύθερη
    })
    .catch(err => {
        console.error("❌ ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ ΣΤΟ db.js:", err.message);
    });

module.exports = db;