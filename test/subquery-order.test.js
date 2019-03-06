

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

describe("subquery-order", function(){
	it("genreateDocument ?name", function(){
		document.getElementById('q').setAttribute('subquery-order', '?name');
		assert.equal(document.getElementById('q').getAttribute('subquery'), 'each');
		// Check that the value we just set is in the test title
		assert(this.test.title.indexOf(document.getElementById('q').getAttribute('subquery-order')) >= 0);
		var result = parse(baseIRI, document);
		var rdoc = result.parser.generateDocument(result.document, dataGraph);
		// modify the subquery-order to sort ascending (default)
		var eBody = rdoc.documentElement.childNodes[3];
		assert.equal(eBody.nodeName, 'body');
		var eMain = rdoc.getElementById('main-content');
		assert.equal(eMain.nodeName, 'main');
		var eTr = rdoc.getElementsByTagName('tr');
		assert.equal(eTr.length, 4);
		assert.equal(eTr[0].childNodes[0].firstChild.textContent, 'Name');
		assert.equal(eTr[1].childNodes[1].firstChild.textContent, 'Alice');
		assert.equal(eTr[2].childNodes[1].firstChild.textContent, 'Bob');
		assert.equal(eTr[3].childNodes[1].firstChild.textContent, 'Charlie');
	});
	it("genreateDocument ASC(?name)", function(){
		document.getElementById('q').setAttribute('subquery-order', 'ASC(?name)');
		assert.equal(document.getElementById('q').getAttribute('subquery'), 'each');
		// Check that the value we just set is in the test title
		assert(this.test.title.indexOf(document.getElementById('q').getAttribute('subquery-order')) >= 0);
		var result = parse(baseIRI, document);
		var rdoc = result.parser.generateDocument(result.document, dataGraph);
		// modify the subquery-order to sort ascending (default)
		var eBody = rdoc.documentElement.childNodes[3];
		assert.equal(eBody.nodeName, 'body');
		var eMain = rdoc.getElementById('main-content');
		assert.equal(eMain.nodeName, 'main');
		var eTr = rdoc.getElementsByTagName('tr');
		assert.equal(eTr.length, 4);
		assert.equal(eTr[0].childNodes[0].firstChild.textContent, 'Name');
		assert.equal(eTr[1].childNodes[1].firstChild.textContent, 'Alice');
		assert.equal(eTr[2].childNodes[1].firstChild.textContent, 'Bob');
		assert.equal(eTr[3].childNodes[1].firstChild.textContent, 'Charlie');
	});
	it("genreateDocument DESC(?name)", function(){
		document.getElementById('q').setAttribute('subquery-order', 'DESC(?name)');
		var result = parse(baseIRI, document);
		assert.equal(result.document.getElementById('q').getAttribute('subquery'), 'each');
		// Check that the value we just set is in the test title
		assert(this.test.title.indexOf(document.getElementById('q').getAttribute('subquery-order')) >= 0);
		var rdoc = result.parser.generateDocument(result.document, dataGraph);
		// modify the subquery-order to sort descending (z->a)
		var eBody = rdoc.documentElement.childNodes[3];
		assert.equal(eBody.nodeName, 'body');
		var eMain = rdoc.getElementById('main-content');
		assert.equal(eMain.nodeName, 'main');
		var eTr = rdoc.getElementsByTagName('tr');
		assert.equal(eTr.length, 4);
		assert.equal(eTr[0].childNodes[0].firstChild.textContent, 'Name');
		assert.equal(eTr[1].childNodes[1].firstChild.textContent, 'Charlie');
		assert.equal(eTr[2].childNodes[1].firstChild.textContent, 'Bob');
		assert.equal(eTr[3].childNodes[1].firstChild.textContent, 'Alice');
	});
});
