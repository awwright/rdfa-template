
if(process.argv.length < 4){
	console.error('Usage: process.js <Template> <Data>');
	return;
}

var fs = require('fs');

var rdf = require('rdf');
var parse = require('../index.js').parse;
var XMLSerializer = require('xmldom').XMLSerializer;
var DOMParser = require('xmldom').DOMParser;

var baseIRI = process.argv[4] || 'http://example.com/';

var templateFilename = process.argv[2];
var templateContents = fs.readFileSync(templateFilename, 'UTF-8');
var sz = new XMLSerializer;
var document = new DOMParser().parseFromString(templateContents, 'application/xml');

var dataFilename = process.argv[3];
var dataContents = fs.readFileSync(dataFilename, 'UTF-8');
var dataParse = rdf.TurtleParser.parse(dataContents, baseIRI);
var dataGraph = dataParse.graph;

var rdfenv = {
	createNamedNode: rdf.environment.createNamedNode,
	createBlankNode: rdf.environment.createBlankNode,
	createLiteral: rdf.environment.createLiteral,
}

console.error('Parse:');
var result = parse(baseIRI, document);
console.error('DOM:');
console.error(sz.serializeToString(result.document));
console.error('');
console.error('Data:');
console.error(dataGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
console.error('Query:');
console.error(result.outputPattern.toString());
console.error('Recordset:');
result.parser.queries.forEach(function(query, i){
	console.error('======');
	console.error('RecordSet '+query.id, i);
	console.error(query.toString());
	console.error(query.evaluate(dataGraph));
});
console.error('Output:');
console.log(sz.serializeToString(result.fillSingle(dataGraph)));


