const jwT = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret';
async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization header required' });
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user || user.isDeleted) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    res.status(401).json({ error: 'Invalid token' });
  }
}
module.exports = { authenticate };