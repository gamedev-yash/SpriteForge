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

  static async generateSprite(files, outputPath, outputName) {
    const outputPngPath = path.join(outputPath, `sprite-${outputName}.png`).replace(/\\/g, '\\\\');
    const outputJsonPath = path.join(outputPath, `sprite-${outputName}.json`).replace(/\\/g, '\\\\');
    
    const texturePackerArgs = [
      '--sheet', outputPngPath,
      '--data', outputJsonPath,
      '--max-width', '2048',
      '--max-height', '2048',
      '--format', 'json',
      '--quiet',
      '--enable-rotation',
      '--trim',
      ...files.map(f => f.replace(/\\/g, '\\\\'))
    ];

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
        resolve({ outputPngPath, outputJsonPath });
      });

      process.on('spawn', () => {
        console.log('TexturePacker process started');
      });
    });
  }
}

module.exports = TexturePackerUtil;