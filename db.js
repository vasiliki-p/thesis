const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Υποχρεωτικό για να μας δεχτεί το Aiven
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- TEST ΣΥΝΔΕΣΗΣ (Για να δούμε αν δουλεύει στο τερματικό) ---
db.getConnection()
    .then(connection => {
        console.log("✅ ΕΠΙΤΥΧΗΣ ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΒΑΣΗ (db.js)");
        connection.release(); // Την αφήνουμε ελεύθερη
    })
    .catch(err => {
        console.error("❌ ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ ΣΤΟ db.js:", err.message);
    });

module.exports = db;