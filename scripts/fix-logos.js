#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const publicAbrava = path.join(root, 'abravacom-main', 'public');

const pairs = [
  // Ensure both variants exist in each public folder
  { dir: publicRoot, from: 'logo_abravacom_transparent.png', to: 'logo_abravacon_transparent.png' },
  { dir: publicRoot, from: 'logo_abravacon_transparent.png', to: 'logo_abravacom_transparent.png' },
  { dir: publicAbrava, from: 'logo_abravacom_transparent.png', to: 'logo_abravacon_transparent.png' },
  { dir: publicAbrava, from: 'logo_abravacon_transparent.png', to: 'logo_abravacom_transparent.png' },
];

function copyIfNeeded(dir, from, to) {
  try {
    if (!fs.existsSync(dir)) return;
    const src = path.join(dir, from);
    const dest = path.join(dir, to);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
    }
  } catch (e) {
    console.error('Error copying', from, '->', to, e.message);
  }
}

for (const p of pairs) copyIfNeeded(p.dir, p.from, p.to);
console.log('Logo sync completed.');
