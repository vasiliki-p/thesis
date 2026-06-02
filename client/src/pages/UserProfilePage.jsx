import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { getUserProfile, updateUserProfile, getUserHistory } from "../api";
import {
  Eye, EyeSlash, Pencil, ClockHistory, HeartFill, Trash, BoxArrowUpRight, PersonCircle
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";

function LoadingSpinner({ small = false }) {
  const sizeClass = small ? "spinner-border-sm" : "";
  return (
    <div className={`spinner-border ${sizeClass}`} style={{ color: 'var(--accent-color)' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}
LoadingSpinner.propTypes = { small: PropTypes.bool };

export default function UserProfilePage() {
  const [profile, setProfile] = useState({
    id: null, username: "", email: "", password: "", location: "", interests: "", budget: "",
  });

  const [favourites, setFavourites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingFavourites, setLoadingFavourites] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState({ username: false, email: false });
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageText, setMessageText] = useState("");

  const token = localStorage.getItem("token");
  const formatCost = (cost) => (Number(cost) === 0 ? "Free" : `${cost}€`);

  const getImage = (act) => {
    if (act.image_url && act.image_url.length > 10) return act.image_url;
    const title = act.title ? act.title.toLowerCase() : "";
    if (title.includes("θάλασσα") || title.includes("παραλία")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80";
    if (title.includes("βουνό") || title.includes("πεζοπορία")) return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=100&q=80";
    if (title.includes("φαγητό") || title.includes("γαστρονομία")) return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=100&q=80";
    return "https://picsum.photos/100";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(token);
        setProfile((prev) => ({ ...prev, ...data, password: "" }));
      } catch (err) { console.error("Error fetching profile:", err); } 
      finally { setLoading(false); }
    };
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!profile.id) return;
    const fetchData = async () => {
      setLoadingFavourites(true);
      setLoadingHistory(true);
      try {
        // ΔΙΟΡΘΩΣΗ: Σβήσαμε το ${profile.id} από το τέλος του link!
        const favRes = await axios.get("http://localhost:5000/api/favourites", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const favouriteIds = favRes.data.map(Number);
        const actRes = await axios.get("http://localhost:5000/api/activities");

        if (favouriteIds.length > 0) {
          setFavourites(actRes.data.filter((act) => favouriteIds.includes(Number(act.id))));
        } else { setFavourites([]); }

        // Το getUserHistory() στο api.js διαβάζει ήδη το token, οπότε δεν θέλει παραμέτρους
        const historyData = await getUserHistory();
        setHistory(historyData);
      } catch (err) { console.error("Error loading data:", err); } 
      finally { setLoadingFavourites(false); setLoadingHistory(false); }
    };
    fetchData();
  }, [profile.id, token]);

  const handleRemoveFav = async (activityId) => {
    if (!window.confirm("Σίγουρα θες να το διαγράψεις από τα αγαπημένα;")) return;
    try {
      // 3. Στέλνουμε το token στα headers και βγάζουμε το user_id από το body!
      await axios.delete("http://localhost:5000/api/favourites/remove", { 
          headers: { Authorization: `Bearer ${token}` },
          data: { activity_id: activityId } 
      });
      setFavourites((prev) => prev.filter((f) => f.id !== activityId));
    } catch (err) { alert("Κάτι πήγε στραβά με τη διαγραφή."); }
  };

  const enableEdit = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      if (field === "username" && usernameRef.current) usernameRef.current.focus();
      if (field === "email" && emailRef.current) emailRef.current.focus();
    }, 100);
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await updateUserProfile(token, profile);
      setMessage("success");
      setMessageText("✅ Το προφίλ ενημερώθηκε!");
      setProfile((prev) => ({ ...prev, password: "" }));
      setIsEditing({ username: false, email: false });
    } catch (err) {
      setMessage("error");
      setMessageText(err?.response?.data?.error || "❌ Σφάλμα κατά την ενημέρωση.");
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><LoadingSpinner /></div>;

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '80px', minHeight: '100vh' }}>
      
      <div className="row g-4">
        
        {/* --- ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ: PROFILE & SETTINGS (40%) --- */}
        <div className="col-lg-4">
          <div className="bento-card p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            
            {/* User Header Info (Συμμαζεμένο στην κορυφή της κάρτας) */}
            <div className="text-center mb-4 pb-4 border-bottom" style={{ borderColor: 'var(--card-border) !important' }}>
              <div className="position-relative d-inline-block mb-2">
                <img 
                  src={`https://ui-avatars.com/api/?name=${profile.username || "Explorer"}&background=random&color=fff&rounded=true&bold=true&size=128`} 
                  alt="User Avatar" 
                  className="rounded-circle shadow-sm"
                  style={{ width: "80px", height: "80px", objectFit: "cover", border: '2px solid var(--accent-color)' }} 
                />
                <span className="position-absolute bottom-0 end-0 p-2 bg-success border border-2 rounded-circle" style={{ borderColor: 'var(--card-bg)' }}></span>
              </div>
              <h3 className="fw-bold mb-0" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                {profile.username || "Explorer"}
              </h3>
              <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSubmit}>
              <h6 className="fw-bold mb-3" style={{ color: 'var(--text-main)' }}>Ρυθμίσεις Λογαριασμού</h6>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Όνομα Χρήστη</label>
                <div className="input-group compact-input">
                  <input ref={usernameRef} type="text" name="username" className="form-control bg-transparent text-reset border-end-0" value={profile.username || ""} onChange={handleChange} required disabled={!isEditing.username} style={{ borderColor: 'var(--card-border)' }} />
                  <button className="btn border-start-0" type="button" onClick={() => enableEdit("username")} style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Email</label>
                <div className="input-group compact-input">
                  <input ref={emailRef} type="email" name="email" className="form-control bg-transparent text-reset border-end-0" value={profile.email || ""} onChange={handleChange} required disabled={!isEditing.email} style={{ borderColor: 'var(--card-border)' }} />
                  <button className="btn border-start-0" type="button" onClick={() => enableEdit("email")} style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Αλλαγή Κωδικού</label>
                <div className="input-group compact-input">
                  <input type={showPassword ? "text" : "password"} name="password" className="form-control bg-transparent text-reset border-end-0" placeholder="••••••••" value={profile.password || ""} onChange={handleChange} autoComplete="new-password" style={{ borderColor: 'var(--card-border)' }} />
                  <button className="btn border-start-0" type="button" onClick={() => setShowPassword(!showPassword)} style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <h6 className="fw-bold mt-4 mb-3" style={{ color: 'var(--text-main)' }}>Προτιμήσεις</h6>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Τοποθεσία</label>
                <input type="text" name="location" className="form-control bg-transparent text-reset compact-input" placeholder="π.χ. Αθήνα" value={profile.location || ""} onChange={handleChange} style={{ borderColor: 'var(--card-border)' }} />
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Ενδιαφέροντα</label>
                <textarea name="interests" className="form-control bg-transparent text-reset compact-input" rows="2" placeholder="Φαγητό, Θέατρο..." value={profile.interests || ""} onChange={handleChange} style={{ borderColor: 'var(--card-border)' }} />
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Σύνηθες Budget (€)</label>
                <input type="number" name="budget" className="form-control bg-transparent text-reset compact-input" placeholder="30" value={profile.budget || ""} onChange={handleChange} style={{ borderColor: 'var(--card-border)' }} />
              </div>

              {message && (
                <div className={`alert ${message === "success" ? "alert-success" : "alert-danger"} rounded-3 py-2 small border-0 mt-3`}>
                  {messageText}
                </div>
              )}

              <button type="submit" className="btn w-100 mt-2 fw-bold py-2 rounded-pill" style={{ background: 'var(--text-main)', color: 'var(--bg-color)' }}>
                Αποθήκευση
              </button>
            </form>
          </div>
        </div>

        {/* --- ΔΕΞΙΑ ΣΤΗΛΗ: ΑΓΑΠΗΜΕΝΑ & ΙΣΤΟΡΙΚΟ (60%) --- */}
        <div className="col-lg-8 d-flex flex-column gap-4">
          
          {/* Card Αγαπημένων */}
          <div className="bento-card p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#FF3B30' }}>
              <HeartFill size={18} /> Αγαπημένα
            </h5>
            
            {loadingFavourites ? <LoadingSpinner small /> : favourites.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {favourites.map((act) => (
                  <div key={act.id} className="compact-list-item d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid var(--card-border)' }}>
                    <div className="d-flex align-items-center gap-3">
                      <img src={getImage(act)} alt={act.title} className="rounded-2" style={{ width: "45px", height: "45px", objectFit: "cover" }} />
                      <div>
                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{act.title}</h6>
                        <small style={{ color: 'var(--text-muted)' }}>{act.category} • {formatCost(act.cost)}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <Link to={`/activities/${act.id}`} className="btn btn-sm btn-light rounded-circle" style={{ padding: '6px 8px' }}><BoxArrowUpRight size={14} /></Link>
                      <button onClick={() => handleRemoveFav(act.id)} className="btn btn-sm btn-danger rounded-circle text-white border-0" style={{ padding: '6px 8px' }}><Trash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 opacity-50">
                <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>Δεν υπάρχουν αγαπημένα ακόμα.</p>
              </div>
            )}
          </div>

          {/* Card Ιστορικού */}
          <div className="bento-card p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--accent-color)' }}>
              <ClockHistory size={18} /> Πρόσφατα Είδατε
            </h5>
            
            {loadingHistory ? <LoadingSpinner small /> : history.length > 0 ? (
              <div className="row g-2">
                {history.map((item) => (
                  <div className="col-12 col-md-6" key={item.id}>
                    <Link to={`/activities/${item.id}`} className="compact-list-item p-2 d-flex align-items-center gap-3 rounded-3 text-decoration-none" style={{ border: '1px solid var(--card-border)' }}>
                      <img src={getImage(item)} alt={item.title} className="rounded-circle" style={{ width: "35px", height: "35px", objectFit: "cover" }} />
                      <div className="flex-grow-1 overflow-hidden">
                        <h6 className="mb-0 fw-bold text-truncate" style={{ color: 'var(--text-main)', fontSize: "0.9rem" }}>{item.title}</h6>
                        <small style={{ color: 'var(--text-muted)', fontSize: "10px" }}>{new Date(item.event_time).toLocaleDateString("el-GR")}</small>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 opacity-50">
                <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>Κενό ιστορικό.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .compact-input { font-size: 0.9rem; }
        .compact-input:focus { border-color: var(--accent-color) !important; box-shadow: none; outline: none; }
        .compact-input:disabled { opacity: 0.6; }
        
        .compact-list-item { transition: background 0.2s, border-color 0.2s; background: transparent; }
        .compact-list-item:hover { background: rgba(128,128,128,0.05); border-color: var(--accent-color) !important; }
      `}</style>
    </div>
  );
}