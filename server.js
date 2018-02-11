"use strict";

var http = require("http");
var httpProxy = require("http-proxy");
var qs = require("querystring");
var url = require("url");
var FifoArray = require("fifo-array");
var express = require("express");
var minimist = require("minimist");

/* Defaults
 * endpoint: http://localhost:8890
 **/

var argv = minimist(process.argv.slice(2));
var endpoint = argv.endpoint || "http://localhost:8890";
console.log("Commandline arguments: ", argv);


var logArray = new FifoArray(20);


var proxy = httpProxy.createProxyServer({});


proxy.on("proxyRes", function (proxyRes, req, res) {
    var url_parts = url.parse(req.url, true);
    var query_params = url_parts.query;

    if (query_params.query) {
        req.query = query_params.query;
    } else {
        var bodyRequest = [];
        req.on("data", function (chunk) {
            bodyRequest.push(chunk);
        }).on("end", function () {
            bodyRequest = Buffer.concat(bodyRequest).toString();
            req.query = qs.parse(bodyRequest).query;
        });
    }

    var bodyResponse = "";
    proxyRes.on("data", function (chunk) {
        chunk = chunk.toString("utf-8");
        bodyResponse += chunk;
    });

    res.end = function() {
        if (req.query) {
            var sparqlLogEntry = {
                "url": req.url,
                "destinationUrl": endpoint,
                "method": req.method,
                "request-headers": req.headers,
                "query": req.query,
                "client": req.headers["x-forwarded-for"] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress,
                "response-headers": proxyRes.headers,
                "response": bodyResponse
            };
            logArray.push(sparqlLogEntry);
            emitRequest(sparqlLogEntry);
            console.log("New SPARQL request", sparqlLogEntry);
        }
    };
});

var serverSparql = http.createServer(function (req, res) {
    proxy.web(req, res, {
        target: endpoint
    });

}).listen(5050);
console.log("SPARQL proxy listening on", serverSparql.address());


var app = express();
var serverLog = app.listen(5060);
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/", function (req, res) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(logArray, null, 2));
    res.end();
});


var io = require("socket.io").listen(serverLog);
io.sockets.on("connection", function (socket) {
    console.log("Client connected", socket.client.id);
});
var emitRequest = function (data) {
    io.emit("request", data);
};

console.log("SPARQL statistics listening on", serverLog.address());
