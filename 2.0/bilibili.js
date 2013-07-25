var libRequest = require('request');
var q = require('q');
var libXml2js = require('xml2js');
var libUrl = require('url');
var zlib = require('zlib');
var util = require('util');

function request(url, cookies) {
    var args = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
    var callback = arguments[arguments.length - 1];
    return libRequest({
        url: url,
        encoding: 'binary',
        headers: {
            'Cache-Control': 'no-cache',
            'Referer': 'video.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/536.26.17 (KHTML, like Gecko) Version/6.0.2 Safari/536.26.17',
            'Cookie': cookies || ''
//            'Accept-Encoding': ''
        }
    }, function (e, q, r) {
        if (callback instanceof Function) {
            callback.apply(null, [e, q, r].concat(args))
        }
    });
}

var qRequest = q.nbind(request);

exports.render = function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Custom-Header');
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');

    var cookies = req.headers['Cookie'];
    var qs = libUrl.parse(req.url, true).query || {};
    var callback = qs['callback'] || '';
    var aid = qs['aid'] || 664244;
    var page = qs['page'] || 1;
    var cid = qs['cid'] || '';
    var vid = qs['vid'] || '';
    var callType = qs['ct'] || 'jsonp';
//    var cid = -1;


    qRequest("http://api.bilibili.tv/view?type=json&appkey=0f38c1b83b2de0a0&id=" + aid + "&page=" + page, cookies)
        .then(function (result) {
            var cid = JSON.parse(result[1]).cid;
            if (!cid || cid == -1) {
                throw new Error('get cid failed.');
            }
            console.log(cid);
            return {cid: cid};
        })
        .then(function (result) {
            return qRequest("http://interface.bilibili.tv/playurl?otype=json&appkey=0f38c1b83b2de0a0&cid=" + result.cid + "&type=mp4", cookies, result.cid);
        })
        .then(function (result) {
            return  {urlInfo: JSON.parse(result[1]), cid: result[2]};
        })
        .then(function (result) {
            return q.nfcall(function (result, callback) {
                var url = "http://comment.bilibili.tv/" + result.cid + ".xml";
                var stream = zlib.createInflateRaw();
                var d = '';
                stream.on('data', function (data) {
                    d += data;
                });
                stream.on('end', function () {
                    libXml2js.parseString(d, function (e, d) {
                        callback(e, {result: d, cid: result.cid, urlInfo: result.urlInfo});
                    });
                });
                request(url, cookies).pipe(stream);
                return result;
            }, result);
        })
        .then(function (result) {
            var d = result.result.i.d;
            var v = null;
            for (var i = 0, len = d.length; i < len; i++) {
                v = d[i];
                d[i] = {
                    msg: v['_'],
                    p: v['$']['p'].split(',')
                };
            }
            return {cid: result.cid, urlInfo: result.urlInfo, comments: d};
        })
        .fail(function (e) {
            console.log(e);
            res.end(util.format("%s(-1)", callback));
        })
        .then(function (result) {
            console.log('8');
            res.end(util.format('%s(%d,%j,%j)', callback, result.cid, result.urlInfo, result.comments));
        });
/*
    return;
    res.write(callback);
    res.write("(");
    var getCid = function () {
        var url = "http://api.bilibili.tv/view?type=json&appkey=0f38c1b83b2de0a0&id=" + aid + "&page=" + page;
        request(url, cookies, function (error, response, body) {
            try {
                var data = JSON.parse(body);
                cid = data.cid ? data.cid : -1;
                res.write(cid + '');
                getPath();
            } catch (e) {
                res.end('-1)');
            }
        });
    };

    var getPath = function () {
        var url = "http://interface.bilibili.tv/playurl?otype=json&appkey=0f38c1b83b2de0a0&cid=" + cid + "&type=mp4";
        request(url, cookies, function (error, respone, body) {
            res.write(',');
            res.write(body);
            getComment(cid);
        });
    };

    var getComment = function (cid, callback) {
        var url = "http://comment.bilibili.tv/" + cid + ".xml";
        var stream = zlib.createInflateRaw();
        var d = '';
        stream.on('data', function (data) {
            d += data;
        });
        stream.on('end', function () {
            libXml2js.parseString(d, function (e, result) {
                res.write(',');
                var d = result.i.d;
                var v = null;
                for (var i = 0, len = d.length; i < len; i++) {
                    v = d[i];
                    d[i] = {
                        msg: v['_'],
                        p: v['$']['p'].split(',')
                    };
                }
                res.write(JSON.stringify(d));
                res.end(')');
            });
        });
        request(url, cookies).pipe(stream);
    };

    getCid();
    */
};