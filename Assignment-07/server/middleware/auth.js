// ============================================================
// middleware/auth.js - JWT authentication middleware
// Protects routes so only logged-in users can access them
// ============================================================

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // The client sends the token as:  Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1]; // extract the token part

  try {
    // Verify the token with our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Attach the decoded user info to the request object
    // so route handlers can use req.user.id
    req.user = decoded;

    next(); // proceed to the actual route handler
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = protect;
