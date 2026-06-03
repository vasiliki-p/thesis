import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { EnvelopeFill, LockFill, EyeFill, EyeSlashFill, CompassFill } from "react-bootstrap-icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const Login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // κλήση στο πραγματικό σου API
      const res = await axios.post("/api/login", { email, password });
      
      // αποθήκευση του token και των στοιχείων χρήστη
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user.id);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // ανακατεύθυνση στην Αρχική
      navigate("/");
      // reload για να ενημερωθεί το Navbar (αν χρειάζεται)
      window.location.reload(); 
    } catch (err) {
      setError(err.response?.data?.message || "Λάθος email ή κωδικός. Προσπάθησε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  return (

<div className="d-flex align-items-center justify-content-center position-relative w-100" style={{ minHeight: "calc(100vh - 80px)", paddingBottom: "5vh", background: "var(--bg-color)" }}>
        
      {/* διακοσμητικά σχήματα στο background */}
      <div className="position-absolute" style={{ width: '300px', height: '300px', background: 'var(--accent-color)', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.2', top: '10%', left: '10%', zIndex: 0 }}></div>
      <div className="position-absolute" style={{ width: '400px', height: '400px', background: '#8A2BE2', borderRadius: '50%', filter: 'blur(120px)', opacity: '0.15', bottom: '10%', right: '10%', zIndex: 0 }}></div>

      {/* Η κάρτα του login */}
      <div className="bento-card p-4 p-md-5 position-relative z-1 shadow-lg" style={{ width: "100%", maxWidth: "420px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "32px", backdropFilter: "blur(20px)" }}>
        <div className="text-center mb-4">
  <div className="mb-3">
    <span style={{ fontSize: '3rem' }}>🧭</span>
  </div>
  <h2 className="fw-bold mb-1" style={{ color: "var(--text-main)", letterSpacing: "-1px" }}>Καλώς ήρθες!</h2>
  <p className="small" style={{ color: "var(--text-muted)" }}>Συνδέσου για να βρεις το επόμενο vibe σου.</p>
</div>

        {error && (
          <div className="alert alert-danger border-0 rounded-4 small fw-bold text-center py-2 mb-4" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
            {error}
          </div>
        )}

        <form onSubmit={Login}>
          {/* πεδίο email */}
          <div className="mb-3">
            <label className="form-label small fw-bold" style={{ color: "var(--text-muted)", marginLeft: "5px" }}>EMAIL</label>
            <div className="input-group premium-input-group shadow-sm" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--card-border)" }}>
              <span className="input-group-text border-0" style={{ background: "var(--bg-color)", color: "var(--text-muted)" }}>
                <EnvelopeFill />
              </span>
              <input
                type="email"
                className="form-control border-0"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: "var(--bg-color)", color: "var(--text-main)", boxShadow: "none", padding: "12px" }}
              />
            </div>
          </div>

          {/* πεδίο κωδικού */}
          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: "var(--text-muted)", marginLeft: "5px" }}>ΚΩΔΙΚΟΣ</label>
            <div className="input-group premium-input-group shadow-sm" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--card-border)" }}>
              <span className="input-group-text border-0" style={{ background: "var(--bg-color)", color: "var(--text-muted)" }}>
                <LockFill />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ background: "var(--bg-color)", color: "var(--text-main)", boxShadow: "none", padding: "12px" }}
              />
              <button 
                type="button" 
                className="btn border-0" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "var(--bg-color)", color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeSlashFill /> : <EyeFill />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn w-100 py-3 rounded-pill fw-bold shadow-sm transition-btn mb-4 d-flex justify-content-center align-items-center gap-2" 
            style={{ background: "var(--text-main)", color: "var(--bg-color)", fontSize: "1.05rem" }}
            disabled={loading}
          >
            {loading ? <div className="spinner-border spinner-border-sm"></div> : "Σύνδεση"}
          </button>

          <div className="text-center mt-3">
            <p className="small mb-0" style={{ color: "var(--text-muted)" }}>
              Δεν έχεις λογαριασμό;{" "}
              <Link to="/register" className="fw-bold text-decoration-none" style={{ color: "var(--accent-color)" }}>
                Κάνε εγγραφή
              </Link>
            </p>
          </div>
        </form>
      </div>

      <style>{`
        .premium-input-group:focus-within {
          border-color: var(--accent-color) !important;
          box-shadow: 0 0 0 3px rgba(23, 224, 160, 0.2) !important;
        }
      `}</style>
    </div>
  );
}