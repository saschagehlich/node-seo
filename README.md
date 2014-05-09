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
  requestURL: 'http://localhost:8080'
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
