const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'assets');
const destDir = path.join(__dirname, '..', 'dist', 'assets');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
}
