var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './examples/throw-unavailable/index.js',
  output: {
    path: './build',
    filename: 'bundle.throw.js',
  },
  plugins: [new plugin({strictMatching:true,throwIfUnavailable:true})],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

