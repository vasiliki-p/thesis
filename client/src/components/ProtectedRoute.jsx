
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  
  // αν δεν υπάρχει token (δεν είναι συνδεδεμένος), τον στέλνουμε στο login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // αν όλα είναι οκ, του δείχνουμε κανονικά τη σελίδα που ζήτησε (children)
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
