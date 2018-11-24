

var assert = require('assert');
var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parse;
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

var baseIRI = 'http://example.com/';

// TODO: load this data in a before() clause
var templateFilename = __dirname + '/data-table.html';
var templateContents = fs.readFileSync(templateFilename, 'UTF-8');
var sz = new XMLSerializer;
var document = new DOMParser().parseFromString(templateContents, 'text/xml');

var dataFilename = __dirname + '/data-table.ttl';
var dataContents = fs.readFileSync(dataFilename, 'UTF-8');
var dataParse = rdf.TurtleParser.parse(dataContents, baseIRI);
var dataGraph = dataParse.graph;

var rdfenv = {
	createNamedNode: rdf.environment.createNamedNode,
	createBlankNode: rdf.environment.createBlankNode,
	createLiteral: rdf.environment.createLiteral,
}

describe("0001", function(){
    it("parse() result", function(){
        var result = parse(baseIRI, document);
        assert(result);
        assert(result.document);
        assert(result.parser);
        assert(result.outputGraph);
        assert(result.outputPattern);
        assert(result.processorGraph);
    });
    it("outputPattern", function(){
        var result = parse(baseIRI, document);
        // TODO: verify the string is actually correct
        assert(result.outputPattern.toString());
    });
    it("genreateDocument", function(){
        var result = parse(baseIRI, document);
        var rdoc = result.parser.generateDocument(result.document, dataGraph);
        // TODO: verify data has appeared in DOM here
    });
});
