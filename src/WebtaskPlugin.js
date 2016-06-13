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
var request = require('sync-request');
var _ = require('lodash');
var response= request('GET',WT_MODULES_URL);
var wtEnvironment = JSON.parse(response.getBody('utf8'));
console.log(wtEnvironment);

WebtaskWebpackPlugin.prototype.apply = function(compiler) {
  // Add the basic modules as externals. Since it is always node we selcet commonjs as the external representation 
  var wtInstalledModules = _(wtEnvironment.modules).reduce(function (acc, module) {
        return _.set(acc, module.name, true);
    });
  
  compiler.apply(new webpack.ExternalsPlugin("commonjs",WT_ADDITIONAL_MODULES));
  compiler.apply(new webpack.ExternalsPlugin("commonjs",wtInstalledModules));
  
  compiler.plugin("normal-module-factory", function(nmf) {
    nmf.plugin('after-resolve', function(data, cb) {
      if (!data) return cb();
      
      if (data.rawRequest === 'buffer') {
        console.log(data);
      }

      cb(null, data);
    });
    nmf.plugin('after-resolve',function(data,cb){
      if (!data) return cb();

      //console.log('after', data.resource);
      cb(null,data);
    });
  });
}

module.exports = WebtaskWebpackPlugin;
