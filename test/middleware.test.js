/* global createServer: true, clearCache: true, $: true */
'use strict';
var fs = require('fs');
var path = require('path');
var supertest = require('supertest');
var app;

describe('Middleware', function() {
  this.timeout(5000);
  before(function() {
    app = createServer({
      routes: require('./seo-routes'),

      // This modifier injects jQuery into the PhantomJS page and
      // removes all script tags from the header
      pageModifier: function (page, callback) {
        var jqueryPath = path.resolve(process.cwd(), 'test/vendor/jquery-1.11.1.min.js');
        page.injectJs(jqueryPath);
        page.evaluate(function () {
          $('head script').remove();
        }, function () {
          callback();
        });
      }
    });
  });

  after(function() {
    app.server.close();
  });

  describe('when user agent is a bot', function() {
    before(clearCache);

    describe('when requesting a seo url', function() {
      beforeEach(function(next) {
        supertest(app.server)
          .get('/seo-route')
          .set('User-Agent', 'googlebot')
          .expect(200)
          .end(function (err, res) {
            if(err) throw err;

            var resultPath = path.resolve(process.cwd(), 'test/seo-page-result.html');
            var expectedResult = fs.readFileSync(resultPath).toString();
            (res.text + '\n').should.equal(expectedResult);

            next();
          });
      });

      it('should create a snapshot', function() {
        var cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForUrl('127.0.0.1', '/seo-route'));
        var exists = fs.existsSync(cachePath);
        exists.should.equal(true);
      });

      describe('when re-requesting a seo url', function() {
        var cachePath, statBefore, statAfter;
        before(function (next) {
          cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForUrl('127.0.0.1', '/seo-route'));
          statBefore = fs.statSync(cachePath);

          setTimeout(next, 2000);
        });
        it('should not re-create a snapshot', function() {
          statAfter = fs.statSync(cachePath);

          (+statBefore.mtime).should.equal(+statAfter.mtime);
        });
      });
    });
  });

  describe('when user agent is not a bot', function() {
    before(clearCache);

    it('should not create a snapshot', function(done) {
      supertest(app.server)
        .get('/seo-route')
        .set('User-Agent', 'foobarbaz')
        .expect(200)
        .end(function (err) {
          if(err) throw err;

          var cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForUrl('127.0.0.1', '/seo-route'));
          var exists = fs.existsSync(cachePath);
          exists.should.equal(false);

          done();
        });
    });

    it('should not serve a snapshot', function(done) {
      supertest(app.server)
        .get('/seo-route')
        .set('User-Agent', 'foobarbaz')
        .expect(200)
        .end(function (err, res) {
          if(err) throw err;

          var seoFilePath = path.resolve(process.cwd(), 'test/seo-page.html');
          var expectedResult = fs.readFileSync(seoFilePath).toString();

          res.text.should.equal(expectedResult);

          done();
        });
    });
  });
});
