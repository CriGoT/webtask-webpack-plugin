'use strict'
const WT_MODULES_URL='https://sandbox.it.auth0.com/api/run/crigot/canirequire'
const WT_ADDITIONAL_MODULES=[ 'auth0-api-jwt-rsa-validation',
      'auth0-authz-rules-api',
      'auth0-oauth2-express',
      'auth0-sandbox-ext',
      'detective',
      'sandboxjs',
      'webtask-tools'];
 
const webpack = require('webpack');
const path = require('path');
const request = require('sync-request');
const semver = require('semver');
const glob = require('glob-all');
const WebtaskModule = require('./WebtaskModule');
const helpers = require('./helpers');

/**
 *
 * Avoids bundling modules already deploy to a http://webtask.io anvironment
 *
 * @constructor
 *
 * @param {Object} options
 * @param {string} options.modulesUrl Provides a way to define your own description of the Webtask Envrionment. Your webtask must be based on the task created byt @tehsis https://github.com/tehsis/webtaskio-canirequire/blob/gh-pages/tasks/list_modules.js
 * @param {bool}   options.strictMatching Specifies that dependencies will not be bundled only if the same version is available in the webtaks environment. If false matching will be based soelly in the name of the module.
 * @param {bool}   options.dependencyMatching If set implies that instead of waiting for webpack to resolve the dependencies the replacemente will be based on the dependencies propoerty of the package.json file. In this case Semver matching will be used.
 * @param {bool}   options.throwIfUnavailable If set the plugin will throw an error if a depdendency is found with a version not available in the webtask environment
 */
function WebtaskWebpackPlugin(options){
  options = options || {};
  var modulesSource = options.modulesUrl || WT_MODULES_URL;
  var response= request('GET',modulesSource);
  this.webtaskEnvironment = JSON.parse(response.getBody('utf8'));
  this.strictMatching = (options.strictMatching===undefined) || options.strictMatching; 
  this.dependencyMatching = options.dependencyMatching;
  this.throwIfUnavailable = options.throwIfUnavailable;
}

function isNative(module){
  return module.version === "native";
}

function getPackageDefinition(directory){
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

  return packageDefinition;
}

function buildReplacementPlugins(directory, modules) {
  var packageFiles = glob.sync(path.join(directory,'**','package.json'));
  var packageDefinitions = packageFiles.map(function(file) { return require(file);});
  var externalDependencies = {};

  packageDefinitions.forEach(function (packageDefinition){
    for(var module in packageDefinition.dependencies) {
      if (modules[module]) {
        for(var index = 0; index< modules[module].length;index++) {
          if (semver.satisfies(modules[module][index],packageDefinition.dependencies[module])) { 
            externalDependencies[module] = helpers.getVerquireRequest(module,modules[module][index]);
            break;
          }
        }
      }
    }
  });

  return externalDependencies;
}

WebtaskWebpackPlugin.prototype.apply = function(compiler) {
  var _this = this;

  // Add the basic modules as externals. Since it is always node we use commonjs as the external representation 
  var availableModules = _this.webtaskEnvironment.modules;
  var nativeModules = availableModules
    .filter(isNative)
    .map(function name(module){return module.name})
    .concat(WT_ADDITIONAL_MODULES); // Although these are not native we don't have the version to do the actual verification.

  compiler.apply(new webpack.ExternalsPlugin("commonjs2",nativeModules));
  
  var verquireModules = {};
  availableModules.forEach(function(module){
    if (module.name && !isNative(module)) {
      if (!verquireModules[module.name]){
        verquireModules[module.name]= [];
      }
      verquireModules[module.name].push(module.version);
    }
  });

  var dependencyRequirements = _this.dependencyMatching ? buildReplacementPlugins(compiler.context,verquireModules) : {};

  compiler.plugin("normal-module-factory", function(nmf) {
    var counter=0;
    nmf.plugin('create-module',function(data){
      if (dependencyRequirements[data.rawRequest]) {
        return new WebtaskModule(data.rawRequest,dependencyRequirements[data.rawRequest]);
      }

      if (verquireModules[data.rawRequest]) {
        var webtaskModule = verquireModules[data.rawRequest];
        var packageDefinition = getPackageDefinition(data.resource);

        if (packageDefinition.name === data.rawRequest){
          for(var index = 0; index< webtaskModule.length;index++) {
            if (semver.eq(webtaskModule[index],packageDefinition.version)) {               
              return new WebtaskModule(data.rawRequest, webtaskModule[index]);
            }
          }

          if (!_this.strictMatching) {
            return new WebtaskModule(data.rawRequest, webtaskModule[0], [new Error('dependency module: ' + data.rawRequest + '\n  Webtask version: ' + webtaskModule[0] + '\n  Local version: ' + packageDefinition.version + '\nModule will not be bundled, enable strictMatching in the Webtask Webpack Plugin to bundle your own version of the module.')]);
          } else if (_this.throwIfUnavailable) {
            return new WebtaskModule(data.rawRequest, webtaskModule[0],[],[new Error('The module \'' + data.rawRequest + '\' version ' + packageDefinition.version + ' is referenced but it is not available in Webtask.\nPlease use one of the following versions: ' + webtaskModule)]);
          }
        }
      }
    });
  });
}

/** @module Plugin Wetbask.io Module Plugin for Webpack */
module.exports = WebtaskWebpackPlugin;
