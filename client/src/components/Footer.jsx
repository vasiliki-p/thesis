import React from 'react';
import { Link } from 'react-router-dom';
import { GeoAltFill, EnvelopeFill, HeartFill } from 'react-bootstrap-icons';

export default function Footer() {
  return (
    <footer className="pt-5 pb-4 mt-auto">
      <div className="container">
        <div className="row g-4">
          
          {/* λογότυπο και περιγραφή */}
          <div className="col-lg-4 col-md-6">
            <h4 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
               Pyxis 🧭
            </h4>
            <p className="text-secondary small lh-lg">
              Ο προσωπικός σου ψηφιακός οδηγός για αξέχαστες εμπειρίες. 
              Ανακάλυψε δραστηριότητες, βρες νέα στέκια και ζήσε την πόλη σου αλλιώς.
            </p>
          </div>

          {/* βασικό μενού */}
          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3 text-uppercase small ls-1">Μενου</h6>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/" className="text-secondary text-decoration-none small hover-link">Αρχική</Link></li>
              <li><Link to="/activities" className="text-secondary text-decoration-none small hover-link">Δραστηριότητες</Link></li>
              <li><Link to="/suggestions" className="text-secondary text-decoration-none small hover-link">Προτάσεις AI</Link></li>
              <li><Link to="/stats" className="text-secondary text-decoration-none small hover-link">Στατιστικά</Link></li>
            </ul>
          </div>

          {/* χρήσιμα links & νομικά */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-uppercase small ls-1">Info</h6>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/profile" className="text-secondary text-decoration-none small hover-link">Το Προφίλ μου</Link></li>
              <li><span className="text-secondary small" style={{cursor:'pointer'}}>Όροι Χρήσης</span></li>
              <li><span className="text-secondary small" style={{cursor:'pointer'}}>Πολιτική Απορρήτου</span></li>
            </ul>
          </div>

          {/* στοιχεία επικοινωνίας */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-uppercase small ls-1">Επικοινωνια</h6>
            <ul className="list-unstyled text-secondary small mb-0">
                <li className="mb-3 d-flex align-items-center gap-2">
                    <GeoAltFill className="text-primary"/> 
                    <span>Αθήνα, Ελλάδα</span>
                </li>
                <li className="mb-3 d-flex align-items-center gap-2">
                    <EnvelopeFill className="text-primary"/> 
                    <span>hello@pyxis.gr</span>
                </li>
            </ul>
          </div>

        </div>

        <hr className="border-secondary opacity-25 my-4" />

        {/* copyright & υπογραφή */}
        <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
                <p className="small text-secondary mb-0">
                    &copy; {new Date().getFullYear()} Pyxis. Made with <HeartFill className="text-danger mx-1" size={12}/> for explorers.
                </p>
            </div>
            <div className="col-md-6 text-center text-md-end d-none d-md-block">
                <p className="small text-secondary mb-0">Navigate your experience.</p>
            </div>
        </div>
      </div>
    </footer>
  );
}