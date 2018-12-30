var assert = require('assert');
var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parse;
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

function templateFromFile(templateFilename){
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
	var template = parse(baseIRI, template);
	var rendered = template.parser.generateDocument(template.document, dataGraph, bindings);
	return rendered;
}

function generateFilledDocument(templateDocument, dataGraph, baseIRI, bindings){
	if(!baseIRI) baseIRI = 'http://example.com/';
	var template = parse(baseIRI, templateDocument);
	var recordSet = template.parser.generateInitialList(dataGraph, {});
	assert.equal(recordSet.length, 1);
	var rendered = template.parser.generateDocument(template.document, dataGraph, recordSet[0]);
	return rendered;
}

function elements(list){
	return Array.prototype.filter.call(list, function(e){
		return e.nodeType==e.ELEMENT_NODE;
	});
}

describe("RDFa Core examples", function(){
	it('002a', function(){
		var doc = generateFilledDocument(
			templateFromFile('rdfa-002a.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('002b', function(){
		var doc = generateFilledDocument(
			templateFromFile('rdfa-002b.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas.length, 1);
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links.length, 1);
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('002c', function(){
		var doc = generateTest(
			templateFromFile('rdfa-002c.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas.length, 1);
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links.length, 1);
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('003a', function(){
		var doc = generateFilledDocument(
			templateFromFile('rdfa-003a.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas.length, 1);
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links.length, 1);
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('003b', function(){
		var doc = generateFilledDocument(
			templateFromFile('rdfa-003b.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas.length, 1);
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links.length, 1);
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('003c', function(){
		var doc = generateTest(
			templateFromFile('rdfa-003c.html'),
			dataFromFile('rdfa-002.ttl'),
		);
		var metas = elements(doc.getElementsByTagName('meta'));
		assert.equal(metas.length, 1);
		assert.equal(metas[0].getAttribute('content'), 'Mark Birbeck');
		var links = elements(doc.getElementsByTagName('link'));
		assert.equal(links.length, 1);
		assert.equal(links[0].getAttribute('href'), 'http://www.example.com/#us');
	});
	it('005a', function(){
		var doc = generateTest(
			templateFromFile('rdfa-005a.html'),
			dataFromFile('rdfa-005.ttl'),
		);
		var e = elements(doc.getElementsByTagName('h1'));
		assert.equal(e.length, 1);
		assert.equal(e[0].textContent, 'My home-page');
	});
});
