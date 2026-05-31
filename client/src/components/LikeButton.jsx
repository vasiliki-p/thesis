import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, HeartFill } from "react-bootstrap-icons";
import PropTypes from "prop-types";

export default function LikeButton({ activityId }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId || !activityId) return;

    let isMounted = true;

    const checkLikeStatus = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/favourites/check?user_id=${userId}&activity_id=${activityId}`
        );
        if (isMounted) setLiked(res.data.isLiked);
      } catch (err) {
        console.error("Like status check failed:", err.message);
      }
    };

    checkLikeStatus();

    return () => {
      isMounted = false;
    };
  }, [activityId, userId]);

  const handleToggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Πρέπει να συνδεθείτε για να κάνετε Like!");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (liked) {
        await axios.delete(`http://localhost:5000/api/favourites/remove`, {
          data: { user_id: userId, activity_id: activityId },
        });
        setLiked(false);
      } else {
        await axios.post(`http://localhost:5000/api/favourites/add`, {
          user_id: userId,
          activity_id: activityId,
        });
        setLiked(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Σφάλμα σύνδεσης με τον server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      className="bg-transparent border-0 p-0"
      style={{ 
        /* Αν είναι Liked γίνεται Κόκκινο, αλλιώς παίρνει το χρώμα του κειμένου */
        color: liked ? "#E63946" : "var(--text-main)", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer", 
        zIndex: 10,
        /* Bouncy animation όταν πας το ποντίκι από πάνω */
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.15)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      disabled={loading}
      aria-label={liked ? "Remove from favourites" : "Add to favourites"}
    >
      {/* Αν είναι Liked δείχνει γεμάτη καρδιά, αλλιώς άδεια */}
      {liked ? <HeartFill size={22} /> : <Heart size={22} />}
    </button>
  );
}

LikeButton.propTypes = {
  activityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};