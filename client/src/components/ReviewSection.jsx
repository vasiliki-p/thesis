import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StarFill, ChatLeftTextFill, SendFill } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

export default function ReviewSection({ activityId }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // φόρτωση κριτικών από το backend
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviews([]); 
        setLoading(true);
        const res = await axios.get(`/api/reviews/${activityId}`);
        if (Array.isArray(res.data)) {
        setReviews(res.data);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Σφάλμα κατά τη φόρτωση κριτικών:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (activityId) loadReviews();
  }, [activityId]);
    
  // υποβολή νέας κριτικής
  const submitReview = async (e) => {
    e.preventDefault();

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userName = user ? (user.username || "Χρήστης") : "Χρήστης";

      const response = await axios.post('/api/reviews', {
        activity_id: activityId,
        comment: newReview, 
        rating: rating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // optimistic update: βάζουμε την κριτική κατευθείαν στο state για να φανεί αμέσως
      const newRevObj = {
        id: response.data.id || Date.now(),
        username: userName, 
        comment: newReview, 
        rating: rating,
        created_at: new Date().toISOString()
      };
      
      setReviews([newRevObj, ...reviews]);
      
      // καθάρισμα φόρμας
      setNewReview("");
      setRating(5);
    } catch (err) {
      console.error("Σφάλμα κατά την αποστολή κριτικής:", err);
      toast.error("Υπήρξε πρόβλημα με την αποστολή της κριτικής.");
    }
  };

  // βοηθητική συνάρτηση για να ζωγραφίζει τα αστεράκια
  const renderStars = (currentRating, interactive = false) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return interactive ? (
        <span 
          key={index} 
          onClick={() => setRating(starValue)}
          style={{ 
            cursor: 'pointer', 
            color: starValue <= rating ? '#FFD700' : 'var(--text-muted)', 
            opacity: starValue <= rating ? 1 : 0.4,
            transition: 'all 0.2s' 
          }}
        >
          <StarFill size={24} className="me-1" />
        </span>
      ) : (
        <span 
          key={index} 
          style={{ 
            color: starValue <= currentRating ? '#FFD700' : 'var(--text-muted)',
            opacity: starValue <= currentRating ? 1 : 0.4
          }}
        >
          <StarFill size={14} className="me-1" />
        </span>
      );
    });
  };

  if (loading) {
    return <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--accent-color)' }}></div></div>;
  }

  return (
    <div>
      <h4 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)', letterSpacing: "-0.5px" }}>
        <ChatLeftTextFill style={{ color: 'var(--accent-color)' }} /> Κριτικές
      </h4>

      {/* φόρμα κριτικής (μόνο αν είναι logged in) */}
      {token ? (
        <div className="p-4 mb-5 rounded-4" style={{ background: 'rgba(128,128,128,0.05)', border: '1px solid var(--card-border)' }}>
          <h6 className="fw-bold mb-3" style={{ color: 'var(--text-main)' }}>Γράψε την εμπειρία σου</h6>
          <form onSubmit={submitReview}>
            <div className="mb-3 d-flex align-items-center gap-2">
              <span className="small fw-bold" style={{ color: 'var(--text-muted)' }}>Βαθμολογία:</span>
              <div className="d-flex align-items-center mt-1">
                {renderStars(rating, true)}
              </div>
            </div>
            
            <div className="input-group">
              <textarea 
                className="form-control" 
                placeholder="Πώς σου φάνηκε;" 
                rows="2"
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                style={{ 
                  background: 'var(--bg-color)', color: 'var(--text-main)', 
                  border: '1px solid var(--card-border)', borderRadius: '16px',
                  resize: 'none', boxShadow: 'none'
                }}
              />
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button 
                type="submit" 
                className="btn px-4 py-2 fw-bold rounded-pill d-flex align-items-center gap-2 transition-btn"
                style={{ background: 'var(--text-main)', color: 'var(--bg-color)' }}
              >
                Αποστολή <SendFill size={14} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="alert p-3 rounded-4 mb-5 d-flex align-items-center gap-3" style={{ background: 'rgba(23, 224, 160, 0.1)', border: '1px solid var(--accent-color)', color: 'var(--text-main)' }}>
          <span style={{ fontSize: '1.5rem' }}>👋</span>
          <p className="mb-0 small fw-medium">Συνδέσου για να αφήσεις τη δική σου κριτική!</p>
        </div>
      )}

      {/* λίστα με τις ήδη υπάρχουσες κριτικές */}
      <div className="d-flex flex-column gap-3">
        {reviews.length > 0 ? (
          reviews.map((review, index) => {
            const displayName = review.username || "Anonymous";

            return (
              <div key={review.id || index} className="p-4 rounded-4" style={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${displayName}&background=random&color=fff&rounded=true&bold=true`} 
                      alt="User Avatar" 
                      className="rounded-circle shadow-sm"
                      style={{ width: "40px", height: "40px", objectFit: "cover", border: '2px solid var(--accent-color)' }} 
                    />
                    <div>
                      <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-main)' }}>{displayName}</h6>
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {review.created_at ? new Date(review.created_at).toLocaleDateString("el-GR") : ""}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex">
                    {renderStars(review.rating || 5)}
                  </div>
                </div>
                <p className="mt-3 mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {review.comment}
                </p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 opacity-50">
            <p className="mb-0" style={{ color: 'var(--text-muted)' }}>Δεν υπάρχουν κριτικές ακόμα. Κάνε την αρχή!</p>
          </div>
        )}
      </div>

    </div>
  );
}