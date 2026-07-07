import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation} from "react-router-dom";
import axios from "axios";
import { ShareFill, CheckCircleFill, GeoAltFill, PeopleFill, ArrowLeft, BinocularsFill, Magic, StarFill, Clock } from "react-bootstrap-icons"; 
import { addToHistory } from "../api";
import Map from "../components/Map"; 
import ReviewSection from "../components/ReviewSection"; 
import LikeButton from "../components/LikeButton"; 
import toast from 'react-hot-toast';

export default function ActivityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useLocation();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false); 

  const token = localStorage.getItem("token"); 

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/activities/${id}`);
        setActivity(response.data);
        setLoading(false);

        // αν είναι logged in, το βάζουμε στο ιστορικό
        if (token) {
          addToHistory(id).catch(err => console.error("History log failed", err));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Η δραστηριότητα δεν βρέθηκε.");
        setLoading(false);
      }
    };
    loadActivity();
  }, [id, token]);

  const joinLobby = async () => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    if (!token) {
      toast.error("Πρέπει να συνδεθείς για να μπεις στο Live Chat!");
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('/api/lobby/join', 
        {
          activityId: id,
          userName: user ? (user.username || user.name || "Εξερευνητής") : "Guest"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        navigate(`/lobby/${id}`); 
      }
    } catch (err) {
      console.error("Lobby error:", err);
    }
  };

  const copyLink = async () => {
    if (!activity) return;
    const url = window.location.href;
    const cost = Number(activity.cost) === 0 ? "Δωρεάν" : `${activity.cost}€`;
    const text = `🌟 Τσέκαρε αυτό: ${activity.title}\n📍 ${activity.location}\n💰 ${cost}\n🔗 ${url}`;

    try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error("Copy failed", err);
    }
  };
  
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border" style={{ color: 'var(--accent-color)' }}></div></div>;
  if (error) return <div className="alert alert-danger m-4 rounded-4 border-0 shadow-sm">{error}</div>;
  if (!activity) return null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', paddingTop: '30px' }}>
      <div className="container">
        
        {/* --- 1. HEADER & TOP INFO --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="mb-4 d-inline-flex align-items-center gap-2 fw-bold transition-btn shadow-sm" 
              style={{ color: 'var(--text-main)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '100px', padding: '8px 20px', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Πίσω
            </button>
            
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
              {activity.title}
            </h1>
            
            <div className="d-flex flex-wrap align-items-center gap-3" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <span className="d-flex align-items-center gap-1 fw-bold">
                <StarFill color="#FFD700" size={16} className="mb-1" /> 
                <span style={{ color: 'var(--text-muted)' }}>
                  {activity.rating || "4.5"} <span className="text-decoration-underline ms-1">({activity.reviews || "0"} κριτικές)</span>
                </span>
              </span>
              <span style={{ color: 'var(--card-border)' }}>•</span>
              <span className="d-flex align-items-center gap-1 fw-medium text-decoration-underline" style={{ color: 'var(--text-muted)' }}>
                <GeoAltFill size={16} style={{ color: 'var(--accent-color)' }} /> {activity.location?.split(',')[0]}
              </span>
              <span style={{ color: 'var(--card-border)' }}>•</span>
              <span className="badge rounded-pill fw-bold px-3 py-1 shadow-sm" style={{ background: 'var(--accent-color)', fontSize: '0.85rem' }}>
                {activity.category}
              </span>
            </div>
          </div>
          
          {/* share */}
          <div className="d-flex gap-3 align-items-center align-self-start mt-3 mt-md-0">
            <button 
              onClick={copyLink} 
              className="d-flex align-items-center gap-2 rounded-pill fw-bold transition-btn shadow-sm" 
              style={{ border: '1px solid var(--card-border)', color: 'var(--text-main)', background: 'var(--card-bg)', padding: '12px 24px', cursor: 'pointer' }}
            >
              {copied ? <CheckCircleFill className="text-success" /> : <ShareFill />} <span className="d-none d-md-inline">{copied ? "Αντιγράφηκε" : "Κοινοποίηση"}</span>
            </button>
            
          {/* like */}
            <div 
              className="rounded-pill d-flex align-items-center justify-content-center transition-btn shadow-sm" 
              style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)', width: '48px', height: '48px', display: 'flex' }}
            >
              <LikeButton activityId={id} />
            </div>
          </div>
        </div>

        {/* κεντρική εικόνα */}
        <div className="w-100 mb-5 overflow-hidden shadow-sm" style={{ height: '50vh', minHeight: '400px', borderRadius: '32px', background: 'var(--card-bg)' }}>
          <img 
            src={activity.image_url || "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1200&q=80"} 
            alt={activity.title} 
            className="w-100 h-100" 
            style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} 
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} 
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} 
          />
        </div>

        <div className="row g-5">
          
          {/* αριστερή στήλη (AI insight & reviews) */}
          <div className="col-lg-7 col-xl-8">
            
            <div className="bento-card p-4 mb-4 d-flex align-items-start gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeft: '4px solid var(--accent-color)', borderRadius: '24px' }}>
              <div className="p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ background: 'rgba(23, 224, 160, 0.15)' }}>
                <Magic size={24} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h6 className="fw-bold mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>AI Pyxis Insight</h6>
                <p className="mb-0 fst-italic" style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {/* Δημιουργούμε μια μεταβλητή για το insight */}
{ (state?.ai_reason || activity.ai_summary) && (
  <div className="bento-card p-4 mb-4 d-flex align-items-start gap-3" 
       style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeft: '4px solid var(--accent-color)', borderRadius: '24px' }}>
    <div className="p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ background: 'rgba(23, 224, 160, 0.15)' }}>
      <Magic size={24} style={{ color: 'var(--accent-color)' }} />
    </div>
    <div>
      <h6 className="fw-bold mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>AI Pyxis Insight</h6>
      <p className="mb-0 fst-italic" style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
        "{state?.ai_reason || activity.ai_summary}"
      </p>
    </div>
  </div>
)}
                </p>
              </div>
            </div>

            <div className="bento-card p-4 p-md-5 mb-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px' }}>
  {/*  το key={id}, αναγκάζει το ReviewSection να καθαρίζει τα παλιά δεδομένα και να κάνει update αμέσως */}
  <ReviewSection activityId={id} key={id} />
</div>
          </div>

          {/* δεξιά στήλη (info, chat, map) */}
          <div className="col-lg-5 col-xl-4">
          <div className="sticky-top" style={{ top: '120px', zIndex: 10 }}>
              
              {/* τιμή */}
              <div className="bento-card p-4 mb-3 d-flex align-items-center justify-content-between" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
                <div>
                  <span className="small text-muted fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '0.5px', fontSize: '0.7rem' }}>Κόστος Εμπειρίας</span>
                  <h2 className="fw-bold mb-0" style={{ color: 'var(--text-main)', letterSpacing: '-1.5px', fontSize: '2.5rem' }}>
                    {Number(activity.cost) === 0 ? "Δωρεάν" : `${activity.cost}€`}
                  </h2>
                </div>
                <span className="badge rounded-pill px-3 py-2 fw-bold" 
                      style={{ 
                        background: Number(activity.cost) === 0 ? 'rgba(25, 135, 84, 0.1)' : 'rgba(94, 92, 230, 0.1)', 
                        color: Number(activity.cost) === 0 ? '#198754' : 'var(--text-main)', 
                        fontSize: '0.8rem' 
                      }}>
                  {Number(activity.cost) === 0 ? "Free Entrance" : "Premium Spot"}
                </span>
              </div>

              {/* διάρκεια */}
              <div className="bento-card p-4 mb-4 d-flex align-items-center justify-content-between" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
                <div>
                  <span className="small text-muted fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '0.5px', fontSize: '0.7rem' }}>Εκτιμώμενος Χρόνος</span>
                  <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <Clock size={20} style={{ color: 'var(--accent-color)' }} /> {activity.duration || "2-3 ώρες"}
                  </h4>
                </div>
              </div>

              {/* public chat room */}
              <div className="p-4 text-white border-0 position-relative overflow-hidden mb-4 shadow-sm" style={{ background: 'var(--text-main)', borderRadius: '32px' }}>
                <div className="position-absolute" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', top: '-20px', right: '-20px' }}></div>
                <div className="d-flex align-items-center mb-3 position-relative z-1">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3 me-3"><PeopleFill size={20} /></div>
                  <h4 className="fw-bold m-0 text-white">Βρες Παρέα 🤝</h4>
                </div>
                <p className="small mb-4 position-relative z-1" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                  Μπες στο live chat room της δραστηριότητας και οργανώσου με άλλα άτομα που θέλουν να πάνε τώρα!
                </p>
                <div className="d-flex align-items-center mb-4 position-relative z-1">
                  <div className="avatar-group d-flex">
                    <img src="https://i.pravatar.cc/100?img=11" alt="u1" className="rounded-circle border border-2 border-white" style={{ width: '32px', height: '32px', zIndex: 3 }} />
                    <img src="https://i.pravatar.cc/100?img=12" alt="u2" className="rounded-circle border border-2 border-white" style={{ width: '32px', height: '32px', marginLeft: '-12px', zIndex: 2 }} />
                    <div className="bg-white text-dark d-flex align-items-center justify-content-center fw-bold rounded-circle border border-2 border-white" style={{ width: '32px', height: '32px', marginLeft: '-12px', zIndex: 1, fontSize: '11px' }}>+8</div>
                  </div>
                </div>
                <button onClick={joinLobby} className="btn bg-white w-100 fw-bold py-3 shadow-sm position-relative z-1 transition-btn rounded-pill" style={{ color: 'var(--text-main)', border: 'none' }}>
                  Άνοιγμα Live Chat
                </button>
              </div>

              {/* χάρτης (μίνι) */}
              <div className="bento-card p-3 d-flex flex-column" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px', height: "350px" }}>
                <div className="flex-grow-1 overflow-hidden mb-3" style={{ borderRadius: '20px' }}>
                  <Map key={activity.id} activities={[activity]} />
                </div>
                <a
                  href={`
                    https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location || "Αθήνα")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="d-flex align-items-center justify-content-center transition-btn fw-bold py-3 rounded-pill shadow-sm"
                  style={{ background: 'var(--text-main)', color: 'var(--inverted-text)', border: 'none', textDecoration: 'none' }}
                >
                  <GeoAltFill className="me-2 text-danger" /> Άνοιγμα στους Χάρτες
                </a> 
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
}