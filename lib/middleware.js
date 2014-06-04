/* global document */
'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var phantom = require('phantom');
var Q = require('q');

function Middleware(options) {
  this.options = options;
}

/**
 * Handles the given request
 * @param  {Request}   req
 * @param  {Response}   res
 * @param  {Function} next [description]
 * @public
 */
Middleware.prototype.request = function (req, res, next) {
  var self = this;
  var shouldTakeSnapshot = this.options.routes(req);
  if (!shouldTakeSnapshot) return next();

  var botRegex = /(google|yahoo|bing|baidu|jeeves|facebook|twitter|linkedin)/i;
  var isBot = botRegex.test(req.headers['user-agent']);
  if (!isBot) return next();

  this._checkForCache(req)
    .then(function (inCache) {
      if (!inCache) {
        return self._createSnapshot(req);
      }
    })
    .then(function () {
      return self._serveSnapshot(req, res);
    });
};

Middleware.prototype._serveSnapshot = function(request, response) {
  var cachePath = this._getCachePathForRequest(request);
  fs.readFile(cachePath, function (err, data) {
    if(err) throw err;
    response.send(data.toString());
  });
};

Middleware.prototype._createSnapshot = function(request) {
  var self = this;
  var deferred = Q.defer();
  var cachePath = this._getCachePathForRequest(request);
  this._ensureCacheDirectoryExists()
    .then(function () { return self._getContentForURL(self.options.requestURL + request.path); })
    .then(function (content) {
      fs.writeFile(cachePath, content, function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });
    });
  return deferred.promise;
};

Middleware.prototype._checkForCache = function (request) {
  var deferred = Q.defer();

  // Does a cache file exist for this hash?
  var cachePath = this._getCachePathForRequest(request);
  fs.exists(cachePath, function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
};

Middleware.prototype._getCachePathForRequest = function(request) {
  var requestedPath = request.path;
  var hash = this._getHashForPath(requestedPath);

  return path.resolve(this.options.cacheDirectory, hash);
};

Middleware.prototype._ensureCacheDirectoryExists = function() {
  var self = this;
  var deferred = Q.defer();
  fs.exists(this.options.cacheDirectory, function (exists) {
    if (!exists) {
      fs.mkdir(self.options.cacheDirectory, function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
  });
  return deferred.promise;
};

/**
 * Returns an MD5 hash for the given path
 * @param  {String} path
 * @return {String}
 * @private
 */
Middleware.prototype._getHashForPath = function (path) {
  return crypto.createHash('md5').update(path).digest('hex');
};

/**
 * Creates a PhantomJS instance and returns the computed DOM
 * for the given URL
 * @param  {String} url
 * @return {Promise}
 * @private
 */
Middleware.prototype._getContentForURL = function (url) {
  var deferred = Q.defer();
  var self = this;
  phantom.create(function (ph) {
    phantom.onError = function (err) {
      phantom.exit();
      return deferred.reject(err);
    };
    ph.createPage(function (page) {
      page.onError = function (err) {
        phantom.exit();
        return deferred.reject(err);
      };

      page.open(url, function (status) {
        if (status !== 'success') {
          return deferred.reject(new Error('PhantomJS status for ' + url + ': ' + status));
        }

        var generateHTML = function () {
          page.evaluate(function() { return document.documentElement.innerHTML; }, function (result) {
            deferred.resolve(result);
          });
        };

        if (typeof self.options.pageModifier === 'function') {
          self.options.pageModifier(page, function () {
            generateHTML();
          });
        } else {
          generateHTML();
        }
      });
    });
  });
  return deferred.promise;
};

module.exports = Middleware;
