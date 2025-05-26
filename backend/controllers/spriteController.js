const fs = require('fs');
const path = require('path');
const TexturePackerUtil = require('../utils/texturePacker');
const History = require('../models/History'); // <-- Add this line

const getUniqueOutputName = (baseName, outputPath) => {
  let name = baseName;
  let counter = 1;
  while (
    fs.existsSync(path.join(outputPath, `${name}.png`)) ||
    fs.existsSync(path.join(outputPath, `${name}.json`))
  ) {
    name = `${baseName}_${counter++}`;
  }
  return name;
};

class SpriteController {
  static async generateSprite(req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Collect all options from the form
    const options = { ...req.body };

    const outputPath = path.join(__dirname, '../../output');
    const uploadedFiles = req.files.map(file => file.path);

    let outputName = options.outputBaseName || 'sprite';
    outputName = getUniqueOutputName(outputName, outputPath);

    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Check TexturePacker availability
      await TexturePackerUtil.checkAvailability();

      // Generate sprite sheet with all options
      const { outputPngPath, outputJsonPath } = await TexturePackerUtil.generateSprite(
        uploadedFiles,
        outputPath,
        outputName,
        options
      );

      // Verify output files exist
      if (!fs.existsSync(outputPngPath) || !fs.existsSync(outputJsonPath)) {
        throw new Error('Output files were not created');
      }

      // --- Save history entry ---
      if (req.session && req.session.userId) {
        await History.create({
          user: req.session.userId,
          outputName,
          spriteSheetPath: `/output/${outputName}.png`,
          dataPath: `/output/${outputName}.json`,
          options
        });
      }

      console.log('About to send success response');
      res.json({
        success: true,
        message: 'Sprite sheet generated successfully',
        files: {
          spriteSheet: `/output/${outputName}.png`,
          data: `/output/${outputName}.json`
        },
        processedFiles: {
          received: req.files.map(f => ({
            name: f.originalname,
            path: f.path,
            size: f.size
          })),
          used: uploadedFiles,
          uniqueCount: new Set(uploadedFiles).size,
          duplicateCount: uploadedFiles.length - new Set(uploadedFiles).size
        }
      });
      console.log('Success response sent');
    } catch (error) {
      console.error('Error processing request:', error);
      try {
        res.status(500).json({
          error: error.message || 'Failed to process images',
          details: error.stderr || error.stack || error,
          files: req.files.map(f => f.originalname)
        });
        console.log('Error response sent');
      } catch (e) {
        console.error('Failed to send error response:', e);
      }
    }
  }

  static async checkUploads() {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      return files.length;
    }
    return 0;
  }

  static async cleanupUploads() {
    const uploadsDir = path.join(__dirname, '../../uploads');
    let filesDeleted = 0;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          filesDeleted++;
          console.log(`Cleaned up: ${filePath}`);
        } catch (err) {
          console.error(`Failed to clean up file ${filePath}:`, err);
        }
      }
    }
    return filesDeleted;
  }
}

module.exports = SpriteController;