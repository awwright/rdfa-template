"use strict";

var assert = require('assert');
var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parserFrom(require('rdfa').RDFaXMLParser);
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

function templateFromFile(templateFilename){
	// TODO: load this data in a before() clause
	var templateFilepath = __dirname + '/' + templateFilename;
	var templateContents = fs.readFileSync(templateFilepath, 'UTF-8');
	var sz = new XMLSerializer;
	var document = new DOMParser().parseFromString(templateContents, 'text/xml');
	return document;
}

function dataFromFile(dataFilename, baseIRI){
	if(!baseIRI) baseIRI = 'http://example.com/';
	var dataFilepath = __dirname + '/' + dataFilename;
	var dataContents = fs.readFileSync(dataFilepath, 'UTF-8');
	var dataParse = rdf.TurtleParser.parse(dataContents, baseIRI);
	var dataGraph = dataParse.graph;
	return dataGraph;
}

function generateTest(template, dataGraph, baseIRI, bindings){
	if(!baseIRI) baseIRI = 'http://example.com/';
	var parsed = parse(baseIRI, template);
	var rendered = parsed.parser.generateDocument(parsed.document, dataGraph, bindings);
	return rendered;
}

function elements(list){
	return Array.prototype.filter.call(list, function(e){
		return e.nodeType==e.ELEMENT_NODE;
	});
}
function tableCells(eTable){
	return elements(eTable.getElementsByTagName('tr')).map(function(e){
		return elements(e.childNodes);
	});
}
describe("generateDocument", function(){
	it('0001', function(){
		var doc = generateTest(
			templateFromFile('data-table.html'),
			dataFromFile('data-users-one.ttl'),
		);
		var table = tableCells(doc.getElementById('main-content'));
		assert.equal(table.length, 2);
		assert.equal(table[0][0].firstChild.textContent, 'Name');
		assert.equal(table[0][1].firstChild.textContent, 'Homepage');
		assert.equal(table[0][2].firstChild.textContent, 'Nickname');
		assert.equal(table[1][0].firstChild.textContent, 'Alice');
		assert.equal(table[1][1].firstChild.textContent, 'http://example.com/~a/');
		assert.equal(table[1][2].firstChild.textContent, 'a');
	});
	it('0002', function(){
		var doc = generateTest(
			templateFromFile('data-table.html'),
			dataFromFile('data-table.ttl'),
		);
		var table = tableCells(doc.getElementById('main-content'));
		assert.equal(table.length, 4);
		assert.equal(table[0][0].firstChild.textContent, 'Name');
		assert.equal(table[0][1].firstChild.textContent, 'Homepage');
		assert.equal(table[0][2].firstChild.textContent, 'Nickname');
		assert.equal(table[1][0].firstChild.textContent, 'Alice');
		assert.equal(table[1][1].firstChild.textContent, 'http://example.com/~a');
		assert.equal(table[1][2].firstChild.textContent, 'a');
		assert.equal(table[2][0].firstChild.textContent, 'Bob');
		assert.equal(table[2][1].firstChild.textContent, 'http://example.com/~b');
		assert.equal(table[2][2].firstChild.textContent, 'b');
		assert.equal(table[3][0].firstChild.textContent, 'Charlie');
		assert.equal(table[3][1].firstChild.textContent, 'http://example.com/~c');
		assert.equal(table[3][2].firstChild.textContent, 'c');
		var rows = elements(doc.getElementsByTagName('tr'));
		assert.equal(rows.length, 4);
		assert.equal(rows[1].getAttribute('typeof'), 'http://xmlns.com/foaf/0.1/Person');
	});
	it('0003 empty graph no results', function(){
		var doc = generateTest(
			templateFromFile('data-table-about.html'),
			new rdf.Graph(),
		);
		var rows = elements(doc.getElementsByTagName('tr'));
		assert.equal(rows.length, 1);
	});
	it('0004', function(){
		var doc = generateTest(
			templateFromFile('data-table.html'),
			dataFromFile('data-table.ttl'),
			null,
			{name: new rdf.Literal('Alice')},
		);
		var table = tableCells(doc.getElementById('main-content'));
		assert.equal(table.length, 2);
		assert.equal(table[0][0].firstChild.textContent, 'Name');
		assert.equal(table[0][1].firstChild.textContent, 'Homepage');
		assert.equal(table[0][2].firstChild.textContent, 'Nickname');
		assert.equal(table[1][0].firstChild.textContent, 'Alice');
		assert.equal(table[1][1].firstChild.textContent, 'http://example.com/~a');
		assert.equal(table[1][2].firstChild.textContent, 'a');
	});
	it('0005', function(){
		var doc = generateTest(
			templateFromFile('data-table-hyperlinks.html'),
			dataFromFile('data-table.ttl'),
		);
		var table = tableCells(doc.getElementById('main-content'));
		assert.equal(table.length, 4);
		assert.equal(table[0][0].firstChild.textContent, 'Name');
		assert.equal(table[0][1].firstChild.textContent, 'Homepage');
		assert.equal(table[0][2].firstChild.textContent, 'Nickname');
		assert.equal(table[1][0].firstChild.textContent, 'Alice');
		assert.equal(table[1][1].firstChild.textContent, 'http://example.com/~a');
		assert.equal(table[1][2].firstChild.textContent, 'a');
		assert.equal(table[2][0].firstChild.textContent, 'Bob');
		assert.equal(table[2][1].firstChild.textContent, 'http://example.com/~b');
		assert.equal(table[2][2].firstChild.textContent, 'b');
		assert.equal(table[3][0].firstChild.textContent, 'Charlie');
		assert.equal(table[3][1].firstChild.textContent, 'http://example.com/~c');
		assert.equal(table[3][2].firstChild.textContent, 'c');
	});
	it('subquery=each about-bind, href-bind', function(){
		var doc = generateTest(
			templateFromFile('data-table-about.html'),
			dataFromFile('data-table.ttl'),
		);
		var table = tableCells(doc.getElementById('main-content'));
		assert.equal(table.length, 4);
		assert.equal(table[0][0].firstChild.textContent, 'Subject');
		assert.equal(table[0][1].firstChild.textContent, 'Homepage');
		assert.equal(table[0][2].firstChild.textContent, 'Nickname');
		assert.equal(table[1][0].firstChild.textContent, 'http://example.com/#a');
		assert.equal(table[1][0].firstChild.localName, 'a');
		assert.equal(table[1][0].firstChild.getAttribute('href'), '/#a');
		assert.equal(table[1][1].firstChild.textContent, 'Alice');
		assert.equal(table[1][2].firstChild.textContent, 'a');
		assert.equal(table[2][0].firstChild.textContent, 'http://example.com/#b');
		assert.equal(table[2][0].firstChild.localName, 'a');
		assert.equal(table[2][0].firstChild.getAttribute('href'), '/#b');
		assert.equal(table[2][1].firstChild.textContent, 'Bob');
		assert.equal(table[2][2].firstChild.textContent, 'b');
		assert.equal(table[3][0].firstChild.textContent, 'http://example.com/#c');
		assert.equal(table[3][0].firstChild.localName, 'a');
		assert.equal(table[3][0].firstChild.getAttribute('href'), '/#c');
		assert.equal(table[3][1].firstChild.textContent, 'Charlie');
		assert.equal(table[3][2].firstChild.textContent, 'c');
	});
	it('link tag with standard link relation 1', function(){
		var doc = generateTest(
			templateFromFile('data-link-var.html'),
			dataFromFile('data-link-standard.ttl'),
			null,
			{ predicate: new rdf.NamedNode('http://www.w3.org/1999/xhtml/vocab#up') },
		);
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links[0].getAttribute('rel'), 'up');
	});
	it('link tag with standard link relation 2', function(){
		var doc = generateTest(
			templateFromFile('data-link-var.html'),
			dataFromFile('data-link-custom.ttl'),
			null,
			{ predicate: new rdf.NamedNode('http://example.com/term/property') },
		);
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links[0].getAttribute('rel'), 'http://example.com/term/property');
	});
});
