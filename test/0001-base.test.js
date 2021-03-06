"use strict";

var assert = require('assert');
var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parserFrom(require('rdfa').RDFaXMLParser);
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

var baseIRI = 'http://example.com/';

// TODO: load this data in a before() clause
var templateFilename = __dirname + '/data-table.html';
var templateContents = fs.readFileSync(templateFilename, 'UTF-8');
var document = new DOMParser().parseFromString(templateContents, 'text/xml');

var dataFilename = __dirname + '/data-users-one.ttl';
var dataContents = fs.readFileSync(dataFilename, 'UTF-8');
var dataParse = rdf.TurtleParser.parse(dataContents, baseIRI);
var dataGraph = dataParse.graph;

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
	it("queries", function(){
		var result = parse(baseIRI, document);
		// TODO: verify the string is actually correct
		assert.equal(result.parser.queries.toString(),
			'SELECT * {\n' +
			'\t# Block 0\n' +
			'}\n' +
			',SELECT * {\n' +
			'\t# Block 1\n' +
			'\t_:b2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type .\n' +
			'\t_:b2 <http://xmlns.com/foaf/0.1/name> ?name .\n' +
			'\t_:b2 <http://xmlns.com/foaf/0.1/homepage> ?homepage .\n' +
			'\t_:b2 <http://xmlns.com/foaf/0.1/nick> ?nick .\n' +
			'\t# Block 0\n' +
			'}\n',
		);
	});
	it("generateDocument", function(){
		var result = parse(baseIRI, document);
		var rdoc = result.fillSingle(dataGraph);
		var eBody = rdoc.documentElement.childNodes[3];
		assert.equal(eBody.nodeName, 'body');
		var eMain = rdoc.getElementById('main-content');
		assert.equal(eMain.nodeName, 'main');
		var eTr = rdoc.getElementsByTagName('tr');
		assert.equal(eTr.length, 2);
		assert.equal(eTr[0].childNodes[0].firstChild.textContent, 'Name');
		assert.equal(eTr[1].childNodes[1].firstChild.textContent, 'Alice');
	});
});
