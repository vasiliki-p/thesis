const db = require('./db');

// Βάλε το πραγματικό σου κλειδί εδώ μέσα στα εισαγωγικά!
const API_KEY = 'TQE1LUFVAX2JEUNGH5OCBEZU0II25WQ4WVCDCQZTO033HVJD'; 

const FOURSQUARE_API = 'https://api.foursquare.com/v3/places/search?near=Athens,%20GR&categories=13000,10000&limit=10';

async function seedDatabase() {
    try {
        console.log("Αναζήτηση δεδομένων από Foursquare...");
        
        const response = await fetch(FOURSQUARE_API, {
            method: 'GET',
            headers: {
                'Authorization': API_KEY, // Χρησιμοποιούμε τη μεταβλητή απευθείας
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Σφάλμα API: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const places = data.results;

        for (const place of places) {
            const title = place.name;
            const category = place.categories[0]?.name || 'Δραστηριότητα';
            const location = place.location.formatted_address || 'Αθήνα';
            const image_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`;
            const cost = Math.floor(Math.random() * 30) + 10; 

            await db.query(
                "INSERT INTO activities (title, description, category, location, cost, image_url) VALUES (?, ?, ?, ?, ?, ?)",
                [title, `Εξαιρετική επιλογή για ${category} στην περιοχή: ${location}`, category, location, cost, image_url]
            );
            console.log(`✅ Προστέθηκε: ${title}`);
        }

        console.log("Η εισαγωγή ολοκληρώθηκε! Πάτα Ctrl+C για έξοδο.");
        process.exit(0);
    } catch (error) {
        console.error("Σφάλμα:", error.message);
        process.exit(1);
    }
}

seedDatabase();