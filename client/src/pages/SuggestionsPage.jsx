import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Stars, GeoAltFill, Wallet2, Search, Magic, EmojiSmile, ArrowRight, CloudRainFill, SunFill, MoonFill, CloudFill } from "react-bootstrap-icons";
import axios from "axios";

export default function SuggestionsPage() {
  const [filters, setFilters] = useState({ interests: "", budget: "", location: "" });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weatherStatus, setWeatherStatus] = useState(null);

  // Παίρνουμε το token!
  const token = localStorage.getItem("token");

  const getImage = (act) => {
    if (act.image_url && act.image_url.length > 10) return act.image_url;
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800";
  };

  const addTag = (tag) => {
    const next = filters.interests ? `${filters.interests}, ${tag}` : tag;
    setFilters({ ...filters, interests: next });
  };

  const fetchSuggestions = async () => {
    setError("");
    setLoading(true);
    let finalWeather = "Clear"; 

    try {
      try {
        const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY; 
        
        let cityQuery = filters.location || "Athens";
        const locLower = cityQuery.toLowerCase();
        
        if (locLower.includes("αθη") || locLower.includes("athen")) cityQuery = "Athens";
        else if (locLower.includes("θεσσαλον") || locLower.includes("thess")) cityQuery = "Thessaloniki";
        else if (locLower.includes("πατρ") || locLower.includes("patr")) cityQuery = "Patras";
        else if (locLower.includes("ηρακλ") || locLower.includes("herak")) cityQuery = "Heraklion";
        else if (locLower.includes("λαρισ") || locLower.includes("laris")) cityQuery = "Larissa";
        else if (locLower.includes("βολ") || locLower.includes("volo")) cityQuery = "Volos";
        else if (locLower.includes("ιωανν") || locLower.includes("ioann")) cityQuery = "Ioannina";
        
        if (!API_KEY) {
          console.warn("⚠️ ΠΡΟΣΟΧΗ: Το κλειδί REACT_APP_OPENWEATHER_API_KEY δε βρέθηκε στο .env του Frontend!");
          throw new Error("Missing API Key");
        }

        const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityQuery)}&appid=${API_KEY}`);
        
        if (weatherRes.data && weatherRes.data.weather) {
          finalWeather = weatherRes.data.weather[0].main;
        }
      } catch (weatherErr) {
        console.warn("☁️ Το API καιρού απέτυχε, αλλά κρατάμε την προεπιλογή (Clear) για το banner.");
      }
      
      setWeatherStatus(finalWeather);

      // Προσθήκη του Token στα Headers
      const res = await axios.post("/api/ai/suggest", 
        { interests: filters.interests, budget: filters.budget, location: filters.location, weather: finalWeather },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data && res.data.suggestions) {
        setSuggestions(res.data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      setError("Αδυναμία σύνδεσης με τον AI Βοηθό. Ελέγξτε το backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      
      {/* --- ΔΙΟΡΘΩΜΕΝΟ HEADER --- */}
      <div className="text-center mb-5">
        <span className="badge rounded-pill px-3 py-2 mb-3 shadow-sm fw-bold text-uppercase" 
              style={{ background: "var(--accent-color)", color: "#000", letterSpacing: "1px", fontSize: "0.75rem" }}>
          POWERED BY PYXIS AI
        </span>

        <h1 className="fw-bold display-4 mb-2" style={{ color: 'var(--text-main)', letterSpacing: "-0.05em" }}>
          <Magic className="me-2" style={{ color: 'var(--accent-color)' }} /> Έξυπνος Βοηθός
        </h1>
        <p className="mx-auto" style={{ color: 'var(--text-muted)', maxWidth: "700px" }}>
          Πες μας τι ψάχνεις και η AI θα βρει τις καλύτερες δραστηριότητες βάσει των προτιμήσεών σου και του καιρού!
        </p>
      </div>

      {/* --- ΔΙΟΡΘΩΜΕΝΑ ΦΙΛΤΡΑ (Bento style) --- */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
        <div className="row g-3">
          
          <div className="col-md-5">
            <label htmlFor="suggest-interests" className="form-label small fw-bold" style={{ color: 'var(--text-muted)' }}>Τι έχεις όρεξη;</label>
            <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <span className="input-group-text border-0" style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }}><EmojiSmile /></span>
              <input id="suggest-interests" type="text" className="form-control border-0 ps-0" placeholder="π.χ. Φύση, Ποτό..." value={filters.interests} onChange={(e) => setFilters({ ...filters, interests: e.target.value })} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', boxShadow: 'none' }} />
            </div>
            <div className="mt-3 d-flex gap-2 flex-wrap">
              {["Χαλαρά ☕", "Ρομαντικά 🍷", "Περιπέτεια 🧗", "Οικογένεια 👨‍👩‍👧"].map((tag) => (
                <button key={tag} onClick={() => addTag(tag)} className="badge border rounded-pill py-2 px-3 fw-normal shadow-sm transition-btn" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', borderColor: 'var(--card-border)', cursor: "pointer" }} type="button">{tag}</button>
              ))}
            </div>
          </div>

          <div className="col-md-2">
            <label htmlFor="suggest-budget" className="form-label small fw-bold" style={{ color: 'var(--text-muted)' }}>Ποσό (€)</label>
            <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <span className="input-group-text border-0" style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }}><Wallet2 /></span>
              <input id="suggest-budget" type="number" className="form-control border-0 ps-0" placeholder="50" value={filters.budget} onChange={(e) => setFilters({ ...filters, budget: e.target.value })} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', boxShadow: 'none' }} />
            </div>
          </div>

          <div className="col-md-3">
            <label htmlFor="suggest-location" className="form-label small fw-bold" style={{ color: 'var(--text-muted)' }}>Περιοχή</label>
            <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <span className="input-group-text border-0" style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }}><GeoAltFill /></span>
              <input id="suggest-location" type="text" className="form-control border-0 ps-0" placeholder="Αθήνα" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', boxShadow: 'none' }} />
            </div>
          </div>

          <div className="col-md-2 d-flex align-items-end">
            <button onClick={fetchSuggestions} className="btn w-100 rounded-pill fw-bold shadow-sm py-2 transition-btn" disabled={loading} type="button" style={{ background: 'var(--accent-color)', color: '#000' }}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : <><Search className="me-2" /> Βρες το</>}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger rounded-4 shadow-sm">{error}</div>}

     {/* --- AI WEATHER INSIGHT BANNER --- */}
      {weatherStatus && suggestions.length > 0 && (
        (() => {
          const isNight = new Date().getHours() < 6 || new Date().getHours() > 20;
          let IconComponent = SunFill;
          let iconColor = '#FFD700';
          let messageText = "Ο καιρός είναι υπέροχος! Σου προτείνω τις καλύτερες επιλογές για έξω και μέσα.";

          if (['Rain', 'Drizzle', 'Thunderstorm'].includes(weatherStatus)) {
            IconComponent = CloudRainFill;
            iconColor = '#00b8ff';
            messageText = "Εντόπισα βροχή στην περιοχή! Φιλτράρω αυτόματα για εσωτερικές δραστηριότητες.";
          } else if (weatherStatus === 'Clouds') {
            IconComponent = CloudFill;
            iconColor = '#a0aec0';
            messageText = "Έχει αρκετή συννεφιά. Προτείνω ιδανικές δραστηριότητες για να είσαι άνετα.";
          } else if (isNight) {
            IconComponent = MoonFill;
            iconColor = '#F6E05E';
            messageText = "Υπέροχη βραδιά! Δες τι παίζει τώρα στην πόλη.";
          }

          return (
            <div className="alert border-0 shadow-sm rounded-4 d-flex align-items-center mb-4 p-3 animate__animated animate__fadeIn" style={{ background: 'rgba(23, 224, 160, 0.1)' }}>
              <div className="fs-2 me-3">
                <IconComponent style={{ color: iconColor }} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-main)' }}>AI Weather Analysis</h6>
                <small style={{ color: 'var(--text-muted)' }}>
                  {messageText}
                </small>
              </div>
            </div>
          );
        })()
      )}

      {/* --- ΝΕΑ ΑΠΟΤΕΛΕΣΜΑΤΑ (ΝΕΟ PREMIUM DESIGN) --- */}
      <div className="row g-4 mt-2">
        {suggestions.map((item) => {
          const descriptionText = item.description?.length > 100 ? `${item.description.substring(0, 100)}...` : item.description;

          return (
            <div key={item.id} className="col-12 col-md-6 col-lg-4">
              <div className="h-100 d-flex flex-column rounded-4 overflow-hidden shadow-sm transition-btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                
                <div className="position-relative" style={{ height: "220px", overflow: "hidden" }}>
                  <img src={getImage(item)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: 'transform 0.5s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                  {item.ai_score && (
                    <div className="position-absolute top-0 end-0 m-3 badge rounded-pill shadow-lg py-2 px-3 fw-bold d-flex align-items-center gap-1" style={{ background: 'var(--accent-color)', color: '#000', fontSize: '0.85rem', zIndex: 2 }}>
                      <Stars /> Match: {item.ai_score}%
                    </div>
                  )}
                </div>

               <div className="card-body d-flex flex-column p-4 flex-grow-1">
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--text-main)' }}>{item.title}</h5>
                  <div className="d-flex align-items-center gap-3 small mb-3">
                    
                    {/* Διορθωμένο Link για Google Maps */}
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(item.title + ' ' + item.location)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="d-flex align-items-center gap-1 text-decoration-none transition-btn" 
                      style={{ color: 'var(--text-muted)' }}>
                      <GeoAltFill style={{ color: 'var(--accent-color)' }} /> 
                      <span style={{ borderBottom: '1px dashed var(--text-muted)' }}>{item.location}</span>
                    </a>
                    
                    <span className="fw-bold" style={{ color: 'var(--text-main)' }}>{Number(item.cost) === 0 ? "Free" : `${item.cost}€`}</span>
                  </div>
                  
                  <p className="small mb-3 flex-grow-1" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{descriptionText}</p>

                  {/* --- ΑΙΤΙΟΛΟΓΙΑ ΤΗΣ AI --- */}
                  {item.ai_reason && (
                    <div className="alert border-0 small mb-4 py-2 px-3 rounded-3 d-flex align-items-start gap-2" style={{ background: 'rgba(23, 224, 160, 0.1)', borderLeft: '3px solid var(--accent-color)', color: 'var(--text-main)' }}>
                      <Magic style={{ color: 'var(--accent-color)', marginTop: '2px', flexShrink: 0 }} /> 
                      <span className="fst-italic lh-sm">"{item.ai_reason}"</span>
                    </div>
                  )}

                  <Link 
                    to={`/activities/${item.id}`} 
                    state={{ ai_reason: item.ai_reason }} 
                    className="btn w-100 rounded-pill py-2 mt-auto fw-bold d-flex align-items-center justify-content-center gap-2 transition-btn" 
                    style={{ background: 'var(--text-main)', color: 'var(--bg-color)' }}
                  >
                    Λεπτομέρειες <ArrowRight />
                  </Link>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {!loading && suggestions.length === 0 && !error && (
        <div className="text-center mt-5 opacity-50">
          <Search size={60} className="mb-3" style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ color: 'var(--text-main)' }}>Περιμένω να μου πεις τι ψάχνεις!</h4>
        </div>
      )}

      <style>{`
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
}