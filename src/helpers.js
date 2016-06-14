module.exports = {
  getVerquireRequest: function(request, version) {
    if (!version) return request;

    if (typeof version === "string" && typeof request === "string")
    {
      if (version === "native")
        return request;
      else
        return request + '@' + version;
    }

    throw new Error('Invalid Webtask Module definition');
  }
}
