'use strict'
var WT_MODULES_URL='https://sandbox.it.auth0.com/api/run/crigot/canirequire'
var WT_ADDITIONAL_MODULES=[ 'auth0-api-jwt-rsa-validation',
      'auth0-authz-rules-api',
      'auth0-oauth2-express',
      'auth0-sandbox-ext',
      'detective',
      'sandboxjs',
      'webtask-tools'];
 
function WebtaskWebpackPlugin(){

}

var webpack = require('webpack');
var path = require('path');
var request = require('sync-request');
var semver = require('semver');
var WebtaskModule = require('./WebtaskModule');


var response= request('GET',WT_MODULES_URL);
var webtaskEnvironment = JSON.parse(response.getBody('utf8'));


WebtaskWebpackPlugin.prototype.apply = function(compiler) {
  // Add the basic modules as externals. Since it is always node we selcet commonjs as the external representation 
  var availableModules = webtaskEnvironment.modules;

  function isNative(module){
    return module.version === "native";
  }

  var nativeModules = availableModules
    .filter(isNative)
    .map(function name(module){return module.name})
    .concat(WT_ADDITIONAL_MODULES); // Although these are not native we don't have the version to do the actual verification.

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

  compiler.apply(new webpack.ExternalsPlugin("commonjs",nativeModules));
  //compiler.apply(new webpack.ExternalsPlugin("commonjs",wtInstalledModules));
  
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

        for(var index = 0; index< webtaskModule.length;index++) {
          if (semver.satisfies(webtaskModule[index],packageDefinition.version)) {
            return new WebtaskModule(data.rawRequest, webtaskModule[index]);
          }
        }
      }
    });
  });
}

module.exports = WebtaskWebpackPlugin;
