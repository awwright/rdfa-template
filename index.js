
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
	var parser = new RDFaTemplateParser(base, document);

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
	if(iriref.termType==='Variable'){
		return iriref;
	}
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
		ctx.outputPattern = new Query(node, this.outputPattern);
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
		ctx.outputPattern = new Query(node, this.outputPattern, order);
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
function RDFaTemplateParser(base, document){
	rdfa.RDFaParser.apply(this, arguments);
	this.template = document;
	this.outputResultSets = [];
	this.nodeContextMap = new Map;
	this.outputPattern = new Query(document, null);
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
	//this.stack[0].base = new rdf.Variable('?base');
	//this.stack[0].base = new rdf.NamedNode('http://example.com/');
}

RDFaTemplateParser.prototype.getRel = function getRel(node){
	if(node.hasAttribute('rel-bind')) return node.getAttribute('rel-bind');
	return node.hasAttribute('rel') ? node.getAttribute('rel') : null;
};
RDFaTemplateParser.prototype.getRev = function getRev(node){
	if(node.hasAttribute('rev-bind')) return node.getAttribute('rev-bind');
	return node.hasAttribute('rev') ? node.getAttribute('rev') : null;
};
RDFaTemplateParser.prototype.getTypeof = function getTypeof(node){
	if(node.hasAttribute('typeof-bind')) return node.getAttribute('typeof-bind');
	return node.hasAttribute('typeof') ? node.getAttribute('typeof') : null;
};
RDFaTemplateParser.prototype.getProperty = function getProperty(node){
	if(node.hasAttribute('property-bind')) return node.getAttribute('property-bind');
	return node.hasAttribute('property') ? node.getAttribute('property') : null;
};
RDFaTemplateParser.prototype.getDatetime = function getDatetime(node){
	if(node.hasAttribute('datetime-bind')) return node.getAttribute('datetime-bind');
	return node.hasAttribute('datetime') ? node.getAttribute('datetime') : null;
};
RDFaTemplateParser.prototype.getContent = function getContent(node){
	if(node.hasAttribute('content-bind')) return node.getAttribute('content-bind');
	return node.hasAttribute('content') ? node.getAttribute('content') : null;
};
RDFaTemplateParser.prototype.getAbout = function getAbout(node){
	if(node.hasAttribute('about-bind')) return node.getAttribute('about-bind');
	return node.hasAttribute('about') ? node.getAttribute('about') : null;
};
RDFaTemplateParser.prototype.getSrc = function getSrc(node){
	if(node.hasAttribute('src-bind')) return node.getAttribute('src-bind');
	return node.hasAttribute('src') ? node.getAttribute('src') : null;
};
RDFaTemplateParser.prototype.getResource = function getResource(node){
	if(node.hasAttribute('resource-bind')) return node.getAttribute('resource-bind');
	return node.hasAttribute('resource') ? node.getAttribute('resource') : null;
};
RDFaTemplateParser.prototype.getHref = function getHref(node){
	if(node.hasAttribute('href-bind')) return node.getAttribute('href-bind');
	return node.hasAttribute('href') ? node.getAttribute('href') : null;
};

RDFaTemplateContext.prototype.isVariable = function isVariable(str){
	return typeof str=='string' && str[0]=='{' && str[1]=='?' && str[str.length-1]=='}';
}
RDFaTemplateContext.prototype.getVariable = function getVariable(str){
	return new rdf.Variable(str.substring(2, str.length-1));
}

