import React, { useState } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Stars, PersonCircle, BarChartLine, BoxArrowRight, Map, People } from 'react-bootstrap-icons'; 

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    closeMenu(); 
    navigate("/");
    window.location.reload();
  };

  const getLinkClasses = (path) => {
    return location.pathname === path 
      ? "fw-bold rounded-pill px-3 py-2 shadow-sm"
      : "fw-medium px-3 py-2"; 
  };

  const getLinkStyles = (path) => {
    return location.pathname === path
      ? { background: 'var(--accent-color)', color: '#000' } 
      : { color: 'var(--text-main)' }; 
  };

  return (
    <nav className="navbar navbar-expand-lg shadow-sm sticky-top py-1" >
      <div className="container-fluid px-4"> 
        
        {/* LOGO */}
       <Link className="navbar-brand py-0 transition-btn" to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.8rem' }}>🧭</span>
          <div style={{ lineHeight: '1', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text-main)' }}>PYXIS</span>
          </div>
        </Link>

        {/* TOGGLER */}
        <button 
            className="navbar-toggler border-0 shadow-none" 
            type="button" 
            onClick={toggle} 
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(var(--invert-icon, 0))' }}></span>
        </button>

        {/* MENU CONTENTS */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
              
              <ul className="navbar-nav mx-auto align-items-center gap-2 gap-lg-4 mt-3 mt-lg-0"> 
            
                <li className="nav-item">
                  <Link 
                    className={`nav-link d-flex align-items-center gap-2 transition-btn ${getLinkClasses('/activities')}`} 
                    to="/activities" onClick={closeMenu} style={getLinkStyles('/activities')}
                  >
                    <Map size={18} /> Δραστηριότητες
                  </Link>
                </li>

                {/* 🔓 ΕΛΕΥΘΕΡΟ ΣΕ ΟΛΟΥΣ: Τα Lobbies */}
                <li className="nav-item">
                  <Link 
                    className={`nav-link d-flex align-items-center gap-2 transition-btn ${getLinkClasses('/lobbies')}`} 
                    to="/lobbies" onClick={closeMenu} style={getLinkStyles('/lobbies')}
                  >
                    <People size={18} /> Lobbies
                  </Link>
                </li>

                {/* 🔒 ΜΟΝΟ ΣΥΝΔΕΔΕΜΕΝΟΙ ΒΛΕΠΟΥΝ ΤΑ ΠΑΡΑΚΑΤΩ */}
                {token && (
                  <>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link d-flex align-items-center gap-2 transition-btn ${getLinkClasses('/suggestions')}`} 
                        to="/suggestions" onClick={closeMenu} style={getLinkStyles('/suggestions')}
                      >
                        <Stars size={18} /> Προτάσεις
                      </Link>
                    </li>
                    
                    <li className="nav-item">
                      <Link 
                        className={`nav-link d-flex align-items-center gap-2 transition-btn ${getLinkClasses('/stats')}`} 
                        to="/stats" onClick={closeMenu} style={getLinkStyles('/stats')}
                      >
                        <BarChartLine size={18} /> Στατιστικά
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link 
                        className={`nav-link d-flex align-items-center gap-2 transition-btn ${getLinkClasses('/profile')}`} 
                        to="/profile" onClick={closeMenu} style={getLinkStyles('/profile')}
                      >
                        <PersonCircle size={18} /> Προφίλ
                      </Link>
                    </li>
                  </>
                )}
              </ul>

              {/* ΚΟΥΜΠΙΑ ΔΕΞΙΑ */}
              <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0 justify-content-center"> 
                {token ? (
                    <button 
                        onClick={handleLogout} 
                        className="logout-btn"
                    >
                      <BoxArrowRight size={18}/> Αποσύνδεση
                    </button>
                ) : (
                    <>
                        <Link className="btn fw-bold d-flex align-items-center gap-2 rounded-pill transition-btn px-4 py-2" to="/login" onClick={closeMenu} style={{ background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}>
                            Σύνδεση
                        </Link>
                        <Link className="btn fw-bold d-flex align-items-center gap-2 rounded-pill px-4 py-2 shadow-sm transition-btn" to="/register" onClick={closeMenu} style={{ background: 'var(--text-main)', color: 'var(--inverted-text)' }}>
                            Εγγραφή
                        </Link>
                    </>
                )}
              </div>

        </div>
      </div>
      <style>{`
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: scale(1.05); }
      `}</style>
    </nav>
  );
}