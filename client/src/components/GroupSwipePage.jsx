import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const socket = io("/");

export default function GroupSwipePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate(); 
  
  const [activities, setActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  
  // ΝΕΟ: Βάλαμε loading state για να ξέρουμε πότε τελείωσε το ψάξιμο
  const [loading, setLoading] = useState(true);

  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [latestMatch, setLatestMatch] = useState(null);

  // States για τα Animations
  const [isSkipping, setIsSkipping] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  // Για το Double Tap & το Swipe
  const lastTapTime = useRef(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success("Ο κωδικός αντιγράφηκε! Στείλτον στην παρέα σου. 📲");
  };

  useEffect(() => {
    socket.emit('join_group', sessionId);
    
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        // ΔΙΟΡΘΩΣΗ 1: Χτυπάμε το σωστό endpoint που καταλαβαίνει από Φίλτρα!
        const res = await axios.get(`/api/group/activities/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActivities(res.data);
      } catch (err) { 
        console.error("Σφάλμα κατά τη φόρτωση καρτών:", err); 
      } finally {
        // Τελείωσε το ψάξιμο
        setLoading(false);
      }
    };
    fetchActivities();

    socket.on('receive_swipe', (data) => {
      if (data.match) {
        setActivities(prev => {
          const matchedAct = prev.find(a => Number(a.id) === Number(data.activityId));
          if (matchedAct) {
            setMatches(prevMatches => {
              if (prevMatches.find(m => m.id === matchedAct.id)) return prevMatches;
              setLatestMatch(matchedAct);
              setShowMatchScreen(true);
              return [...prevMatches, matchedAct];
            });
          }
          return prev;
        });
      }
    });

    return () => socket.off('receive_swipe');
  }, [sessionId]);

  // --- ΠΛΟΗΓΗΣΗ ΜΕ ΒΕΛΑΚΙΑ ΠΛΗΚΤΡΟΛΟΓΙΟΥ ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handleVote('dislike');
      if (e.key === 'ArrowRight') handleVote('like');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activities]);

  // --- ΑΣΦΑΛΕΙΑ ΔΕΔΟΜΕΝΩΝ (Fallback) ---
  const getSafeImage = (activity) => {
    if (activity && activity.image_url && activity.image_url.trim() !== "") return activity.image_url;
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800"; 
  };
  
  const getSafeTitle = (activity) => {
    if (activity && activity.name && activity.name.trim() !== "") return activity.name;
    if (activity && activity.title && activity.title.trim() !== "") return activity.title;
    return "Μυστική Τοποθεσία ✨"; 
  };

  // --- ΛΟΓΙΚΗ ΨΗΦΟΦΟΡΙΑΣ ---
  const handleVote = async (voteType) => {
    if (currentIndex >= activities.length) return;
    const currentActivity = activities[currentIndex];
    
    const token = localStorage.getItem("token");

    if (!token) { 
      toast.error("Παρακαλώ συνδεθείτε ξανά."); 
      return; 
    }

    if (voteType === 'like') {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      setIsSkipping(true); 
    }

    try {
      const res = await axios.post('/api/group/vote', 
        { 
          sessionId, 
          activityId: Number(currentActivity.id), 
          voteType 
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }
      );

      if (res.data.match) {
        socket.emit('send_swipe', { groupId: sessionId, activityId: currentActivity.id, match: true });
        setLatestMatch(currentActivity);
        setShowMatchScreen(true);
      }
    } catch (err) { console.error("Σφάλμα στην ψήφο:", err); }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsSkipping(false);
    }, voteType === 'like' ? 600 : 400); 
  };

  const handleDragStart = (e) => {
    touchStartX.current = e.clientX || (e.touches && e.touches[0].clientX);
  };

  const handleDragEnd = (e) => {
    touchEndX.current = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    if (swipeDistance > 60) {
      handleVote('dislike'); 
    } else if (swipeDistance < -60) {
      handleVote('like'); 
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapTime.current < DOUBLE_PRESS_DELAY) {
      handleVote('like'); 
    }
    lastTapTime.current = now;
  };

  // -------------------------------------------------------------
  // ΟΘΟΝΕΣ ΦΟΡΤΩΣΗΣ ΚΑΙ ΕΛΕΓΧΩΝ (ΠΡΙΝ ΦΤΑΣΟΥΜΕ ΣΤΙΣ ΚΑΡΤΕΣ)
  // -------------------------------------------------------------
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
        <div className="spinner-border" style={{ color: "var(--accent-color)", width: "3rem", height: "3rem" }}></div>
      </div>
    );
  }

  // ΔΙΟΡΘΩΣΗ 2: Το "Ειλικρινές" Empty State αν δεν υπάρχουν κάρτες για αυτά τα φίλτρα
  if (!loading && activities.length === 0) {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh", paddingTop: "80px", background: "var(--bg-color)" }}>
        <div className="text-center p-5 bento-card shadow-lg" style={{ borderRadius: "30px", maxWidth: "450px" }}>
          <div className="display-1 mb-3">🏜️</div>
          <h3 className="fw-bold mb-3" style={{ color: "var(--text-main)" }}>Δεν βρέθηκε τίποτα!</h3>
          <p className="text-muted mb-4">
            Δεν υπάρχουν δραστηριότητες σε αυτή την περιοχή για το Vibe που επιλέξατε.
          </p>
          <button 
            onClick={() => navigate('/lobbies')} 
            className="btn w-100 py-3 rounded-pill fw-bold transition-btn shadow-sm"
            style={{ background: "var(--accent-color)", color: "#000", fontSize: "1.1rem" }}
          >
             Επιστροφή στα Lobbies
          </button>
        </div>
      </div>
    );
  }

  const currentActivity = activities[currentIndex];

  return (
    <div style={{ 
      width: '100%', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', 
      paddingTop: '2px', paddingBottom: '20px', overflow: 'hidden' 
    }}>
      
      {/* HEADER */}
      <div className="text-center mb-3">
        <span className="urgency-badge mb-2 d-inline-block shadow-sm" onClick={copyToClipboard} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem' }}>
            Session: #{sessionId} 📋
        </span>
        
        <h2 style={{ fontWeight: 900, margin: '5px 0', letterSpacing: '-1px', fontSize: '1.8rem', color: "var(--text-main)" }}>
          Squad Sync <span style={{color: 'var(--accent-color)'}}>Pyxis</span>
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Σύρε την κάρτα, βάλε βελάκια <strong>ή</strong> πάτα τα κουμπιά.
        </p>
      </div>
      
      {/* TIKTOK FEED CONTAINER */}
      {currentActivity ? (
        <div className="tiktok-container">
          
          <div 
            className={`tiktok-card ${isSkipping ? 'slide-up-out' : ''}`} 
            style={{ 
              backgroundImage: `url(${getSafeImage(currentActivity)})`,
              cursor: 'grab' 
            }}
            onClick={handleDoubleTap}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            {/* Overlay Καρδιάς */}
            <div className={`big-heart-overlay ${showHeart ? 'animate' : ''}`}>🧭</div>
            
            {/* ΠΛΗΡΟΦΟΡΙΕΣ */}
            <div className="tiktok-info">
              <span className="tag-pill m-0" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff' }}>
                {currentActivity.category || "Εξερεύνηση"}
              </span>
              
              <h2 style={{ color: '#ffffff', fontSize: '2.2rem', fontWeight: 900, textShadow: '0 4px 15px rgba(0,0,0,0.9)', margin: '10px 0 5px 0', lineHeight: 1.1 }}>
                {getSafeTitle(currentActivity)}
              </h2>
              <p style={{ color: '#ffffff', fontSize: '1.1rem', opacity: 0.95, textShadow: '0 2px 10px rgba(0,0,0,0.9)', margin: 0 }}>
                📍 {currentActivity.location || "Δες στον χάρτη"}
              </p>
            </div>

            {/* ΚΟΥΜΠΙΑ */}
            <div className="tiktok-actions">
              <div className="tiktok-btn-wrapper">
                <button className="tiktok-btn btn-like" onClick={(e) => { e.stopPropagation(); handleVote('like'); }}>
                  🧭
                </button>
                <span className="tiktok-btn-label">Vibe</span>
              </div>
              
              <div className="tiktok-btn-wrapper">
                <button className="tiktok-btn btn-skip" onClick={(e) => { e.stopPropagation(); handleVote('dislike'); }}>
                  <span style={{ display: 'inline-block', fontSize: '1.2rem' }}>⏩</span>
                </button>
                <span className="tiktok-btn-label">Skip</span>
              </div>
            </div>
          </div>
          
        </div>
      ) : (
       /* ΟΤΑΝ ΤΕΛΕΙΩΣΟΥΝ ΟΙ ΕΠΙΛΟΓΕΣ (Όταν κάνει swipe και την τελευταία κάρτα) */
        <div className="d-flex flex-column align-items-center justify-content-center text-center p-5" style={{ border: '2px dashed var(--accent-color)', borderRadius: '30px', background: 'var(--card-bg)', width: '90%', maxWidth: '420px', height: '60vh' }}>
          <div className="display-1 mb-3">🏆</div>
          <h3 className="fw-bold mb-2" style={{ color: 'var(--text-main)' }}>Τα είδατε όλα!</h3>
          <p className="text-muted mb-4">Η ψηφοφορία σου ολοκληρώθηκε. Πάμε να δούμε τι αποφάσισε τελικά η παρέα!</p>
          
          <button 
            onClick={() => navigate(`/match-results/${sessionId}`)} 
            className="btn mt-2 rounded-pill px-5 py-3 fw-bold transition-btn shadow-lg"
            style={{ background: 'var(--accent-color)', color: '#000', fontSize: '1.1rem' }}
          >
             Δες τα Αποτελέσματα 🔥
          </button>
        </div>
      )}

      {/* --- MATCH SCREEN OVERLAY --- */}
      {showMatchScreen && latestMatch && (
        <div 
          className="match-screen-immersive"
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundImage: `url(${getSafeImage(latestMatch)})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.4s ease-out'
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(10, 10, 15, 0.75)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            zIndex: -1
          }}></div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '40px',
            padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
            maxWidth: '90%', width: '400px', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            
            <h1 style={{ 
                fontSize: '3.5rem', fontWeight: 900, 
                background: 'linear-gradient(135deg, var(--accent-color) 0%, #00b8ff 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                margin: '0 0 5px 0', textAlign: 'center', filter: 'drop-shadow(0 10px 20px rgba(23, 224, 160, 0.3))'
              }}>
              MATCH!
            </h1>
            
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '25px', textAlign: 'center', fontWeight: '500' }}>
              Η παρέα μίλησε. Φύγαμε για:
            </p>

            <div style={{ 
              width: '100%', height: '300px', borderRadius: '24px', 
              backgroundImage: `url(${getSafeImage(latestMatch)})`, 
              backgroundSize: 'cover', backgroundPosition: 'center', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              position: 'relative', overflow: 'hidden', marginBottom: '30px'
            }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'
              }}></div>
              
              <div style={{
                position: 'absolute', bottom: '20px', left: '20px', right: '20px',
                color: '#ffffff', fontWeight: 900, margin: 0, fontSize: '1.6rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)', lineHeight: '1.2'
              }}>
                {getSafeTitle(latestMatch)}
              </div>
            </div>
            
            <div className="d-flex flex-column gap-3 w-100">
              <button 
                onClick={() => navigate(`/activities/${latestMatch.id}`)} 
                style={{
                  background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '100px',
                  padding: '16px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(23, 224, 160, 0.4)', transition: 'all 0.2s'
                }}
              >
                Πάμε εκεί! 🚀
              </button>
              
              <button 
                onClick={() => setShowMatchScreen(false)} 
                style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none',
                  padding: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Συνέχεια στο Swipe
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}