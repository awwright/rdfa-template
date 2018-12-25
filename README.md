# rdfa-template

Fill variables on an RDFa page with data from an RDF graph.

## Tests

Run `mocha` to run tests.

Tests should verify the following:

* Generated queries on source graph
* Produced DOM tree
* RDF from DOM matches source graph
* Handling of variables/placeholders in each of the supported RDFa attributes

## Index of Files

* bin/process.js - command line executable
* demo/index.xhtml - Browser demo of library (run `make` first)
* lib/query.js - library to query the RDF graph
* test/ - Mocha tests
* index.js - Entry point
* Makefile - generates browser bundle
* README.md - You're looking at it
