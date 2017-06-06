/**
 * Created by mgraube on 21.05.17.
 */
var http = require('http');
var httpProxy = require('http-proxy');
var qs = require('querystring');
var url = require('url');
var FifoArray = require('fifo-array');
var express = require("express");
var router = express.Router();

var logArray = new FifoArray(20);


var proxy = httpProxy.createProxyServer({});

var serverSparql = http.createServer(function (req, res) {


    var url_parts = url.parse(req.url, true);
    var query_params = url_parts.query;

    req.time = new Date();
    if (query_params.query) {
        req.query = query_params.query;
    }
    else {
        var body = [];
        req.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            body = Buffer.concat(body).toString();
            req.query = qs.parse(body).query;
        });
    }

    if (req.query) {
        sparqlLogEntry = {
            'url': req.url,
            'method': req.method,
            'host': req.headers.host,
            'userAgent': req.headers['user-agent'],
            'time': new Date,
            'query': req.query,
            'client': req.headers['x-forwarded-for'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress
        }

        logArray.push(sparqlLogEntry);
        console.log("New SPARQL request", sparqlLogEntry);
    }

    proxy.web(req, res, {
        target: 'http://eatld.et.tu-dresden.de:8890'
        //target: 'http://10.2.52.3:8890'
    });

}).listen(5050);
console.log("SPARQL proxy listening on port 5050")

/*
proxy.on('proxyRes', function (proxyRes, req, res) {

    if (req.query) {
        sparqlLogEntry = {
                'url': req.url,
                'method': req.method,
                'host': req.headers.host,
                'user-agent': req.headers['user-agent'],
                'time': req.time,
                'query': req.query,
                'client': req.ip
            },
            'response': {
                'time': new Date(),
                'content-type': proxyRes.headers['content-type']
            }
        };

        var body_res = [];
        proxyRes.on('data', function (chunk) {
            body_res.push(chunk);
        }).on('end', function () {
            body_res = Buffer.concat(body_res).toString();
            sparqlLogEntry.response.result = body_res;
        });

        logArray.push(sparqlLogEntry);
    }
});
*/

var app = express();
var serverLog = app.listen(5060);
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/queries", function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(logArray, true, 2));
    res.end();
});
console.log("SPARQL statistics listening on port 5060")


