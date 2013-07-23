/**
 * Module dependencies.
 */

var http = require('http');
var port = 3000;

var bilibi = require('./bilibili');
var acfun = require('./acfun');
var fs = require('fs');

var server = http.createServer(function (req, res) {
    console.log(req.url);
    if (/^\/bilibili/.test(req.url)) {
        bilibi.render(req, res);
    } else if (/^\/acfun/.test(req.url)) {
        acfun.render(req, res);
    } else {
        fs.createReadStream('./youkuhtml5playerbookmark2.js').pipe(res);
    }
});

server.listen(port, function () {
    console.log('server listening on port ' + port);
});
