import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const file = fs.createWriteStream(path.join(dir, 'forest-ambience.mp3'));
console.log('Downloading forest audio...');

https.get('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=birds-in-the-morning-24147.mp3', function(response) {
  if (response.statusCode === 302 || response.statusCode === 301) {
    https.get(response.headers.location, function(redirectResponse) {
      redirectResponse.pipe(file);
      file.on('finish', function() {
        file.close();
        console.log('Download complete!');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      console.log('Download complete!');
    });
  }
}).on('error', function(err) {
  fs.unlink(path.join(dir, 'forest-ambience.mp3'), () => {});
  console.error('Error downloading file:', err.message);
});
