

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

describe("0002", function(){
    it("genreateDocument ASC(?name)", function(){
        var result = parse(baseIRI, document);
        var rdoc = result.parser.generateDocument(result.document, dataGraph);
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
});
