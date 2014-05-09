'use strict';
module.exports = function (request) {
  if (request.path === '/seo-route') return true;
  return false;
};
