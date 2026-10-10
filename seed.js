require('dotenv').config();
const axios = require('axios');
const db = require('./db'); 

const FOURSQUARE_API = 'https://api.foursquare.com/v3/places/search';

async function seedDatabase() {
    try {
        console.log("Αναζήτηση δεδομένων από Foursquare...");
        
        const response = await axios.get(FOURSQUARE_API, {
            headers: {
                Authorization: process.env.FOURSQUARE_API_KEY,
                accept: 'application/json'
            },
            params: {
                near: 'Athens, GR',
                categories: '13000,10000', 
                limit: 10 
            }
        });

        const places = response.data.results;

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
    } catch (error) {
        console.error("Σφάλμα:", error.message);
    }
}

seedDatabase();