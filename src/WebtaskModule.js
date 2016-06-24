const Module = require('webpack/lib/ExternalModule');
const helpers = require('./helpers');
/*
 * Represents a module available in a Webtask.io environment
 *
 * @constructor
 * @param {string} request The name of the module as listed in the webtask.io environment
 * @param {string} version the specific versino to be requested
 * @param {Array}  warnings Array containing alerts to be included as part of the comilation process
 * @param {Array}  errors Array containing errors to be included as part of the comilation process
 */
function WebtaskModule(request, version, warnings, errors){
  Module.call(this, helpers.getVerquireRequest(request, version), "commonjs2");
  this.requestName = request;
  this.requestVersion = version;
  this.warnings = warnings || [];
  this.errors = errors || [];
  this.counter=0;
}

WebtaskModule.prototype = Object.create(Module.prototype);
WebtaskModule.prototype.constructor = WebtaskModule;
WebtaskModule.prototype.build = function(options, compilation, resolver, fs, callback) {
	this.builtTime = new Date().getTime();
  this.warnings.forEach(function(warning){
    compilation.warnings.push(warning);
  });
  this.warnings.length=0;
  this.errors.forEach(function(error){
    compilation.errors.push(error);
  });
  this.errors.length=0;
  callback();
};

module.exports = WebtaskModule;
