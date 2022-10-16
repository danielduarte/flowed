const fs = require('fs');

fs.mkdirSync('dist/lib', { recursive: true });
fs.copyFileSync('web/flowed.js', 'dist/lib/flowed.js');
