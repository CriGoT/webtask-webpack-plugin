var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './samples/dependency-matching/index.js',
  output: {
    path: './build',
    filename: 'bundle.dependency.js',
  },
  plugins: [new plugin({dependencyMatching:true})],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

