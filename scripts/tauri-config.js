const fs = require('fs');
const path = require('path');

const config = {
  productName: process.env.PRODUCT_NAME,
  version: process.env.VERSION,
  identifier: process.env.IDENTIFIER,
  build: {
    frontendDist: "../dist"
  },
  bundle: {
    active: true,
    targets: ["all"],
    icon: [
      "icons/icon.png",
      "icons/icon.ico",
      "icons/icon.icns"
    ]
  }
};

const outPath = path.resolve(__dirname, '../app/tauri.conf.json');

fs.writeFileSync(outPath, JSON.stringify(config, null, 2));

console.log("tauri.conf.json generated:");
console.log(config);
