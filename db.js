const mysql = require('mysql2/promise');
require('dotenv').config();

// βασικές ρυθμίσεις της βάσης από το .env
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

// προσθήκη ssl μόνο όταν η εφαρμογή τρέχει σε production περιβάλλον
if (process.env.NODE_ENV === 'production') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

// δημιουργία connection pool αντί για απλό connection για καλύτερο performance
const db = mysql.createPool(dbConfig);

// αρχικό τεστ για να βεβαιωθούμε ότι η βάση είναι προσβάσιμη
db.getConnection()
    .then(connection => {
        console.log("Επιτυχής σύνδεση με τη βάση (db.js)");
        connection.release(); // Την αφήνουμε ελεύθερη
    })
    .catch(err => {
        console.error("Σφάλμα σύνδεσης στο db.js:", err.message);
    });

module.exports = db;