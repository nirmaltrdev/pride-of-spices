import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.warn('Sharp is not installed.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '../public/images');
const OPTIMIZED_DIR = path.join(__dirname, '../public/images/optimized');

const targetWidths = [480, 800, 1200];

// Products that appear in the Collection grid
const products = [
  'black_pepper',
  'cardamom',
  'clove',
  'cinnamon',
  'nutmeg',
  'cinnamon-nutmeg', // mace
  'turmeric',
  'ginger',
  'chili',
  'coriander',
  'white_pepper', // cumin
  'crushed_pepper',
  'forest_honey',
  'sunset',
  'hero_bg',
  'forest-path',
  'forest_mist_background',
];

async function generateVariants() {
  for (const prod of products) {
    // Find the source file (.jpg, .png)
    let srcFile = path.join(RAW_DIR, `${prod}.jpg`);
    if (!fs.existsSync(srcFile)) {
      srcFile = path.join(RAW_DIR, `${prod}.png`);
    }
    if (!fs.existsSync(srcFile)) {
      console.warn(`Could not find raw file for ${prod}`);
      continue;
    }

    const inputBuffer = fs.readFileSync(srcFile);
    console.log(`Processing variants for ${prod}...`);

    for (const w of targetWidths) {
      const avifPath = path.join(OPTIMIZED_DIR, `${prod}-${w}w.avif`);
      const webpPath = path.join(OPTIMIZED_DIR, `${prod}-${w}w.webp`);

      // WebP
      const webpData = await sharp(inputBuffer)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(webpPath, webpData);

      // AVIF
      const avifData = await sharp(inputBuffer)
        .resize({ width: w, withoutEnlargement: true })
        .avif({ quality: 65 })
        .toBuffer();
      fs.writeFileSync(avifPath, avifData);
    }
  }
  console.log('All responsive card variants generated successfully!');
}

generateVariants().catch(console.error);
