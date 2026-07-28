import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Use sharp for image processing (must be installed via npm)
// We use dynamic import for sharp to fail gracefully if not installed yet during Phase 2 setup
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.warn('Sharp is not installed. Run `npm install sharp --save-dev` to use the optimization pipeline.');
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '../public/images');
const OPTIMIZED_DIR = path.join(__dirname, '../public/images/optimized');
const REPORTS_DIR = path.join(__dirname, '../public/reports');

// Ensure directories exist
[RAW_DIR, OPTIMIZED_DIR, REPORTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const report = {
  timestamp: new Date().toISOString(),
  results: []
};

async function optimizeImages() {
  const files = fs.readdirSync(RAW_DIR);
  
  if (files.length === 0) {
    console.log('No raw images found in public/images/raw. Skipping optimization.');
    return;
  }

  for (const file of files) {
    if (!file.match(/\.(jpe?g|png)$/i)) continue;

    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const inputPath = path.join(RAW_DIR, file);
    
    const webpPath = path.join(OPTIMIZED_DIR, `${basename}.webp`);
    const avifPath = path.join(OPTIMIZED_DIR, `${basename}.avif`);
    
    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const originalSize = inputBuffer.length;
      
      const fileReport = {
        originalAsset: file,
        originalSizeKb: (originalSize / 1024).toFixed(2),
        optimized: {},
        failedConversions: []
      };

      // Generate WebP
      try {
        const webpData = await sharp(inputBuffer).webp({ quality: 80 }).toBuffer();
        fs.writeFileSync(webpPath, webpData);
        fileReport.optimized.webpSizeKb = (webpData.length / 1024).toFixed(2);
        fileReport.optimized.webpRatio = ((webpData.length / originalSize) * 100).toFixed(1) + '%';
      } catch (e) {
        fileReport.failedConversions.push('webp');
      }

      // Generate AVIF
      try {
        const avifData = await sharp(inputBuffer).avif({ quality: 65 }).toBuffer();
        fs.writeFileSync(avifPath, avifData);
        fileReport.optimized.avifSizeKb = (avifData.length / 1024).toFixed(2);
        fileReport.optimized.avifRatio = ((avifData.length / originalSize) * 100).toFixed(1) + '%';
      } catch (e) {
        fileReport.failedConversions.push('avif');
      }

      report.results.push(fileReport);
      console.log(`Optimized: ${file}`);
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  }

  const reportPath = path.join(REPORTS_DIR, 'optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Optimization complete. Report saved to ${reportPath}`);
}

optimizeImages().catch(console.error);
