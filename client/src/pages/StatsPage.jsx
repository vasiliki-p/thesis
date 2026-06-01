import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Tooltip, Legend, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer
} from "recharts";
import axios from "axios";
import { ChatSquareTextFill, StarFill, TrophyFill, BarChartFill } from "react-bootstrap-icons";

export default function StatsPage() {
  const [reviews, setReviews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("user_id");
  
  // Premium Neon Παλέτα για το Dark Mode
  const COLORS = ["var(--accent-color)", "#8A2BE2", "#00b8ff", "#FFD700", "#FF007F", "#ff4d4d"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token"); // Παίρνουμε το Token
        
        // Φέρνουμε ΠΑΡΑΛΛΗΛΑ τα reviews του χρήστη και τις δραστηριότητες
        const [reviewsRes, activitiesRes] = await Promise.all([
          // ΔΙΟΡΘΩΣΗ: Αφαιρέσαμε το ${userId} και βάλαμε το Token στα Headers
          axios.get(`http://localhost:5000/api/reviews/user`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/activities`)
        ]);
        
        setReviews(reviewsRes.data);
        setActivities(activitiesRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
    else setLoading(false);
  }, [userId]);

  // --- Στατιστικά ---
  const activityStats = reviews.reduce((acc, review) => {
    // Βρίσκουμε το πραγματικό όνομα της δραστηριότητας από τη βάση
    const foundActivity = activities.find(a => Number(a.id) === Number(review.activity_id));
    const realTitle = foundActivity ? foundActivity.title : review.activity_title || `Activity #${review.activity_id}`;
    
    if (!acc[realTitle]) {
      acc[realTitle] = {
        fullName: realTitle,
        // Κόβουμε το όνομα για τον άξονα Χ ώστε να μη χαλάει το design
        shortName: realTitle.length > 12 ? realTitle.substring(0, 12) + "..." : realTitle,
        value: 0,
        avgRating: 0,
        totalRating: 0,
      };
    }
    acc[realTitle].value += 1;
    acc[realTitle].totalRating += review.rating;
    acc[realTitle].avgRating = Number((acc[realTitle].totalRating / acc[realTitle].value).toFixed(1));
    return acc;
  }, {});

  const chartData = Object.values(activityStats);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "-";

  const mostPopular = chartData.length > 0
    ? chartData.reduce(
        (prev, current) => (prev.value > current.value ? prev : current),
        chartData[0]
      ).fullName
    : "-";

  const totalReviews = reviews.length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--bg-color)' }}>
        <output aria-live="polite" className="d-inline-flex align-items-center flex-column gap-3">
          <span className="spinner-border" style={{ color: 'var(--accent-color)', width: '3rem', height: '3rem' }} aria-hidden="true"></span>
          <span className="h5 mb-0 fw-bold" style={{ color: 'var(--text-main)' }}>Φόρτωση Pyxis Analytics...</span>
        </output>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container py-5 mt-5 text-center">
        <div className="bento-card p-5 mx-auto" style={{ maxWidth: '500px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px' }}>
          <BarChartFill size={50} style={{ color: 'var(--text-muted)' }} className="mb-4" />
          <h3 className="fw-bold" style={{ color: 'var(--text-main)' }}>Δεν είσαι συνδεδεμένος</h3>
          <p style={{ color: 'var(--text-muted)' }}>Πρέπει να συνδεθείς για να δεις τα προσωπικά σου στατιστικά.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container position-relative py-5 mt-5" style={{ zIndex: 1 }}>
      
      {/* Background blobs */}
      <div className="position-absolute" style={{ width: '400px', height: '400px', background: 'var(--accent-color)', borderRadius: '50%', filter: 'blur(120px)', opacity: '0.1', top: '10%', right: '10%', zIndex: -1 }}></div>

      <div className="text-center mb-5">
        <span className="badge rounded-pill px-3 py-2 mb-3 shadow-sm fw-bold text-uppercase d-inline-flex align-items-center gap-2" 
              style={{ background: "var(--card-bg)", color: "var(--text-main)", border: '1px solid var(--card-border)', letterSpacing: "1px", fontSize: "0.75rem" }}>
          <BarChartFill style={{ color: 'var(--accent-color)' }} /> PYXIS ANALYTICS
        </span>
        <h1 className="fw-bold display-5 mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-1px' }}>Τα Στατιστικά μου</h1>
        <p className="lead mx-auto" style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
          Δες συνολικά τις εμπειρίες σου και ανακάλυψε τι είδους δραστηριότητες προτιμάς πραγματικά.
        </p>
      </div>

      {/* --- TOP SUMMARY CARDS (Bento Style) --- */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 h-100 transition-btn d-flex flex-row align-items-center gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(23, 224, 160, 0.1)', color: 'var(--accent-color)' }}>
              <ChatSquareTextFill size={28} />
            </div>
            <div>
              <h6 className="mb-1 fw-bold" style={{ color: 'var(--text-muted)' }}>Συνολικές Κριτικές</h6>
              <h2 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>{totalReviews}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 h-100 transition-btn d-flex flex-row align-items-center gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700' }}>
              <StarFill size={28} />
            </div>
            <div>
              <h6 className="mb-1 fw-bold" style={{ color: 'var(--text-muted)' }}>Μέσο Rating</h6>
              <h2 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>{averageRating}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 h-100 transition-btn d-flex flex-row align-items-center gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px' }}>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(138, 43, 226, 0.1)', color: '#8A2BE2' }}>
              <TrophyFill size={28} />
            </div>
            <div className="overflow-hidden">
              <h6 className="mb-1 fw-bold" style={{ color: 'var(--text-muted)' }}>Πιο Δημοφιλής</h6>
              <h5 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text-main)' }} title={mostPopular}>{mostPopular}</h5>
            </div>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="alert border text-center py-5 rounded-4 shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h4 style={{ color: 'var(--text-main)' }}>Δεν υπάρχουν δεδομένα ακόμα.</h4>
          <p style={{ color: 'var(--text-muted)' }}>Κάνε μια κριτική σε κάποια δραστηριότητα και γύρνα εδώ! 🙂</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* PIE CHART */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px' }}>
              <h5 className="fw-bold mb-4" style={{ color: 'var(--text-main)' }}>📌 Κατανομή Κριτικών</h5>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="fullName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={5}
                      label={{ fill: 'var(--text-main)', fontSize: 12 }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${entry.fullName}`} fill={COLORS[index % COLORS.length]} stroke="var(--card-bg)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '32px' }}>
              <h5 className="fw-bold mb-4" style={{ color: 'var(--text-main)' }}>⭐ Μέσο Rating ανά Δραστηριότητα</h5>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    {/* ΝΕΟΣ ΑΞΟΝΑΣ Χ - Εμφανίζει τα ονόματα υπό γωνία */}
                    <XAxis 
                      dataKey="shortName" 
                      stroke="var(--text-muted)" 
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-main)' }}
                    />
                    <Bar dataKey="avgRating" fill="var(--accent-color)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .transition-btn { transition: all 0.2s ease-in-out; }
        .transition-btn:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important; }
      `}</style>
    </div>
  );
}