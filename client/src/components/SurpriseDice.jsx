import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SurpriseDice() {
  const [isRolling, setIsRolling] = useState(false);
  const navigate = useNavigate();

  const rollDice = async () => {
    // αποτροπή διπλού κλικ όσο γυρνάει το ζάρι
    if (isRolling) return;
    
    setIsRolling(true);

    try {
      // παίρνουμε όλες τις δραστηριότητες
      const response = await axios.get('/api/activities');
      const activities = response.data;
      
      if (activities && activities.length > 0) {
        // επιλογή μιας τυχαίας δραστηριότητας
        const randomAct = activities[Math.floor(Math.random() * activities.length)];
        
        // περιμένουμε 1.5s για να παίξει το animation του ζαριού πριν την αλλαγή σελίδας
        setTimeout(() => { 
          setIsRolling(false); 
          navigate(`/activities/${randomAct.id}`); 
        }, 1500);

      } else {
        setIsRolling(false);
        toast.error("Δεν βρέθηκαν δραστηριότητες για να διαλέξουμε.");
      }
    } catch (err) { 
      console.error("Σφάλμα στο ζάρι:", err);
      setIsRolling(false);
      toast.error("Υπήρξε πρόβλημα με τη σύνδεση στον server.");
    }
  };

  return (
    <div className="dice-container" onClick={rollDice} style={{ cursor: 'pointer', margin: 0 }}>
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