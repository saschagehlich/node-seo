'use strict';
process.env.NODE_ENV = 'test';

var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var express = require('express');
var seo = require('../index');

global._after = function (t, f) { return setTimeout(f, t); };
global._every = function (t, f) { return setInterval(f, t); };

global.createServer = function(options) {
  var app = {};
  var _seo = new seo(options);

  app.server = express();
  app.seo = _seo;
  app.server.use(_seo.init());

  app.server.get('/seo-route', function (req, res) {
    var seoPagePath = path.resolve(process.cwd(), 'test/seo-page.html');
    res.end(fs.readFileSync(seoPagePath));
  });

  app.server = app.server.listen(8899);

  return app;
};

global.clearCache = function() {
  var directory = path.resolve(process.cwd(), '.seo-cache');

  if (!fs.existsSync(directory)) return;

  var files = fs.readdirSync(directory);
  files.forEach(function (file) {
    var filePath = directory + '/' + file;
    if (!fs.statSync(filePath).isDirectory()) {
      fs.unlinkSync(filePath);
    }
  });
};
