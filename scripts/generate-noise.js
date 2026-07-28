import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const noisePath = path.join(__dirname, '../public/images/noise.png');

async function generateNoise() {
  try {
    const width = 256;
    const height = 256;
    const size = width * height * 4;
    const rawData = new Uint8Array(size);
    
    // Generate a subtle monochromatic noise texture
    for (let i = 0; i < size; i += 4) {
      const val = Math.floor(Math.random() * 255);
      rawData[i] = val;     // R
      rawData[i + 1] = val; // G
      rawData[i + 2] = val; // B
      rawData[i + 3] = 40;  // Alpha (opacity)
    }
    
    await sharp(Buffer.from(rawData), {
      raw: { width, height, channels: 4 }
    }).png().toFile(noisePath);
    
    console.log(`Successfully generated noise texture at ${noisePath}`);
  } catch (err) {
    console.error('Error generating noise:', err);
  }
}

generateNoise();
