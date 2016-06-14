var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './test/loose-matching/index.js',
  output: {
    path: './build',
    filename: 'bundle.[name].js',
  },
  plugins: [new plugin({strictMatching:false})],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};
