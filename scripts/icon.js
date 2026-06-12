const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const job = process.env.JOB;

const iconPath = path.resolve(`upload/icons/${job}.png`);
const outDir = path.resolve('app/icons');

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(iconPath)) {
  console.log('skip icon (not found)');
  process.exit(0);
}

try {
  execSync(`npx tauri icon "${iconPath}" --output "${outDir}"`, {
    stdio: 'inherit'
  });
  console.log('icon generated');
} catch (e) {
  console.log('icon generation failed but ignored');
}
