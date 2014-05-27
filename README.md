# node-seo [![Build Status](https://travis-ci.org/saschagehlich/node-seo.svg?branch=master)](https://travis-ci.org/saschagehlich/node-seo)

node-seo is a connect middleware that can generate, cache and serve HTML
snapshots of single page web apps for search bots. Uses [PhantomJS](http://phantomjs.org/)
for generating snapshots.

## Installation

via npm:

```bash
$ npm install seo
```

## Configuration

node-seo can be used as a middleware for connect/express, like this:

```js
var express = require('express');
var seo  = require('seo');
var app = express();

app.use(new seo({
  cacheDirectory: path.resolve(process.cwd(), '.seo-cache'),
  routes: require('./seo-routes'),
  requestURL: 'http://localhost:8080',
  pageModifier: function (page, callback) {
    // This function can be used to modify a page before it is cached
    // `page` is an instance of PhantomJS's Page object. For an example
    // see `test/middleware.test.js`
  }
}).init());

app.listen(8080);
```

In this case, node-seo will use `seo-routes.js` to check whether it should
create a snapshot for the current path. This file should export a function that
returns a boolean. The first parameter is the current request:

```js
module.exports = function (request) {
  if (request.path === '/') return true;
  return false;
}
```

## Todo

* Ability to pre-render (initial rendering can take some time and we don't want to affect our search engine ranking by slow rendering times)
