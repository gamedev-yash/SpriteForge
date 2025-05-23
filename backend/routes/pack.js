const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const SpriteController = require('../controllers/spriteController');

router.post('/pack', upload.array('images'), SpriteController.generateSprite);
router.post('/cleanup', async (req, res) => {
  try {
    await SpriteController.cleanupUploads();
    res.json({ success: true, message: 'Upload directory cleaned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clean uploads' });
  }
});

module.exports = router;