const path = require('path');

module.exports = {
  mode: 'production',
  target: ['web', 'es5'],
  entry: './dist/index.js',
  output: {
    filename: 'flowed.js',
    path: path.resolve(__dirname, 'web'),
    library: {
      name: 'Flowed',
      type: 'umd',
    },
  },
  resolve: {
    fallback: {
      fs: false,
      http: false, // @todo see polyfill -> require.resolve("stream-http"),
      https: false, // @todo see polyfill -> require.resolve("https-browserify"),
    },
  },
};
