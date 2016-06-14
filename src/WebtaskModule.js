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

function WebtaskModule(request, version){
  console.log(request, version);
  Module.call(this, getVerquireRequest(request, version), "commonjs2");
  this.requestName = request;
  this.requestVersion = version;
}

WebtaskModule.prototype = Object.create(Module.prototype);
WebtaskModule.prototype.constructor = WebtaskModule;

module.exports = WebtaskModule;
