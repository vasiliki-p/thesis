import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { GeoAltFill, ArrowRightCircleFill } from "react-bootstrap-icons";
import PropTypes from "prop-types";

// custom styles για τον χάρτη και τα εφέ των pins
const mapStyles = `
  .custom-zenly-pin {
    background: transparent;
    border: none;
  }
  .map-pin-container {
    display: flex; 
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
    border-radius: 50%; /* Εδώ γίνεται τέλειος κύκλος */
    border: 3px solid var(--accent-color, #17E0A0); 
    box-shadow: 0 4px 12px rgba(0,0,0,0.4); 
    object-fit: cover; 
    background: #fff;
  }

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

const cityCoordinates = {
  //  ΑΤΤΙΚΗ & ΣΤΕΡΕΑ ΕΛΛΑΔΑ 
  "Αθήνα": [37.9838, 23.7275], "Πειραιάς": [37.9429, 23.6469], "Σούνιο": [37.6502, 24.0246],
  "Ζωγράφου": [37.9733, 23.7667], "Λαμία": [38.896, 22.4351], "Δελφοί": [38.4795, 22.4965],
  "Αράχωβα": [38.4795, 22.5855], "Καρπενήσι": [38.9135, 21.7946], "Χαλκίδα": [38.4636, 23.5951],
  "Εύβοια": [38.4636, 23.5951], "Θήβα": [38.3236, 23.3175], "Λιβαδειά": [38.4358, 22.8770],
  "Μεσολόγγι": [38.3685, 21.4278], "Αγρίνιο": [38.6253, 21.4087], "Ναύπακτος": [38.3929, 21.8268],

  //  ΠΕΛΟΠΟΝΝΗΣΟΣ 
  "Πάτρα": [38.2466, 21.7345], "Καλάβρυτα": [38.0376, 22.1111], "Κόρινθος": [37.9386, 22.9324],
  "Νεμέα": [37.817, 22.6599], "Ναύπλιο": [37.5671, 22.8016], "Επίδαυρος": [37.6368, 23.1597],
  "Αργολίδα": [37.7289, 22.7533], "Άργος": [37.6318, 22.7277], "Τρίπολη": [37.5090, 22.3790],
  "Αρκαδία": [37.509, 22.3789], "Σπάρτη": [37.0745, 22.4303], "Λακωνία": [36.7628, 23.0805],
  "Μονεμβασιά": [36.6865, 23.056], "Μάνη": [36.6575, 22.3807], "Καλαμάτα": [37.0383, 22.1142],
  "Μεσσηνία": [36.9634, 21.6961], "Πύργος": [37.6749, 21.4428], "Ηλεία": [37.6766, 21.4325],
  "Ολυμπία": [37.6403, 21.6247],

  //  ΘΕΣΣΑΛΙΑ 
  "Λάρισα": [39.6390, 22.4191], "Βόλος": [39.3667, 22.9458], "Πήλιο": [39.4389, 23.0489],
  "Τρίκαλα": [39.5557, 21.7679], "Καλαμπάκα": [39.7042, 21.6269], "Μετέωρα": [39.7217, 21.6306],
  "Καρδίτσα": [39.3633, 21.9211],

  //  ΗΠΕΙΡΟΣ 
  "Ιωάννινα": [39.665, 20.8537], "Ζαγοροχώρια": [39.8783, 20.7303], "Άρτα": [39.1558, 20.9836],
  "Πρέβεζα": [38.9562, 20.7509], "Ηγουμενίτσα": [39.5061, 20.2655], "Θεσπρωτία": [39.5056, 20.2655],

  //  ΜΑΚΕΔΟΝΙΑ & ΘΡΑΚΗ 
  "Θεσσαλονίκη": [40.6401, 22.9444], "Χαλκιδική": [40.3533, 23.4473], "Σέρρες": [41.0921, 23.5413],
  "Έδεσσα": [40.8016, 22.0439], "Αριδαία": [40.9702, 22.0583], "Βέροια": [40.5283, 22.2014],
  "Βεργίνα": [40.4859, 22.3195], "Κατερίνη": [40.2696, 22.5061], "Λιτόχωρο": [40.103, 22.5024],
  "Κιλκίς": [40.9930, 22.8743], "Κοζάνη": [40.3006, 21.7889], "Γρεβενά": [40.0845, 21.4274],
  "Καστοριά": [40.5235, 21.2667], "Φλώρινα": [40.7820, 21.4098], "Καβάλα": [40.9396, 24.4069],
  "Δράμα": [41.1528, 24.1473], "Ξάνθη": [41.1349, 24.888], "Κομοτηνή": [41.1192, 25.4054],
  "Αλεξανδρούπολη": [40.8457, 25.8735],

  //  ΙΟΝΙΟ 
  "Κέρκυρα": [39.6243, 19.9217], "Παξοί": [39.2013, 20.1852], "Λευκάδα": [38.8306, 20.7047],
  "Κεφαλονιά": [38.1764, 20.4889], "Ιθάκη": [38.3644, 20.7180], "Ζάκυνθος": [37.7874, 20.8978],

  //  ΚΡΗΤΗ 
  "Ηράκλειο": [35.3387, 25.1442], "Χανιά": [35.5138, 24.018], "Ρέθυμνο": [35.3669, 24.4754],
  "Λασίθι": [35.1905, 25.7178], "Άγιος Νικόλαος": [35.1911, 25.7152],

  //  ΚΥΚΛΑΔΕΣ 
  "Σαντορίνη": [36.3932, 25.4615], "Οία": [36.4618, 25.3753], "Μύκονος": [37.4467, 25.3289],
  "Νάξος": [37.1039, 25.3764], "Πάρος": [37.0856, 25.1489], "Σύρος": [37.4446, 24.9425],
  "Μήλος": [36.7455, 24.4239], "Αμοργός": [36.8322, 25.8998], "Ίος": [36.7215, 25.2836],
  "Τήνος": [37.5385, 25.1610], "Άνδρος": [37.8333, 24.9333],

  //  ΒΟΡΕΙΟ ΑΙΓΑΙΟ & ΔΩΔΕΚΑΝΗΣΑ & ΣΠΟΡΑΔΕΣ 
  "Ρόδος": [36.4349, 28.2175], "Κως": [36.8917, 27.2877], "Χίος": [38.3678, 26.1358],
  "Λέσβος": [39.2245, 26.2694], "Σάμος": [37.7548, 26.9772], "Λήμνος": [39.8751, 25.2604],
  "Σκιάθος": [39.1623, 23.4909], "Σκόπελος": [39.1235, 23.7264]
};

const getImage = (act) => {
  if (act.image_url && act.image_url.length > 10) return act.image_url;
  return "https://picsum.photos/240/140";
};

// ρυθμίσεις χάρτη
const DEFAULT_CENTER = [38.3, 22];
const DEFAULT_ZOOM = 6;
const SINGLE_ITEM_ZOOM = 11;
const MAX_FIT_ZOOM = 14;
const LARGE_AREA_LAT_DIFF_THRESHOLD = 2; 
const FIT_PADDING = [50, 50];

// offsets για να μην πέφτουν τα pins ακριβώς το ένα πάνω στο άλλο
const OFFSET_LAT_STEP = 0.0004;
const OFFSET_LAT_BASE = 0.0002;
const OFFSET_LNG_STEP = 0.0004;
const OFFSET_LNG_BASE = 0.0002;

// δημιουργία custom pin με εικόνα
const createZenlyIcon = (activity) => {
  return new L.DivIcon({
    className: "custom-zenly-pin",
    html: `
      <div class="map-pin-container">
        <img src="${getImage(activity)}" class="pin-avatar" alt="pin" />
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22], // Κεντράρει τον κύκλο ακριβώς πάνω στη συντεταγμένη
    popupAnchor: [0, -25], // Σηκώνει το popup πάνω από την εικόνα
  });
};
// δημιουργία cluster icon
const createClusterIcon = (cluster) =>
  new L.DivIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "custom-cluster-icon",
    iconSize: L.point(44, 44, true),
  });

// component που ελέγχει δυναμικά το κέντρο και το zoom του χάρτη
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

          // μαθηματικό offset για να μη στοιβάζονται τα pins
          const offsetLat = (Number(activity.id) % 5) * OFFSET_LAT_STEP - OFFSET_LAT_BASE;
          const offsetLng = (Number(activity.id) % 3) * OFFSET_LNG_STEP - OFFSET_LNG_BASE;
          const finalPos = [position[0] + offsetLat, position[1] + offsetLng];

          return (
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