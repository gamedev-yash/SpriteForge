const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

class TexturePackerUtil {
  static async checkAvailability() {
    return new Promise((resolve, reject) => {
      execFile('TexturePacker', ['--version'], (error, stdout, stderr) => {
        if (error) {
          console.error('TexturePacker not found:', error);
          reject(new Error('TexturePacker CLI not found. Please ensure it is installed and in your PATH.'));
          return;
        }
        console.log('TexturePacker version:', stdout);
        resolve(stdout);
      });
    });
  }

  static async generateSprite(files, outputPath, outputName, options = {}) {
    const uniqueFiles = [...new Set(files)];
    const outputPngPath = path.join(outputPath, `${outputName}.png`).replace(/\\/g, '\\\\');
    const outputJsonPath = path.join(outputPath, `${outputName}.json`).replace(/\\/g, '\\\\');

    // Build CLI args based on options
    const texturePackerArgs = [
      '--sheet', outputPngPath,
      '--data', outputJsonPath,
      '--max-width', options.maxWidth || '2048',
      '--max-height', options.maxHeight || '2048',
      '--format', options.format || 'json',
      '--quiet'
    ];
    if (options.trim) texturePackerArgs.push('--trim');
    if (options.enableRotation) texturePackerArgs.push('--enable-rotation');
    // Add more options as needed

    texturePackerArgs.push(...uniqueFiles.map(f => f.replace(/\\/g, '\\\\')));

    console.log('TexturePacker command:', 'TexturePacker', texturePackerArgs.join(' '));

    return new Promise((resolve, reject) => {
      const process = execFile('TexturePacker', texturePackerArgs, {
        timeout: 30000
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('TexturePacker Error:', error);
          console.error('stderr:', stderr);
          reject(error);
          return;
        }
        console.log('TexturePacker Output:', stdout);
        
        // Verify the output files after generation
        if (fs.existsSync(outputPngPath) && fs.existsSync(outputJsonPath)) {
          const jsonContent = fs.readFileSync(outputJsonPath, 'utf8');
          const spriteData = JSON.parse(jsonContent);
          console.log('Generated sprite data:', {
            totalFrames: Object.keys(spriteData.frames).length,
            frameNames: Object.keys(spriteData.frames)
          });
        }
        
        resolve({ outputPngPath, outputJsonPath });
      });

      process.on('spawn', () => {
        console.log('TexturePacker process started');
      });
    });
  }
}

module.exports = TexturePackerUtil;