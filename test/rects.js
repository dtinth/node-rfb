var assert = require('assert');
var qemu = require('./lib/qemu');
var RFB = require('rfb');
var Seq = require('seq');

exports.rects = function () {
    var port = Math.floor(Math.random() * (Math.pow(2,16) - 10000)) + 10000;
    var q = qemu({ port : port });
    
    var to = 'dimensions keys'
        .split(' ')
        .reduce(function (acc, name) {
            acc[name] = setTimeout(function () {
                assert.fail('never reached ' + name);
            }, 60000);
            return acc;
        }, {})
    ;
    
    setTimeout(function () {
        var r = new RFB({ port : port });
        
        r.requestRedraw();
        r.dimensions(function (dims) {
            clearTimeout(to.dimensions);
            assert.eql(dims, { width : 720, height : 400 });
            
            setTimeout(sendKeys, 5000, r);
        });
    }, 10000);
    
    function sendKeys (r) {
        clearTimeout(to.keys);
        
        Seq.ap('echo moo\n'.split(''))
            .seqEach_(function (cb, key) {
                setTimeout(function () {
                    r.once('raw', function (rect) {
                        setTimeout(cb, 100);
                    });
                    
                    r.sendKeyDown(key.charCodeAt(0));
                    r.sendKeyUp(key.charCodeAt(0));
                }, 250);
            })
            .seq(function () {
                setTimeout(function () {
                    q.stdin.write('quit\n');
                }, 500);
            })
        ;
    }
};