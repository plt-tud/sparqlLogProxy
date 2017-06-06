# sparqlLogProxy

Proxy for a SPARQL endpoint which logs all SPARQL requests and provides the last 20 requests as JSON. It works as backend for the SparqlViz tool.

[![Build Status](http://dev.plt.et.tu-dresden.de:8000/api/badges/graube/sparqlLogProxy/status.svg)](http://dev.plt.et.tu-dresden.de:8000/graube/sparqlLogProxy)

## Starting
Install all dependencies

`npm install`

Then you can start the proxy redirecting to a SPARQL endpoint (default *http://localhost:8890*) via

`node server.js [--endpoint=http://localhost:8890]`


# Interface

There is an interface on port 5050 redirecting to a SPARQL endpoint.

On `localhost:5060` you get the log of the last 20 SPARQL queries. New queries are also pushed as socket.io after connecting to this URL.

