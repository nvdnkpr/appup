'use strict';

var dynamicDedupe = require('dynamic-dedupe');

var path = require('path');
var optimist = require('optimist');
var browserify = require('browserify');

var startPages = require('./lib/start-pages');
var startApi = require('./lib/start-api');

/**
 * Creates browserify bundle and starts up pages server and/or api server according to the supplied options.
 *
 * If no api port is given, the api server is not started up.
 * If no pages port is given, the pages server is not started up.
 * If neither port is given, an error is thrown.
 * 
 * @name exports
 * @function
 * @param opts {Object} with the following properties
 *  - pages: port at which to start up pages server (optional)
 *  - api: port at which to start up api server (optional)
 *  - config: full path configuration provided to override browserify specific options and/or custom API/Pages servers init functions
 *  - entry: entry file to add to browserify
 *  - dedupe: turns on dynamic-dedupe
 */
var go = module.exports = function (opts) {

  // ensure to turn dedupe on BEFORE requiring the entry
  if (opts.dedupe) dynamicDedupe.activate(); 

  var config    =  opts.config ? require(opts.config) : {};
  var pagesPort =  opts.pagesPort;
  var apiPort   =  opts.apiPort;
  var entry     =  opts.entry;

  if (!pagesPort && !apiPort) throw new Error('Need to pass either pages or api port in order for me to start an app');

  var bfy = config.initBrowserify ? config.initBrowserify(browserify) : browserify();
  var bundleOpts = config.bundleOpts || { insertGlobals: true, debug: true };

  var initPages     =  config.initPages     || function () {};
  var postInitPages =  config.postInitPages || function () {};
  var initApi       =  config.initApi       || function () {};
  var postInitApi   =  config.postInitApi   || function () {};

  bfy.require(entry, { entry: true });

  function maybeStartPages (apiServerInfo) {
    if (pagesPort) {
      startPages(bfy, bundleOpts, initPages, postInitPages, pagesPort, apiServerInfo, function (err, address) {
        var port = address.port;
        console.log('pages server listening: http://localhost:' + port);
      });
    }
  }

  // api server needst to be started before pages server in order to provide api server location to the latter
  if (apiPort) { 
    startApi(initApi, postInitApi, apiPort, function (err, address) {
      if (err) return console.error(err);
      var port = address.port;
      console.log('api server listening: http://localhost:' + port);
      maybeStartPages({ address: address });
    });
  } else {
    maybeStartPages(null);
  }
};
