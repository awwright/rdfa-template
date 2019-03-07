
var rdfa = require('rdfa');
var rdfat = require('rdfa-template');



var rdf = require('rdf');
var parse = require('rdfa-template').parse;

var baseIRI = 'http://example.com/test';

document.addEventListener("DOMContentLoaded", onLoad);

function onLoad(){
    baseIRI = document.location.toString();
    document.getElementById('turtle-document').addEventListener('change', function(){
        processGraph();
    });
    document.getElementById('do-render-content').addEventListener('click', function(){
        processGraph();
    });
    processGraph();
}

function processGraph(){
    var dataContents = document.getElementById('turtle-document').value;
    var dataParse = rdf.TurtleParser.parse(dataContents, baseIRI);
    var dataGraph = dataParse.graph;
    // var templateRoot = document.getElementById('main-content');
    var templateRoot = document.cloneNode(true);
    [
        templateRoot.getElementById('data'),
        templateRoot.getElementById('render-content'),
    ].forEach(function(e){
        e.parentNode.removeChild(e);
    });
    var renderRoot = document.getElementById('render-content');
    var generator = parse(baseIRI, templateRoot);
    var rdoc = generator.fillSingle(dataGraph);
    while(renderRoot.firstChild) renderRoot.removeChild(renderRoot.firstChild);
    renderRoot.appendChild(rdoc.getElementById('main-content'));
}
