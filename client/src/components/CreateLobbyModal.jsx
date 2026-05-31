import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleFill, PlusCircleFill } from 'react-bootstrap-icons';
import axios from 'axios';

export default function CreateLobbyModal({ show, onClose }) {
  const navigate = useNavigate();
  const [newLobby, setNewLobby] = useState({ name: '', type: 'Διασκέδαση', location: '' });

  if (!show) return null;

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    
    try {
      // Παίρνουμε το ID του χρήστη
      const userId = localStorage.getItem('user_id') || 1; 

      // 1. Στέλνουμε τα στοιχεία στο Backend για να δημιουργήσει και να ΑΠΟΘΗΚΕΥΣΕΙ το δωμάτιο
      const response = await axios.post('http://localhost:5000/api/group/create', {
        hostId: userId,
        isPublic: false, // Είναι private
        lobbyName: newLobby.name,
        lobbyType: newLobby.type,
        lobbyLocation: newLobby.location
      });

      // 2. Παίρνουμε το ΕΠΙΣΗΜΟ PIN που μας έδωσε η βάση δεδομένων
      const officialPin = response.data.pin;

      onClose(); // Κλείνουμε το modal
      navigate(`/group-swipe/${officialPin}`);

    } catch (error) {
      console.error("Σφάλμα κατά την αποθήκευση του Lobby:", error);
      alert("Υπήρξε πρόβλημα με τη δημιουργία του δωματίου. Δοκιμάστε ξανά.");
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
      <div className="p-4 p-md-5 w-100 position-relative shadow-lg" style={{ maxWidth: '440px', background: 'var(--card-bg)', border: '2px solid var(--accent-color)', borderRadius: '32px' }}>
        <button onClick={onClose} className="btn position-absolute top-0 end-0 m-3 p-0 border-0" style={{ color: 'var(--text-muted)' }}>
          <XCircleFill size={26} />
        </button>
        
        <h3 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)', letterSpacing: '-1px' }}>
          <PlusCircleFill size={24} color="var(--accent-color)"/> Νέα Παρέα
        </h3>
        
        <p className="small mb-4" style={{ color: 'var(--text-muted)' }}>
          Ρύθμισε το δωμάτιο σου. Μόνο όσοι έχουν το PIN θα μπορούν να μπουν.
        </p>
        
        <form onSubmit={handleCreateLobby}>
          <div className="mb-3">
            <label className="form-label small fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>ΟΝΟΜΑ ΠΑΡΕΑΣ</label>
            <input type="text" required className="form-control border-0" placeholder="π.χ. Nightout στο Κέντρο 🍻" value={newLobby.name} onChange={(e) => setNewLobby({...newLobby, name: e.target.value})} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '12px', boxShadow: 'none' }} />
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
            <input type="text" required className="form-control border-0" placeholder="π.χ. Αθήνα, Γλυφάδα..." value={newLobby.location} onChange={(e) => setNewLobby({...newLobby, location: e.target.value})} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '12px', boxShadow: 'none' }} />
          </div>

          <button type="submit" className="btn w-100 py-3 rounded-pill fw-bold transition-btn" style={{ background: 'var(--text-main)', color: 'var(--bg-color)', fontSize: '1.05rem' }}>
            Δημιουργία Δωματίου 🚀
          </button>
        </form>
      </div>
    </div>
  );
}