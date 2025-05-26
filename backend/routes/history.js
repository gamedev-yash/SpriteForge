const express = require('express');
const router = express.Router();
const History = require('../models/History');

// Auth middleware (reuse from server.js)
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// GET /history - fetch user's history
router.get('/', requireAuth, async (req, res) => {
  try {
    const history = await History.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

module.exports = router;