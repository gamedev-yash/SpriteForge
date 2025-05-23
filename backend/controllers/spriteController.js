const fs = require('fs');
const path = require('path');
const TexturePackerUtil = require('../utils/texturePacker');

class SpriteController {
  static async generateSprite(req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('Processing files:', req.files.map(f => f.originalname));
    
    const outputName = Date.now();
    const outputPath = path.join(__dirname, '../../output');
    const uploadedFiles = req.files.map(file => file.path);

    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Check TexturePacker availability
      await TexturePackerUtil.checkAvailability();

      // Generate sprite sheet
      const { outputPngPath, outputJsonPath } = await TexturePackerUtil.generateSprite(
        uploadedFiles,
        outputPath,
        outputName
      );

      // Verify output files exist
      if (!fs.existsSync(outputPngPath) || !fs.existsSync(outputJsonPath)) {
        throw new Error('Output files were not created');
      }

      // After successful sprite generation, clean up uploaded files
      uploadedFiles.forEach(file => {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up: ${file}`);
        } catch (err) {
          console.error(`Failed to clean up file ${file}:`, err);
        }
      });

      res.json({
        success: true,
        message: 'Sprite sheet generated successfully',
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
  }

  static async cleanupUploads() {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Cleaning up ${files.length} files from uploads directory`);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        } catch (err) {
          console.error(`Failed to clean up file ${filePath}:`, err);
          throw err;
        }
      }
    }
  }
}

module.exports = SpriteController;