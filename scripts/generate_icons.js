/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generate() {
  const rootDir = path.join(__dirname, '..');
  const svgPath = path.join(rootDir, 'public', 'favicon.svg');
  const buildDir = path.join(rootDir, 'build');
  const electronAppDir = path.join(rootDir, 'electron', 'app');

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(electronAppDir)) fs.mkdirSync(electronAppDir, { recursive: true });

  const png512 = path.join(buildDir, 'icon.png');
  const png256 = path.join(buildDir, 'icon_256.png');
  const appPng = path.join(electronAppDir, 'icon.png');

  // Render SVG to 512x512 PNG with sharp
  await sharp(svgPath)
    .resize(512, 512, { fit: 'contain', background: { r: 8, g: 9, b: 13, alpha: 0 } })
    .png()
    .toFile(png512);

  await sharp(svgPath)
    .resize(256, 256, { fit: 'contain', background: { r: 8, g: 9, b: 13, alpha: 0 } })
    .png()
    .toFile(png256);

  await sharp(svgPath)
    .resize(128, 128, { fit: 'contain', background: { r: 8, g: 9, b: 13, alpha: 0 } })
    .png()
    .toFile(appPng);

  console.log('PNG icons created successfully in build/ and electron/app/');

  // Use Python Pillow to produce build/icon.ico and electron/app/icon.ico
  const pyScript = `
from PIL import Image
img = Image.open(r"${png512}")
img.save(r"${path.join(buildDir, 'icon.ico')}", format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
img.save(r"${path.join(electronAppDir, 'icon.ico')}", format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
print("ICO created successfully in build/ and electron/app/")
  `;

  try {
    execSync(`python -c "${pyScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
  } catch {
    console.warn('Note: Python Pillow not found to compile .ico file. PNGs were generated.');
  }
}

generate().catch(console.error);
