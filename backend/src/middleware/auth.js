const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, type, email }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const requireDoctor = (req, res, next) => {
  if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Doctor access required' });
  next();
};

module.exports = { verifyToken, requireAdmin, requireDoctor };