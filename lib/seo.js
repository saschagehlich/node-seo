'use strict';

var path = require('path');
var _ = require('underscore');
var Middleware = require('./middleware');

function SEO(options) {
  this.options = options;
  this.options = _.defaults(this.options, {
    cacheDirectory: path.resolve(process.cwd(), '.seo-cache')
  });

  if (!this.options.routes) {
    this.options.routes = require(path.resolve(process.cwd(), 'seo-routes'));
  }

  this.middleware = new Middleware(this.options);
}

/**
 * Returns the middleware
 * @return {Function}
 * @public
 */
SEO.prototype.init = function() {
  var middleware = this.middleware;
  return function() {
    middleware.request.apply(middleware, arguments);
  };
};

module.exports = SEO;
