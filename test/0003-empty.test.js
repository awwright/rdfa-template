

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

var dataGraph = new rdf.Graph();

describe("0003", function(){
    it("genreateDocument: no results on empty input", function(){
        var generator = parse(baseIRI, document);
        var rdoc = generator.fillSingle(dataGraph);
        var eBody = rdoc.documentElement.childNodes[3];
        assert.equal(eBody.nodeName, 'body');
        var eMain = rdoc.getElementById('main-content');
        assert.equal(eMain.nodeName, 'main');
        var eTr = rdoc.getElementsByTagName('tr');
        assert.equal(eTr.length, 1);
        assert.equal(eTr[0].childNodes[0].firstChild.textContent, 'Name');
    });
});
