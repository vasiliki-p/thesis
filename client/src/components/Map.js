import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { GeoAltFill, ArrowRightCircleFill } from "react-bootstrap-icons";
import PropTypes from "prop-types";

// --- 1. CSS Styles ---
const mapStyles = `
  /* Στυλ για τα Zenly Custom Pins */
  .custom-zenly-pin {
    background: transparent;
    border: none;
  }
  .map-pin-container {
    position: relative;
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .map-pin-container:hover { 
    transform: scale(1.15) translateY(-5px); 
    z-index: 1000 !important; 
  }
  .pin-avatar {
    width: 45px; 
    height: 45px; 
    border-radius: 50%;
    border: 3px solid var(--accent-color, #17E0A0); 
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
    object-fit: cover; 
    z-index: 2;
    background: #fff;
  }
  .pin-label {
    background: rgba(0, 0, 0, 0.8); 
    backdrop-filter: blur(5px);
    color: #fff;
    padding: 4px 10px; 
    border-radius: 12px; 
    font-size: 0.75rem;
    font-weight: 700; 
    margin-top: -8px; 
    border: 1px solid rgba(255,255,255,0.1);
    white-space: nowrap;
    z-index: 3;
  }
  .pin-ripple {
    position: absolute; 
    top: 15px; 
    left: 50%; 
    transform: translate(-50%, -50%);
    width: 45px; 
    height: 45px; 
    border-radius: 50%; 
    background: transparent;
    border: 2px solid var(--accent-color, #17E0A0); 
    z-index: 1;
    animation: map-ripple 2s infinite cubic-bezier(0.19, 1, 0.22, 1);
  }
  @keyframes map-ripple {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
  }

  /* Cluster & Popup Styles (Τα κράτησα όπως τα είχες) */
  .custom-cluster-icon {
    background-color: var(--accent-color, #0d6efd); 
    color: #000;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900;
    font-size: 16px;
    border: 3px solid white; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  }
  .leaflet-popup-content-wrapper {
    border-radius: 16px !important;
    overflow: hidden;
    padding: 0 !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: 240px !important;
  }
  .leaflet-popup-tip { background: white; }
`;

// --- 2. DATA HELPERS ---
const cityCoordinates = {
  "Αθήνα": [37.9838, 23.7275], "Σούνιο": [37.6502, 24.0246], "Πειραιάς": [37.9429, 23.6469], "Πάτρα": [38.2466, 21.7345], "Καλάβρυτα": [38.0376, 22.1111], "Ναύπλιο": [37.5671, 22.8016], "Επίδαυρος": [37.6368, 23.1597], "Νεμέα": [37.817, 22.6599], "Ολυμπία": [37.6403, 21.6247], "Κόρινθος": [37.9386, 22.9324], "Μεσσηνία": [36.9634, 21.6961], "Μάνη": [36.6575, 22.3807], "Μονεμβασιά": [36.6865, 23.056], "Αργολίδα": [37.7289, 22.7533], "Λακωνία": [36.7628, 23.0805], "Αρκαδία": [37.509, 22.3789], "Δελφοί": [38.4795, 22.4965], "Λαμία": [38.896, 22.4351], "Ναύπακτος": [38.3929, 21.8268], "Καλαμπάκα": [39.7042, 21.6269], "Μετέωρα": [39.7217, 21.6306], "Καρδίτσα": [39.3633, 21.9211], "Πήλιο": [39.4389, 23.0489], "Θεσσαλονίκη": [40.6401, 22.9444], "Βεργίνα": [40.4859, 22.3195], "Αριδαία": [40.9702, 22.0583], "Χαλκιδική": [40.3533, 23.4473], "Λιτόχωρο": [40.103, 22.5024], "Ξάνθη": [41.1349, 24.888], "Σέρρες": [41.0921, 23.5413], "Έδεσσα": [40.8016, 22.0439], "Ζαγοροχώρια": [39.8783, 20.7303], "Ιωάννινα": [39.665, 20.8537], "Κέρκυρα": [39.6243, 19.9217], "Ζάκυνθος": [37.7874, 20.8978], "Λευκάδα": [38.8306, 20.7047], "Κεφαλονιά": [38.1764, 20.4889], "Ηράκλειο": [35.3387, 25.1442], "Χανιά": [35.5138, 24.018], "Οία": [36.4618, 25.3753], "Σαντορίνη": [36.3932, 25.4615], "Μήλος": [36.7455, 24.4239], "Ρόδος": [36.4349, 28.2175], "Αμοργός": [36.8322, 25.8998], "Μύκονος": [37.4467, 25.3289], "Νάξος": [37.1039, 25.3764], "Πάρος": [37.0856, 25.1489], "Κως": [36.8917, 27.2877], "Χίος": [38.3678, 26.1358]
};

