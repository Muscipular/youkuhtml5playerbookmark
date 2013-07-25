//'bilibili'
youkuhtml5playerbookmark2.add(function(core, canPlayM3U8){
    var aid = window.aid, pageno = window.pageno;
    var sina = function(src, callback, commentInfo){
        var id = src.match(/vid\=([0-9a-zA-Z]+)/);
        if(id){
            id = id[1];
            src = 'http://edge.v.iask.com.sinastorage.com/' + id + '.mp4';
        }
        callback({ 'sina': src }, commentInfo);
    };
    var youku = function(src, callback, commentInfo){
        var id = src.match(/vid\/([0-9a-zA-Z]+)\//);
        id = id[1];
        if(false && canPlayM3U8){
            callback({
                '&#x6807;&#x6E05;': 'http://v.youku.com/player/getM3U8/vid/' + id + '/type/flv/ts/' + (new Date()).getTime().toString().substring(0, 10) + '/sc/2/useKeyframe/0/v.m3u8',
                '&#x539F;&#x753B;': 'http://v.youku.com/player/getM3U8/vid/' + id + '/type/hd2/ts/' + (new Date()).getTime().toString().substring(0, 10) + '/sc/2/useKeyframe/0/v.m3u8'
            }, commentInfo);
        }else{
            core.jsonp(
                'http://zythum.sinaapp.com/youkuhtml5playerbookmark/getyoukuid.php?id=' + id + '&callback=',
                function(param){
                    function getFileIDMixString(seed){
                        var source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ/\\:._-1234567890".split(''),
                            mixed = [], index;
                        for(var i = 0, len = source.length; i < len; i++){
                            seed = (seed * 211 + 30031) % 65536;
                            index = Math.floor(seed / 65536 * source.length);
                            mixed.push(source[index]);
                            source.splice(index, 1);
                        }
                        return mixed.join('');
                    };
                    function getFileID(fileid, seed){
                        var mixed = getFileIDMixString(seed), ids = fileid.split("*"), realId = [], idx;
                        for(var i = 0; i < ids.length; i++){
                            idx = parseInt(ids[i], 10);
                            realId.push(mixed.charAt(idx));
                        }
                        return realId.join('');
                    };
                    var d = new Date(),
                        fileid = getFileID(param.data[0]['streamfileids']['3gphd'], param.data[0]['seed']),
                        sid = d.getTime() + "" + (1E3 + d.getMilliseconds()) + "" + (parseInt(Math.random() * 9E3)),
                        k = param.data[0]['segs']['3gphd'][0]['k'],
                        st = param.data[0]['segs']['3gphd'][0]['seconds'];
                    core.jsonp(
                        'http://f.youku.com/player/getFlvPath/sid/' + sid + '_00/st/mp4/fileid/' + fileid + '?K=' + k + '&hd=1&myp=0&ts=1156&ypp=0&ymovie=1&callback=',
                        function(param){
                            callback({ '&#x9AD8;&#x6E05;': param[0]['server'] }, commentInfo);
                        }
                    );
                }
            );
        }
    };
    var qq = function(src, callback, commentInfo){
        var id = src.match(/qq\.com\/([0-9a-zA-Z]+)\.mp4/);
        if(id){
            id = id[1];
            core.jsonp(
                'http://vv.video.qq.com/geturl?otype=json&vid=' + id + '&charge=0&callback=',
                function(param){
                    callback({ '&#x9AD8;&#x6E05;': param.vd.vi[0].url }, commentInfo);
                }
            );
        }
    };
    var bili = function(src, callback, commentInfo){
        callback({ 'bili': src }, commentInfo);
    };
    var init = function(callback){
        $('#bofqi,object,embed').remove();
        var cid = '',
            vid = '';
        if(window.flashvars){
            cid = window.flashvars.cid;
            vid = window.flashvars.vid;
            var scr = document.createElement('script');
            scr.src = 'http://cache.video.qiyi.com/m/201971/' + vid + '/';
            document.body.appendChild(scr);
            scr.addEventListener('load', function(){
                if(!window.ipadUrl){
                    throw new Error('load url failed');
                }
                if(canPlayM3U8){
                    //safari下使用m3u8
                    var url = null;
                    ipadUrl.data.mtl.forEach(function(v){
                        if(!url || (v.vd < url.vd && v.vd < 90)){
                            url = v;
                        }
                    });
                    callback({
                        '&#x9AD8;&#x6E05;': ipadUrl.data.url//url.m3u
                    }, []);
                }else{
                    //chrome使用mp4
                    var mp4Url = ipadUrl.data.mp4Url;
                    var scr = document.createElement('script');
                    scr.src = mp4Url;
                    document.body.appendChild(scr);
                    scr.addEventListener("load", function(){
                        if(!window.videoUrl){
                            throw  new Error('load mp4 failed');
                        }
                        callback({
                            '&#x9AD8;&#x6E05;': videoUrl.data.l
                        }, []);
                    }, false);
                }
            }, false);


            return;
        }
        core.jsonp(
            'http://127.0.0.1:3000/bilibili?aid=' + aid + '&page=' + pageno + '&cid=' + cid + '&callback=',
            function(cid, videoInfo, commentInfo){
                var urls = [videoInfo.durl[0]['url']].concat(videoInfo.durl[0]['backup_url']);
                var len = urls.length;
                var i = 0;
                var vPlayer = $('.youkuhtml5playerbookmark2-video')[0];
                var code = function(){
                    if(i >= len){
                        throw new Error('request time out!');
                    }
                    if(isNaN(vPlayer.duration)){
                        var src = urls[i++].replace('android', 'ios').replace('tss=no', 'tss=ios');
                        console.log("loading src: " + src);
                        if(i == 1){
                            if(/v\.iask\.com/i.test(src)){
                                sina(src, callback, commentInfo)
                            }
                            else if(/v\.youku\.com/i.test(src)){
                                youku(src, callback, commentInfo)
                            }
                            else if(/qq\.com/.test(src)){
                                qq(src, callback, commentInfo)
                            }
                            else{
                                bili(src, callback, commentInfo);
                            }
                        }else{
                            vPlayer.src = src;
                            vPlayer.load();
                        }
                        setTimeout(code, 30000);
                    }
                };
                code();
//                setTimeout(code, 30000);
            }
        );
    };
    return{
        reg: /bilibili\.tv/.test(window.location.host) && window.aid,
        call: function(callback){
            return init(function(urls, commentInfo){
                return callback({ urls: urls, flashElementId: 'bofqi', comment: commentInfo });
            });
        }
    };
});
