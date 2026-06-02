import React, { useEffect, useState } from 'react';
import { getActivities } from '../api'; 
import ActivityCard from '../components/ActivityCard'; 
import Map from '../components/Map';
import { MapFill, GeoAltFill } from "react-bootstrap-icons";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('Όλα');

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getActivities();
        setActivities(data);
      } catch (err) {
        console.error(err);
        setError('Σφάλμα κατά την ανάκτηση των δραστηριοτήτων');
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const categories = ['Όλα', ...new Set(activities.map(act => act.category || 'Άλλο'))];

  const filteredActivities = selectedCategory === 'Όλα' 
    ? activities 
    : activities.filter(act => (act.category || 'Άλλο') === selectedCategory);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--bg-color)' }}>
      <output aria-live="polite" className="d-flex align-items-center gap-3">
        <div className="spinner-border" style={{ color: 'var(--accent-color)' }} role="status"></div>
        <span className="h5 mb-0 fw-bold" style={{ color: 'var(--text-main)' }}>Αναζήτηση εμπειριών...</span>
      </output>
    </div>
  );
  
  if (error) return (
    <div className="container mt-5 pt-5">
      <div className="alert border-0 rounded-4 shadow-sm text-center fw-bold" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
        {error}
      </div>
    </div>
  );

  return (
    <div className="container position-relative mt-5" style={{ minHeight: '100vh', zIndex: 1 }}>
      
      {/* Background blobs */}
      <div className="position-absolute" style={{ width: '400px', height: '400px', background: 'var(--accent-color)', borderRadius: '50%', filter: 'blur(120px)', opacity: '0.1', top: '0', left: '10%', zIndex: -1 }}></div>

      {/* 🖋️ HEADER (Premium Typography) */}
      <div className="text-center mb-5">
        <span className="badge rounded-pill px-3 py-2 mb-3 shadow-sm fw-bold text-uppercase d-inline-flex align-items-center gap-2" 
              style={{ background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)', letterSpacing: "1px", fontSize: "0.75rem" }}>
          <MapFill style={{ color: 'var(--accent-color)' }} /> EXPLORE NOW
        </span>
        <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
          Τι παίζει τώρα γύρω σου;
        </h1>
        <p className="fs-5 mx-auto mb-0" style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
          Δες στον χάρτη πού χτυπάει ο παλμός της πόλης αυτή τη στιγμή και βρες το επόμενο vibe σου.
        </p>
      </div>

      {/* 🧊 MAP BENTO CARD - Διορθωμένο: Αφαίρεση padding p-2 */}
      <div className="bento-card mb-5 shadow-lg" 
           style={{ 
             background: 'var(--card-bg)', 
             border: '1px solid var(--card-border)', 
             borderRadius: '32px', 
             height: '450px',
             overflow: 'hidden' // ✅ Εξασφαλίζει ότι ο χάρτης "κόβεται" σωστά στις γωνίες της κάρτας
           }}>
        {filteredActivities.length > 0 ? (
            /* Διορθωμένο: Αφαίρεση του padding στο εσωτερικό div */
            <div style={{ overflow: 'hidden', height: '100%' }}>
              <Map activities={filteredActivities} />
            </div>
        ) : (
            <div className="d-flex justify-content-center align-items-center h-100 fw-bold p-3" style={{ color: 'var(--text-muted)' }}>
                🔭 Δεν βρέθηκαν τοποθεσίες σε αυτή την κατηγορία.
            </div>
        )}
      </div>

      {/* 🔘 MOOD FILTERS */}
      <div className="text-center mb-5">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button 
                    key={cat}
                    className="badge transition-btn fw-bold shadow-sm" 
                    onClick={() => setSelectedCategory(cat)}
                    style={{ 
                      background: isActive ? 'var(--text-main)' : 'var(--card-bg)', 
                      color: isActive ? 'var(--bg-color)' : 'var(--text-main)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--card-border)'}`,
                      borderRadius: '100px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                >
                    {cat}
                </button>
              );
            })}
        </div>
      </div>

      {/* 🖋️ SECTION TITLE */}
      <div className="mb-4 px-2 d-flex align-items-center gap-2">
         <GeoAltFill size={24} style={{ color: 'var(--accent-color)' }} />
         <h3 className="fw-bold mb-0" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {selectedCategory === 'Όλα' ? 'Όλες οι εμπειρίες' : selectedCategory}
         </h3>
      </div>
      
      {/* 🧊 LISTA (Bento Grid) */}
      <div className="row g-4 mb-5">
        {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
            <div className="col-md-6 col-lg-4" key={activity.id}>
                {/* 💡 Σημείωση: Βεβαιώσου ότι το ActivityCard.jsx ακούει και αυτό στα χρώματα του Theme! */}
                <ActivityCard activity={activity} />
            </div>
            ))
        ) : (
            <div className="col-12 text-center py-5 rounded-4 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px dashed var(--card-border)' }}>
                <h4 className="fw-bold mb-3" style={{ color: 'var(--text-main)' }}>🤷‍♂️ Δεν βρέθηκαν δραστηριότητες.</h4>
                <button 
                  className="btn rounded-pill px-4 py-2 fw-bold transition-btn" 
                  style={{ background: 'var(--text-main)', color: 'var(--bg-color)' }}
                  onClick={() => setSelectedCategory('Όλα')}
                >
                  Επιστροφή σε όλες
                </button>
            </div>
        )}
      </div>

      <style>{`
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}