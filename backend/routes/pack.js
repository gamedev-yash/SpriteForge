const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const SpriteController = require('../controllers/spriteController');

router.get('/check-uploads', async (req, res) => {
  try {
    const fileCount = await SpriteController.checkUploads();
    res.json({ 
      hasFiles: fileCount > 0,
      count: fileCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check uploads' });
  }
});

router.post(
  '/pack',
  upload.array('images'),
  express.urlencoded({ extended: true }),
  SpriteController.generateSprite
);
router.post('/cleanup', async (req, res) => {
  try {
    await SpriteController.cleanupUploads();
    res.json({ success: true, message: 'Upload directory cleaned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clean uploads' });
  }
});

module.exports = router;