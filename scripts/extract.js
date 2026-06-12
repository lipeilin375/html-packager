const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const job = process.env.JOB;
const zipPath = path.resolve(`upload/html/${job}.zip`);
const outDir = path.resolve('app/dist');

if (!fs.existsSync(zipPath)) {
  console.error('ZIP not found:', zipPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

fs.createReadStream(zipPath)
  .pipe(unzipper.Extract({ path: outDir }))
  .on('close', () => console.log('Extract done'))
  .on('error', err => {
    console.error(err);
    process.exit(1);
  });
