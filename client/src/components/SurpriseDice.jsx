import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SurpriseDice() {
  const [isRolling, setIsRolling] = useState(false);
  const navigate = useNavigate();

  const handleRoll = async () => {
    // Αν ήδη γυρνάει, μην κάνεις τίποτα (για να μην πατάει πολλές φορές ο χρήστης)
    if (isRolling) return;
    
    setIsRolling(true);

    try {
      // 1. Τραβάμε ΠΡΑΓΜΑΤΙΚΕΣ δραστηριότητες από το API σου
      const response = await axios.get('/api/activities');
      const activities = response.data;
      
      if (activities && activities.length > 0) {
        // 2. Διαλέγουμε μία στην τύχη
        const randomAct = activities[Math.floor(Math.random() * activities.length)];
        
        // 3. Περιμένουμε 1.5 δευτερόλεπτο για να παίξει το 3D animation του ζαριού 
        // και μετά κάνουμε redirect στο πραγματικό ID!
        setTimeout(() => { 
          setIsRolling(false); 
          navigate(`/activities/${randomAct.id}`); 
        }, 1500);

      } else {
        setIsRolling(false);
        alert("Δεν βρέθηκαν δραστηριότητες για να διαλέξουμε.");
      }
    } catch (err) { 
      console.error("Σφάλμα στο ζάρι:", err);
      setIsRolling(false);
      alert("Υπήρξε πρόβλημα με τη σύνδεση στον server.");
    }
  };

  return (
    <div className="dice-container" onClick={handleRoll} style={{ cursor: 'pointer', margin: 0 }}>
      <div className={`dice ${isRolling ? 'rolling' : ''}`}>
        <div className="dice-face front">🎲</div>
        <div className="dice-face back">✨</div>
        <div className="dice-face right">🔥</div>
        <div className="dice-face left">🔮</div>
        <div className="dice-face top">🚀</div>
        <div className="dice-face bottom">👀</div>
      </div>
    </div>

  );
}