const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const path = require('path');
const upload = require('../middleware/upload');

router.post('/pack', upload.array('images'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const outputName = Date.now();
  const outputPath = path.join(__dirname, '../../output');
  
  // Create array of uploaded file paths
  const uploadedFiles = req.files.map(file => file.path);
  
  const texturePackerArgs = [
    '--sheet', `${outputPath}/sprite-${outputName}.png`,
    '--data', `${outputPath}/sprite-${outputName}.json`,
    '--max-width', '2048',
    '--max-height', '2048',
    '--format', 'json',
    ...uploadedFiles  // Spread the actual file paths
  ];

  try {
    await new Promise((resolve, reject) => {
      execFile('TexturePacker', texturePackerArgs, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve(stdout);
      });
    });

    res.json({
      success: true,
      files: {
        spriteSheet: `/output/sprite-${outputName}.png`,
        data: `/output/sprite-${outputName}.json`
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process images' });
  }
});

module.exports = router;