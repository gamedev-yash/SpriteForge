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
    const outputPngPath = path.join(outputPath, `${outputName}.png`).replace(/\\/g, '/');
    const outputJsonPath = path.join(outputPath, `${outputName}.json`).replace(/\\/g, '/');

    // Build CLI args based on options
    const texturePackerArgs = [
      '--sheet', outputPngPath,
      '--data', outputJsonPath
    ];

    // Map options to CLI args
    if (options.maxWidth) texturePackerArgs.push('--max-width', options.maxWidth);
    if (options.maxHeight) texturePackerArgs.push('--max-height', options.maxHeight);
    if (options.format) texturePackerArgs.push('--format', options.format);
    if (options.textureFormat) texturePackerArgs.push('--texture-format', options.textureFormat);
    if (options.padding) texturePackerArgs.push('--padding', options.padding);
    if (options.shapePadding) texturePackerArgs.push('--shape-padding', options.shapePadding);
    if (options.borderPadding) texturePackerArgs.push('--border-padding', options.borderPadding);
    if (options.algorithm) texturePackerArgs.push('--algorithm', options.algorithm);
    if (options.scale) texturePackerArgs.push('--scale', options.scale);
    if (options.extrude) texturePackerArgs.push('--extrude', options.extrude);
    if (options.backgroundColor) texturePackerArgs.push('--background-color', options.backgroundColor);
    if (options.jpgQuality) texturePackerArgs.push('--jpg-quality', options.jpgQuality);
    if (options.webpQuality) texturePackerArgs.push('--webp-quality', options.webpQuality);
    if (options.ditherType) texturePackerArgs.push('--dither-type', options.ditherType);

    if (options.trim === 'true' || options.trim === true) texturePackerArgs.push('--trim');
    if (options.enableRotation === 'true' || options.enableRotation === true) texturePackerArgs.push('--enable-rotation');
    if (options.multipack === 'true' || options.multipack === true) texturePackerArgs.push('--multipack');

    // Add custom CLI arguments (split by space, but preserve quoted strings)
    if (options.customArgs && typeof options.customArgs === 'string' && options.customArgs.trim()) {
      // Simple split, advanced: use a shell-args parser if needed
      const customArgs = options.customArgs.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      texturePackerArgs.push(...customArgs);
    }

    texturePackerArgs.push('--quiet');
    texturePackerArgs.push(...uniqueFiles.map(f => f.replace(/\\/g, '/')));

    console.log('TexturePacker command:', 'TexturePacker', texturePackerArgs.join(' '));

    return new Promise((resolve, reject) => {
      const process = execFile('TexturePacker', texturePackerArgs, {
        timeout: 30000
      }, (error, stdout, stderr) => {
        if (error) {
          // Include stderr in the error object
          error.stderr = stderr;
          reject(error);
          return;
        }
        console.log('TexturePacker Output:', stdout);

        // Verify the output files after generation
        if (fs.existsSync(outputPngPath) && fs.existsSync(outputJsonPath)) {
          const jsonContent = fs.readFileSync(outputJsonPath, 'utf8');
          try {
            const spriteData = JSON.parse(jsonContent);
            console.log('Generated sprite data:', {
              totalFrames: Object.keys(spriteData.frames).length,
              frameNames: Object.keys(spriteData.frames)
            });
          } catch (e) {
            console.warn('Could not parse generated JSON:', e);
          }
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