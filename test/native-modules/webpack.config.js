var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './test/native-modules/index.js',
  output: {
    path: './build',
    filename: 'bundle.[name].js',
  },
  plugins: [new plugin()],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

