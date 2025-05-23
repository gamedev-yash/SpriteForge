const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');

router.post('/pack', upload.array('images'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  console.log('Uploaded files:', req.files);
  
  const outputName = Date.now();
  const outputPath = path.join(__dirname, '../../output');

  // Create array of uploaded file paths
  const uploadedFiles = req.files.map(file => file.path);

  console.log('Output path:', outputPath);
  console.log('Uploaded file paths:', uploadedFiles);
  
  const texturePackerArgs = [
    '--sheet', `${outputPath}/sprite-${outputName}.png`,
    '--data', `${outputPath}/sprite-${outputName}.json`,
    '--max-width', '2048',
    '--max-height', '2048',
    '--format', 'json',
    ...uploadedFiles
  ];

  console.log('TexturePacker arguments:', texturePackerArgs);

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Verify upload files exist
    for (const file of uploadedFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Uploaded file not found: ${file}`);
      }
    }

    await new Promise((resolve, reject) => {
      execFile('TexturePacker', texturePackerArgs, (error, stdout, stderr) => {
        if (error) {
          console.error('TexturePacker Error:', error);
          console.error('stderr:', stderr);
          reject(error);
        }
        console.log('TexturePacker Output:', stdout);
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
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Failed to process images',
      details: error.message 
    });
  }
});

module.exports = router;