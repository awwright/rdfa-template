var assert = require('assert');
var fs = require('fs');

var rdf = require('rdf');
var parserFrom = require('../index.js').parserFrom;
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

function generateTest(parse, template, dataGraph, baseIRI, bindings){
	if(!baseIRI) baseIRI = 'http://example.com/';
	var template = parse(baseIRI, template);
	var rendered = template.parser.generateDocument(template.document, dataGraph, bindings);
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
describe("parserFrom", function(){
	it('parserFrom(RDFaXMLParser)', function(){
		var parser = parserFrom(require('rdfa').RDFaXMLParser);
		var graph = parser('http://localhost/', templateFromFile('data/parserFrom.html')).data();
		// <http://localhost/> <http://www.w3.org/2007/05/powder-s#describedby> <http://localhost/target> .
		// <http://localhost/> <http://localhost/rel> <http://localhost/target> .
		assert.equal(graph.length, 2);
	});
	it('parserFrom(RDFaXHTMLParser)', function(){
		var parser = parserFrom(require('rdfa').RDFaXHTMLParser);
		var graph = parser('http://localhost/', templateFromFile('data/parserFrom.html')).data();
		// <http://localhost/> <http://www.w3.org/1999/xhtml/vocab#up> <http://localhost/target> .
		// <http://localhost/> <http://www.w3.org/2007/05/powder-s#describedby> <http://localhost/target> .
		// <http://localhost/> <http://localhost/rel> <http://localhost/target> .
		assert.equal(graph.length, 3);
	});
});
