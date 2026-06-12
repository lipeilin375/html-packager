const fs = require('fs');
const path = require('path');

const config = {
  productName: "智慧哨表系统",
  version: "1.0.0",
  identifier: "com.super-memory.app",
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

console.log("tauri.conf.json generated");
