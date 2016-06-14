var Module = require('webpack/lib/ExternalModule');


function getVerquireRequest(request, version) {
  if (!version) return request;

  if (typeof version === "string" && typeof request === "string")
  {
    if (version === "native")
      return request;
    else
      return request + '@' + version;
  }

  throw 'Invalid Webtask Module definition';
}

/*
 * Represents a module available in a Webtask.io environment
 *
 * @constructor
 * @param {string} request The name of the module as listed in the webtask.io environment
 * @param {string} version the specific versino to be requested
 * @param {Array}  warnings Array containing alerts to be included as part of the comilation process
 */
function WebtaskModule(request, version, warnings){
  Module.call(this, getVerquireRequest(request, version), "commonjs2");
  this.requestName = request;
  this.requestVersion = version;
  this.warnings = warnings || [];
}

WebtaskModule.prototype = Object.create(Module.prototype);
WebtaskModule.prototype.constructor = WebtaskModule;
WebtaskModule.prototype.build = function(options, compilation, resolver, fs, callback) {
	this.builtTime = new Date().getTime();
  for(var index =0;index<this.warnings.lenght;index++){
    compilation.warnings.push(this.warnings[index]);
  }
	callback();
};

module.exports = WebtaskModule;
