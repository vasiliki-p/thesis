import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { XCircleFill, Radar, PlusCircleFill, GeoAltFill, LockFill, Globe } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

export default function LobbyDiscovery() {
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(true);
  const [newLobby, setNewLobby] = useState({ name: '', type: 'Διασκέδαση', location: '' });

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  
  // φορτώνουμε τα ενεργά lobbies
  useEffect(() => {
    const loadLobbies = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/group/active', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setLobbies(response.data);
      } catch (err) {
        console.error("Σφάλμα κατά τη φόρτωση των lobbies:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLobbies();
  }, [token]);

  // άνοιγμα του modal δημιουργίας
  const openModal = (publicMode) => {
    if (!token) { toast.error("Πρέπει να συνδεθείς πρώτα!"); navigate('/login'); return; }
    setIsPublicMode(publicMode);
    setShowModal(true);
  };

  const createLobby = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/group/create', { 
        isPublic: isPublicMode, 
        lobbyName: newLobby.name || (isPublicMode ? 'Pyxis Group' : 'Private Squad'),
        lobbyType: newLobby.type,
        lobbyLocation: newLobby.location || 'Αθήνα'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setShowModal(false);
        navigate(`/lobby/${res.data.pin}`);      
      }
    } catch (err) {
      console.error("Lobby create error:", err);
      toast.error("Σφάλμα κατά τη δημιουργία δωματίου");
    }
  };

  // είσοδος σε lobby
  const joinLobby = (lobbyId) => {
    if (!token) {
      toast.error("Πρέπει να συνδεθείς ή να κάνεις εγγραφή για να μπεις στην παρέα! 🚀");
      navigate('/login');
      return; 
    }
    navigate(`/lobby/${lobbyId}`); 
  };

  return (
    <div className="container position-relative" style={{ paddingTop: '30px', paddingBottom: '80px', minHeight: '100vh', zIndex: 1 }}>
      
      {/* header και εφέ ραντάρ */}
      <div className="text-center mb-5">
        <div className="radar-base mb-4 mx-auto position-relative d-flex align-items-center justify-content-center"
             style={{ width: '100px', height: '100px', background: 'rgba(217, 119, 6, 0.1)', border: '2px solid rgba(217, 119, 6, 0.2)', borderRadius: '50%' }}>
          <div className="radar-ping"></div>
          <div className="radar-wave"></div>
          <Radar size={40} style={{ color: '#d97706', zIndex: 2 }} />
        </div>
        
        <h1 className="fw-bold display-4 mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
          Lobby Radar
        </h1>
        <p className="fw-bold d-flex align-items-center justify-content-center gap-2 small" style={{ color: '#d97706', letterSpacing: '1px' }}>
          <span className="pulse-dot-radar"></span> ΣΑΡΩΣΗ ΓΙΑ ΕΝΕΡΓΕΣ ΠΑΡΕΕΣ ΣΤΗΝ ΠΟΛΗ
        </p>
      </div>

      {/* λίστα με τα ανοιχτά lobbies */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      ) : lobbies.length > 0 ? (
        <div className="row g-4 mb-5">
          {lobbies.map((lobby) => (
            <div className="col-12 col-md-6" key={lobby.id || lobby.pin}>
              <div className="p-4 transition-btn h-100 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge mb-3 rounded-pill px-3 py-2 fw-bold" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', fontSize: '0.75rem' }}>
                      {lobby.type?.toUpperCase() || "ΠΑΡΕΑ"}
                    </span>
                    <h4 className="fw-bold mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                      {lobby.name || `Δωμάτιο #${lobby.pin}`}
                    </h4>
                    {lobby.location && (
                      <p className="mb-0 small d-flex align-items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <GeoAltFill style={{ color: '#d97706' }} /> {lobby.location}
                      </p>
                    )}
                  </div>
                  <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm" 
                       style={{ width: '42px', height: '42px', background: 'var(--text-main)', color: 'var(--bg-color)', fontSize: '0.85rem', border: '1px solid var(--card-border)' }}>
                    +{lobby.users_count || lobby.users || 1}
                  </div>
                </div>
                <div className="mt-4">
                  <button onClick={() => joinLobby(lobby.pin || lobby.id)} className="btn w-100 fw-bold py-3 transition-btn rounded-pill" style={{ background: '#d97706', color: '#fff' }}>
                    Join Lobby 🚀
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 mb-5 rounded-4 p-5 shadow-sm mx-auto" style={{ background: 'var(--card-bg)', border: '1px dashed var(--card-border)', borderRadius: '24px', maxWidth: '800px' }}>
          <h4 className="fw-bold mb-2" style={{ color: 'var(--text-main)' }}>Δεν βρέθηκαν ανοιχτά Lobbies</h4>
          <p className="mb-0" style={{ color: 'var(--text-muted)' }}>Η πόλη είναι ήσυχη αυτή τη στιγμή. Ίσως είναι ώρα να κάνεις εσύ την αρχή!</p>
        </div>
      )}

      {/* επιλογές για νέο public ή private lobby */}
      <div className="row g-4 mx-auto" style={{ maxWidth: '900px' }}>
     
        <div className="col-md-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center h-100 d-flex flex-column justify-content-center transition-btn" 
               style={{ background: 'var(--card-bg)', border: '2px dashed #d97706' }}>
            <div className="mb-3">
              <Globe size={32} style={{ color: '#d97706' }} />
            </div>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--text-main)' }}>Θέλεις νέες παρέες;</h5>
            <p className="small mb-4" style={{ color: 'var(--text-muted)' }}>
              Άνοιξε ένα Public Lobby για να φανεί στο Ραντάρ και να μπουν άτομα από όλη την πόλη.
            </p>
            <button className="btn w-100 py-3 rounded-pill fw-bold mt-auto" onClick={() => openModal(true)} style={{ background: '#d97706', color: '#fff' }}>
              <Radar className="me-2" /> Ανοιχτό Lobby
            </button>
          </div>
        </div>

        <div className="col-md-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center h-100 d-flex flex-column justify-content-center transition-btn" 
               style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="mb-3">
              <LockFill size={32} style={{ color: 'var(--accent-color)' }} />
            </div>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--text-main)' }}>Μόνο για την παρέα;</h5>
            <p className="small mb-4" style={{ color: 'var(--text-muted)' }}>
              Φτιάξε ένα κλειστό Private Room, πάρε το μυστικό PIN και στείλτο μόνο στους φίλους σου.
            </p>
            <button className="btn w-100 py-3 rounded-pill fw-bold mt-auto" onClick={() => openModal(false)} style={{ background: 'var(--text-main)', color: 'var(--bg-color)' }}>
              <LockFill className="me-2" /> Private Squad
            </button>
          </div>
        </div>
      </div>

      {/* modal δημιουργίας */}
      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
          <div className="p-4 p-md-5 w-100 position-relative shadow-lg" style={{ maxWidth: '440px', background: 'var(--card-bg)', border: `2px solid ${isPublicMode ? '#d97706' : 'var(--accent-color)'}`, borderRadius: '32px' }}>
            <button onClick={() => setShowModal(false)} className="btn position-absolute top-0 end-0 m-3 p-0 border-0" style={{ color: 'var(--text-muted)' }}><XCircleFill size={26} /></button>
            
            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)', letterSpacing: '-1px' }}>
              {isPublicMode ? <><Radar size={24} color="#d97706"/> Ανοιχτό Lobby</> : <><LockFill size={24} color="var(--accent-color)"/> Private Squad</>}
            </h3>
            
            <p className="small mb-4" style={{ color: 'var(--text-muted)' }}>
              {isPublicMode ? 'Το δωμάτιο θα εμφανιστεί στο κεντρικό ραντάρ.' : 'Μόνο όσοι έχουν το PIN θα μπορούν να μπουν.'}
            </p>
            
            <form onSubmit={createLobby}>
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>ΟΝΟΜΑ ΠΑΡΕΑΣ</label>
                <input type="text" className="form-control border-0" placeholder={isPublicMode ? "π.χ. Nightout στο Κέντρο 🍻" : "π.χ. Κολλητοί 🍕"} value={newLobby.name} onChange={(e) => setNewLobby({...newLobby, name: e.target.value})} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '12px', boxShadow: 'none' }} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>VIBE / ΚΑΤΗΓΟΡΙΑ</label>
                <select className="form-select border-0" value={newLobby.type} onChange={(e) => setNewLobby({...newLobby, type: e.target.value})} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '12px', boxShadow: 'none' }}>
                  <option>Διασκέδαση</option>
                  <option>Night Out</option>
                  <option>Φαγητό</option>
                  <option>Καφέ / Χαλαρά</option>
                  <option>Φύση / Δραστηριότητα</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>ΠΕΡΙΟΧΗ</label>
                <input type="text" className="form-control border-0" placeholder="π.χ. Αθήνα, Γλυφάδα..." value={newLobby.location} onChange={(e) => setNewLobby({...newLobby, location: e.target.value})} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '12px', boxShadow: 'none' }} />
              </div>
              <button type="submit" className="btn w-100 py-3 rounded-pill fw-bold transition-btn" style={{ background: isPublicMode ? '#d97706' : 'var(--text-main)', color: isPublicMode ? '#fff' : 'var(--bg-color)', fontSize: '1.05rem' }}>
                Άνοιγμα Δωματίου 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .radar-ping { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #d97706; animation: radar-pulse 2s infinite linear; }
        .radar-wave { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%); animation: radar-pulse 2s infinite linear; animation-delay: 0.5s; }
        .pulse-dot-radar { width: 8px; height: 8px; background-color: #d97706; border-radius: 50%; animation: blink 1.5s infinite ease-in-out; }
        @keyframes radar-pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
      `}</style>
    </div>
  );
}