RDFaTemplateContext.prototype.getRelNode = function getRelNode(node){
	var attr = this.parser.getRel(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaTemplateContext.prototype.getRevNode = function getRevNode(node){
	var attr = this.parser.getRev(node);
	if(this.isVariable(attr)) return [this.getVariable(attr)];
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaTemplateContext.prototype.getTypeofNode = function getTypeofNode(node){
	var attr = this.parser.getTypeof(node);
	if(this.isVariable(attr)) return [this.getVariable(attr)];
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaTemplateContext.prototype.getPropertyNode = function getPropertyNode(node){
	var attr = this.parser.getProperty(node);
	if(this.isVariable(attr)) return [this.getVariable(attr)];
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaTemplateContext.prototype.getDatatypeNode = function getDatatypeNode(node){
	var attr = this.parser.getDatatype(node);
	if(this.isVariable(attr)) return this.getVariable(attr);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRI(attr);
	return attr;
};
// RDFaTemplateContext.prototype.getContentNode = function getContentNode(node){
// 	var attr = this.parser.getContent(node);
// 	if(typeof attr=='string') return this.from(attr);
// 	return attr;
// };
RDFaTemplateContext.prototype.getAboutNode = function getAboutNode(node){
	var attr = this.parser.getAbout(node);
	if(this.isVariable(attr)) return this.getVariable(attr);
	if(typeof attr=='string') return this.fromSafeCURIEorCURIEorIRI(attr);
	return attr;
};
RDFaTemplateContext.prototype.getSrcNode = function getSrcNode(node){
	var attr = this.parser.getSrc(node);
	if(this.isVariable(attr)) return this.getVariable(attr);
	if(typeof attr=='string') return this.fromIRI(attr);
	return attr;
};
RDFaTemplateContext.prototype.getResourceNode = function getResourceNode(node){
	var attr = this.parser.getResource(node);
	if(this.isVariable(attr)) return this.getVariable(attr);
	if(typeof attr=='string') return this.fromSafeCURIEorCURIEorIRI(attr);
	return attr;
};
RDFaTemplateContext.prototype.getHrefNode = function getHrefNode(node){
	var attr = this.parser.getHref(node);
	if(this.isVariable(attr)) return this.getVariable(attr);
	if(typeof attr=='string') return this.fromIRI(attr);
	return attr;
};


RDFaTemplateParser.prototype.emit = function emit(s, p, o){
	var ctx = this.stack[this.stack.length-1];
	if(o.termType=='Literal' && o.value[0]=='{' && o.value[o.value.length-1]=='}'){
		var value = o.value;
		o = new rdf.Variable(value.substring(1, value.length-1));
	}
	ctx.outputPattern.add(new rdf.TriplePattern(s, p, o));
}

// Execute the first query on the template over the provided dataGraph
// The returned records are suitable for providing to generateDocument for completing the record set
RDFaTemplateParser.prototype.generateInitialList = function generateInitialList(dataGraph, initialBindings){
	var self = this;
	var query = self.outputResultSets[0];
	var resultset = query.evaluate(dataGraph, initialBindings);
	return resultset;
}

RDFaTemplateParser.prototype.generateDocument = function generateDocument(template, dataGraph, initialBindings){
	var self = this;
	var output = template.cloneNode(true);
	initialBindings = initialBindings || {};
	// TODO: verify that initialBindings produces statements in dataGraph
	// Values from generateInitialList will always work if the data has not been modified
	// Values passed by hand might not be in the dataGraph
	var rootQuery = self.outputResultSets[0];
	for(var n in rootQuery.variables){
		if(!initialBindings[n]) throw new Error('Expected variable '+JSON.stringify(n)+' to be bound');
	}
	output.rdfaTemplateBindings = initialBindings;
	var node=template, clone=output;
	// Make a copy of the array but skip the first query;
	// bindings for this top-level query must be provided in initialBindings.
	var outputResultSets = self.outputResultSets.slice(1);
	// Copy query information
	while(node && outputResultSets.length){
		if(node===outputResultSets[0].node){
			clone.rdfaTemplateQuery = outputResultSets.shift();
		}
		if(node.firstChild){
			node=node.firstChild, clone=clone.firstChild;
		}else{
			while(node && !node.nextSibling) node=node.parentNode, clone=clone.parentNode;
			if(node) node=node.nextSibling, clone=clone.nextSibling;
		}
	}
	// Now process the copy
	var node = output;
	while(node){
		var rdfaContext = self.stack[this.stack.length-1];
		if(node.rdfaTemplateQuery){
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
			var query = node.rdfaTemplateQuery;
			for(var bindingsNode=node; bindingsNode && !bindingsNode.rdfaTemplateBindings; bindingsNode=bindingsNode.parentNode);
			if(!bindingsNode) throw new Error('no bindingsNode?');
			var resultset = query.evaluate(dataGraph, bindingsNode.rdfaTemplateBindings);
			resultset.forEach(function(record, i){
				var newItem = itemTemplate.cloneNode(true);
				newItem.rdfaTemplateQuery = null;
				newItem.rdfaTemplateBindings = record;
				newItem.rdfaTemplateElement = itemTemplate;
				newItem.removeAttribute('subquery');
				newItem.removeAttribute('subquery-order');
				newItem.setAttribute('subquery-i', i.toString());
				parentNode.insertBefore(newItem, nextSibling);
			});
			// Forward to the first inserted item, or otherwise the next element after the template
			while(node && !node.nextSibling) node = node.parentNode;
			if(node) node = node.nextSibling;
			// And then remove the template from the tree
			itemTemplate.parentNode.removeChild(itemTemplate);
		}else{
			for(var bindingsNode=node; bindingsNode && !bindingsNode.rdfaTemplateBindings; bindingsNode=bindingsNode.parentNode);
			if(!node) throw new Error('no node?');
			if(!bindingsNode) throw new Error('no bindingsNode?');
			// attributes that accept content
			[
				'content',
			].forEach(function(attributeName){
				var patternName = attributeName + '-bind';
				if(node.getAttribute && node.hasAttribute(patternName)){
					var attributeValue = node.getAttribute(patternName);
					if(rdfaContext.isVariable(attributeValue)){
						var varname = rdfaContext.getVariable(attributeValue);
						node.setAttribute(attributeName, bindingsNode.rdfaTemplateBindings[varname].toString());
						node.removeAttribute(patternName);
					}
				}
			});
			// attributes relative to the document base
			[
				'href',
				'src',
			].forEach(function(attributeName){
				var patternName = attributeName + '-bind';
				if(node.getAttribute && node.hasAttribute(patternName)){
					var attributeValue = node.getAttribute(patternName);
					if(rdfaContext.isVariable(attributeValue)){
						var varname = rdfaContext.getVariable(attributeValue);
						// TODO turn target into a relative URI Reference if possible
						var target = bindingsNode.rdfaTemplateBindings[varname].toString();
						node.setAttribute(attributeName, target);
						node.removeAttribute(patternName);
					}
				}
			});
			// attributes that support full IRI
			[
				'about',
				'property',
				'rel',
				'resource',
				'rev',
				'typeof',
				'datetime',
				'content',
			].forEach(function(attributeName){
				var patternName = attributeName + '-bind';
				if(node.getAttribute && node.hasAttribute(patternName)){
					var attributeValue = node.getAttribute(patternName);
					if(rdfaContext.isVariable(attributeValue)){
						var varname = rdfaContext.getVariable(attributeValue);
						node.setAttribute(attributeName, bindingsNode.rdfaTemplateBindings[varname].toString());
						node.removeAttribute(patternName);
					}
				}
			});
			var textContent = node.firstChild && node.firstChild.data;
			if(rdfaContext.isVariable(textContent)){
				var varname = rdfaContext.getVariable(textContent);
				if(bindingsNode.rdfaTemplateBindings[varname]===undefined){
					throw new Error('No result for '+JSON.stringify(textContent));
				}
				node.textContent = bindingsNode.rdfaTemplateBindings[varname].toString();
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
function Query(node, parent, order, limit, offset){
	this.node = node;
	this.parent = parent;
	this.statements = [];
	this.queries = [];
	this.variables = {};
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
	if(v.subject.termType=='Variable') this.variables[v.subject] = v.subject;
	if(v.predicate.termType=='Variable') this.variables[v.predicate] = v.predicate;
	if(v.object.termType=='Variable') this.variables[v.object] = v.object;
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
		str += '\t# Block '+q.id+'\n';
		str += q.statements.map(function(v){ return "\t" + v.toString() + '\n'; }).join('');
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
Query.prototype.evaluate = function evaluate(dataGraph, initialBindings){
	return evaluateQuery(dataGraph, this, initialBindings);
}
