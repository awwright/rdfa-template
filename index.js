
var rdf = require('rdf');
var TriplePattern = rdf.TriplePattern;
var rdfa = require('rdfa');

exports.parse = parse;
function parse(base, document, options){
	var self = this;
	if(typeof base!=='string') throw new Error('Expected `base` to be a string');
	if(typeof document!=='object') throw new Error('Unexpected argument');
	if(typeof options==='object'){
	}
	var parser = new RDFaTemplateParser(base, document.documentElement);
	var node = document;

	if(typeof options==='object'){
		if(options.rdfenv) parser.rdfenv = options.rdfenv;
	}

	parser.walkDocument(document);
	
	return {
		document: document,
		parser: parser,
		outputQuery: parser.outputQuery,
		outputGraph: parser.outputGraph,
		outputPattern: parser.outputPattern,
		processorGraph: parser.processorGraph,
	};
}

rdfa.inherits(RDFaTemplateContext, rdfa.RDFaContext);
function RDFaTemplateContext(){
	rdfa.RDFaContext.apply(this, arguments);
}

RDFaTemplateContext.prototype.resolveReference = function resolveReference(iriref){
	if(this.base.termType=='Variable'){
		if(iriref=='') return this.base;
		else if(iriref.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)) return iriref;
		else throw new Error('Cannot resolve reference against variable base for '+JSON.stringify(iriref));
	}
	return rdfa.RDFaContext.prototype.resolveReference.apply(this, arguments);
}

RDFaTemplateContext.prototype.child = function child(node){
	var ctx = rdfa.RDFaContext.prototype.child.apply(this, arguments);
	if(node.getAttribute && node.getAttribute('subquery')==='optional'){
		ctx.outputPattern = new Query(this.outputPattern);
		ctx.outputPattern.optional = true;
		this.outputPattern.queries.push(ctx.outputPattern);
	}else if(node.getAttribute && node.getAttribute('subquery')==='each'){
		ctx.outputPattern = new Query(this.outputPattern);
		ctx.outputPattern.each = true;
		this.outputPattern.queries.push(ctx.outputPattern);
	}else{
		ctx.outputPattern = this.outputPattern;
	}
	return ctx;
}

RDFaTemplateContext.prototype.fromSafeCURIEorCURIEorIRI = function fromSafeCURIEorCURIEorIRI(str){
	if(str.charAt(0)=='{' && str.charAt(1)=='?' && str.charAt(str.length-1)=='}'){
		return new rdf.Variable(str.substring(2, str.length-1));
	}
	return rdfa.RDFaContext.prototype.fromSafeCURIEorCURIEorIRI.apply(this, arguments);
}

RDFaTemplateContext.prototype.fromTERMorCURIEorAbsIRI = function fromTERMorCURIEorAbsIRI(str){
	if(str.charAt(0)=='{' && str.charAt(1)=='?' && str.charAt(str.length-1)=='}'){
		return new rdf.Variable(str.substring(2, str.length-1));
	}
	return rdfa.RDFaContext.prototype.fromTERMorCURIEorAbsIRI.apply(this, arguments);
}

rdfa.inherits(RDFaTemplateParser, rdfa.RDFaParser);
function RDFaTemplateParser(){
	rdfa.RDFaParser.apply(this, arguments);
	this.outputPattern = new Query;
	this.outputPattern.root = true;
	this.emitUsesVocabulary = false;
}

RDFaTemplateParser.prototype.RDFaContext = RDFaTemplateContext;
//RDFaTemplateParser.prototype.rdfenv = {
//	createNamedNode: rdf.environment.createNamedNode.bind(rdf.environment),
//	createBlankNode: rdf.environment.createBlankNode.bind(rdf.environment),
//	createLiteral: rdf.environment.createLiteral.bind(rdf.environment),
//};

RDFaTemplateParser.prototype.initialize = function initialize(){
	rdfa.RDFaParser.prototype.initialize.apply(this, arguments);
	this.stack[0].outputPattern = this.outputPattern;
	this.stack[0].base = new rdf.Variable('?base');
}

RDFaTemplateParser.prototype.emit = function emit(s, p, o){
	var ctx = this.stack[this.stack.length-1];
	if(o.termType=='Literal' && o.value[0]=='{' && o.value[o.value.length-1]=='}'){
		var value = o.value;
		o = new rdf.Variable(value.substring(1, value.length-1));
	}
	ctx.outputPattern.add(new rdf.TriplePattern(s, p, o));
}

module.exports.Query = Query;
function Query(parent, sort, limit, offset){
	this.parent = parent;
	this.statements = [];
	this.queries = [];
	this.optional = false;
	this.sort = [];
	this.limit = limit;
	this.offset = offset;
}
Query.prototype.add = function add(v){
	//if(!(v instanceof rdf.TriplePattern)) throw new Error('Expected arguments[0] `pattern` to be an instance of TriplePattern');
	this.statements.push(v);
}
Query.prototype.toString = function toString(){
	var str = '';
	for(var padding='', e=this; e.parent; e=e.parent) padding+='\t';
	
	str += this.statements.map(function(v){ return padding + "\t" + v.toString() + '\n'; }).join('');
	str += this.queries.map(function(v){ return padding + "\t" + v.toString() + '\n'; }).join('');

	if(this.root){
		str = 'SELECT * {\n' + str + padding + '}\n';
	}else if(this.optional){
		str = 'OPTIONAL {\n' + str + padding + '}\n';
	}else if(this.each){
		str = '{ # Loop\n' + str + padding + '}\n';
	}
	return str;
}
Query.prototype.toArray = function toArray(){
	return this.constraints;
}
Query.prototype.toTriplesString = function toSPARQLString(){
	var str = '';
	this.constraints.map(function(v){
		return v.toTripleString();
	}).join('');
}
