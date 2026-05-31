const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Δεν παρέχεται token πρόσβασης (Unauthorized)" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Μη έγκυρο ή ληγμένο token (Forbidden)" });
    }
    // Αποθηκεύουμε τα στοιχεία του χρήστη στο req.user για να τα βλέπουν τα επόμενα routes
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;