const path = require('path');

module.exports = {
  mode: "development",
  entry: './dist/index.js',
  output: {
    filename: 'flowed.js',
    path: path.resolve(__dirname, 'web')
  },
  node: {
    fs: 'empty'
  }
};
