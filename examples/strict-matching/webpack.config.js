var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './examples/strict-matching/index.js',
  output: {
    path: './build',
    filename: 'bundle.strict.js',
  },
  plugins: [new plugin()],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

