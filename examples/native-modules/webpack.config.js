var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './examples/native-modules/index.js',
  output: {
    path: './build',
    filename: 'bundle.native.js',
  },
  plugins: [new plugin()],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