const getImage = (act) => {
  if (act.image_url && act.image_url.length > 10) return act.image_url;
  return "https://picsum.photos/240/140";
};

const DEFAULT_CENTER = [38.3, 22];
const DEFAULT_ZOOM = 6;
const SINGLE_ITEM_ZOOM = 11;
const MAX_FIT_ZOOM = 14;
const LARGE_AREA_LAT_DIFF_THRESHOLD = 2; 
const FIT_PADDING = [50, 50];

const OFFSET_LAT_STEP = 0.0004;
const OFFSET_LAT_BASE = 0.0002;
const OFFSET_LNG_STEP = 0.0004;
const OFFSET_LNG_BASE = 0.0002;

// --- 3. ICONS ---

// Το νέο μας Zenly Icon!
const createZenlyIcon = (activity) => {
  return new L.DivIcon({
    className: "custom-zenly-pin",
    html: `
      <div class="map-pin-container">
        <div class="pin-ripple"></div>
        <img src="${getImage(activity)}" class="pin-avatar" alt="pin" />
        <div class="pin-label">${activity.title || activity.name || 'Hotspot'}</div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 45],
    popupAnchor: [0, -35], // Για να ανοίγει το popup λίγο πιο πάνω
  });
};

const createClusterIcon = (cluster) =>
  new L.DivIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "custom-cluster-icon",
    iconSize: L.point(44, 44, true),
  });


// --- 4. CONTROLLER ---
function MapController({ activities }) {
  const map = useMap();

  useEffect(() => {
    const points = activities
      .map((act) => {
        let pos = cityCoordinates[act.location];
        if (!pos) {
          const foundKey = Object.keys(cityCoordinates).find((k) =>
            act.location.includes(k)
          );
          if (foundKey) pos = cityCoordinates[foundKey];
        }
        return pos;
      })
      .filter((pos) => pos !== undefined);

    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], SINGLE_ITEM_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(points);
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const latDiff = Math.abs(northEast.lat - southWest.lat);

    if (latDiff > LARGE_AREA_LAT_DIFF_THRESHOLD) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else {
      map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM });
    }
  }, [activities, map]);

  return null;
}

MapController.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      location: PropTypes.string,
      cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      image_url: PropTypes.string,
    })
  ).isRequired,
};

// --- 5. MAIN COMPONENT ---
const ActivitiesMap = ({ activities }) => {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      style={{
        height: "100%",
        width: "100%",
        minHeight: "400px",
        zIndex: 1,
        borderRadius: "12px",
      }}
    >
      <style>{mapStyles}</style>
      <MapController activities={activities} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={45}
        showCoverageOnHover={false}
      >
        {activities.map((activity) => {
          let position = cityCoordinates[activity.location];
          if (!position) {
            const foundKey = Object.keys(cityCoordinates).find((key) =>
              activity.location.includes(key)
            );
            if (foundKey) position = cityCoordinates[foundKey];
          }

          if (!position) return null;

          const offsetLat = (Number(activity.id) % 5) * OFFSET_LAT_STEP - OFFSET_LAT_BASE;
          const offsetLng = (Number(activity.id) % 3) * OFFSET_LNG_STEP - OFFSET_LNG_BASE;
          const finalPos = [position[0] + offsetLat, position[1] + offsetLng];

          return (
            /* Εδώ βάλαμε το νέο createZenlyIcon! */
            <Marker key={activity.id} position={finalPos} icon={createZenlyIcon(activity)}>
              <Popup closeButton={false}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={getImage(activity)}
                      alt={activity.title}
                      style={{
                        width: "100%",
                        height: "130px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <span className="badge bg-dark bg-opacity-75 position-absolute bottom-0 end-0 m-2">
                      {Number(activity.cost) === 0 ? "Free" : `${activity.cost}€`}
                    </span>
                  </div>

                  <div className="p-3">
                    <h6 style={{ fontWeight: 800, marginBottom: "5px", color: "#333" }}>
                      {activity.title}
                    </h6>
                    <p className="text-muted small mb-3">
                      <GeoAltFill className="me-1" />
                      {(activity.location || "").split(",")[0]}
                    </p>

                    <Link
                      to={`/activities/${activity.id}`}
                      className="btn btn-primary w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      style={{ fontSize: "14px", padding: "8px 0" }}
                    >
                      Δες περισσότερα <ArrowRightCircleFill />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

ActivitiesMap.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      location: PropTypes.string,
      cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      image_url: PropTypes.string,
    })
  ).isRequired,
};

export default ActivitiesMap;