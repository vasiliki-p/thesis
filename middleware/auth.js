const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// middleware που προστατεύει τα routes, ελέγχοντας αν ο χρήστης είναι συνδεδεμένος
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Δεν παρέχεται token πρόσβασης (Unauthorized)" });
  }

  // επαλήθευση του token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Μη έγκυρο ή ληγμένο token (Forbidden)" });
    }
    // περνάμε τον χρήστη στα επόμενα routes μέσω του req
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;