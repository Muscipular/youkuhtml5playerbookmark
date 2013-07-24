var libRequest = require('request');
var libXml2js = require('xml2js');
var libUrl = require('url');
var zlib = require('zlib');
var libStream = require('stream');

function request(url, cookies, callback) {
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
    }, callback);
}

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
};