var Webpack = require('webpack');
var plugin = require('../../src/WebtaskPlugin')

module.exports = {
  entry: './test/dependency-matching/index.js',
  output: {
    path: './build',
    filename: 'bundle.[name].js',
  },
  plugins: [new plugin({dependencyMatching:true})],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  node: false
};

