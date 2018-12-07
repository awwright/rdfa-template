
var rdf = require('rdf');
var TriplePattern = rdf.TriplePattern;
var rdfa = require('rdfa');
var evaluateQuery = require('./lib/query.js').evaluateQuery;

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
		ctx.outputPattern.id = this.parser.outputResultSets.length;
		this.parser.outputResultSets.push(ctx.outputPattern);
		ctx.outputPattern.optional = true;
		this.outputPattern.queries.push(ctx.outputPattern);
	}else if(node.getAttribute && node.getAttribute('subquery')==='each'){
		if(node.hasAttribute('subquery-order')){
			var order = node.getAttribute('subquery-order').split(/\s+/g).map(function(v){
				return {expression: v};
			});
		}
		ctx.outputPattern = new Query(this.outputPattern, order);
		ctx.outputPattern.id = this.parser.outputResultSets.length;
		this.parser.outputResultSets.push(ctx.outputPattern);
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
	this.outputResultSets = [];
	this.nodeContextMap = new Map;
	this.outputPattern = new Query;
	this.outputPattern.id = this.outputResultSets.length;
	this.outputResultSets.push(this.outputPattern);
	this.outputPattern.root = true;
	this.emitUsesVocabulary = false;
}

RDFaTemplateParser.prototype.RDFaContext = RDFaTemplateContext;
//RDFaTemplateParser.prototype.rdfenv = {
//	createNamedNode: rdf.environment.createNamedNode.bind(rdf.environment),
//	createBlankNode: rdf.environment.createBlankNode.bind(rdf.environment),
//	createLiteral: rdf.environment.createLiteral.bind(rdf.environment),
//};

//RDFaTemplateParser.prototype.processElement = function processElement(node){
//	rdfa.RDFaParser.prototype.processElement.apply(this, arguments);
//	var rdfaContext = this.stack[this.stack.length-1];
//	this.nodeContextMap.set(node, rdfaContext);
//}

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

RDFaTemplateParser.prototype.generateDocument = function generateDocument(template, dataGraph, initialBindings){
	var output = template.cloneNode(true);
	output.rdfaTemplateBindings = initialBindings || {};
	var node = output;
	// Loop through every node and ID the subqueries
	var subqueryId = 0;
	node.subqueryId = subqueryId++;
	while(node){
		if(node.getAttribute && node.getAttribute('subquery')==='each'){
			node.subqueryId = subqueryId++;
		}
		// Recurse into children
		if(node.firstChild){
			node = node.firstChild;
		}else{
			while(node && !node.nextSibling) node = node.parentNode;
			if(node) node = node.nextSibling;
		}
	}
	// Now process the template
	var node = output;
	while(node){
		if(node.getAttribute && node.getAttribute('subquery')==='each'){
			// Make a copy of this node for every match in the result set
			// Next iteration of the loop should skip over this entire subquery/template and go right to the next sibling/cloned node (if any)
			var parentNode = node.parentNode;
			if(node.firstChild){
				defaultNext = node.firstChild;
			}else{
				while(node && !node.nextSibling) defaultNext = node.parentNode;
				if(node) defaultNext = node.nextSibling;
			}
			// Get the result set
			var itemTemplate = node;
			var nextSibling = itemTemplate.nextSibling;
			var query = this.outputResultSets[itemTemplate.subqueryId];
			var resultset = query.evaluate(dataGraph);
			resultset.forEach(function(record, i){
				var newItem = itemTemplate.cloneNode(true);
				newItem.rdfaTemplateBindings = record;
				newItem.rdfaTemplateElement = itemTemplate;
				newItem.removeAttribute('subquery');
				newItem.removeAttribute('subquery-order');
				newItem.setAttribute('subquery-i', i.toString());
				parentNode.insertBefore(newItem, nextSibling);
			});
			while(node && !node.nextSibling) node = node.parentNode;
			if(node) node = node.nextSibling;
			itemTemplate.parentNode.removeChild(itemTemplate);
		}else{
			for(var bindingsNode=node; bindingsNode && !bindingsNode.rdfaTemplateBindings; bindingsNode=bindingsNode.parentNode);
			if(!node) throw new Error('no node?');
			if(!bindingsNode) throw new Error('no bindingsNode?');
			if(node.getAttribute && node.hasAttribute('typeof')){
				var typeofAttr = node.getAttribute('typeof');
				if(typeofAttr[0]=='{' && typeofAttr[1]=='?' && typeofAttr[typeofAttr.length-1]=='}'){
					var varname = typeofAttr.substring(2, typeofAttr.length-1);
					node.setAttribute('typeof', bindingsNode.rdfaTemplateBindings[varname].toString());
				}
			}
			var textContent = node.textContent;
			if(textContent && textContent[0]=='{' && textContent[1]=='?' && textContent[textContent.length-1]=='}'){
				var varname = textContent.substring(2, textContent.length-1);
				if(bindingsNode.rdfaTemplateBindings[textContent.substring(2, textContent.length-1)]===undefined){
					throw new Error('No result for '+JSON.stringify(textContent));
				}
				node.textContent = bindingsNode.rdfaTemplateBindings[textContent.substring(2, textContent.length-1)].toString();
			}
			// Recurse into children
			if(node.firstChild){
				node = node.firstChild;
			}else{
				while(node && !node.nextSibling) node = node.parentNode;
				if(node) node = node.nextSibling;
			}
		}
	}
	return output;
}

module.exports.Query = Query;
function Query(parent, order, limit, offset){
	this.parent = parent;
	this.statements = [];
	this.queries = [];
	this.optional = false;
	if(order===undefined || order===null) order = [];
	else if(Array.isArray(order)) order.forEach(function(v, i){ if(typeof v!=='object') throw new Error('Expected `order` to be an array of objects'); });
	else throw new Error('Expected arguments[1] order to be an Array');
	this.order = order;
	this.limit = limit;
	this.offset = offset;
}
Query.prototype.add = function add(v){
	//if(!(v instanceof rdf.TriplePattern)) throw new Error('Expected arguments[0] `pattern` to be an instance of TriplePattern');
	this.statements.push(v);
}
Query.prototype.toStringAll = function toStringAll(){
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
Query.prototype.toString = function toString(){
	var str = '';
	for(var q = this; q; q = q.parent){
		str += '# Block '+q.id+'\n';
		str += this.statements.map(function(v){ return "\t" + v.toString() + '\n'; }).join('');
	}
	return 'SELECT * {\n' + str + '}\n';
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
Query.prototype.evaluate = function evaluate(dataGraph){
	return evaluateQuery(dataGraph, this);
}
