import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { GeoAltFill } from "react-bootstrap-icons";
import LikeButton from "./LikeButton";

// λέξεις κλειδιά για να μπαίνουν αυτόματα εικόνες αν λείπουν από τη βάση
const titleRules = [
  { url: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=800&q=80", titleIncludes: ["πλάκα", "ακρόπολη", "παρθενώνας", "αναφιώτικα"] },
  { url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80", titleIncludes: ["κήπος", "πικνίκ", "πάρκο", "δασύλλιο"] },
  { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", titleIncludes: ["υμηττός", "πεζοπορία", "βουνό", "όλυμπος"] },
  { url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80", titleIncludes: ["λίμνη", "ποτάμι", "καταρράκτες", "βουλιαγμένη"] },
  { url: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&w=800&q=80", titleIncludes: ["escape", "sherlock", "μυστήριο"] },
  { url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80", titleIncludes: ["σινεμά", "ταινία", "cinema"] },
  { url: "https://images.unsplash.com/photo-1574516766432-8dfc33b664d0?auto=format&fit=crop&w=800&q=80", titleIncludes: ["allou", "park", "λούνα"] },
  { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80", titleIncludes: ["spa", "χαμάμ", "λουτρά"] },
  { url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80", titleIncludes: ["κρασί", "wine", "οινοποιείο"] },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", titleIncludes: ["surf", "παραλία", "θάλασσα"] },
  { url: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80", titleIncludes: ["μουσείο", "αρχαιολογικό"] },
];

const categoryRules = [
  { url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80", categoryIncludes: ["διασκέδαση"] },
  { url: "https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&w=800&q=80", categoryIncludes: ["φύση"] },
  { url: "https://images.unsplash.com/photo-1599803654935-5b9d1c93578c?auto=format&fit=crop&w=800&q=80", categoryIncludes: ["πολιτισμός"] },
  { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", categoryIncludes: ["γαστρονομία"] },
];

const fallbackImg = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";


export default function ActivityCard({ activity }) {
  // βρίσκει την καλύτερη εικόνα αν λείπει το link
  const getSmartImage = (act) => {
    const title = act.title?.toLowerCase() ?? "";
    const cat = act.category?.toLowerCase() ?? "";
    const titleRule = titleRules.find((rule) => rule.titleIncludes.some((k) => title.includes(k)));
    if (titleRule) return titleRule.url;
    const catRule = categoryRules.find((rule) => rule.categoryIncludes.some((k) => cat.includes(k)));
    if (catRule) return catRule.url;
    return fallbackImg;
  };

  const hasValidDbImage = activity.image_url && activity.image_url.length > 15;
  const imageSrc = hasValidDbImage ? activity.image_url : getSmartImage(activity);
  const price = Number(activity.cost) === 0 ? "Δωρεάν" : `${activity.cost}€`;

  return (
    <div className="card h-100 border-0 shadow-sm overflow-hidden" 
         style={{ borderRadius: "32px", background: "var(--card-bg)", border: "1px solid var(--card-border)", transition: "all 0.3s ease" }}
         onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
         onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      
      {/* εικόνα & badges */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
        <img
          src={imageSrc}
          alt={activity.title}
          className="w-100 h-100"
          style={{ objectFit: "cover", transition: "transform 0.6s ease" }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        
        <div className="position-absolute top-0 start-0 m-3 z-2">
          <span className="badge shadow-sm px-3 py-2 rounded-pill fw-bold" 
                style={{ background: 'var(--accent-color)', color: '#000', fontSize: "0.75rem", letterSpacing: "-0.02em" }}>
            {price}
          </span>
        </div>

        {/* like button */}
        <div className="position-absolute top-0 end-0 m-3 rounded-circle shadow-sm d-flex justify-content-center align-items-center z-2"
             style={{ width: "42px", height: "42px", background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <LikeButton activityId={activity.id} />
        </div>
      </div>

      {/* κείμενα */}
      <div className="card-body p-4 d-flex flex-column">
        <div className="mb-3">
          <span className="badge rounded-pill px-3 py-2" 
                style={{ background: "rgba(23, 224, 160, 0.1)", color: "var(--accent-color)", fontSize: "0.7rem", fontWeight: "700" }}>
            {activity.category?.toUpperCase() || "ΓΕΝΙΚΑ"}
          </span>
        </div>

        <h5 className="fw-bold mb-2" style={{ letterSpacing: "-0.04em", color: "var(--text-main)" }}>
          {activity.title}
        </h5>

        <p className="small mb-4 d-flex align-items-center" style={{ color: "var(--text-muted)", fontWeight: "500" }}>
          <GeoAltFill className="me-2" style={{ color: "var(--accent-color)" }} /> {activity.location}
        </p>

        {/* mt-auto για να μείνει το κουμπί στο κάτω μέρος */}
        <Link
          to={`/activities/${activity.id}`}
          className="btn w-100 fw-bold rounded-pill"
          style={{ background: "var(--text-main)", color: "var(--bg-color)", padding: "12px 0", fontSize: "0.9rem" }}
        >
          Εξερεύνηση
        </Link>
      </div>
    </div>
  );
}

/* ================= PROPTYPES ================= */
ActivityCard.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    image_url: PropTypes.string,
    cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    category: PropTypes.string,
    location: PropTypes.string,
  }).isRequired,
};