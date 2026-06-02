import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrophyFill, ChatDotsFill, ArrowLeft, StarFill, PeopleFill } from 'react-bootstrap-icons';

export default function MatchResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // ΕΔΩ ΗΤΑΝ ΤΟ ΛΑΘΟΣ: Τώρα χτυπάμε το '/swipe/results/' για να πάρουμε τα votes!
        const res = await axios.get(`http://localhost:5000/api/group/swipe/results/${sessionId}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("ΑΠΟΤΕΛΕΣΜΑΤΑ ΑΠΟ BACKEND:", res.data);
        setMatches(res.data);
        setLoading(false);
        
      } catch (err) {
        console.error("Σφάλμα κατά τη φόρτωση των matches:", err);
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMatches();
    }
  }, [sessionId, token]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: "var(--accent-color)", width: "3rem", height: "3rem" }}></div>
          <h4 className="fw-bold" style={{ color: "var(--text-main)" }}>Υπολογισμός Vibe...</h4>
        </div>
      </div>
    );
  }

  const perfectMatches = matches.filter(m => m.votes === m.maxVotes && m.maxVotes > 0);
  const runnerUps = matches.filter(m => m.votes < m.maxVotes && m.votes >= Math.floor(m.maxVotes / 2));

  return (
    <div className="container position-relative" style={{ minHeight: "100vh", paddingTop: "30px", paddingBottom: "120px" }}>
      
      <div className="position-absolute" style={{ width: '400px', height: '400px', background: 'var(--accent-color)', borderRadius: '50%', filter: 'blur(120px)', opacity: '0.15', top: '5%', left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}></div>

      <div className="text-center mb-5 position-relative z-1">
        <span className="badge rounded-pill px-3 py-2 mb-3 shadow-sm fw-bold text-uppercase d-inline-flex align-items-center gap-2" 
              style={{ background: "rgba(212, 175, 55, 0.15)", color: "var(--accent-color)", border: '1px solid var(--accent-color)', letterSpacing: "1px" }}>
          <TrophyFill /> THE VERDICT
        </span>
        <h1 className="fw-bold display-4 mb-2" style={{ color: "var(--text-main)", letterSpacing: "-1px" }}>Η Παρέα Μίλησε!</h1>
        <p className="lead" style={{ color: "var(--text-muted)" }}>Αυτές είναι οι επιλογές που συμφωνήσατε όλοι.</p>
      </div>

      <div className="row justify-content-center position-relative z-1">
        <div className="col-lg-8">
          
          {perfectMatches.length > 0 ? (
            <div className="perfect-matches-container mb-5">
              <h4 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: "var(--text-main)" }}>
                <StarFill color="var(--accent-color)" /> Τέλεια Matches (100%)
              </h4>
              <div className="row g-4">
                {perfectMatches.map((match, index) => (
                  <div className="col-md-6" key={match.id || index}>
                    <div className="bento-card match-card winner-card h-100 position-relative overflow-hidden" style={{ borderRadius: "24px", border: "2px solid var(--accent-color)" }}>
                      <div className="winner-badge position-absolute top-0 end-0 m-3 badge rounded-pill px-3 py-2" style={{ background: "var(--accent-color)", color: "#000", fontWeight: "800" }}>
                        #1 ΕΠΙΛΟΓΗ
                      </div>
                      <img src={match.image || match.image_url} alt={match.title} className="w-100" style={{ height: "220px", objectFit: "cover" }} />
                      <div className="p-4" style={{ background: "var(--card-bg)" }}>
                        <span className="small fw-bold mb-2 d-block" style={{ color: "var(--accent-color)" }}>{match.category}</span>
                        <h4 className="fw-bold mb-3" style={{ color: "var(--text-main)" }}>{match.title}</h4>
                        <div className="d-flex align-items-center gap-2 small fw-bold" style={{ color: "var(--text-muted)" }}>
                          <PeopleFill /> Συμφώνησαν: {match.votes}/{match.maxVotes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bento-card p-5 text-center mb-5" style={{ borderRadius: "24px" }}>
              <h3 className="fw-bold mb-3" style={{ color: "var(--text-main)" }}>Ουπς! Κανένα 100% Match 😅</h3>
              <p style={{ color: "var(--text-muted)" }}>Κανείς δεν τα βρήκε σε όλα. Δείτε τις εναλλακτικές παρακάτω ή κάντε νέο γύρο!</p>
            </div>
          )}

          {runnerUps.length > 0 && (
            <div className="runner-ups-container mb-5">
              <h5 className="fw-bold mb-3" style={{ color: "var(--text-muted)" }}>Εναλλακτικές (Πλειοψηφία)</h5>
              <div className="d-flex flex-column gap-3">
                {runnerUps.map((match, index) => (
                  <div key={match.id || index} className="bento-card p-3 d-flex align-items-center gap-3 transition-btn" style={{ borderRadius: "16px" }}>
<img 
  src={match.image_url || match.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800"} 
  alt={match.title} 
  className="rounded-3" 
  style={{ width: "80px", height: "80px", objectFit: "cover" }} 
  onError={(e) => { 
    e.target.onerror = null; 
    e.target.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800"; 
  }} 
/>                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1" style={{ color: "var(--text-main)" }}>{match.title}</h6>
                      <span className="small" style={{ color: "var(--text-muted)" }}>{match.votes} από {match.maxVotes} άτομα συμφώνησαν</span>
                    </div>
                    <div className="badge rounded-pill px-3 py-2 shadow-sm" style={{ background: "var(--text-main)", color: "var(--inverted-text)", fontSize: "0.9rem" }}>
                      {Math.round((match.votes / match.maxVotes) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex flex-column flex-md-row gap-3 mt-5 mb-5 pb-4">
            <button onClick={() => navigate(`/lobby/${sessionId}`)} className="btn w-100 py-3 rounded-pill fw-bold transition-btn d-flex align-items-center justify-content-center gap-2 shadow-lg" 
                    style={{ background: "var(--accent-color)", color: "#000", fontSize: "1.1rem" }}>
              <ChatDotsFill size={20} /> Πάμε Chat να κανονίσουμε
            </button>
            <button onClick={() => navigate('/lobbies')} className="btn w-100 py-3 rounded-pill fw-bold transition-btn d-flex align-items-center justify-content-center gap-2" 
                    style={{ background: "var(--card-bg)", color: "var(--text-main)", border: "2px solid var(--card-border)", fontSize: "1.1rem" }}>
              <ArrowLeft /> Επιστροφή στο Lobby
            </button>
          </div>

        </div>
      </div>

      <style>{`
        .winner-card {
          box-shadow: 0 15px 35px var(--shadow-color) !important;
          transform: translateY(-5px);
        }
        .winner-card::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(from 0deg, transparent 70%, var(--accent-color) 100%);
          animation: spin-glow 4s linear infinite;
          z-index: -1;
          opacity: 0.3;
        }
        @keyframes spin-glow { 100% { transform: rotate(360deg); } }
        .transition-btn { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .transition-btn:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}