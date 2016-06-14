'use strict'
const WT_MODULES_URL='https://sandbox.it.auth0.com/api/run/crigot/canirequire'
const WT_ADDITIONAL_MODULES=[ 'auth0-api-jwt-rsa-validation',
      'auth0-authz-rules-api',
      'auth0-oauth2-express',
      'auth0-sandbox-ext',
      'detective',
      'sandboxjs',
      'webtask-tools'];
 
var webpack = require('webpack');
var path = require('path');
var request = require('sync-request');
var semver = require('semver');
var WebtaskModule = require('./WebtaskModule');

/**
 *
 * Avoids bundling modules already deploy to a http://webtask.io anvironment
 *
 * @constructor
 *
 * @param {Object} options
 * @param {string} options.modulesUrl Provides a way to define your own description of the Webtask Envrionment. Your webtask must be based on the task created byt @tehsis https://github.com/tehsis/webtaskio-canirequire/blob/gh-pages/tasks/list_modules.js
 * @param {bool}   options.strictMatching Specifies that dependencies will not be bundled only if the same version is available in the webtaks environment. If false matching will be based soelly in the name of the module.
 * @param {bool}   options.dependencyMatching If set implies that instead of waiting for webpack to resolve the dependencies the replacemente will be based on the dependencies propoerty of the package.json file. In this case Semver matchign will be used.
 *
 */
function WebtaskWebpackPlugin(options){
  options = options || {};
  var modulesSource = options.modulesUrl || WT_MODULES_URL;
  var response= request('GET',modulesSource);
  this.webtaskEnvironment = JSON.parse(response.getBody('utf8'));
  this.strictMatching = (options.strictMatching===undefined) || options.strictMatching; 
  this.dependencyMatching = options.dependencyMatching;
}


WebtaskWebpackPlugin.prototype.apply = function(compiler) {
  var _this = this;
  function isNative(module){
    return module.version === "native";
  }

  // Add the basic modules as externals. Since it is always node we use commonjs as the external representation 
  var availableModules = _this.webtaskEnvironment.modules;
  var nativeModules = availableModules
    .filter(isNative)
    .map(function name(module){return module.name})
    .concat(WT_ADDITIONAL_MODULES); // Although these are not native we don't have the version to do the actual verification.

  compiler.apply(new webpack.ExternalsPlugin("commonjs",nativeModules));
  
  var verquireModules = {};
  for(var index=0;index < availableModules.length;index++)
  {
    var module = availableModules[index];

    if (module.name && !isNative(module)) {
      if (!verquireModules[module.name]){
        verquireModules[module.name]= [];
      }
      verquireModules[module.name].push(module.version);
    }
  }

  compiler.plugin("normal-module-factory", function(nmf) {
    nmf.plugin('create-module',function(data){
      if (verquireModules[data.rawRequest]) {
        var webtaskModule = verquireModules[data.rawRequest];
        var directory = data.resource;
        var packageDefinition;

        do {
          directory = path.dirname(directory);
          var packageFile = path.join(directory,'package.json');
          try {
            packageDefinition = require(packageFile);
          } catch(ex) {
            packageDefinition = undefined;
          }
        } while(!packageDefinition);


        if (packageDefinition.name === data.rawRequest){
          for(var index = 0; index< webtaskModule.length;index++) {
            if (semver.eq(webtaskModule[index],packageDefinition.version)) {               
              return new WebtaskModule(data.rawRequest, webtaskModule[index]);
            }
          }

          if (!_this.strictMatching) {
            return new WebtaskModule(data.rawRequest, webtaskModule[0], [new Error('The module \'' + data.rawRequest + '\' was not bundled because there is a version available in the Webtask environment. However the version to be used will be ' + webtaskModule[0] + ' and the local version is ' + packageDefinition.version + '. Enable strictMatching in the Webtask Webpack Plugin to use your own version.')]);
          }
        }
      }
    });
  });
}

/** @module Plugin Wetbask.io Module Plugin for Webpack */
module.exports = WebtaskWebpackPlugin;
