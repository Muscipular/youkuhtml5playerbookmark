var libRequest = require('request');
var libXml2js = require('xml2js');
var libUrl = require('url');
var zlib = require('zlib');
var libStream = require('stream');

function request(url, cookies, callback){
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

exports.render = function(req, res){
    res.headers['Access-Control-Allow-Origin'] = '*';
    res.headers['Access-Control-Allow-Credentials'] = 'true';
    res.headers['Access-Control-Allow-Methods'] = 'GET, POST';
    res.headers['Access-Control-Allow-Headers'] = 'X-Custom-Header';
    //res.headers['Content-Type'] = 'text/html; charset=utf-8';

    var cookies = req.headers['Cookie'];
    var qs = libUrl.parse(req.url, true).query || {};
    console.log(req.headers);
    var callback = qs['callback'] || '';
    var aid = qs['aid'] || 664244;
    var page = qs['page'] || 1;
    console.log(qs['callback']);
    console.log(qs['aid']);
    console.log(qs['page']);
    var cid = -1;


    res.write(callback);
    res.write("(");
    var getCid = function(){
        console.log(aid);
        var url = "http://api.bilibili.tv/view?type=json&appkey=0f38c1b83b2de0a0&id=" + aid + "&page=" + page;
        request(url, cookies, function(error, response, body){
            try{
                console.log(body);
                var data = JSON.parse(body);
                cid = data.cid ? data.cid : -1;
                console.log(cid);
                res.write(cid + '');
                getPath();
            } catch (e) {
                console.log(e);
                console.log(e ? e.stack : '');
                res.end('-1)');
            }
        });
    };

    var getPath = function(){
        var url = "http://interface.bilibili.tv/playurl?otype=json&appkey=0f38c1b83b2de0a0&cid=" + cid + "&type=mp4";
        request(url, cookies, function(error, respone, body){
            res.write(',');
            res.write(body);
            getComment();
        });
    };

    var getComment = function(){
//        var url = "http://comment.bilibili.tv/" + cid + ".xml";
//        var stream = new libStream.Writable();
//        var d = '';
//        stream.on('data', function (data) {
//            d += data;
//        });
//        stream.on('end', function () {
//            res.write(d);
        res.write(',');
        res.end('[])');
//        });
//        request(url, cookies).pipe(zlib.createInflateRaw()).pipe(stream);
    };

    getCid();
};