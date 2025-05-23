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

   // Use Windows-style paths with double backslashes
  const outputPngPath = path.join(outputPath, `sprite-${outputName}.png`).replace(/\\/g, '\\\\');
  const outputJsonPath = path.join(outputPath, `sprite-${outputName}.json`).replace(/\\/g, '\\\\');
  
  const texturePackerArgs = [
    '--sheet', outputPngPath,
    '--data', outputJsonPath,
    '--max-width', '2048',
    '--max-height', '2048',
    '--format', 'json',
    '--quiet', // Reduce output noise
    '--enable-rotation', // Enable rotation for better packing
    '--trim', // Remove transparent edges
    ...uploadedFiles.map(f => f.replace(/\\/g, '\\\\'))
  ];

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Check if TexturePacker is available
    await new Promise((resolve, reject) => {
      execFile('TexturePacker', ['--version'], (error, stdout, stderr) => {
        if (error) {
          console.error('TexturePacker not found:', error);
          reject(new Error('TexturePacker CLI not found. Please ensure it is installed and in your PATH.'));
          return;
        }
        console.log('TexturePacker version:', stdout);
        resolve();
      });
    });

    // Execute TexturePacker with timeout
    await new Promise((resolve, reject) => {
      const process = execFile('TexturePacker', texturePackerArgs, {
        timeout: 30000 // 30 second timeout
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('TexturePacker Error:', error);
          console.error('stderr:', stderr);
          reject(error);
          return;
        }
        console.log('TexturePacker Output:', stdout);
        resolve(stdout);
      });

      // Log when the process starts
      process.on('spawn', () => {
        console.log('TexturePacker process started');
      });
    });

    // Verify output files exist
    if (!fs.existsSync(outputPngPath) || !fs.existsSync(outputJsonPath)) {
      throw new Error('Output files were not created');
    }

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
      details: error.message,
      command: 'TexturePacker ' + texturePackerArgs.join(' ')
    });
  } finally {
    // Optional: Clean up uploaded files
    // uploadedFiles.forEach(file => fs.unlinkSync(file));
  }
});

module.exports = router;