import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, HeartFill } from "react-bootstrap-icons";
import PropTypes from "prop-types";
import toast from 'react-hot-toast';

export default function LikeButton({ activityId }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // ελέγχουμε αν το έχει ήδη στα αγαπημένα μόλις φορτώσει
  useEffect(() => {
    if (!token || !activityId) return;

    let isMounted = true;

    const checkLike = async () => {
      try {
        const res = await axios.get(
          `/api/favourites/check?activity_id=${activityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isMounted) setLiked(res.data.isLiked);
      } catch (err) {
        console.error("Like status check failed:", err.message);
      }
    };

    checkLike();

    // cleanup
    return () => {
      isMounted = false;
    };
  }, [activityId, token]);

  // προσθήκη ή αφαίρεση από τα αγαπημένα
  const toggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error("Πρέπει να συνδεθείτε για να κάνετε Like!");
      return;
    }

    // αποτροπή spam clicks
    if (loading) return;
    setLoading(true);

    try {
      if (liked) {
        await axios.delete(`/api/favourites/remove`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { activity_id: activityId },
        });
        setLiked(false);
      } else {
        await axios.post(`/api/favourites/add`, 
          { activity_id: activityId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLiked(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Σφάλμα σύνδεσης με τον server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      className="bg-transparent border-0 p-0"
      style={{ 
        color: liked ? "#E63946" : "var(--text-main)", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer", 
        zIndex: 10,
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.15)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      disabled={loading}
      aria-label={liked ? "Remove from favourites" : "Add to favourites"}
    >
      {liked ? <HeartFill size={22} /> : <Heart size={22} />}
    </button>
  );
}

LikeButton.propTypes = {
  activityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};