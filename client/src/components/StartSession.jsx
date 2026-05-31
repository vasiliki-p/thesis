import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StartSession = ({ userId }) => {
  const [invitePin, setInvitePin] = useState('');
  const navigate = useNavigate();

  // Δημιουργία νέου δωματίου
  const handleCreate = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/group/create', { hostId: userId });
      if (res.data.success) {
        // Μετάβαση στη σελίδα swipe με τον νέο κωδικό
        navigate(`/group-swipe/${res.data.pin}`);
      }
    } catch (err) {
      alert("Σφάλμα κατά τη δημιουργία δωματίου");
    }
  };

  // Είσοδος σε υπάρχον δωμάτιο
  const handleJoin = () => {
    if (invitePin.length === 6) {
      navigate(`/group-swipe/${invitePin.toUpperCase()}`);
    } else {
      alert("Βάλε έναν έγκυρο 6ψήφιο κωδικό");
    }
  };

  return (
    <div className="card p-4 shadow-sm" style={{ borderRadius: '15px', maxWidth: '400px', margin: '20px auto' }}>
      <h3 className="text-center mb-4">👥 Group Mode</h3>
      
      <button onClick={handleCreate} className="btn btn-primary w-100 mb-3 py-2">
        🚀 Δημιουργία Νέας Παρέας
      </button>

      <div className="hr-text text-muted my-2 text-center">ή μπες σε υπάρχουσα</div>

      <div className="input-group mb-3">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Κωδικός PIN" 
          maxLength="6"
          value={invitePin}
          onChange={(e) => setInvitePin(e.target.value)}
        />
        <button onClick={handleJoin} className="btn btn-outline-secondary">
          Είσοδος
        </button>
      </div>
    </div>
  );
};

export default StartSession;