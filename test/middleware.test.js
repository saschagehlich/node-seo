/* global createServer: true, clearCache: true */
'use strict';
var fs = require('fs');
var path = require('path');
var supertest = require('supertest');
var app;

describe('Middleware', function() {
  this.timeout(5000);
  before(function() {
    app = createServer({
      routes: require('./seo-routes')
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

            res.text.should.equal('<head></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">ohai</pre></body>');

            next();
          });
      });

      it('should create a snapshot', function() {
        var cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForPath('/seo-route'));
        var exists = fs.existsSync(cachePath);
        exists.should.equal(true);
      });

      describe('when re-requesting a seo url', function() {
        var cachePath, statBefore, statAfter;
        before(function (next) {
          cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForPath('/seo-route'));
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

          var cachePath = path.resolve(process.cwd(), '.seo-cache', app.seo.middleware._getHashForPath('/seo-route'));
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

          res.text.should.equal('ohai');

          done();
        });
    });
  });
});
