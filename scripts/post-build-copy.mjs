import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'dist-electron', 'Udhyana Games Reception 0.1.0.exe');
const dest = path.join(root, 'Udhyana Reception.exe');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✅ Updated: Udhyana Reception.exe in website root folder');
}
