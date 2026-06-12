const fs = require('fs');
const path = require('path');

const configPath = process.argv[2];
if (!configPath) {
    console.error('Usage: node update-config.js <path-to-tauri.conf.json>');
    process.exit(1);
}

// 读取元数据
const metadata = JSON.parse(fs.readFileSync('tauri_resources/build_metadata.json', 'utf8'));

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

config.productName = metadata.app_name;
config.version = metadata.version;
config.identifier = metadata.bundle_id;

// 配置 bundle 目标格式
config.bundle = config.bundle || {};
config.bundle.active = true;
config.bundle.targets = ['nsis', 'msi', 'deb', 'appimage', 'dmg'].filter(t => {
    if (t === 'nsis' || t === 'msi') return metadata.platforms.includes('windows');
    if (t === 'deb' || t === 'appimage') return metadata.platforms.includes('linux');
    if (t === 'dmg') return metadata.platforms.includes('macos');
    return false;
});

// 禁用前端构建命令（我们直接使用静态文件）
if (config.build) {
    config.build.beforeBuildCommand = null;
    config.build.beforeDevCommand = null;
}
config.build.distDir = './src';

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ tauri.conf.json 已更新');