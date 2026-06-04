import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PatchCheckFill, GeoAltFill } from 'react-bootstrap-icons';
import { getActivities, getProfile } from '../api';

const PersonalChoice = () => {
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
            setLoading(false);
            return; 
        }

        const [allActivities, userProfile] = await Promise.all([
          getActivities(),
          getProfile(token) 
        ]);

        if (!userProfile || (!userProfile.location && !userProfile.interests && !userProfile.budget)) {
            setHasProfile(false);
            setLoading(false);
            return;
        }

        setHasProfile(true);

        const selected = allActivities
          .map(act => {
            let score = 0;
            
            // A. Location Match (+40)
            const userLoc = (userProfile.location || "").toLowerCase().trim();
            if (userLoc && act.location?.toLowerCase().includes(userLoc)) {
              score += 40;
            }

            // B. Interests Match (+40)
            const userInterests = Array.isArray(userProfile.interests) 
                ? userProfile.interests.join(' ').toLowerCase() 
                : (userProfile.interests || "").toLowerCase();

            if (userInterests && act.category && userInterests.includes(act.category.toLowerCase())) {
                score += 40;
            }

            // C. Budget Match (+20)
            const userBudget = Number(userProfile.budget || 0);
            if (userBudget > 0 && Number(act.cost) <= userBudget) {
                score += 20;
            }

            // D. Bonus Free (+10)
            if (Number(act.cost) === 0) {
                score += 10;
            }
            
            return { ...act, score };
          })
          // ΦΙΛΤΡΟ: Πρέπει πλέον να έχει πιάσει τουλάχιστον 40 (δηλαδή υποχρεωτικά Τοποθεσία ή Ενδιαφέρον)
          .filter(act => act.score >= 40) 
          .sort((a, b) => b.score - a.score) 
          .slice(0, 4); 

        setChoices(selected);

      } catch (error) {
        console.error("Error fetching data for Personal Choice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null; 
  if (!localStorage.getItem("token")) return null;

  if (!hasProfile || choices.length === 0) {
      return (
        <div className="container py-4">
            <div className="p-4 bg-light rounded shadow-sm border text-center">
                <h5 className="fw-bold text-muted">Δεν βρήκαμε προτάσεις για σένα 😔</h5>
                <p className="small text-muted mb-3">Δεν υπάρχουν δραστηριότητες που να ταιριάζουν απόλυτα με τις ρυθμίσεις σου αυτή τη στιγμή.</p>
                <Link to="/profile" className="btn btn-sm btn-primary rounded-pill px-4 shadow-sm">
                    Αλλαγή Προτιμήσεων
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h4 className="fw-bold m-0 text-dark">
        Βάσει των προτιμήσεών σου <span className="text-primary ms-1"><PatchCheckFill/></span>
        </h4>
      </div>

      <div className="row g-3">
        {choices.map((item) => (
            <div key={item.id} className="col-md-3 col-6"> 
              <div className="card h-100 shadow-sm border-0 position-relative">
                
                <div className="position-absolute top-0 start-0 m-2 badge bg-primary bg-gradient shadow-sm">
                   Για Σένα
                </div>

                <img 
                    src={item.image_url || "https://picsum.photos/300/200"} 
                    className="card-img-top" 
                    alt={item.title} 
                    style={{height: '130px', objectFit: 'cover'}}
                />
                
                <div className="card-body p-2">
                  <h6 className="card-title fw-bold text-truncate mb-1">{item.title}</h6>
                  
                  <div className="d-flex justify-content-between align-items-center text-muted small mb-2" style={{fontSize: '0.8rem'}}>
                    <span className="text-truncate" style={{maxWidth: '70px'}}>
                        <GeoAltFill className="me-1"/>{item.location ? item.location.split(',')[0] : ''}
                    </span>
                    <span className="fw-bold text-dark">
                        {Number(item.cost) === 0 ? 'Free' : `${item.cost}€`}
                    </span>
                  </div>
                  
                  <Link to={`/activities/${item.id}`} className="btn btn-sm btn-outline-primary w-100 fw-bold rounded-pill" style={{fontSize: '0.8rem'}}>
                    Δες το
                  </Link>
                </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalChoice;