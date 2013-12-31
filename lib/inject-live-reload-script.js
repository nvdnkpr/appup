'use strict';
/*jshint browser: true*/

var cheerio = require('cheerio');

function liveReloadCode() {
  /*global EventSource */
  if(window.EventSource) {
    var es = (new EventSource('/-/live-reload'));
    es.onmessage = function(ev) {
      if(ev.data === 'reload') {
        window.location.reload();
      }
    };
  } else {
    setTimeout(iter, 2000);
  }

  function iter() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/-/live-reload');
    xhr.onreadystatechange = function() {
      if(xhr.readyState !== 4) return;

      if(/true/.test(xhr.responseText)) {
        window.location = window.location;
        return;
      }
      xhr = xhr.onreadystatechange = null;
      setTimeout(iter, 2000);
    };

    xhr.send(null);
  }
}

var go = module.exports = function (body) {
  var script = '<script type=\"text/javascript\">\n;(' + liveReloadCode + ')()\n<\/script>\n';
  var dom = cheerio(body);
  var scripts = dom.find('script');
  scripts.before(script);

  return dom.toString();
};
