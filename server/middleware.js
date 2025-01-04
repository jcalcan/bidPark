const jwt = require("jsonwebtoken");

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Get token from Authorization header

  if (!token) return res.sendStatus(401); // Unauthorized if no token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if token is invalid
    req.user = user; // Attach user info to request object
    next(); // Proceed to the next middleware/route handler
  });
};

module.exports = authenticateToken; // Export the middleware
