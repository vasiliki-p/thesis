import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PersonalChoice from '../components/PersonalChoice'; 
import SurpriseDice from '../components/SurpriseDice'; 
import CreateLobbyModal from '../components/CreateLobbyModal'; 
import axios from 'axios';
import toast from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  
  // παίρνουμε το token από το localStorage
  const token = localStorage.getItem('token'); 

  const [showModal, setShowModal] = useState(false);
  const [pin, setPin] = useState('');

  // είσοδος σε υπάρχον δωμάτιο
  const JoinLobby = async (mode) => {
    if (!token) {
      toast.error('Πρέπει να συνδεθείτε για να μπείτε σε μια παρέα!');
      navigate('/login');
      return;
    }

    if (pin.length < 3) {
      toast.error('Παρακαλώ εισάγετε έγκυρο PIN!');
      return;
    }
    
    try {
      // τσεκάρουμε αν υπάρχει το δωμάτιο
      await axios.get(`/api/group/info/${pin}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      // αν το βρήκε, πάμε εκεί που διάλεξε (chat ή swipe)
      if (mode === 'chat') {
        navigate(`/lobby/${pin}`);
      } else {
        navigate(`/group-swipe/${pin}`);
      }
    } catch (error) {
      // Αν το backend γυρίσει 404 (Δεν βρέθηκε) ή 401
      toast.error('❌ Το δωμάτιο δεν βρέθηκε! Ελέγξτε το PIN σας.');
    }
  };

  return (
    <div className="position-relative" style={{ minHeight: '100vh', paddingBottom: '100px' }}>      
      
      {/* hero section */}
      <section className="d-flex flex-column justify-content-center align-items-center text-center px-3" style={{ minHeight: '80vh' }}>
        <div className="container">
          <span className="badge rounded-pill px-4 py-2 mb-4 shadow-sm fw-bold" style={{ background: 'var(--text-main)', color: 'var(--inverted-text)', letterSpacing: '1px' }}>
            AI POWERED EXPLORATION
          </span>
          
          <h1 className="display-1 fw-bold mb-4 hero-title" style={{ color: 'var(--text-main)', letterSpacing: '-4px', lineHeight: '1.1' }}>
            Pyxis <span style={{ color: 'var(--accent-color)' }}>.</span>
          </h1>
          
          <p className="fs-4 mb-5 mx-auto fw-medium opacity-75" style={{ color: 'var(--text-muted)', maxWidth: '650px' }}>
            Η μοναδική πλατφόρμα που καταλαβαίνει πώς ακριβώς θέλεις να διασκεδάσεις <strong>σήμερα</strong>.
          </p>
          
          <div className="d-flex flex-column align-items-center gap-4">
            <Link to="/activities" className="btn px-5 rounded-pill shadow-lg border-0 d-flex align-items-center justify-content-center fw-bold transition-btn" style={{ background: 'var(--text-main)', color: 'var(--inverted-text)', height: '60px', width: '250px' }}>
              Ξεκίνα εδώ
            </Link>
            
            <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
              <SurpriseDice />
            </div>
          </div>
        </div>
      </section>

      {/* περιεχόμενο bento grid */}
      <main className="container z-1 position-relative">
        <div className="row g-4">
          
          {/* προσωπικό feed */}
          <div className="col-12">
            <div className="bento-card p-4 p-md-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(24px)' }}>
                <div className="d-flex align-items-center mb-4 gap-3">
                    <div className="pulse-dot"></div>
                    <h3 className="fw-bold mb-0" style={{ color: 'var(--text-main)', fontSize: '1.5rem', letterSpacing: '-1px' }}>Για σένα</h3>
                </div>
                <div className="component-wrapper">
                  <PersonalChoice />
                </div>
            </div>
          </div>

          {/* lobbies promo */}
          <div className="col-12">
            <div className="bento-card p-4 p-md-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(24px)' }}>
              <div>
                <span className="badge rounded-pill px-3 py-2 mb-3 fw-bold shadow-sm" style={{ background: 'var(--accent-color)', color: '#000' }}>
                  LIVE NOW 🟢
                </span>
                <h2 className="display-6 fw-bold mb-3" style={{ color: 'var(--text-main)', letterSpacing: '-1px' }}>Βρες Παρέα στην Πόλη 🤝</h2>
                <p className="fs-5 mb-4 mb-lg-0" style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
                  Δεν χρειάζεται να πας μόνος. Μπες στα δημόσια lobbies και γνώρισε άτομα με το ίδιο mood!
                </p>
              </div>
              
              <div className="d-flex flex-column align-items-lg-end gap-3">
                <div className="d-flex align-items-center gap-3 p-2 pe-4 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="avatar-group d-flex">
                    {[1, 2, 3, 4, 5].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i+30}`} alt="user" className="avatar-img rounded-circle shadow-sm" style={{ border: '2px solid var(--card-bg)' }} />
                    ))}
                  </div>
                  <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>+24 άτομα</span>
                </div>
                
                <Link to="/lobbies" className="btn px-5 py-3 rounded-pill fw-bold shadow-sm transition-btn w-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--text-main)', color: 'var(--inverted-text)', textDecoration: 'none' }}>
                  Εξερεύνηση Lobbies
                </Link>
              </div>
            </div>
          </div>

          {/* group mode */}
          <div className="col-lg-8">
            <div className="bento-card p-4 p-md-5 h-100 text-dark d-flex flex-column" style={{ background: 'var(--accent-color)', border: 'none' }}>
                <h2 className="display-6 fw-bold mb-3" style={{ letterSpacing: '-1px' }}>Group Mode 👥</h2>
                <p className="fs-5 opacity-75 mb-4">Βρείτε το κοινό σας Match σε πραγματικό χρόνο.</p>
                <div className="p-3 p-md-4 rounded-4 shadow mt-auto flex-grow-1" style={{ background: 'var(--inverted-text)', color: 'var(--text-main)' }}>
                    
                    <div className="card p-4 shadow-sm" style={{ borderRadius: '15px', maxWidth: '400px', margin: '20px auto' }}>
                      
                      <button 
                        onClick={() => setShowModal(true)} 
                        className="btn w-100 mb-3 py-2 fw-bold"
                        style={{ background: 'var(--text-main)', color: '#ffffff', border: 'none' }}
                      >
                        🚀 Δημιουργία Νέας Παρέας
                      </button>

                      <div className="hr-text text-muted my-2 text-center">ή μπες σε υπάρχουσα</div>

                      {/* πεδίο PIN  κ κουμπιά */}
                      <div className="mb-3 mt-3">
                        <input 
                          type="text" 
                          className="form-control text-center mb-3" 
                          placeholder="Κωδικός PIN" 
                          maxLength="6"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.toUpperCase())}
                          style={{ letterSpacing: '2px', fontWeight: 'bold', fontSize: '1.1rem' }}
                        />
                        <div className="d-flex gap-2">
                          <button 
                            onClick={() => JoinLobby('chat')} 
                            className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2 fw-bold"
                            style={{ background: '#ffffff', color: 'var(--text-main)', border: '1px solid var(--text-main)' }}
                          >
                            💬 Chat
                          </button>
                          
                          <button 
                            onClick={() => JoinLobby('swipe')} 
                            className="btn w-50 d-flex align-items-center justify-content-center gap-2 fw-bold"
                            style={{ background: 'var(--text-main)', color: '#ffffff', border: 'none' }}
                          >
                            🎲 Swipe
                          </button>
                        </div>
                      </div>
                    </div>

                </div>
            </div>
          </div>

          {/* smart analytics */}
          <div className="col-lg-4">
            <div className="bento-card p-4 p-md-5 h-100 d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(24px)' }}>
                <div className="display-3 mb-4" style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.1))' }}>⚡</div>
                <h4 className="fw-bold" style={{ color: 'var(--text-main)' }}>Live Stats</h4>
                <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>Η πόλη κινείται.<br/>Το Pyxis αναλύει.</p>
            </div>
          </div>

        </div>
      </main>

      {/* styles */}
      <style>{`
        .pulse-dot { width: 14px; height: 14px; background: var(--accent-color); border-radius: 50%; box-shadow: 0 0 0 0 var(--shadow-color); animation: pulse-dot-anim 2s infinite; }
        @keyframes pulse-dot-anim { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 var(--shadow-color); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0,0,0,0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
        .avatar-img { width: 45px; height: 45px; object-fit: cover; }
        .avatar-group img:not(:first-child) { margin-left: -15px; }
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: scale(1.05); }
      `}</style>
    
      {/* Το Modal Δημιουργίας */}
      <CreateLobbyModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}