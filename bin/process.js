
if(process.argv.length < 4){
	console.error('Usage: process.js <Template> <Data>');
	return;
}

var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parse;
var evaluateQuery = require('../lib/query.js').evaluateQuery;
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

var templateFilename = process.argv[2];
var templateContents = fs.readFileSync(templateFilename, 'UTF-8');
var XMLSerializer = new XMLSerializer;
var document = new DOMParser().parseFromString(templateContents, 'text/xml');

var dataFilename = process.argv[3];
var dataContents = fs.readFileSync(dataFilename, 'UTF-8');
var dataParse = rdf.TurtleParser.parse(dataContents);
var dataGraph = dataParse.graph;

var rdfenv = {
	createNamedNode: rdf.environment.createNamedNode,
	createBlankNode: rdf.environment.createBlankNode,
	createLiteral: rdf.environment.createLiteral,
}

console.log('Parse:');
debugger;
var result = parse('http://example.com/', document);
console.log('DOM:');
console.log(XMLSerializer.serializeToString(result.document));
console.log('');
console.log('Data:');
console.log(dataGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
console.log('Query:');
console.log(result.outputPattern.toString());
console.log('Recordset:');
console.log(evaluateQuery(dataGraph, result.outputPattern));


