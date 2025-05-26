const express = require('express');
const router = express.Router();
const History = require('../models/History');
const fs = require('fs');
const path = require('path');

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

// DELETE /history/:id - delete a single history entry and files
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const entry = await History.findOne({ _id: req.params.id, user: req.session.userId });
    if (!entry) return res.status(404).json({ message: 'Not found' });

    // Delete files
    const spritePath = path.join(__dirname, '../../', entry.spriteSheetPath);
    const dataPath = path.join(__dirname, '../../', entry.dataPath);
    [spritePath, dataPath].forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    await entry.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete entry' });
  }
});

// DELETE /history - clear all history for user and files
router.delete('/', requireAuth, async (req, res) => {
  try {
    const entries = await History.find({ user: req.session.userId });
    let deleted = 0;
    for (const entry of entries) {
      const spritePath = path.join(__dirname, '../../', entry.spriteSheetPath);
      const dataPath = path.join(__dirname, '../../', entry.dataPath);
      [spritePath, dataPath].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      await entry.deleteOne();
      deleted++;
    }
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear history' });
  }
});

module.exports = router;