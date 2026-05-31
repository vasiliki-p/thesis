import React, { createContext, useState, useContext } from 'react';
import { XCircleFill, ExclamationCircleFill } from 'react-bootstrap-icons';

// 1. Δημιουργία του Context
const AlertContext = createContext();

// 2. Custom Hook για να το καλούμε πανεύκολα σε άλλες σελίδες
export const useAlert = () => useContext(AlertContext);

// 3. O Provider που "αγκαλιάζει" το App μας
export const AlertProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    message: '',
    title: 'Ειδοποίηση',
    type: 'alert', // 'alert' = 1 κουμπί (ΟΚ), 'confirm' = 2 κουμπιά (ΟΚ / Άκυρο)
    onConfirm: null,
  });

  // Συνάρτηση για απλή ειδοποίηση (Αντικαθιστά το alert)
  const showAlert = (message, title = 'Ειδοποίηση') => {
    setModal({ isOpen: true, message, title, type: 'alert', onConfirm: null });
  };

  // Συνάρτηση για επιβεβαίωση (Αντικαθιστά το confirm)
  const showConfirm = (message, onConfirmCallback, title = 'Επιβεβαίωση') => {
    setModal({ isOpen: true, message, title, type: 'confirm', onConfirm: onConfirmCallback });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* ΤΟ ΚΕΝΤΡΙΚΟ GLOBAL MODAL ΜΑΣ */}
      {modal.isOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 99999 }}>
          <div className="p-4 p-md-5 w-100 position-relative shadow-lg text-center" style={{ maxWidth: '400px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <button onClick={closeModal} className="btn position-absolute top-0 end-0 m-3 p-0 border-0" style={{ color: 'var(--text-muted)' }}>
              <XCircleFill size={26} />
            </button>
            
            <div className="mb-3">
              <ExclamationCircleFill size={50} style={{ color: modal.type === 'confirm' ? '#E63946' : 'var(--accent-color)' }} />
            </div>
            
            <h3 className="fw-bold mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-1px' }}>{modal.title}</h3>
            <p className="mb-4 fw-medium" style={{ color: 'var(--text-muted)' }}>{modal.message}</p>
            
            <div className="d-flex flex-column gap-2">
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={handleConfirm} className="btn w-100 py-3 rounded-pill fw-bold" style={{ background: '#E63946', color: '#fff' }}>
                    Ναι, Σίγουρα
                  </button>
                  <button onClick={closeModal} className="btn w-100 py-3 rounded-pill fw-bold" style={{ background: 'transparent', color: 'var(--text-main)', border: '2px solid var(--card-border)' }}>
                    Ακύρωση
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="btn w-100 py-3 rounded-pill fw-bold" style={{ background: 'var(--text-main)', color: 'var(--inverted-text)' }}>
                  Εντάξει
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};