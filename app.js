(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RDF = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/**
 * RDF
 *
 * Implement a mash-up of the RDF Interfaces API, the RDF API, and first and foremost whatever makes sense for Node.js
 */

var api = exports;

api.RDFNode = require('./lib/RDFNode.js').RDFNode;
api.Term = api.RDFNode;
api.NamedNode = require('./lib/RDFNode.js').NamedNode;
api.BlankNode = require('./lib/RDFNode.js').BlankNode;
api.Literal = require('./lib/RDFNode.js').Literal;
api.Variable = require('./lib/RDFNode.js').Variable;

api.Profile = require('./lib/Profile.js').Profile;
api.TermMap = require('./lib/Profile.js').TermMap;
api.PrefixMap = require('./lib/Profile.js').PrefixMap;
api.RDFEnvironment = require('./lib/RDFEnvironment.js').RDFEnvironment;
api.BlankNodeMap = require('./lib/BlankNodeMap.js').BlankNodeMap;

api.TurtleParser = require('./lib/TurtleParser.js').Turtle;

api.Graph = require('./lib/Graph.js').Graph;
api.Triple = require('./lib/RDFNode.js').Triple;
api.TriplePattern = require('./lib/RDFNode.js').TriplePattern;
api.ResultSet = require("./lib/ResultSet.js").ResultSet;

api.DefaultGraph = require('./lib/RDFNode.js').DefaultGraph;
api.Dataset = require('./lib/Dataset.js').Dataset;
api.Quad = require('./lib/RDFNode.js').Quad;

// DataFactory support
api.factory = require('./lib/DataFactory.js');
// api.namedNode = require('./lib/DataFactory.js').namedNode;
// api.blankNode = require('./lib/DataFactory.js').blankNode;
// api.literal = require('./lib/DataFactory.js').literal;
// api.variable = require('./lib/DataFactory.js').variable;
// api.defaultGraph = require('./lib/DataFactory.js').defaultGraph;
// api.triple = require('./lib/DataFactory.js').triple;
// api.quad = require('./lib/DataFactory.js').quad;

api.environment = require('./lib/environment').environment;
api.setBuiltins = require('./lib/Builtins').setBuiltins;
api.unsetBuiltins = require('./lib/Builtins').unsetBuiltins;
api.builtins = require('./lib/Builtins');
api.parse = function(o, id){
	return api.builtins.ref.call(o, id);
};

api.ns = require('./lib/ns.js').ns;
api.rdfns = require('./lib/ns.js').rdfns;
api.rdfsns = require('./lib/ns.js').rdfsns;
api.xsdns = require('./lib/ns.js').xsdns;

},{"./lib/BlankNodeMap.js":2,"./lib/Builtins":3,"./lib/DataFactory.js":4,"./lib/Dataset.js":5,"./lib/Graph.js":6,"./lib/Profile.js":9,"./lib/RDFEnvironment.js":10,"./lib/RDFNode.js":11,"./lib/ResultSet.js":12,"./lib/TurtleParser.js":13,"./lib/environment":15,"./lib/ns.js":16}],2:[function(require,module,exports){

"use strict";

var BlankNode = require('./RDFNode.js').BlankNode;
var Triple = require('./RDFNode.js').Triple;
var Quad = require('./RDFNode.js').Quad;

// Declare or generate a mapping of Variables or BlankNodes to BlankNodes, Terms, or Literals

module.exports.BlankNodeMap = BlankNodeMap;
function BlankNodeMap(){
	if(!(this instanceof BlankNodeMap)) return new BlankNodeMap();
	this.mapping = {};
	this.start = 0;
	this.labelPrefix = 'bn';
}

BlankNodeMap.prototype.get = function get(bnode){
	return this.mapping[bnode];
}

BlankNodeMap.prototype.process = function process(bnode){
	if(bnode instanceof Triple){
		return new Triple(this.process(bnode.subject), bnode.predicate, this.process(bnode.object));
	}
	if(bnode instanceof Quad){
		return new Quad(this.process(bnode.subject), bnode.predicate, this.process(bnode.object), bnode.graph);
	}
	if(typeof bnode=='string' && bnode.substring(0,2)!=='_:'){
		bnode = '_:' + bnode;
	}
	if(this.mapping[bnode]) return this.mapping[bnode];
	if(this.labelPrefix) this.mapping[bnode] = new BlankNode(this.labelPrefix+this.start);
	else this.mapping[bnode] = new BlankNode(bnode.toString());
	this.start++;
	return this.mapping[bnode];
}

BlankNodeMap.prototype.equals = function equals(bnode, target){
	if(this.mapping[bnode]) return this.mapping[bnode]===target;
	this.mapping[bnode] = target;
	return true;
}

},{"./RDFNode.js":11}],3:[function(require,module,exports){
"use strict";

var RDFNodeEquals = require('./RDFNode.js').RDFNodeEquals;
var RDFNode = require('./RDFNode.js').RDFNode;
var NamedNode = require('./RDFNode.js').NamedNode;
var BlankNode = require('./RDFNode.js').BlankNode;
var defaults = require('./prefixes.js');
var encodeString = require('./encodeString.js');
var env = require('./environment.js').environment;

var rdfnil = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
var rdffirst = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
var rdfrest = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');
var rdftype = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
function xsdns(v){ return 'http://www.w3.org/2001/XMLSchema#'+v; }

function _(v) { return { writable:false, configurable:true, enumerable:false, value:v } }
function _getter(v) { return { configurable:true, enumerable:false, get:v } }
// Expands a Turtle/N3 keyword to an IRI
// p: property name
// profile: profile to use resolving prefixes
function expandprop(name, profile) {
	if(name instanceof RDFNode) return name;
	if(name == 'a') return rdftype;
	name = name.replace('$',':');
	var expanded = profile.resolve(name) || name;
	return new NamedNode(expanded);
};
function shrinkprop(ref, profile) {
	//if(rdftype.equals(ref)) return "a";
	return createNodeFrom(ref).toTurtle(profile);
};
function expandnode(p, profile) {
	if(p instanceof RDFNode){
		return p;
	}else if(p.substring(0,2)=='_:'){
		return new BlankNode(p);
	}else{
		return new NamedNode(profile.resolve(p) || p);
	}
};
function shrinknode(ref, profile) {
	return createNodeFrom(ref).toTurtle(profile);
};
function pad(v,l){
	return ('0000'+v).substr(-(l||2));
}
function n3(value, profile){
	if(typeof value.n3=='function') return value.n3(profile);
	if(typeof value=='string') return exports.String.n3.call(value, profile);
	if(typeof value=='number') return exports.Number.n3.call(value, profile);
	if(typeof value=='boolean') return exports.Boolean.n3.call(value, profile);
	if(value instanceof Date) return exports.Date.n3.call(value, profile);
	throw new TypeError('Cannot create n3 from '+Object.toString.call(value, profile));
}
function createNodeFrom(value){
	if(value instanceof BlankNode) return value;
	if(value instanceof NamedNode) return value;
	if(typeof value!='string') throw new TypeError('Expected string got '+JSON.stringify(value));
	if(value.substring(0,2)=='_:') return new BlankNode(value);
	else return new NamedNode(value);
}

// JS3/JSON-LD decoding
//function graphify(o, base, parentProfile){
//	if(!o.id) var o=o.ref();
//	return o.graphify(parentProfile);
//}

exports.StructuredGraph = {};
exports.StructuredGraph.graphify = function graphifyObject(aliasmap){
	var o = this;
	var graph = env.createGraph();
	var profile = this.getProfile(aliasmap);
	//var idNode = o.id;
	var idNode = this.isNamed ? this.id : (this['$id'] || this['@id'] || this.id);
	function graphify_property(s1,p1,o1) {
		if(typeof s1=='string') var s1n = createNodeFrom(s1);
		else if(s1 instanceof NamedNode) var s1n = s1;
		else if(s1 instanceof BlankNode) var s1n = s1;
		else throw new Error('Expected string/NamedNode/BlankNode subject');
		if(p1[0]=='@' || p1[0]=='$') return;
		if(typeof(o1)=='function' || typeof(o1)=='undefined') return;
		graphify_value(s1n, expandprop(p1,profile), o1);
	}
	function graphify_value(s1n,p1n,o1) {
		if(Array.isArray(o1) || o1['$list'] || o1['@list'] || o1['$set'] || o1['@set']) {
			if(o1['$list'] || o1['@list']){
				var arr = o1['$list'] || o1['@list'];
				var list = true;
			}else if(o1['$set'] || o1['@set']){
				var arr = o1['$set'] || o1['@set'];
				var list = false;
			}else{
				var arr = o1;
				var list = false;
			}
			// o1 is a Collection or a multi-valued property
			if(!list) {
				// o1 is a multi-valued property
				arr.forEach( function(item) { graphify_value(s1n, p1n, item); });
			} else {
				// o1 is an rdf:Collection
				if(o1.length == 0) {
					graph.add( env.createTriple(s1n, p1n, rdfnil ) );
				} else {
					var bnode = env.createBlankNode();
					graph.add( env.createTriple(s1n, p1n, bnode) );
					arr.forEach(function(item,x) {
						graphify_property(bnode, rdffirst, item);
						var n = env.createBlankNode();
						graph.add( env.createTriple(bnode, rdfrest, (x==arr.length-1) ? rdfnil : n ) );
						bnode = n;
					});
				}
			}
		}else  if(o1 instanceof RDFNode){
			graph.add( env.createTriple(s1n, p1n, o1 ) );
		}else if(o1 instanceof Date){
			var literal = exports.Date.toRDFNode.call(o1);
			graph.add( env.createTriple(s1n, p1n, literal ) );
		}else if(typeof o1=='object' && !o1.id) {
			var id = o1.id || o1['$id'] || o1['@id'];
			if(typeof o1=='object' && !o1.nodeType){
				// If the Object doesn't have a bnode, give it one
				o1 = ref.call(o1);
				id = id || o1.id;
			}
			// o1 is an Object, add triple and child triples
			graph.add( env.createTriple(s1n, p1n, createNodeFrom(id) ) );
			graph.addAll( o1.graphify(profile) );
		} else if(typeof o1=='string') {
			// o1 is a string (convert to NamedNode) or RDFNode (NamedNode, BlankNode, or Literal)
			graph.add( env.createTriple(s1n, p1n, expandnode(o1,profile) ) );
		} else if(typeof o1=='number') {
			graph.add( env.createTriple(s1n, p1n, exports.Number.toRDFNode.call(o1) ) );
		} else if(typeof o1=='boolean') {
			graph.add( env.createTriple(s1n, p1n, exports.Boolean.toRDFNode.call(o1) ) );
		} else {
			throw new Error('Unknown type '+(typeof o1));
		}
	}
	//if(typeof(id)=="object") throw new Error("Not an object: "+require('util').inspect(this));
	Object.keys(o).forEach(function(p) { graphify_property(idNode, p, o[p]) });
	return graph;
}

exports.StructuredGraph.n3 = function toN3(aliasmap, padding) {
	padding = padding||'\n\t';
	var outs = [];
	var o = this;
	// Determine the prefix/term profile this object is using
	var profile = exports.StructuredGraph.getProfile.call(o, aliasmap);
	var idNode = this.isNamed ? this.id : (this['$id'] || this['@id'] || this.id);
	// Go through each key and produce a predicate-object line
	Object.keys(this).forEach(toN3_property);
	function toN3_property(p) {
		// Ignore things beginning with @, they're keywords to be interperted
		if(p[0]=='$' || p[0]=='@' || (o.list&&p=='list')) return;
		var val = o[p];
		// val can be anything:
		// undefined, null, string, number, boolean, function, or object (Array, RDFNode, Date, or plain object)
		// Ignore functions, they're from the prototype probably
		if(typeof val == 'function') return;
		if(val === undefined) return;
		if(val === null) return;
		// Determine the name to output. Generate a PrefixedName if possible, otherwise output an IRIREF
		var predicateIRI = expandprop(p, profile);
		var predicateString = shrinkprop(predicateIRI, profile);
		outs.push( predicateString + ' ' + toN3_value(val) );
	}
	function toN3_value(val){
		if(typeof val=='string'){
			// If the value is an IRI, or an object without an IRI, recurse
			return shrinknode(expandnode(val, profile), profile);
		}else if(typeof val=='number' || typeof val=='boolean' || val instanceof Date){
			// If the value is an IRI, or an object without an IRI, recurse
			return n3(val, profile);
		}else if(val && typeof val.nodeType=='function' && val.nodeType() == 'IRI'){
			// If the value is a NamedNode instance, use that
			return shrinknode(val.toString(), profile);
		}else if(val && typeof val.id=='string'){
			// If the value is an object with an "id" property, use that as the object
			// Then don't forget to serialize the object out.
			var objectIRI = expandnode(val.id, profile);
			var objectName = shrinknode(objectIRI);
			return objectName;
		}
		if(val && val.nodeType && val.nodeType == 'IRI'){
			return val.n3(profile);
		}else if(Array.isArray(val)){
			return val.map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(', ');
		}else if(typeof val=='object' && val['@list'] && Array.isArray(val['@list'])){
			return '( ' + val['@list'].map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(' ') + ' )';
		}else if(typeof val=='object' && val['@set'] && Array.isArray(val['@set'])){
			return val['@set'].map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(', ');
		}else{
			// Encode a Literal, or recursively encode the object and the statements in it.
			var valref = (typeof val.n3=='function') ? val : ref.call(val) ;
			return valref.n3(profile, padding+'\t');
		}
	}
	if(this.isNamed){
		if(outs.length > 1) return shrinknode(idNode,profile) + padding + outs.join(";"+padding) + ' .';
		if(outs.length == 1) return shrinknode(idNode,profile) + ' ' + outs.join(";"+padding) + ' .';
		else return '';
	}else{
		return '[' + padding + outs.join(';'+padding+'') + padding + ']';
	}
};
exports.StructuredGraph.getProfile = function(aliasmap) {
	var o = this;
	// Determine the prefix/term profile this object is using
	var profile = env.createProfile();
	//profile.importProfile(env);
	defaults.loadRequiredPrefixMap(profile);
	if(o.aliasmap) profile.importProfile(o.aliasmap, true);
	if(aliasmap){
		profile.importProfile(aliasmap, true);
		if(aliasmap.terms.vocabulary) profile.setDefaultVocabulary(aliasmap.terms.vocabulary);
	}
	var context = o['$context']||o['@context'];
	if(context){
		for(var prefix in context){
			if(prefix[0]=='@' || prefix[0]=='$'){
				var keyword = prefix.substring(1);
				if(keyword=='vocab'){
					profile.setDefaultVocabulary(context[prefix]);
				}
			}else{
				profile.setPrefix(prefix, context[prefix]);
			}
		}
	}
	return profile;
};

exports.ref = ref;
function ref(id) {
	var copy = {};
	for(var n in this) copy[n] = this[n];
	//var copy = Object.create(this);
	Object.defineProperties(copy, {
		'id': _( id ? (env.resolve(id)||id) : env.createBlankNode().toString() ),
		'isNamed': _( !!id ),
		n3: _(exports.StructuredGraph.n3),
		toNT: _( function(a) {
			return this.graphify(a).toArray().join("\n");
		}),
		graphify: _(exports.StructuredGraph.graphify),
		using: _( function() {
			Object.defineProperty(this,'aliasmap',_(Array.prototype.slice.call(arguments)));
			return this;
		}),
		getProfile: _(exports.StructuredGraph.getProfile),
	});
	return copy;
}

// All
exports.Object = {
	equals: RDFNodeEquals,
	ref: ref,
};
exports.ObjectProperties = {
	equals: _(exports.Object.equals),
	ref: _(exports.Object.ref),
};
exports.setObjectProperties = function setObjectProperties(o){
	Object.defineProperties(o, exports.ObjectProperties);
}

// String
exports.String = {
	tl: function(t) {
		return env.createLiteral(this.toString(), null, t);
	},
	l: function(l) {
		return env.createLiteral(this.toString(), l, null);
	},
	resolve: function() {
		return env.resolve(this)||this.toString();
	},
	valueGetter: function(){
		return this.toString();
	},
	nodeType: function() {
		//if(this.type) return 'TypedLiteral';
		//if(this.language || this.indexOf(' ') >= 0 || this.indexOf(':') == -1 ) return 'PlainLiteral';
		if(this.substr(0,2) == '_:') return 'BlankNode';
		return 'IRI';
	},
	termTypeGetter: function() {
		if(this.substr(0,2) == '_:') return 'BlankNode';
		return 'NamedNode';
	},
	n3: function(profile) {
		// FIXME we don't actually use the 'PlainLiteral' or 'TypedLiteral' productions. Either remove them, or re-add detection of them to String#nodeType()
		switch(this.nodeType()) {
			case 'PlainLiteral': return ('"'+encodeString(this)+'"'+(this.language?'@'+this.language:'')).toString();
			case 'IRI':
				var resolved = this.resolve();
				return (resolved == this) ? "<"+encodeString(resolved)+">" : this.toString();
			case 'BlankNode': return this.toString();
			case 'TypedLiteral':
				if(this.type.resolve() == env.resolve("rdf:PlainLiteral")) return '"'+encodeString(this)+'"';
				return '"'+encodeString(this)+'"^^' + (new NamedNode(this.datatype)).n3(profile);
		}
	},
	toNT: function() {
		switch(this.nodeType()) {
			case 'PlainLiteral': return ('"' + encodeString(this) + '"' + ( this.language ? '@' + this.language : '')).toString();
			case 'IRI': return "<" + encodeString(this.resolve()) + ">";
			case 'BlankNode': return this.toString();
			case 'TypedLiteral':
				if(this.type.resolve() == env.resolve("rdf:PlainLiteral")) return '"' + encodeString(this) + '"';
				return '"' + encodeString(this) + '"^^<' + this.datatype + '>';
		}
	},
	toCanonical: function() {
		return this.n3();
	},
	profile: env,
};
exports.StringProperties = {
	tl: _(exports.String.tl),
	l: _(exports.String.l),
	resolve: _(exports.String.resolve),
	value: _getter(exports.String.valueGetter),
	nodeType: _(exports.String.nodeType),
	termType: _getter(exports.String.termTypeGetter),
	n3: _(exports.String.n3),
	toNT: _(exports.String.toNT),
	toCanonical: _(exports.String.toCanonical),
	profile: _(exports.String.profile),
};
exports.setStringProperties = function setStringProperties(o){
	Object.defineProperties(o, exports.StringProperties);
}

// Array
exports.Array = {
	toList: function() {
		this.list = true;
		return this;
	},
	n3: function(a, padding) {
		padding = padding||'\n\t';
		var outs = [];
		this.forEach( function(i) {
			if(typeof i == 'function') return;
			if(i.id && i.id.nodeType() == 'IRI') return outs.push( i.id.n3() );
			if(!i.nodeType) ref.call(i);
			outs.push(i.n3(a, padding+'\t'))
		});
		return this.list ? "("+padding+outs.join(padding)+" )" : outs.join(", ");
	},
};
exports.ArrayProperties = {
	toList: _(exports.Array.toList),
	n3: _(exports.Array.n3),
};

exports.setArrayProperties = function setArrayProperties(o){
	Object.defineProperties(o, exports.ArrayProperties);
}

// Boolean
exports.Boolean = {
	datatype: xsdns("boolean"),
	valueGetter: function(){ return this; },
	nodeType: function() { return "TypedLiteral"; },
	termType: "Literal",
	termTypeGetter: function() { return "Literal"; },
	n3: function() { return this.valueOf(); },
	toNT: function() { return '"' + this.valueOf() + '"' + "^^<" + this.datatype + '>'; },
	toRDFNode: function() { return env.createTypedLiteral(this.valueOf().toString(), xsdns("boolean")); },
	toCanonical: function() { return this.toNT(); },
};
exports.BooleanProperties = {
	datatype: _(exports.Boolean.datatype),
	value: _getter(exports.Boolean.valueGetter),
	nodeType: _(exports.Boolean.nodeType),
	termType: _getter( function() { return "Literal"; } ),
	n3: _(exports.Boolean.n3),
	toNT: _(exports.Boolean.toNT),
	toRDFNode: _(exports.Boolean.toRDFNode),
	toCanonical: _(exports.Boolean.toCanonical),
};
exports.setBooleanProperties = function setBooleanProperties(o){
	Object.defineProperties(o, exports.BooleanProperties);
}

// Date
exports.Date = {
	datatype: xsdns("dateTime"),
	valueGetter: function(){return this; },
	nodeType: function() { return "TypedLiteral"; },
	termTypeGetter: function() { return "Literal"; },
	n3: function(profile) {
		if(!this.getTime()) return '"NaN"^^<' + (new NamedNode(xsdns('double'))).n3(profile) + '>';
		return '"' + this.getUTCFullYear()+'-' + pad(this.getUTCMonth()+1)+'-' + pad(this.getUTCDate())+'T'
		+ pad(this.getUTCHours())+':' + pad(this.getUTCMinutes())+':' + pad(this.getUTCSeconds())+'Z"^^' + (new NamedNode(xsdns('dateTime'))).n3(profile);
	},
	toNT: function() { return this.n3() },
	toRDFNode: function() {
		return env.createTypedLiteral(
			this.getUTCFullYear()+'-' + pad(this.getUTCMonth()+1)+'-' + pad(this.getUTCDate())+'T'
			+ pad(this.getUTCHours())+':' + pad(this.getUTCMinutes())+':' + pad(this.getUTCSeconds())+'Z',
			xsdns("dateTime")
		);
	},
	toCanonical: function() { return this.n3(); },
}
exports.DateProperties = {
	datatype: _(exports.Date.datatype),
	value: _getter(exports.Date.valueGetter),
	nodeType: _(exports.Date.nodeType),
	termType: _getter(exports.Date.termTypeGetter),
	n3: _(exports.Date.n3),
	toNT: _(exports.Date.toNT),
	toRDFNode: _(exports.Date.toRDFNode),
	toCanonical: _(exports.Date.toCanonical),
}
exports.setDateProperties = function setDateProperties(o){
	Object.defineProperties(o, exports.DateProperties);
}

// Number
var INTEGER = new RegExp("^(-|\\+)?[0-9]+$", "");
var DOUBLE = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
var DECIMAL = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");
exports.Number = {
	datatypeGetter: function() {
		if(this == Number.POSITIVE_INFINITY) return xsdns('double');
		if(this == Number.NEGATIVE_INFINITY) return xsdns('double');
		if(isNaN(this)) return xsdns('double');
		var n = this.toString();
		if(INTEGER.test(n)) return xsdns('integer');
		if(DECIMAL.test(n)) return xsdns('decimal');
		if(DOUBLE.test(n)) return xsdns('double');
	},
	valueGetter: function(){
		return this;
	},
	nodeType: function() {
		return "TypedLiteral";
	},
	termTypeGetter: function() {
		return "Literal";
	},
	n3: function() {
		if(this == Number.POSITIVE_INFINITY) return '"INF"^^<' + xsdns('double') + '>';
		if(this == Number.NEGATIVE_INFINITY) return '"-INF"^^<' + xsdns('double') + '>';
		if(isNaN(this)) return '"NaN"^^<' + xsdns('double') + '>';
		return this.toString();
	},
	toNT: function() {
		if(this == Number.POSITIVE_INFINITY) return '"INF"^^<' + xsdns('double') + '>';
		if(this == Number.NEGATIVE_INFINITY) return '"-INF"^^<' + xsdns('double') + '>';
		if(isNaN(this)) return '"NaN"^^<' + xsdns('double') + '>';
		return '"' + this.toString() + '"' + "^^<" + exports.Number.datatypeGetter.call(this) + '>';
	},
	toRDFNode: function() {
		if(this == Number.POSITIVE_INFINITY) return env.createTypedLiteral('INF', xsdns('double'));
		if(this == Number.NEGATIVE_INFINITY) return env.createTypedLiteral('-INF', xsdns('double'));
		if(isNaN(this)) return env.createTypedLiteral('NaN', xsdns('double'));
		return env.createTypedLiteral(this.toString(), exports.Number.datatypeGetter.call(this));
	},
	toCanonical: function() {
		return this.nt();
	},
	toTL: function() {
		return this.nt();
	},
}
exports.NumberProperties = {
	datatype: {
		configurable:true,
		enumerable:false,
		get: exports.Number.datatypeGetter,
	},
	value: 	 _getter(exports.Number.valueGetter),
	nodeType: _( function() { return "TypedLiteral" } ),
	termType: _getter(exports.Number.termTypeGetter),
	n3: _(exports.Number.n3),
	toNT: _(exports.Number.toNT),
	toRDFNode: _(exports.Number.toRDFNode),
	toCanonical: _(exports.Number.toCanonical),
	toTL: _(exports.Number.toTL),
}
exports.setNumberProperties = function setNumberProperties(o){
	Object.defineProperties(o, exports.NumberProperties);
}

// Sometimes the standard API context isn't global, and an Object in one context isn't an Object in another.
// For these cases, you'll need to call these functions by hand.
exports.setBuiltins = function setBuiltins(){
	function setOn(map, target){
		for(var n in map) if(target[n]!==undefined) throw new Error('Builtin already set');
	}

	setOn(exports.ObjectProperties, Object.prototype);
	setOn(exports.StringProperties, String.prototype);
	setOn(exports.ArrayProperties, Array.prototype);
	setOn(exports.BooleanProperties, Boolean.prototype);
	setOn(exports.DateProperties, Date.prototype);
	setOn(exports.NumberProperties, Number.prototype);

	exports.setObjectProperties(Object.prototype);
	exports.setStringProperties(String.prototype);
	exports.setArrayProperties(Array.prototype);
	exports.setBooleanProperties(Boolean.prototype);
	exports.setDateProperties(Date.prototype);
	exports.setNumberProperties(Number.prototype);
}

exports.unsetBuiltins = function unsetBuiltins(){
	function unsetOn(map, target){
		for(var n in map) if(target[n]===undefined) throw new Error('Builtin '+JSON.stringify(n)+' not set');
		for(var n in map){
			Object.defineProperty(target, n, {configurable:true, value:null});
			delete target[n];
		}
	}
	unsetOn(exports.ObjectProperties, Object.prototype);
	unsetOn(exports.StringProperties, String.prototype);
	unsetOn(exports.ArrayProperties, Array.prototype);
	unsetOn(exports.BooleanProperties, Boolean.prototype);
	unsetOn(exports.DateProperties, Date.prototype);
	unsetOn(exports.NumberProperties, Number.prototype);
}

},{"./RDFNode.js":11,"./encodeString.js":14,"./environment.js":15,"./prefixes.js":17}],4:[function(require,module,exports){
// RDF Representation - DataFactory support

"use strict";

var RDFNode = require('./RDFNode.js');
var defaultDefaultGraph = new RDFNode.DefaultGraph();

exports.namedNode = RDFNode.NamedNode;
exports.blankNode = RDFNode.BlankNode;
exports.literal = RDFNode.Literal;
exports.variable = RDFNode.Variable;
exports.defaultGraph = function(){
	return defaultDefaultGraph;
};
exports.triple = RDFNode.Triple;
exports.quad = RDFNode.Quad;

},{"./RDFNode.js":11}],5:[function(require,module,exports){
"use strict";

var RDFNode = require('./RDFNode.js');
var Graph = require('./Graph.js').Graph;

/**
 * Read an RDF Collection and return it as an Array
 */
var rdfnil = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
var rdffirst = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
var rdfrest = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');

function isIndex(i, a, b, c, d, t){
	if(!i[a]) return false;
	if(!i[a][b]) return false;
	if(!i[a][b][c]) return false;
	return i[a][b][c][d] ? i[a][b][c][d].equals(t) : false ;
}

function insertIndex(i, a, b, c, d, t){
	if(!i[a]) i[a] = {};
	if(!i[a][b]) i[a][b] = {};
	if(!i[a][b][c]) i[a][b][c] = {};
	i[a][b][c][d] = t;
}

function deleteIndex(i, a, b, c, d, t){
	if(i[a] && i[a][b] && i[a][b][c] && i[a][b][c][d]){
		if(!i[a][b][c][d].equals(t)) throw new Error('assertion fail: deleted quad mismatch');
		delete(i[a][b][c][d]);
		if(!Object.keys(i[a][b][c]).length) delete(i[a][b][c]);
		if(!Object.keys(i[a][b]).length) delete(i[a][b]);
		if(!Object.keys(i[a]).length) delete(i[a]);
	}
}

exports.Dataset = Dataset;
function Dataset(init){
	this.clear();
	//this._actions = [];
	Object.defineProperty(this, 'size', {get: function(){return self.length;}});
	var self = this;
	if(init && init.forEach){
		init.forEach(function(t){ self.add(t); });
	}
}
Dataset.prototype.length = null;
Dataset.prototype.graph = null;

// TODO remove this? What is this doing?
Dataset.prototype.importArray = function(a) { while( a.length > 0) { this.add(a.pop()) } };

Dataset.prototype.insertIndex = insertIndex;
Dataset.prototype.deleteIndex = deleteIndex;
Dataset.prototype.add = function(quad) {
	if(!(quad instanceof RDFNode.Quad)) throw new TypeError('Expected a Quad for argument[0] `quad`');
	var st=quad.subject.toNT(), pt=quad.predicate.toNT(), ot=quad.object.toNT(), gt=quad.graph.toNT();
	if(isIndex(this.indexSPOG, st, pt, ot, gt, quad)) return;
	insertIndex(this.indexSPOG, st, pt, ot, gt, quad);
	insertIndex(this.indexPOGS, pt, ot, gt, st, quad);
	insertIndex(this.indexOGSP, ot, gt, st, pt, quad);
	insertIndex(this.indexGSPO, gt, st, pt, ot, quad);
	insertIndex(this.indexGPOS, gt, pt, ot, st, quad);
	insertIndex(this.indexOSGP, ot, st, gt, pt, quad);
	this.length++;
	//this.actions.forEach(function(fn){ fn(quad); });
};
Dataset.prototype.addAll = function(g){
	var g2 = this;
	g.forEach(function(s){ g2.add(s); });
};
Dataset.prototype.union = function union(){
	var gx = new Graph;
	this.forEach(function(q){
		gx.add(new RDFNode.Triple(q.subject, q.predicate, q.object));
	});
	return gx;
};
Dataset.prototype.remove = function(quad) {
	var st=quad.subject.toNT(), pt=quad.predicate.toNT(), ot=quad.object.toNT(), gt=quad.graph.toNT();
	if(!isIndex(this.indexSPOG, st, pt, ot, gt, quad)) return;
	deleteIndex(this.indexSPOG, st, pt, ot, gt, quad);
	deleteIndex(this.indexPOGS, pt, ot, gt, st, quad);
	deleteIndex(this.indexOGSP, ot, gt, st, pt, quad);
	deleteIndex(this.indexGSPO, gt, st, pt, ot, quad);
	deleteIndex(this.indexGPOS, gt, pt, ot, st, quad);
	deleteIndex(this.indexOSGP, ot, st, gt, pt, quad);
	this.length--;
}
Dataset.prototype.delete = Dataset.prototype.remove;
Dataset.prototype.has = function(quad) {
	if(!(quad instanceof RDFNode.Quad)) throw new TypeError('Expected a Quad for argument[0] `quad`');
	var st=quad.subject.toNT(), pt=quad.predicate.toNT(), ot=quad.object.toNT(), gt=quad.graph.toNT();
	return isIndex(this.indexSPOG, st, pt, ot, gt, quad);
};
Dataset.prototype.removeMatches = function(s, p, o, g) {
	var self = this;
	this.match(s, p, o, g).forEach(function(t) {
		self.remove(t);
	});
}
Dataset.prototype.deleteMatches = Dataset.prototype.removeMatches;
Dataset.prototype.clear = function(){
	this.indexSPOG = {};
	this.indexPOGS = {};
	this.indexOGSP = {};
	this.indexGSPO = {};
	this.indexGPOS = {};
	this.indexOSGP = {};
	this.length = 0;
}
Dataset.prototype.import = function(s) {
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.add(s.get(i))
	}
};
Dataset.prototype.every = function every(filter) { return this.toArray().every(filter) };
Dataset.prototype.some = function some(filter) { return this.toArray().some(filter) };
Dataset.prototype.forEach = function forEach(callbck) { this.toArray().forEach(callbck) };
Dataset.prototype.toArray = function toArray() {
	var quads = [];
	var data = this.indexSPOG;
	if(!data) return [];
	(function go(data, c){
		if(c) Object.keys(data).forEach(function(t){go(data[t], c-1);});
		else quads.push(data);
	})(data, 4);
	return quads;
};
Dataset.prototype.filter = function filter(cb){
	var result = new Dataset;
	this.forEach(function(quad){
		if(cb(quad)) result.add(quad);
	});
	return result;
};
Dataset.prototype.getCollection = function getCollection(subject){
	var collection=[], seen=[];
	var first, rest=subject;
	while(rest && !rest.equals(rdfnil)){
		var g = this.match(rest, rdffirst, null);
		if(g.length===0) throw new Error('Collection <'+rest+'> is incomplete');
		first = g.toArray().map(function(v){return v.object})[0];
		if(seen.indexOf(rest.toString())!==-1) throw new Error('Collection <'+rest+'> is circular');
		seen.push(rest.toString());
		collection.push(first);
		rest = this.match(rest, rdfrest, null).toArray().map(function(v){return v.object})[0];
	}
	return collection;
};
// FIXME ensure that the RDFNode#equals semantics are met

Dataset.prototype.match = function match(subject, predicate, object, graph){
	// if the String prototype has a nodeType/toNT function, builtins is enabled,
	if(typeof subject=="string" && typeof subject.toNT!='function') subject = new RDFNode.NamedNode(subject);
	if(subject!==null && !RDFNode.RDFNode.is(subject)) throw new Error('match subject is not an RDFNode');
	if(subject!==null && subject.termType!=='NamedNode' && subject.termType!=='BlankNode') throw new Error('match subject must be a NamedNode/BlankNode');
	if(typeof predicate=="string" && typeof predicate.toNT!='function') predicate = new RDFNode.NamedNode(predicate);
	if(predicate!==null && !RDFNode.RDFNode.is(predicate)) throw new Error('match predicate is not an RDFNode');
	if(predicate!==null && predicate.termType!=='NamedNode') throw new Error('match predicate must be a NamedNode');
	if(typeof object=="string" && typeof object.toNT!='function') object = new RDFNode.NamedNode(object);
	if(object!==null && !RDFNode.RDFNode.is(object)) throw new Error('match object is not an RDFNode');
	if(object!==null && object.termType!=='NamedNode' && object.termType!=='BlankNode' && object.termType!=='Literal') throw new Error('match object must be a NamedNode/BlankNode/Literal');
	if(typeof graph=="string" && typeof graph.toNT!='function') graph = new RDFNode.NamedNode(graph);
	if(graph!==null && !RDFNode.RDFNode.is(graph)) throw new Error('match graph is not an RDFNode');
	if(graph!==null && graph.termType!=='NamedNode') throw new Error('match graph must be a NamedNode');
	var result = new Dataset;
	var pattern = {s:subject&&subject.toNT(), p:predicate&&predicate.toNT(), o:object&&object.toNT(), g:graph&&graph.toNT()};
	var patternIndexMap = [
		{index:this.indexSPOG, constants:["s", "p", "o", "g"], variables:[]},
		{index:this.indexSPOG, constants:["s", "p", "o"], variables:["g"]},
		{index:this.indexGSPO, constants:["s", "p", "g"], variables:["o"]},
		{index:this.indexSPOG, constants:["s", "p"], variables:["o", "g"]},
		{index:this.indexOSGP, constants:["s", "o", "g"], variables:["p"]},
		{index:this.indexOSGP, constants:["s", "o"], variables:["p", "g"]},
		{index:this.indexGSPO, constants:["s", "g"], variables:["p", "o"]},
		{index:this.indexSPOG, constants:["s"], variables:["p", "o", "g"]},
		{index:this.indexPOGS, constants:["p", "o", "g"], variables:["s"]},
		{index:this.indexPOGS, constants:["p", "o"], variables:["s", "g"]},
		{index:this.indexGPOS, constants:["p", "g"], variables:["s", "o"]},
		{index:this.indexPOGS, constants:["p"], variables:["s", "o", "g"]},
		{index:this.indexOGSP, constants:["o", "g"], variables:["s", "p"]},
		{index:this.indexOGSP, constants:["o"], variables:["s", "p", "g"]},
		{index:this.indexGSPO, constants:["g"], variables:["s", "p", "o"]},
		{index:this.indexSPOG, constants:[], variables:["s", "p", "o", "g"]},
	];
	var patternType = 0;
	if(!pattern.s) patternType |= 8;
	if(!pattern.p) patternType |= 4;
	if(!pattern.o) patternType |= 2;
	if(!pattern.g) patternType |= 1;
	var index = patternIndexMap[patternType];
	var data = index.index;
	index.constants.forEach(function(v){if(data) data=data[pattern[v]];});
	if(!data) return result;
	(function go(data, c){
		if(c) return void Object.keys(data).forEach(function(t){go(data[t], c-1);});
		if(subject && !data.subject.equals(subject)) throw new Error('assertion fail: subject');
		if(predicate && !data.predicate.equals(predicate)) throw new Error('assertion fail: predicate');
		if(object && !data.object.equals(object)) throw new Error('assertion fail: object');
		if(graph && !data.graph.equals(graph)) throw new Error('assertion fail: graph');
		result.add(data);
	})(data, index.variables.length);
	return result;
};

// Gets a reference to a particular subject
// Graph.prototype.reference = function reference(subject){
// 	return new ResultSet.ResultSet(this, subject);
// };

},{"./Graph.js":6,"./RDFNode.js":11}],6:[function(require,module,exports){
"use strict";

var RDFNode = require('./RDFNode.js');
var ResultSet = require('./ResultSet.js');

/**
 * The very fastest graph for heavy read operations, but uses three indexes
 * Graph (fast, triple indexed) implements DataStore

[NoInterfaceObject]
interface Graph {
    readonly attribute unsigned long          length;
    Graph            add (in Triple triple);
    Graph            remove (in Triple triple);
    Graph            removeMatches (in any? subject, in any? predicate, in any? object);
    sequence<Triple> toArray ();
    boolean          some (in TripleFilter callback);
    boolean          every (in TripleFilter callback);
    Graph            filter (in TripleFilter filter);
    void             forEach (in TripleCallback callback);
    Graph            match (in any? subject, in any? predicate, in any? object, in optional unsigned long limit);
    Graph            merge (in Graph graph);
    Graph            addAll (in Graph graph);
    readonly attribute sequence<TripleAction> actions;
    Graph            addAction (in TripleAction action, in optional boolean run);
};

*/

/**
 * Read an RDF Collection and return it as an Array
 */
var rdfnil = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
var rdffirst = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
var rdfrest = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');

function getKey(node){
	if(!node) return node;
	switch(node.termType){
		case 'Literal': return node.datatype + node.language + ' ' + node.value;
	}
	return node.value;
}

function isIndex(i, a, b, c, t){
	if(!i[a]) return false;
	if(!i[a][b]) return false;
	return i[a][b][c] ? i[a][b][c].equals(t) : false ;
}

function insertIndex(i, a, b, c, t){
	if(!i[a]) i[a] = {};
	if(!i[a][b]) i[a][b] = {};
	i[a][b][c] = t;
}

function deleteIndex(i, a, b, c, t){
	if(i[a]&&i[a][b]&&i[a][b][c]){
		if(!i[a][b][c].equals(t)) throw new Error('assertion fail: deleted triple mismatch');
		delete(i[a][b][c]);
		if(!Object.keys(i[a][b]).length) delete(i[a][b]);
		if(!Object.keys(i[a]).length) delete(i[a]);
	}
}

exports.Graph = Graph;
function Graph(init){
	this.clear();
	//this._actions = [];
	Object.defineProperty(this, 'size', {get: function(){return self.length;}});
	var self = this;
	if(init && init.forEach){
		init.forEach(function(t){ self.add(t); });
	}
}
Graph.prototype.length = null;
Graph.prototype.graph = null;

Graph.prototype.importArray = function(a) { while( a.length > 0) { this.add(a.pop()) } };

Graph.prototype.insertIndex = insertIndex;
Graph.prototype.deleteIndex = deleteIndex;
Graph.prototype.add = function(triple) {
	if(!(triple instanceof RDFNode.Triple)) throw new TypeError('Expected a Triple for argument[0] `triple`');
	var st=getKey(triple.subject), pt=getKey(triple.predicate), ot=getKey(triple.object);
	if(isIndex(this.indexSOP, st, ot, pt, triple)) return;
	insertIndex(this.indexOPS, ot, pt, st, triple);
	insertIndex(this.indexPSO, pt, st, ot, triple);
	insertIndex(this.indexSOP, st, ot, pt, triple);
	this.length++;
	//this.actions.forEach(function(fn){ fn(triple); });
};
Graph.prototype.addAll = function(g){
	var g2 = this;
	g.forEach(function(s){ g2.add(s); });
};
Graph.prototype.union = function union(g){
	var gx = new Graph;
	gx.addAll(this);
	gx.addAll(g);
	return gx;
};
Graph.prototype.merge = Graph.prototype.union;
Graph.prototype.remove = function(triple) {
	var st=getKey(triple.subject), pt=getKey(triple.predicate), ot=getKey(triple.object);
	if(!isIndex(this.indexSOP, st, ot, pt, triple)) return;
	deleteIndex(this.indexOPS, ot, pt, st, triple);
	deleteIndex(this.indexPSO, pt, st, ot, triple);
	deleteIndex(this.indexSOP, st, ot, pt, triple);
	this.length--;
}
Graph.prototype.delete = Graph.prototype.remove;
Graph.prototype.has = function(triple) {
	var st=getKey(triple.subject), pt=getKey(triple.predicate), ot=getKey(triple.object);
	return isIndex(this.indexSOP, st, ot, pt, triple);
};
Graph.prototype.removeMatches = function(s, p, o) {
	var graph = this;
	this.match(s, p, o).forEach(function(t) {
		graph.remove(t);
	});
}
Graph.prototype.deleteMatches = Graph.prototype.removeMatches;
Graph.prototype.clear = function(){
	this.indexSOP = {};
	this.indexPSO = {};
	this.indexOPS = {};
	this.length = 0;
}
Graph.prototype.import = function(s) {
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.add(s.get(i))
	}
};
Graph.prototype.every = function every(filter) { return this.toArray().every(filter) };
Graph.prototype.some = function some(filter) { return this.toArray().some(filter) };
Graph.prototype.forEach = function forEach(callbck) { this.toArray().forEach(callbck) };
Graph.prototype.toArray = function toArray() {
	var triples = [];
	var data = this.indexPSO;
	if(!data) return [];
	(function go(data, c){
		if(c) Object.keys(data).forEach(function(t){go(data[t], c-1);});
		else triples.push(data);
	})(data, 3);
	return triples;
};
Graph.prototype.filter = function filter(cb){
	var result = new Graph;
	this.forEach(function(triple){
		if(cb(triple)) result.add(triple);
	});
	return result;
};
Graph.prototype.getCollection = function getCollection(subject){
	var collection=[], seen=[];
	var first, rest=subject;
	while(rest && !rest.equals(rdfnil)){
		var g = this.match(rest, rdffirst, null);
		if(g.length===0) throw new Error('Collection <'+rest+'> is incomplete');
		first = g.toArray().map(function(v){return v.object})[0];
		if(seen.indexOf(rest.toString())!==-1) throw new Error('Collection <'+rest+'> is circular');
		seen.push(rest.toString());
		collection.push(first);
		rest = this.match(rest, rdfrest, null).toArray().map(function(v){return v.object})[0];
	}
	return collection;
};
// FIXME this should return a Graph, not an Array
// FIXME ensure that the RDFNode#equals semantics are met
Graph.prototype.match = function match(subject, predicate, object){
	if(typeof subject=="string") subject = new RDFNode.NamedNode(subject);
	if(subject!==null && !RDFNode.RDFNode.is(subject)) throw new Error('match subject is not an RDFNode');
	if(subject!==null && subject.termType!=='NamedNode' && subject.termType!=='BlankNode') throw new Error('match subject must be a NamedNode/BlankNode');
	if(typeof predicate=="string") predicate = new RDFNode.NamedNode(predicate);
	if(predicate!==null && !RDFNode.RDFNode.is(predicate)) throw new Error('match predicate is not an RDFNode');
	if(predicate!==null && predicate.termType!=='NamedNode') throw new Error('match predicate must be a NamedNode');
	if(typeof object=="string") object = new RDFNode.NamedNode(object);
	if(object!==null && !RDFNode.RDFNode.is(object)) throw new Error('match object is not an RDFNode');
	if(object!==null && object.termType!=='NamedNode' && object.termType!=='BlankNode' && object.termType!=='Literal') throw new Error('match object must be a NamedNode/BlankNode/Literal');
	var triples = new Graph;
	var pattern = {s:subject&&getKey(subject), p:predicate&&getKey(predicate), o:getKey(object)};
	var patternIndexMap = [
		{index:this.indexOPS, constants:["o", "p", "s"], variables:[]},
		{index:this.indexPSO, constants:["p", "s"], variables:["o"]},
		{index:this.indexSOP, constants:["s", "o"], variables:["p"]},
		{index:this.indexSOP, constants:["s"], variables:["o", "p"]},
		{index:this.indexOPS, constants:["o", "p"], variables:["s"]},
		{index:this.indexPSO, constants:["p"], variables:["s", "o"]},
		{index:this.indexOPS, constants:["o"], variables:["p", "s"]},
		{index:this.indexPSO, constants:[], variables:["p", "s", "o"]},
	];
	var patternType = 0;
	if(!pattern.s) patternType |= 4;
	if(!pattern.p) patternType |= 2;
	if(!pattern.o) patternType |= 1;
	var index = patternIndexMap[patternType];
	var data = index.index;
	index.constants.forEach(function(v){if(data) data=data[pattern[v]];});
	if(!data) return triples;
	(function go(data, c){
		if(c) return void Object.keys(data).forEach(function(t){go(data[t], c-1);});
		if(subject && !data.subject.equals(subject)) throw new Error('assertion fail: subject');
		if(predicate && !data.predicate.equals(predicate)) throw new Error('assertion fail: predicate');
		if(object && !data.object.equals(object)) throw new Error('assertion fail: object');
		triples.add(data);
	})(data, index.variables.length);
	return triples;
};

var GraphEquals = require('./GraphEquals.js');
Graph.prototype.isomorphic = function isomorphic(b){
	return GraphEquals(this, b);
}
Graph.prototype.equals = function equals(b){
	return GraphEquals(this, b);
}
var GraphSimplyEntails = require('./GraphSimplyEntails.js');
Graph.prototype.simplyEntails = function simplyEntails(subset){
	var reference = this;
	return GraphSimplyEntails(reference, subset);
}

//Graph.prototype.addAction = function(action, run){
//	this._actions.push(action);
//	if(run){
//		this.forEach(action);
//	}
//}
//
//Object.defineProperty(Graph.prototype, 'actions', { get: function(){ return this._actions; } });

// Gets a reference to a particular subject
Graph.prototype.reference = function reference(subject){
	return new ResultSet.ResultSet(this, subject);
};

},{"./GraphEquals.js":7,"./GraphSimplyEntails.js":8,"./RDFNode.js":11,"./ResultSet.js":12}],7:[function(require,module,exports){
"use strict";

module.exports = GraphEquals;
function GraphEquals(a, b, depth){
	if(typeof a.length!='number') throw new Error('Expected an RDFGraph for argument `a`');
	if(typeof b.length!='number') throw new Error('Expected an RDFGraph for argument `b`');
	if(a.length!==b.length) return false;
	if(a.length<=0) throw new Error('Expected a nonempty RDFGraph');
	var al = a.toArray();
	var bl = b.toArray();
	//if(!a.every(function(s))) return false;
	var stack = [ {i:0, depth:0, bindings:{}} ];
	// Iterate through each statement in `a`
	// test that named nodes/literals/bound bnodes have a match in the other document
	// For each bnode encountered in the statement that's unbound, determine every possible binding and recurse
	while(stack.length){
		// If `depth` starts as 0 this will never be hit
		if(--depth===0) throw new Error('Hit search limit');
		var state = stack.pop();
		if(state.i===al.length) return state.bindings;
		var stmt = al[state.i];
		// If it's a bnode, then map it. If it's not mapped, use `null` to search for any values.
		// in theory the predicate will never be a bnode, but the additional test shouldn't hurt anything
		var stmtsubject = stmt.subject.nodeType()==='BlankNode' ? (state.bindings[stmt.subject] || null) : stmt.subject ;
		var stmtpredicate = stmt.predicate.nodeType()==='BlankNode' ? (state.bindings[stmt.predicate] || null) : stmt.predicate ;
		var stmtobject = stmt.object.nodeType()==='BlankNode' ? (state.bindings[stmt.object] || null) : stmt.object ;
		var matches = b.match(stmtsubject, stmtpredicate, stmtobject).filter(function(m){
			// wildcards must only match bnodes
			// The predicate should never be a bnode, so skip over that code path for now
			if(stmtsubject===null && m.subject.nodeType()!=='BlankNode') return false;
			//if(stmtpredicate===null && m.predicate.nodeType()!=='BlankNode') return false;
			if(stmtobject===null && m.object.nodeType()!=='BlankNode') return false;
			return true;
		});
		if(stmtsubject && stmtpredicate && stmtobject){
			if(matches.length===1){
				// if there's a single match where all nodes match exactly, push the comparison for the next item
				stack.push({ i:state.i+1, depth:state.depth, bindings:state.bindings });
			}else if(matches.length===0){
				continue;
			}else{
				throw new Error('Multiple matches, expected exactly one or zero match');
			}
		}else{
			// otherwise there's an unbound bnode, get the possible mappings and push those onto the stack
			matches.forEach(function(match){
				var b2 = {};
				var depth = state.depth
				for(var n in state.bindings) b2[n] = state.bindings[n];
				if(stmtsubject===null){
					if(b2[stmt.subject]===undefined){
						for(var n in b2) if(b2[n]===match.subject) return;
						b2[stmt.subject] = match.subject;
						depth++;
					}else{
						throw new Error('bnode already mapped');
					}
				}
//				if(stmtpredicate===null && b2[stmt.predicate]===undefined){
//					if(b2[stmt.predicate]===undefined){
//						for(var n in b2) if(b2[n]===match.predicate) return;
//						b2[stmt.predicate] = match.predicate;
//						depth++;
//					}else{
//						throw new Error('bnode already mapped');
//					}
//				}
				if(stmtobject===null){
					if(b2[stmt.object]===undefined){
						for(var n in b2) if(b2[n]===match.object) return;
						b2[stmt.object] = match.object;
						depth++;
					}else{
						throw new Error('bnode already mapped');
					}
				}
				stack.push({ i:state.i, depth:depth, bindings:b2 });
			});
		}
	}
}

},{}],8:[function(require,module,exports){
"use strict";

// Verify that `ref` simply entails `tst`
// According to RDF 1.1 Semantics, this is true iff a subgraph of `ref` is an instance of `tst`
// Go through every triple in `tst` and map bnodes to nodes in `ref`

module.exports = GraphSimplyEntails;
function GraphSimplyEntails(ref, tst, depth){
	if(typeof ref.length!='number') throw new Error('Expected an RDFGraph for argument `ref`');
	if(typeof tst.length!='number') throw new Error('Expected an RDFGraph for argument `tst`');
	if(tst.length<=0) throw new Error('Expected a nonempty RDFGraph for argument `ref`');
	if(ref.length<=0) throw new Error('Expected a nonempty RDFGraph for argument `tst`');
	if(tst.length > ref.length) return false;
	var tstl = tst.toArray();
	//if(!a.every(function(s))) return false;
	var stack = [ {i:0, depth:0, bindings:{}} ];
	// Iterate through each statement in `a`
	// test that named nodes/literals/bound bnodes have a match in the other document
	// For each bnode encountered in the statement that's unbound, determine every possible binding and recurse
	while(stack.length){
		// If `depth` starts as 0 this will never be hit
		if(--depth===0) throw new Error('Hit search limit');
		var state = stack.pop();
		if(state.i===tstl.length) return state.bindings;
		var stmt = tstl[state.i];
		// If it's a bnode, then map it. If it's not mapped, use `null` to search for any values.
		// in theory the predicate will never be a bnode, but the additional test shouldn't hurt anything
		var stmtsubject = stmt.subject.termType==='BlankNode' ? (state.bindings[stmt.subject] || null) : stmt.subject ;
		var stmtpredicate = stmt.predicate.termType==='BlankNode' ? (state.bindings[stmt.predicate] || null) : stmt.predicate ;
		var stmtobject = stmt.object.termType==='BlankNode' ? (state.bindings[stmt.object] || null) : stmt.object ;
		var matches = ref.match(stmtsubject, stmtpredicate, stmtobject).filter(function(m){
			// wildcards must only match bnodes
			// The predicate should never be a bnode, so skip over that code path for now
			// if(stmtsubject===null && (m.subject.termType!=='BlankNode' && m.subject.termType!=='NamedNode')) return false;
			//if(stmtpredicate===null && (m.predicate.termType!=='BlankNode' && m.predicate.termType!=='NamedNode')) return false;
			// if(stmtobject===null && (m.object.termType!=='BlankNode' && m.object.termType!=='NamedNode' && m.object.termType!=='Literal')) return false;
			return true;
		});
		if(stmtsubject && stmtpredicate && stmtobject){
			if(matches.length===1){
				// if there's a single match where all nodes match exactly, push the comparison for the next item
				stack.push({ i:state.i+1, depth:state.depth, bindings:state.bindings });
			}else if(matches.length===0){
				continue;
			}else{
				throw new Error('Multiple matches, expected exactly one or zero match');
			}
		}else{
			// otherwise there's an unbound bnode, get the possible mappings and push those onto the stack
			matches.forEach(function(match){
				var b2 = {};
				var depth = state.depth
				for(var n in state.bindings) b2[n] = state.bindings[n];
				if(stmtsubject===null){
					if(b2[stmt.subject]===undefined){
						for(var n in b2) if(b2[n]===match.subject) return;
						b2[stmt.subject] = match.subject;
						depth++;
					}else{
						throw new Error('bnode already mapped');
					}
				}
				// if(stmtpredicate===null && b2[stmt.predicate]===undefined){
				// 	if(b2[stmt.predicate]===undefined){
				// 		for(var n in b2) if(b2[n]===match.predicate) return;
				// 		b2[stmt.predicate] = match.predicate;
				// 		depth++;
				// 	}else{
				// 		throw new Error('bnode already mapped');
				// 	}
				// }
				if(stmtobject===null){
					if(b2[stmt.object]===undefined){
						for(var n in b2) if(b2[n]===match.object) return;
						b2[stmt.object] = match.object;
						depth++;
					}else{
						throw new Error('bnode already mapped');
					}
				}
				stack.push({ i:state.i, depth:depth, bindings:b2 });
			});
		}
	}
}

},{}],9:[function(require,module,exports){
"use strict";

/** Implements interfaces from http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/ */

var api = exports;

var NamedNode = require("./RDFNode.js").NamedNode;

api.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");

// This is the same as the XML NCName
// Note how [\uD800-\uDBFF][\uDC00-\uDFFF] is a surrogate pair that encodes #x10000-#xEFFFF
api.CURIE_PREFIX = new RegExp("^([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD.0-9\u00B7\u0300-\u036F\u203F-\u2040\\-]|[\uD800-\uDBFF][\uDC00-\uDFFF])*$", "i");


// For implementations that don't have Map defined...???
function GoodEnoughMap(){
	this.map = {};
}
GoodEnoughMap.prototype.has = function has(key){
	return Object.hasOwnProperty.call(this.map, key+':');
}
GoodEnoughMap.prototype.get = function get(key){
	return Object.hasOwnProperty.call(this.map, key+':') ? this.map[key+':'] : undefined;
}
GoodEnoughMap.prototype.set = function set(key, value){
	// Store with some suffix to avoid certain magic keywords
	this.map[key+':'] = value;
}
GoodEnoughMap.prototype.delete = function del(key){
	delete this.map[key+':'];
}
GoodEnoughMap.prototype.forEach = function forEach(it){
	var map = this.map;
	Object.keys(this.map).forEach(function(k){
		it(map[k], k.substring(0, k.length-1));
	});
}
var StringMap = (typeof Map=='function') ? Map : GoodEnoughMap ;

/**
 * Implements PrefixMap http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-PrefixMap
 */
api.PrefixMap = function PrefixMap(){
	this.prefixMap = new StringMap;
}
api.PrefixMap.prototype.get = function(prefix){
	// strip a trailing ":"
	if(prefix.slice(-1)==":") prefix=prefix.slice(0, -1);
	return this.prefixMap.get(prefix);
}
api.PrefixMap.prototype.set = function(prefix, iri){
	// strip a trailing ":"
	if(prefix.slice(-1)==":") prefix=prefix.slice(0, -1);
	if(typeof prefix!='string') throw new TypeError('Expected a string argument[0] `prefix`');
	if(iri===null) return void this.prefixMap.delete(prefix);
	if(typeof iri!='string') throw new TypeError('Expected a string argument[1] `iri`');
	if(prefix.length && !api.CURIE_PREFIX.exec(prefix)) throw new Error('Invalid prefix name');
	this.prefixMap.set(prefix, iri);
}
api.PrefixMap.prototype.list = function(){
	var list = [];
	return this.prefixMap.forEach(function(expansion, prefix){
		list.push(prefix);
	});
	return list;
}
api.PrefixMap.prototype.remove = function(prefix){
	this.prefixMap.delete(prefix);
}
api.PrefixMap.prototype.resolve = function(curie){
	var index = curie.indexOf(":");
	if(index<0) return null;
	var prefix = curie.slice(0, index);
	var iri = this.get(prefix);
	if(!iri) return null;
	var resolved = iri.concat(curie.slice(index+1));
	if(resolved.match(api.SCHEME_MATCH)==null && this.base!=null){
		resolved = this.base.resolveReference(resolved);
	}
	return resolved.toString();
}
api.PrefixMap.prototype.shrink = function(uri) {
	if(typeof uri!='string') throw new TypeError('Expected string arguments[0] `uri`');
	var shrunk = uri;
	var matchedLen = '';
	this.prefixMap.forEach(function(expansion, prefix){
		if(uri.substr(0,expansion.length)==expansion && expansion.length>matchedLen){
			shrunk = prefix + ':' + uri.substring(expansion.length);
			matchedLen = expansion.length;
		}
	});
	return shrunk;
}
api.PrefixMap.prototype.setDefault = function(uri){
	this.set('', uri);
}
api.PrefixMap.prototype.addAll = function(prefixes, override){
	var localPrefixMap = this.prefixMap;
	if(override){
		prefixes.prefixMap.forEach(function(expansion, prefix){
			localPrefixMap.set(prefix, expansion);
		});
	}else{
		prefixes.prefixMap.forEach(function(expansion, prefix){
			if(!localPrefixMap.has(prefix)) localPrefixMap.set(prefix, expansion);
		});
	}
}

/**
 * Implements TermMap http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-TermMap
 */
api.TermMap = function TermMap(){
	this.termMap = new StringMap;
	this.vocabulary = null;
}
api.TermMap.prototype.get = function(term){
	return this.termMap.get(term);
}
api.TermMap.prototype.set = function(term, iri){
	if(typeof term!='string') throw new TypeError('Expected a string argument[0] `prefix`');
	if(iri===null) return void this.termMap.delete(term);
	if(typeof iri!='string') throw new TypeError('Expected a string argument[1] `iri`');
	if(!api.CURIE_PREFIX.exec(term)) throw new Error('Invalid term name');
	this.termMap.set(term, iri);
}
api.TermMap.prototype.list = function(){
	var list = [];
	return this.prefixMap.forEach(function(definition, term){
		list.push(term);
	});
	return list;
}
api.TermMap.prototype.remove = function(term){
	this.termMap.delete(term);
}
api.TermMap.prototype.resolve = function(term){
	var expansion = this.termMap.get(term);
	if(typeof expansion=='string') return expansion;
	if(typeof this.vocabulary=='string') return this.vocabulary+term;
	return null;
}
api.TermMap.prototype.shrink = function(uri){
	var shrunk = uri;
	this.termMap.forEach(function(definition, term){
		if(uri==definition){
			shrunk = term;
		}
	});
	return shrunk;
}
api.TermMap.prototype.setDefault = function(uri){
	this.vocabulary = (uri==='') ? null : uri;
}
api.TermMap.prototype.addAll = function(terms, override){
	var termMap = this.termMap;
	if(override){
		terms.termMap.forEach(function(definition, term){
			termMap.set(term, definition);
		});
	}else{
		terms.termMap.forEach(function(definition, term){
			if(!termMap.has(term)) termMap.set(term, definition);
		});
	}
}

/**
 * Implements Profile http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Profile
 */
api.Profile = function Profile() {
	this.prefixes = new api.PrefixMap;
	this.terms = new api.TermMap;
};
api.Profile.prototype.resolve = function(toresolve){
	if(toresolve.indexOf(":")<0) return this.terms.resolve(toresolve);
	else return this.prefixes.resolve(toresolve);
}
api.Profile.prototype.setDefaultVocabulary = function(uri){
	this.terms.setDefault(uri);
}
api.Profile.prototype.setDefaultPrefix = function(uri){
	this.prefixes.setDefault(uri);
}
api.Profile.prototype.setTerm = function(term, uri){
	this.terms.set(term, uri);
}
api.Profile.prototype.setPrefix = function(prefix, uri){
	this.prefixes.set(prefix, uri);
}
api.Profile.prototype.shrink = function(uri){
	return this.terms.shrink(this.prefixes.shrink(uri));
}
api.Profile.prototype.importProfile = function(profile, override){
	this.prefixes.addAll(profile.prefixes, override);
	this.terms.addAll(profile.terms, override);
}

},{"./RDFNode.js":11}],10:[function(require,module,exports){
"use strict";

var NamedNode = require("./RDFNode.js").NamedNode;
var BlankNode = require("./RDFNode.js").BlankNode;
var Literal = require("./RDFNode.js").Literal;
var Triple = require("./RDFNode.js").Triple;
var Graph = require("./Graph.js").Graph;
var Profile = require("./Profile.js").Profile;
var PrefixMap = require("./Profile.js").PrefixMap;
var TermMap = require("./Profile.js").TermMap;
var loadRequiredPrefixMap = require("./prefixes.js").loadRequiredPrefixMap;

/**
 * Implements RDFEnvironment http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-RDFEnvironment
 */
exports.RDFEnvironment = function RDFEnvironment(){
	Profile.call(this);
	loadRequiredPrefixMap(this);
}
exports.RDFEnvironment.prototype = Object.create(Profile.prototype, {constructor:{value:exports.RDFEnvironment, iterable:false}});
exports.RDFEnvironment.prototype.createBlankNode = function(){
	return new BlankNode;
}
exports.RDFEnvironment.prototype.createNamedNode = function(v){
	return new NamedNode(v);
}
exports.RDFEnvironment.prototype.createLiteral = function(value, datatype, _dt){
	if(typeof value!='string') throw new Error('Expected argument[0] `value` to be a string');
	if(datatype!==undefined && datatype!==null && typeof datatype!=='string' && !(datatype instanceof NamedNode)) throw new TypeError('Expected optional argument[1] `datatype` to be a string');
	if(_dt!==undefined && _dt!==null && typeof _dt!=='string' && !(_dt instanceof NamedNode)) throw new TypeError('Expected optional argument[2] `_dt` to be a string');
	if(datatype instanceof NamedNode){
		return new Literal(value, datatype);
	}else if(typeof datatype=='string' && (_dt==null || _dt==undefined || _dt=='http://www.w3.org/1999/02/22-rdf-syntax-ns#langString')){
		// Process arguments as a typed and/or language literal
		return new Literal(value, datatype);
	}else if((datatype==null || datatype==undefined) && _dt){
		// Process arguments as a typed literal
		return Literal.typed(value, _dt);
	}
	return new Literal(value);
}
exports.RDFEnvironment.prototype.createTypedLiteral = function(value, datatype){
	return Literal.typed(value, datatype);
}
exports.RDFEnvironment.prototype.createLanguageLiteral = function(value, language){
	return Literal.language(value, language);
}
exports.RDFEnvironment.prototype.createTriple = function(s,p,o){
	return new Triple(s,p,o);
}
exports.RDFEnvironment.prototype.createGraph = function(g){
	return new Graph(g);
}
//exports.RDFEnvironment.prototype.createAction = function(){
//	return new Action;
//}
exports.RDFEnvironment.prototype.createProfile = function(){
	return new Profile;
}
exports.RDFEnvironment.prototype.createTermMap = function(){
	return new TermMap;
}
exports.RDFEnvironment.prototype.createPrefixMap = function(){
	return new PrefixMap;
}

},{"./Graph.js":6,"./Profile.js":9,"./RDFNode.js":11,"./prefixes.js":17}],11:[function(require,module,exports){
"use strict";

var encodeString = require('./encodeString.js');
var api = exports;

function inherits(ctor, superCtor) {
	//ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: { value: ctor, enumerable: false },
	});
};

function nodeType(v){
	if(v.nodeType) return v.nodeType();
	if(typeof v=='string') return (v.substr(0,2)=='_:')?'BlankNode':'IRI';
	return 'TypedLiteral';
}
api.nodeType = nodeType;

function RDFNodeEquals(other) {
	if(typeof other=='string'){
		return this.termType=="NamedNode" && this.value==other;
	}
	if(api.RDFNode.is(other)){
		if(nodeType(this)!=nodeType(other)) return false;
		switch(this.termType) {
			case "NamedNode":
			case "BlankNode":
			case "DefaultGraph":
				return this.toString()==other.toString();
			case "Literal":
				return ( this.language==other.language
					&& this.nominalValue==other.nominalValue
					&& this.datatype.toString()==other.datatype.toString()
					);
		}
		if(typeof this.toNT=='function' && typeof other.toNT=='function'){
			return this.toNT() == other.toNT();
		}
	}
	//throw new Error('Cannot compare values');
	return false;
}
api.RDFNodeEquals = RDFNodeEquals;

function RDFNodeCompare(other) {
	// Node type order: IRI, BlankNode, Literal
	var typeThis=this.termType, typeOther=other.termType;
	if(typeThis != typeOther){
		switch(typeThis) {
			case "IRI":
			case "NamedNode":
				// must be a BlankNode or Literal
				return -1;
			case "BlankNode":
				if(typeOther=="Literal") return -1;
				else return 1;
			case "Literal":
				return 1;
		}
		throw new Error(typeThis);
	}
	// node types are the same, compare nomialValue
	if(typeof this.nominalValue=='string' && typeof other.nominalValue=='string'){
		if(this.nominalValue < other.nominalValue) return -1;
		if(this.nominalValue > other.nominalValue) return 1;
	}
	// values are the same, compare by datatype
	if(typeof this.datatype=='string' && typeof other.datatype=='string'){
		if(this.datatype < other.datatype) return -1;
		if(this.datatype > other.datatype) return 1;
	}
	if(typeof this.language=='string' || typeof other.language=='string'){
		if(typeof this.language=='string' && typeof other.language=='string'){
			if(this.language < other.language) return -1;
			if(this.language > other.language) return 1;
		}else{
			if(other.language) return -1;
			if(this.language) return 1;
		}
	}
	// Compare by any other metric?
	if(typeof this.valueOf=='function'){
		if(this.valueOf() < other) return -1;
		if(this.valueOf() > other) return 1;
		//if(this.valueOf() == other) return 0;
	}
	if(this.equals(other)) return 0;
	throw new Error('Cannot compare values');
}
api.RDFNodeEquals = RDFNodeEquals;

/**
* Implements Triple http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Triple
*/
api.Triple = function Triple(s, p, o) {
	if(typeof s=='string') s = new NamedNode(s);
	if(!api.RDFNode.is(s)) throw new Error('Triple subject is not an RDFNode');
	if(s.termType!=='NamedNode' && s.termType!=='BlankNode') throw new Error('subject must be a NamedNode/BlankNode');

	if(typeof p=='string') p = new NamedNode(p);
	if(!api.RDFNode.is(p)) throw new Error('Triple predicate is not an RDFNode');
	if(p.termType!=='NamedNode') throw new Error('predicate must be a NamedNode');

	if(typeof o=='string') o = new NamedNode(o);
	if(!api.RDFNode.is(o)) throw new Error('Triple object is not an RDFNode');
	if(o.termType!=='NamedNode' && o.termType!=='BlankNode' && o.termType!=='Literal') throw new Error('object must be a NamedNode/BlankNode/Literal');

	this.subject = s;
	this.predicate = p;
	this.object = o;
};
api.Triple.prototype.size = 3;
api.Triple.prototype.length = 3;
api.Triple.prototype.toString = function() {
	return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " .";
}
api.Triple.prototype.toNT = function toNT() {
	return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " .";
}
api.Triple.prototype.toTurtle = function toTurtle(profile) {
	return this.subject.toTurtle(profile) + " " + this.predicate.toTurtle(profile) + " " + this.object.toTurtle(profile) + " .";
}
api.Triple.prototype.equals = function(t) {
	return RDFNodeEquals.call(this.subject,t.subject) && RDFNodeEquals.call(this.predicate,t.predicate) && RDFNodeEquals.call(this.object,t.object);
}
api.Triple.prototype.compare = function(other) {
	var r = 0;
	// test the return value, also assign to `r`
	if(r = this.subject.compare(other.subject)) return r;
	if(r = this.predicate.compare(other.predicate)) return r;
	if(r = this.object.compare(other.object)) return r;
}

/**
*/
api.Quad = function Quad(s, p, o, g) {
	if(typeof s=='string') s = new NamedNode(s);
	if(!api.RDFNode.is(s)) throw new Error('Quad subject is not an RDFNode');
	if(s.termType!=='NamedNode' && s.termType!=='BlankNode') throw new Error('subject must be a NamedNode/BlankNode');

	if(typeof p=='string') p = new NamedNode(p);
	if(!api.RDFNode.is(p)) throw new Error('Quad predicate is not an RDFNode');
	if(p.termType!=='NamedNode') throw new Error('predicate must be a NamedNode');

	if(typeof o=='string') o = new NamedNode(o);
	if(!api.RDFNode.is(o)) throw new Error('Quad object is not an RDFNode');
	if(o.termType!=='NamedNode' && o.termType!=='BlankNode' && o.termType!=='Literal') throw new Error('object must be a NamedNode/BlankNode/Literal');

	if(typeof g=='string') g = new NamedNode(g);
	if(!api.RDFNode.is(g)) throw new Error('Quad graph is not an RDFNode');
	if(g.termType!=='NamedNode') throw new Error('graph must be a NamedNode');

	this.subject = s;
	this.predicate = p;
	this.object = o;
	this.graph = g;
};
api.Quad.prototype.size = 4;
api.Quad.prototype.length = 4;
api.Quad.prototype.toString = function() {
	return this.toNQ();
}
api.Quad.prototype.toNT = function toNT() {
	return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " .";
}
api.Quad.prototype.toNQ = function toNQ() {
	if(this.graph){
		return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " " + this.graph.toNT() + " .";
	}else{
		// the NT form is compatible with N-Quads
		return this.toNT();
	}
}
api.Quad.prototype.toTurtle = function toTurtle(profile) {
	return this.subject.toTurtle(profile) + " " + this.predicate.toTurtle(profile) + " " + this.object.toTurtle(profile) + " .";
}
api.Quad.prototype.equals = function(t) {
	return RDFNodeEquals.call(this.subject,t.subject) && RDFNodeEquals.call(this.predicate,t.predicate) && RDFNodeEquals.call(this.object,t.object) && RDFNodeEquals.call(this.graph,t.graph);
}
api.Quad.prototype.compare = function(other) {
	var r = 0;
	// test the return value, also assign to `r`
	if(r = this.subject.compare(other.subject)) return r;
	if(r = this.predicate.compare(other.predicate)) return r;
	if(r = this.object.compare(other.object)) return r;
	if(r = this.graph.compare(other.graph)) return r;
}

/**
 * Implements RDFNode http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-RDFNode
 */
api.RDFNode = function RDFNode() {};
api.RDFNode.is = function isRDFNode(n){
	if(!n) return false;
	if(n instanceof api.RDFNode) return true;
	if(typeof n.nodeType=='function') return true;
	return false;
}
api.RDFNode.prototype.equals = api.RDFNodeEquals = RDFNodeEquals;
api.RDFNode.prototype.compare = api.RDFNodeCompare = RDFNodeCompare;
api.RDFNode.prototype.nodeType = function() { return "RDFNode"; }
api.RDFNode.prototype.toNT = function() { return ""; }
api.RDFNode.prototype.toCanonical = function() { return this.toNT(); }
api.RDFNode.prototype.toString = function() { return this.nominalValue; }
api.RDFNode.prototype.valueOf = function() { return this.nominalValue; }
// Alignment to "Interface Specification: RDF Representation"
Object.defineProperty(api.RDFNode.prototype, 'value', { get: function(){
	return this.nominalValue;
} });

/**
 * BlankNode
 */
api.BlankNode = BlankNode;
inherits(api.BlankNode, api.RDFNode);
function BlankNode(id) {
	if(typeof id=='string' && id.substr(0,2)=='_:') this.nominalValue=id.substr(2);
	else if(id) this.nominalValue=id;
	else this.nominalValue = 'b'+(++api.BlankNode.NextId).toString();
}
api.BlankNode.NextId = 0;
api.BlankNode.prototype.nodeType = function() { return "BlankNode"; }
api.BlankNode.prototype.interfaceName = "BlankNode";
api.BlankNode.prototype.termType = "BlankNode";
api.BlankNode.prototype.toNT = function() {
	return "_:"+this.nominalValue;
}
api.BlankNode.prototype.toTurtle = function toTurtle() {
	return this.toNT();
}
api.BlankNode.prototype.n3 = function() {
	return this.toNT();
}
api.BlankNode.prototype.toString =  function() {
	return "_:"+this.nominalValue;
}

/**
 * Implements Literal http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Literal
 */
api.Literal = Literal;
inherits(api.Literal, api.RDFNode);
function Literal(value, type) {
	if(typeof value!='string') throw new TypeError('Expected argument[0] `value` to be a string');
	if(type!==null && type!==undefined && typeof type!='string' && !(type instanceof api.NamedNode)) throw new TypeError('Expected optional argument[1] `type` to be a string/RDFNode');
	this.nominalValue = value;
	if(type instanceof NamedNode){
		this.datatype = type;
		this.language = null;
	}else if(typeof type=='string'){
		if(type.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			this.datatype = rdflangString;
			this.language = type;
		}else if(type.match(/^@[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			this.datatype = rdflangString;
			this.language = type.substring(1);
		}else if(type.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)){
			this.datatype = new NamedNode(type);
			this.language = null;
		}else{
			throw new Error('Expected argument[1] `type` to look like a LangTag or IRI');
		}
	}else{
		this.datatype = xsdstring;
		this.language = null;
	}
};
api.Literal.typed = function createTypedLiteral(value, datatype){
	if(typeof value!='string') throw new Error('Expected argument[0] `value` to be a string');
	if(typeof datatype!='string' && !(datatype instanceof api.NamedNode)) throw new Error('Expected argument[1] `datatype` to be a string');
	if(!datatype.toString().match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)) throw new Error('Expected argument[1] `datatype` to be an IRI');
	var literal = new api.Literal(value);
	if(datatype.toString()!=='http://www.w3.org/2001/XMLSchema#string'){
		literal.datatype = datatype;
	}
	return literal;
}
api.Literal.language = function createLanguageLiteral(value, language){
	if(typeof value!='string') throw new Error('Expected argument[0] `value` to be a string');
	if(typeof language!='string') throw new Error('Expected argument[1] `language` to be a string');
	if(!language.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)) throw new Error('Expected argument[1] `language` to be a BCP47 language tag');
	var literal = new api.Literal(value);
	literal.language = language;
	return literal;
}
api.Literal.prototype.nodeType = function() {
	if(rdflangString.equals(this.datatype) && this.language) return 'PlainLiteral';
	if(xsdstring.equals(this.datatype)) return 'PlainLiteral';
	return 'TypedLiteral';
}
api.Literal.prototype.interfaceName = "Literal";
api.Literal.prototype.termType = "Literal";
api.Literal.prototype.toNT = function toNT() {
	var string = '"'+encodeString(this.nominalValue)+'"';
	if(this.language) return string+"@"+this.language;
	else if(xsdstring.equals(this.datatype)) return string;
	else if(this.datatype) return string+'^^<'+this.datatype+">";
	throw new Error('Unknown datatype');
}
api.Literal.prototype.toTurtle = function toTurtle(profile){
	if(xsdinteger.equals(this.datatype) && this.value.match(INTEGER)){
		return this.value;
	}
	if(xsddecimal.equals(this.datatype) && this.value.match(DECIMAL)){
		return this.value;
	}
	if(xsddouble.equals(this.datatype) && this.value.match(DOUBLE)){
		return this.value;
	}
	if(xsdboolean.equals(this.datatype) && this.value.match(BOOLEAN)){
		return this.value;
	}
	if(profile && this.type){
		var shrunk = profile.shrink(this.datatype.toString());
		if(shrunk!=this.datatype.toString()) return shrunk;
	}
	// TODO if it's xsd:integer/xsd:decimal/xsd:double/xsd:boolean, return simplified form
	return this.toNT();
}
api.Literal.prototype.n3 = function n3(profile){
	return this.toTurtle(profile);
}
// Literal#valueOf returns a language-native value - e.g. a number, boolean, or Date where possible
api.Literal.prototype.valueOf = function() {
	if(this.datatype && typeof api.Literal.typeValueOf[this.datatype]=="function"){
		return api.Literal.typeValueOf[this.datatype](this.nominalValue, this.datatype);
	}
	return this.nominalValue;
}
Object.defineProperty(api.Literal.prototype, 'type', { get: function(){
	if(rdflangString.equals(this.datatype)) return null;
	if(xsdstring.equals(this.datatype)) return null;
	return this.datatype.nominalValue;
} });


api.Literal.typeValueOf = {};
api.Literal.registerTypeConversion = function(datatype, f){
	api.Literal.typeValueOf[datatype] = f;
}
require('./space.js').loadDefaultTypeConverters(api.Literal);

/**
 * NamedNode
 */
api.NamedNode = NamedNode;
inherits(api.NamedNode, api.RDFNode);
function NamedNode(iri) {
	if(typeof iri!='string') throw new TypeError('argument iri not a string');
	if(iri[0]=='_' && iri[1]==':') throw new Error('unexpected BlankNode syntax');
	if(!iri.match(api.NamedNode.SCHEME_MATCH)) throw new Error('Expected arguments[0] `iri` to look like an IRI');
	if(iri.indexOf(' ') >= 0) throw new Error('Unexpected whitespace in arguments[0] `iri`');
	this.nominalValue = iri;
};
api.NamedNode.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
api.NamedNode.prototype.nodeType = function nodeType() { return "IRI" };
api.NamedNode.prototype.interfaceName = "NamedNode";
api.NamedNode.prototype.termType = "NamedNode";
api.NamedNode.prototype.toNT = function toNT() {
	return "<" + encodeString(this.nominalValue) + ">";
};
api.NamedNode.prototype.toTurtle = function toTurtle(profile) {
	if(profile){
		var shrunk = profile.shrink(this.nominalValue);
		if(shrunk!=this.nominalValue) return shrunk;
	}
	return this.toNT();
}
api.NamedNode.prototype.n3 = function n3(profile) {
	return this.toTurtle(profile);
}

/**
 * TriplePattern
 */
api.TriplePattern = function TriplePattern(s, p, o) {
	if(typeof s=='string') s = new NamedNode(s);
	if(!api.RDFNode.is(s)) throw new Error('TriplePattern subject is not an RDFNode');
	if(s.termType!=='NamedNode' && s.termType!=='BlankNode' && s.termType!=='Variable') throw new Error('subject must be a NamedNode/BlankNode/Variable');

	if(typeof p=='string') p = new NamedNode(p);
	if(!api.RDFNode.is(p)) throw new Error('TriplePattern predicate is not an RDFNode');
	if(p.termType!=='NamedNode' && p.termType!=='Variable') throw new Error('predicate must be a NamedNode/Variable');

	if(typeof o=='string') o = new NamedNode(o);
	if(!api.RDFNode.is(o)) throw new Error('TriplePattern object is not an RDFNode');
	if(o.termType!=='NamedNode' && o.termType!=='BlankNode' && o.termType!=='Literal' && o.termType!=='Variable') throw new Error('object must be a NamedNode/BlankNode/Literal/Variable');

	this.subject = s;
	this.predicate = p;
	this.object = o;
};
api.TriplePattern.prototype.size = 3;
api.TriplePattern.prototype.length = 3;
api.TriplePattern.prototype.toString = function() {
	return this.subject.n3() + " " + this.predicate.n3() + " " + this.object.n3() + " .";
}
api.TriplePattern.prototype.equals = function(t) {
	return RDFNodeEquals.call(this.subject,t.subject) && RDFNodeEquals.call(this.predicate,t.predicate) && RDFNodeEquals.call(this.object,t.object);
}

/**
 * Variable
 */
api.Variable = Variable;
inherits(api.Variable, api.RDFNode);
function Variable(name) {
	if(typeof name!='string') throw new Error('Expected arguments[0] `name` to be a string');
	if(name[0]=='?' || name[0]=='$') name = name.substring(1);
	this.nominalValue = name;
};
api.Variable.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
api.Variable.prototype.nodeType = function nodeType() { return "Variable" };
api.Variable.prototype.interfaceName = "Variable";
api.Variable.prototype.termType = "Variable";
api.Variable.prototype.toNT = function() {
	throw new Error('Cannot serialize variable to N-Triples');
}
api.Variable.prototype.toTurtle = function toTurtle() {
	throw new Error('Cannot serialize variable to Turtle');
}
api.Variable.prototype.n3 = function n3() {
	return '?'+this.nominalValue;
}

/*
interface DefaultGraph : Term {
	attribute string termType;
	attribute string value;
	boolean equals(Term other);
};
 */
api.DefaultGraph = DefaultGraph;
inherits(api.DefaultGraph, api.RDFNode);
function DefaultGraph() {
};
api.DefaultGraph.prototype.interfaceName = "DefaultGraph";
api.DefaultGraph.prototype.termType = "DefaultGraph";
api.DefaultGraph.prototype.nominalValue = "";
api.DefaultGraph.prototype.toNT = function() {
	throw new Error('Cannot serialize DefaultGraph to N-Triples');
}
api.DefaultGraph.prototype.toTurtle = function toTurtle() {
	throw new Error('Cannot serialize DefaultGraph to Turtle');
}
api.DefaultGraph.prototype.n3 = function n3() {
	throw new Error('Cannot serialize DefaultGraph to n3');
}

// Constants needed for processing Literals
var xsdstring = new NamedNode('http://www.w3.org/2001/XMLSchema#string');
var rdflangString = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');

// Shamelessly copied from Builtins.js, also found in TurtleParser.js
var xsdns = require('./ns.js').xsdns;
var INTEGER = new RegExp("^(-|\\+)?[0-9]+$", "");
var xsdinteger = new NamedNode(xsdns('integer'));
var DOUBLE = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
var xsddouble = new NamedNode(xsdns('double'));
var DECIMAL = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");
var xsddecimal = new NamedNode(xsdns('decimal'));
var BOOLEAN = new RegExp("^(true|false)", "");
var xsdboolean = new NamedNode(xsdns('boolean'));

},{"./encodeString.js":14,"./ns.js":16,"./space.js":18}],12:[function(require,module,exports){
var Graph = require('./Graph.js');
var RDFNode = require('./RDFNode.js');

module.exports.ResultSet = ResultSet;
function ResultSet(graph, initialNode){
	if(typeof initialNode=='string') initialNode = new RDFNode.NamedNode(initialNode);
	if(!(graph instanceof Graph.Graph)) throw new TypeError('Expected argument[0] `graph` to be a Graph');
	this.graph = graph;
	this.set = [];
	if(initialNode){
		if(!RDFNode.RDFNode.is(initialNode)) throw new Error('Triple initialNode is not an RDFNode');
		if(initialNode.termType!=='NamedNode' && initialNode.termType!=='BlankNode') throw new Error('subject must be a NamedNode/BlankNode');
		this.set.push(initialNode);
	}
}

ResultSet.prototype.set = [];

ResultSet.prototype.add = function(node){
	// @@@TODO maybe verify that `node` is somewhere in the graph
	if(this.set.some(function(v){ return v.equals(node); })) return;
	this.set.push(node);
}

ResultSet.prototype.rel = function(predicate){
	if(typeof predicate=='string') predicate = new RDFNode.NamedNode(predicate);
	if(!RDFNode.RDFNode.is(predicate)) throw new Error('Expected argument[0] `predicate` to be an RDFNode');
	if(predicate.termType!=='NamedNode') throw new Error('Expected argument[0] `predicate` to be a NamedNode');
	var graph = this.graph;
	var set = this.set;
	var result = new ResultSet(graph);
	set.forEach(function(node){
		if(node.termType!='NamedNode' && node.termType!='BlankNode') return;
		graph.match(node, predicate, null).forEach(function(triple){
			result.add(triple.object);
		});
	});
	return result;
}

ResultSet.prototype.rev = function rev(predicate){
	if(typeof predicate=='string') predicate = new RDFNode.NamedNode(predicate);
	if(!RDFNode.RDFNode.is(predicate)) throw new Error('Expected argument[0] `predicate` to be an RDFNode');
	if(predicate.termType!=='NamedNode') throw new Error('Expected argument[0] `predicate` to be a NamedNode');
	var graph = this.graph;
	var set = this.set;
	var result = new ResultSet(graph);
	set.forEach(function(node){
		graph.match(null, predicate, node).forEach(function(triple){
			result.add(triple.subject);
		});
	});
	return result;
}

ResultSet.prototype.toArray = function toArray(callback){
	return this.set.slice();
}

ResultSet.prototype.some = function some(callback){
	return this.set.some(callback);
}

ResultSet.prototype.every = function every(callback){
	return this.set.every(callback);
}

ResultSet.prototype.filter = function filter(callback){
	var result = new ResultSet(this.graph);
	// FIXME this can probably be optimized since we're only removing nodes
	this.set.filter(callback).forEach(function(node){
		result.add(node);
	});
	return result;
}

ResultSet.prototype.forEach = function forEach(callback){
	return this.set.forEach(callback);
}

ResultSet.prototype.map = function map(callback){
	var result = new ResultSet(this.graph);
	this.set.map(callback).forEach(function(node){
		result.add(node);
	});
	return result;
}

ResultSet.prototype.reduce = function reduce(callback, initial){
	return this.set.reduce(callback, initial);
}

ResultSet.prototype.one = function one(callback){
	if(this.set.length>1) throw new Error('Expected one match');
	if(this.set.length===0) return null;
	return this.set[0];
}

Object.defineProperty(ResultSet.prototype, 'length', { get: function(){ return this.set.length; } });

},{"./Graph.js":6,"./RDFNode.js":11}],13:[function(require,module,exports){
"use strict";

var parsers = exports;

var IRI = require('iri').IRI;
var env = require('./environment.js').environment;
function rdfns(v){return 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'+v;};
function xsdns(v){return 'http://www.w3.org/2001/XMLSchema#'+v;};

parsers.u8 = new RegExp("\\\\U([0-9A-Fa-f]{8})", "g");
parsers.u4 = new RegExp("\\\\u([0-9A-Fa-f]{4})", "g");
parsers.hexToChar = function hexToChar(hex) {
	var result = "";
	var n = parseInt(hex, 16);
	if(n <= 65535) {
		result += String.fromCharCode(n);
	} else if(n <= 1114111) {
		n -= 65536;
		result += String.fromCharCode(55296 + (n >> 10), 56320 + (n & 1023))
	} else {
		throw new Error("code point isn't known: " + n);
	}
	return result;
};
parsers.decodeString = function decodeString(str) {
	str = str.replace(parsers.u8, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(parsers.u4, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(new RegExp("\\\\t", "g"), "\t");
	str = str.replace(new RegExp("\\\\b", "g"), "\b");
	str = str.replace(new RegExp("\\\\n", "g"), "\n");
	str = str.replace(new RegExp("\\\\r", "g"), "\r");
	str = str.replace(new RegExp("\\\\f", "g"), "\f");
	str = str.replace(new RegExp('\\\\"', "g"), '"');
	str = str.replace(new RegExp("\\\\\\\\", "g"), "\\");
	return str;
};
parsers.decodePrefixedName = function(str){
	var decoded = '';
	for(var i=0; i<str.length; i++){
		if(str[i]=='\\'){
			decoded += str[++i];
		}else{
			decoded += str[i];
		}
	}
	return decoded;
}
parsers.decodeIRIREF = function decodeIRIREF(str) {
	str = str.replace(parsers.u8, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(parsers.u4, function(matchstr, parens) { return parsers.hexToChar(parens); });
	return str;
};

/**
 * Turtle implements DataParser
 * doc param of parse() and process() must be a string
 */
function Turtle(environment) {
	if(!environment) environment = env.createProfile();
	this.environment = environment;
	this.base = new IRI('');
	this.bnHash = {};
	this.filter = null;
	this.processor = null;
	this.quick = null;
	this.graph = null;
};
parsers.Turtle = Turtle;

Turtle.parse = function parse(document, base, event){
	var parser = new Turtle();
	if(typeof event=='function'){
		parser.quick = true;
		parser.processor = event;
	}
	parser.parse(document, null, base);
	if(typeof event=='function'){
		event(null, null);
	}
	return parser;
}

Turtle.isWhitespace = new RegExp("^[ \t\r\n#]+", "");
Turtle.initialWhitespace = new RegExp("^[ \t\r\n]+", "");
Turtle.initialComment = new RegExp("^#[^\r\n]*", "");
Turtle.simpleToken = new RegExp("^[^ \t\r\n](\\.*[^ \t\r\n,;\\.])*", "");
Turtle.simpleObjectToken = /^(\\[_\~\.\-\!\$&'()*+,;=\/?#@%]|%[0-9A-Fa-f]{2}|[^ \t\r\n;,\[\]()])+/;
Turtle.tokenInteger = new RegExp("^(-|\\+)?[0-9]+", "");
Turtle.tokenDouble = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))", "");
Turtle.tokenDecimal = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?", "");
Turtle.PrefixedName = /^(([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD](([\-.0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])*[\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])?)?:([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~])((([\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[.0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~]))*([\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~]))?|([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD](([\-.0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])*[\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])?)?:)/;

Turtle.prototype.parse = function parse(doc, callback, base, filter, graph) {
	this.graph = graph==null ? env.createGraph() : graph;
	if(base) this.base = new IRI(base.toString());
	this.filter = filter;
	this.parseStatements(new String(doc));
	if((typeof callback)=="function") callback(this.graph);
	return true;
};
Turtle.prototype.t = function t(){ return {o:null} };
Turtle.prototype.expect = function(s, t) {
	if(typeof t.test=='function'){
		if(t.test(s)) return;
	}else if(typeof t=='string'){
		if(s.substring(0, t.length) == t) return;
	}
	throw new Error("Expected token: " + t + " at " + JSON.stringify(s.substring(0, 50)));
};
Turtle.prototype.parseStatements = function(s) {
	s = s.toString();
	while(s.length > 0) {
		s = this.skipWS(s);
		if(s.length == 0) return true;
		s = (s.charAt(0)=="@" || s.substring(0,4).toUpperCase()=='BASE' || s.substring(0,6).toUpperCase()=='PREFIX') ? this.consumeDirective(s) : this.consumeStatement(s);
		s = this.skipWS(s);
	}
	return true;
};
Turtle.prototype.createTriple = function createTriple(s, p, o){
	return env.createTriple(s, p, o);
}
Turtle.prototype.createNamedNode = function createNamedNode(v){
	return env.createNamedNode(v);
}
Turtle.prototype.createBlankNode = function createBlankNode(){
	return env.createBlankNode();
}
Turtle.prototype.createLiteral = function createLiteral(v, dt, ll){
	return env.createLiteral(v, dt, ll);
}
Turtle.prototype.add = function(t) {
	var $use = true;
	if(this.filter != null) $use = this.filter(t, null, null);
	if(!$use) return;
	this.processor ? this.processor(null, t) : this.graph.add(t);
};
Turtle.prototype.consumeBlankNode = function(s, t) {
	t.o = this.createBlankNode();
	s = this.skipWS(s.slice(1));
	if(s.charAt(0) == "]") return s.slice(1);
	s = this.skipWS(this.consumePredicateObjectList(s, t));
	this.expect(s, "]");
	return this.skipWS(s.slice(1));
};
Turtle.prototype.consumeCollection = function(s, subject) {
	subject.o = this.createBlankNode();
	var listject = this.t();
	listject.o = subject.o;
	s = this.skipWS(s.slice(1));
	var cont = s.charAt(0) != ")";
	if(!cont) { subject.o = this.createNamedNode(rdfns("nil")); }
	while(cont) {
		var o = this.t();
		switch(s.charAt(0)) {
			case "[": s = this.consumeBlankNode(s, o); break;
			case "_": s = this.consumeKnownBlankNode(s, o); break;
			case "(": s = this.consumeCollection(s, o); break;
			case "<": s = this.consumeURI(s, o); break;
			case '"': case "'": s = this.consumeLiteral(s, o); break;
			case '+': case '-': case '.':
			case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				var token;
				if(token = Turtle.tokenDouble.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("double"));
				} else if(token = Turtle.tokenDecimal.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("decimal"));
				} else if(token = Turtle.tokenInteger.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("integer"));
				} else {
					throw new Error("Expected NumericLiteral");
				}
				s = s.slice(token.length);
				break;
			default:
				var token = s.match(Turtle.simpleObjectToken).shift();
				if(token.charAt(token.length - 1) == ")") {
					token = token.substring(0, token.length - 1);
				}
				if(token==="false" || token==="true"){
					o.o = this.createLiteral(token, null, xsdns("boolean"));
				}else if(token.indexOf(":") >= 0) {
					o.o = this.createNamedNode(this.environment.resolve(token));
				}
				s = s.slice(token.length);
				break;
		}
		this.add(this.createTriple(listject.o, this.createNamedNode(rdfns("first")), o.o));
		s = this.skipWS(s);
		cont = s.charAt(0) != ")";
		if(cont) {
			this.add(this.createTriple(listject.o, this.createNamedNode(rdfns("rest")), listject.o = this.createBlankNode()));
		} else {
			this.add(this.createTriple(listject.o, this.createNamedNode(rdfns("rest")), this.createNamedNode(rdfns("nil"))));
		}
	}
	return this.skipWS(s.slice(1));
};
Turtle.prototype.consumeDirective = function(s) {
	var p = 0;
	if(s.substring(1, 7) == "prefix") {
		s = this.skipWS(s.slice(7));
		p = s.indexOf(":");
		var prefix = s.substring(0, p);
		s = this.skipWS(s.slice(++p));
		this.expect(s, "<");
		this.environment.setPrefix(prefix, this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">")))).toString());
		s = this.skipWS(s.slice(++p));
		this.expect(s, ".");
		s = s.slice(1);
	} else if(s.substring(0, 6).toUpperCase() == "PREFIX") {
		// SPARQL-style
		s = this.skipWS(s.slice(7));
		p = s.indexOf(":");
		var prefix = s.substring(0, p);
		s = this.skipWS(s.slice(++p));
		this.expect(s, "<");
		this.environment.setPrefix(prefix, this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">")))).toString());
		s = this.skipWS(s.slice(++p));
	} else if(s.substring(1, 5) == "base") {
		s = this.skipWS(s.slice(5));
		this.expect(s, "<");
		this.base = this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">"))));
		s = this.skipWS(s.slice(++p));
		this.expect(s, ".");
		s = s.slice(1);
	} else if(s.substring(0, 4).toUpperCase() == "BASE") {
		// SPARQL-style
		s = this.skipWS(s.slice(5));
		this.expect(s, "<");
		this.base = this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">"))));
		s = this.skipWS(s.slice(++p));
	} else {
		throw new Error("Unknown directive: " + s.substring(0, 50));
	}
	return s;
};
Turtle.prototype.consumeKnownBlankNode = function(s, t) {
	this.expect(s, "_:");
	var bname = s.slice(2).match(Turtle.simpleToken).shift();
	t.o = this.getBlankNode(bname);
	return s.slice(bname.length + 2);
};
Turtle.prototype.consumeLiteral = function(s, o) {
	var char = s[0];
	var value = "";
	var end = 0;
	var longchar = char+char+char;
	if(s.substring(0, 3) == longchar) {
		for(end=3; end<s.length; end++){
			if(s[end]=='\\') end++;
			else if(s[end]==char && s[end+1]==char && s[end+2]==char) break;
		}
		value = s.substring(3, end);
		s = s.slice(value.length + 6);
	} else {
		for(end=1; end<s.length; end++){
			if(s[end]=='\\') end++;
			else if(s[end]==char) break;
		}
		value = s.substring(1, end);
		s = s.slice(value.length + 2);
	}
	value = parsers.decodeString(value);
	switch(s.charAt(0)) {
		case "@":
			var langtag = s.match(Turtle.simpleObjectToken).shift();
			o.o = this.createLiteral(value, langtag.slice(1), null);
			s = s.slice(langtag.length);
			break;
		case "^":
			this.expect(s, "^^");
			s = s.substring(2);
			var iri_val;
			if(s.charAt(0) == "<"){
				var iri_end = s.indexOf(">");
				if(iri_end<0) throw new Error('Could not find terminating ">"');
				var iri_esc = s.substring(1, iri_end);
				iri_val = this.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(iri_esc)).toString());
				s = this.skipWS(s.substring(iri_end+1));
			}else{
				var prefixedName = Turtle.PrefixedName.exec(s);
				if(!prefixedName) throw new Error('Expected PrefixedName');
				prefixedName = prefixedName[0];
				iri_val = this.environment.resolve(parsers.decodePrefixedName(prefixedName));
				if(!iri_val) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(prefixedName)));
				s = this.skipWS(s.slice(prefixedName.length));
			}
			o.o = this.createLiteral(value, null, iri_val);
			break;
		default:
			o.o = this.createLiteral(value, null, null);
			break;
	}
	return s;
};
Turtle.prototype.consumeObjectList = function(s, subject, property) {
	var cont = true;
	while(cont) {
		var o = this.t();
		switch(s.charAt(0)) {
			case "[": s = this.consumeBlankNode(s, o); break;
			case "_": s = this.consumeKnownBlankNode(s, o); break;
			case "(": s = this.consumeCollection(s, o); break;
			case "<": s = this.consumeURI(s, o); break;
			case '"': case "'": s = this.consumeLiteral(s, o); break;
			case '+': case '-': case '.':
			case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				var token;
				if(token = Turtle.tokenDouble.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("double"));
				} else if(token = Turtle.tokenDecimal.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("decimal"));
				} else if(token = Turtle.tokenInteger.exec(s)){
					token = token[0];
					o.o = this.createLiteral(token, null, xsdns("integer"));
				} else {
					throw new Error("Expected NumericLiteral");
				}
				s = s.slice(token.length);
				break;
			default:
				var token = s.match(Turtle.simpleObjectToken);
				var prefixedName;
				token = token&&token[0] || "";
				if(token.charAt(token.length - 1) == ".") {
					token = token.substring(0, token.length - 1);
				}
				if(token==="true" || token==="false"){
					o.o = this.createLiteral(token, null, xsdns("boolean"));
					s = s.slice(token.length);
				}else if(prefixedName=Turtle.PrefixedName.exec(token)) {
					var prefixedName = prefixedName[0];
					var iri = this.environment.resolve(parsers.decodePrefixedName(prefixedName));
					if(!iri) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(prefixedName)));
					o.o = this.createNamedNode(iri);
					if(!o.o) throw new Error('Prefix not defined for '+token);
					s = s.slice(prefixedName.length);
				} else {
					throw new Error("Unrecognised token in ObjectList: " + token);
				}
				break;
		}
		s = this.skipWS(s);
		this.add(this.createTriple(subject.o, property, o.o));
		cont = s.charAt(0)==",";
		if(cont) { s = this.skipWS(s.slice(1)); }
	}
	return s;
};
Turtle.prototype.consumePredicateObjectList = function(s, subject) {
	var cont = true;
	while(cont) {
		var predicate = s.match(Turtle.PrefixedName);
		if(predicate){
			predicate = predicate.shift();
			var iri = this.environment.resolve(parsers.decodePrefixedName(predicate));
			if(!iri) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(predicate)));
			property = this.createNamedNode(iri);
			s = this.skipWS(s.slice(predicate.length));
			s = this.consumeObjectList(s, subject, property);
			continue;
		}
		switch(s.charAt(0)) {
			case "a":
				var property = this.createNamedNode(rdfns("type"));
				s = this.skipWS(s.substring(1));
				break;
			case "<":
				var iri_end = s.indexOf(">");
				var iri = s.substring(1, iri_end);
				property = this.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(iri)).toString());
				s = this.skipWS(s.substring(iri_end+1));
				break;
			case "]": return s;
			case ".": return s;
			case ";":
				// empty predicate, skip
				s = this.skipWS(s.substring(1));
				continue;
			default:
				throw new Error('Expected PrefixedName');
		}
		s = this.consumeObjectList(s, subject, property);
		cont = s.charAt(0)==";";
		if(cont) { s = this.skipWS(s.slice(1)); }
	}
	return s;
};
Turtle.prototype.consumePrefixedName = function(s, t) {
	var name = s.match(Turtle.PrefixedName).shift();
	var iri = this.environment.resolve(parsers.decodePrefixedName(name));
	if(!iri) throw new Error('Could not resolve '+JSON.stringify(parsers.decodePrefixedName(name)));
	t.o = this.createNamedNode(iri);
	return s.slice(name.length);
};
Turtle.prototype.consumeStatement = function(s) {
	var t = this.t();
	switch(s.charAt(0)) {
		case "[":
			s = this.consumeBlankNode(s, t);
			if(s.charAt(0) == ".") return s.slice(1);
			break;
		case "_": s = this.consumeKnownBlankNode(s, t); break;
		case "(": s = this.consumeCollection(s, t); break;
		case "<": s = this.consumeURI(s, t); break;
		default: s = this.consumePrefixedName(s, t); break;
	}
	s = this.consumePredicateObjectList(this.skipWS(s), t);
	this.expect(s, ".");
	return s.slice(1);
};
Turtle.prototype.consumeURI = function(s, t) {
	this.expect(s, "<");
	var p = 0;
	t.o = this.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p=s.indexOf(">")))).toString());
	return s.slice(++p);
};
Turtle.prototype.getBlankNode = function(id) {
	if(this.bnHash[id]) return this.bnHash[id];
	return this.bnHash[id]=this.createBlankNode();
};
Turtle.prototype.skipWS = function(s) {
	while(Turtle.isWhitespace.test(s.charAt(0))) {
		s = s.replace(Turtle.initialWhitespace, "");
		if(s.charAt(0) == "#") {
			s = s.replace(Turtle.initialComment, "");
		}
	}
	return s;
};

},{"./environment.js":15,"iri":19}],14:[function(require,module,exports){
"use strict";

// #x22#x5C#xA#xD
var encodeMap = {
	'"': '\\"',
	'\\': '\\\\',
	"\r": '\\r',
	"\n": '\\n',
	"\t": '\\t',
};

// Takes a string and produces an escaped Turtle String production but without quotes
module.exports = encodeASCIIString;

// Use this to output the unicode character whenever it's legal in N-Triples
// var encodeSearch = /["\r\n\\]/g;
// function encodeString(str) {
// 	return str.replace(encodeSearch, function(a, b){
// 		return encodeMap[b];
// 	});
// }

var encodeASCIIStringSearch = /(["\r\n\t\\])|([\u0080-\uD7FF\uE000-\uFFFF])|([\uD800-\uDBFF][\uDC00-\uDFFF])/g;
function encodeASCIIStringReplace(a, b, c, d){
	if(b){
		// These characters must be escaped
		// Actually \t doesn't have to, but it's allowed and common to do so
		return encodeMap[b];
	}
	if(c){
		// The match is a non-ASCII code point that's not a surrogate pair
		return '\\u'+('0000'+c.charCodeAt(0).toString(16).toUpperCase()).substr(-4);
	}
	if(d){
		// The match is a UTF-16 surrogate pair, compute the UTF-32 codepoint
		var hig = d.charCodeAt(0);
		var low = d.charCodeAt(1);
		var code = (hig - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000;
		return '\\U'+('00000000'+code.toString(16).toUpperCase()).substr(-8);
	}
}

// Return a Turtle string with backslash escapes for all non-7-bit characters
function encodeASCIIString(str){
	return str.replace(encodeASCIIStringSearch, encodeASCIIStringReplace);
}

},{}],15:[function(require,module,exports){
var RDFEnvironment = require("./RDFEnvironment.js").RDFEnvironment;
var env = exports.environment = new RDFEnvironment;
require('./prefixes.js').loadDefaultPrefixMap(env);

},{"./RDFEnvironment.js":10,"./prefixes.js":17}],16:[function(require,module,exports){

exports.ns = function(prefix){
	if(typeof prefix!='string') throw new TypeError('Expected argument[0] `prefix` to be a string');
	return function(suffix){
		if(typeof suffix!='string') throw new TypeError('Expected argument[0] `suffix` to be a string');
		return prefix.concat(suffix);
	};
}

exports.rdfns = exports.ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
exports.rdfsns = exports.ns('http://www.w3.org/2000/01/rdf-schema#');
exports.xsdns = exports.ns('http://www.w3.org/2001/XMLSchema#');

},{}],17:[function(require,module,exports){
"use strict";

exports.loadRequiredPrefixMap = function(context){
	context.setPrefix("owl", "http://www.w3.org/2002/07/owl#");
	context.setPrefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
	context.setPrefix("rdfs", "http://www.w3.org/2000/01/rdf-schema#");
	context.setPrefix("rdfa", "http://www.w3.org/ns/rdfa#");
	context.setPrefix("xhv", "http://www.w3.org/1999/xhtml/vocab#");
	context.setPrefix("xml", "http://www.w3.org/XML/1998/namespace");
	context.setPrefix("xsd", "http://www.w3.org/2001/XMLSchema#");
};
exports.loadDefaultPrefixMap = function(context){
	exports.loadRequiredPrefixMap(context);
	context.setPrefix("grddl", "http://www.w3.org/2003/g/data-view#");
	context.setPrefix("powder", "http://www.w3.org/2007/05/powder#");
	context.setPrefix("powders", "http://www.w3.org/2007/05/powder-s#");
	context.setPrefix("rif", "http://www.w3.org/2007/rif#");
	context.setPrefix("atom", "http://www.w3.org/2005/Atom/");
	context.setPrefix("xhtml", "http://www.w3.org/1999/xhtml#");
	context.setPrefix("formats", "http://www.w3.org/ns/formats/");
	context.setPrefix("xforms", "http://www.w3.org/2002/xforms/");
	context.setPrefix("xhtmlvocab", "http://www.w3.org/1999/xhtml/vocab/");
	context.setPrefix("xpathfn", "http://www.w3.org/2005/xpath-functions#");
	//context.setPrefix("http", "http://www.w3.org/2006/http#");
	context.setPrefix("link", "http://www.w3.org/2006/link#");
	context.setPrefix("time", "http://www.w3.org/2006/time#");
	context.setPrefix("acl", "http://www.w3.org/ns/auth/acl#");
	context.setPrefix("cert", "http://www.w3.org/ns/auth/cert#");
	context.setPrefix("rsa", "http://www.w3.org/ns/auth/rsa#");
	context.setPrefix("crypto", "http://www.w3.org/2000/10/swap/crypto#");
	context.setPrefix("list", "http://www.w3.org/2000/10/swap/list#");
	context.setPrefix("log", "http://www.w3.org/2000/10/swap/log#");
	context.setPrefix("math", "http://www.w3.org/2000/10/swap/math#");
	context.setPrefix("os", "http://www.w3.org/2000/10/swap/os#");
	context.setPrefix("string", "http://www.w3.org/2000/10/swap/string#");
	context.setPrefix("doc", "http://www.w3.org/2000/10/swap/pim/doc#");
	context.setPrefix("contact", "http://www.w3.org/2000/10/swap/pim/contact#");
	context.setPrefix("p3p", "http://www.w3.org/2002/01/p3prdfv1#");
	context.setPrefix("swrl", "http://www.w3.org/2003/11/swrl#");
	context.setPrefix("swrlb", "http://www.w3.org/2003/11/swrlb#");
	context.setPrefix("exif", "http://www.w3.org/2003/12/exif/ns#");
	context.setPrefix("earl", "http://www.w3.org/ns/earl#");
	context.setPrefix("ma", "http://www.w3.org/ns/ma-ont#");
	context.setPrefix("sawsdl", "http://www.w3.org/ns/sawsdl#");
	context.setPrefix("sd", "http://www.w3.org/ns/sparql-service-description#");
	context.setPrefix("skos", "http://www.w3.org/2004/02/skos/core#");
	context.setPrefix("fresnel", "http://www.w3.org/2004/09/fresnel#");
	context.setPrefix("gen", "http://www.w3.org/2006/gen/ont#");
	context.setPrefix("timezone", "http://www.w3.org/2006/timezone#");
	context.setPrefix("skosxl", "http://www.w3.org/2008/05/skos-xl#");
	context.setPrefix("org", "http://www.w3.org/ns/org#");
	context.setPrefix("ical", "http://www.w3.org/2002/12/cal/ical#");
	context.setPrefix("wgs84", "http://www.w3.org/2003/01/geo/wgs84_pos#");
	context.setPrefix("vcard", "http://www.w3.org/2006/vcard/ns#");
	context.setPrefix("turtle", "http://www.w3.org/2008/turtle#");
	context.setPrefix("pointers", "http://www.w3.org/2009/pointers#");
	context.setPrefix("dcat", "http://www.w3.org/ns/dcat#");
	context.setPrefix("imreg", "http://www.w3.org/2004/02/image-regions#");
	context.setPrefix("rdfg", "http://www.w3.org/2004/03/trix/rdfg-1/");
	context.setPrefix("swp", "http://www.w3.org/2004/03/trix/swp-2/");
	context.setPrefix("rei", "http://www.w3.org/2004/06/rei#");
	context.setPrefix("wairole", "http://www.w3.org/2005/01/wai-rdf/GUIRoleTaxonomy#");
	context.setPrefix("states", "http://www.w3.org/2005/07/aaa#");
	context.setPrefix("wn20schema", "http://www.w3.org/2006/03/wn/wn20/schema/");
	context.setPrefix("httph", "http://www.w3.org/2007/ont/httph#");
	context.setPrefix("act", "http://www.w3.org/2007/rif-builtin-action#");
	context.setPrefix("common", "http://www.w3.org/2007/uwa/context/common.owl#");
	context.setPrefix("dcn", "http://www.w3.org/2007/uwa/context/deliverycontext.owl#");
	context.setPrefix("hard", "http://www.w3.org/2007/uwa/context/hardware.owl#");
	context.setPrefix("java", "http://www.w3.org/2007/uwa/context/java.owl#");
	context.setPrefix("loc", "http://www.w3.org/2007/uwa/context/location.owl#");
	context.setPrefix("net", "http://www.w3.org/2007/uwa/context/network.owl#");
	context.setPrefix("push", "http://www.w3.org/2007/uwa/context/push.owl#");
	context.setPrefix("soft", "http://www.w3.org/2007/uwa/context/software.owl#");
	context.setPrefix("web", "http://www.w3.org/2007/uwa/context/web.owl#");
	context.setPrefix("content", "http://www.w3.org/2008/content#");
	context.setPrefix("vs", "http://www.w3.org/2003/06/sw-vocab-status/ns#");
	context.setPrefix("air", "http://dig.csail.mit.edu/TAMI/2007/amord/air#");
	context.setPrefix("ex", "http://example.org/");
	context.setPrefix("dc", "http://purl.org/dc/terms/");
	context.setPrefix("dc11", "http://purl.org/dc/elements/1.1/");
	context.setPrefix("dctype", "http://purl.org/dc/dcmitype/");
	context.setPrefix("foaf", "http://xmlns.com/foaf/0.1/");
	context.setPrefix("cc", "http://creativecommons.org/ns#");
	context.setPrefix("opensearch", "http://a9.com/-/spec/opensearch/1.1/");
	context.setPrefix("void", "http://rdfs.org/ns/void#");
	context.setPrefix("sioc", "http://rdfs.org/sioc/ns#");
	context.setPrefix("sioca", "http://rdfs.org/sioc/actions#");
	context.setPrefix("sioct", "http://rdfs.org/sioc/types#");
	context.setPrefix("lgd", "http://linkedgeodata.org/vocabulary#");
	context.setPrefix("moat", "http://moat-project.org/ns#");
	context.setPrefix("days", "http://ontologi.es/days#");
	context.setPrefix("giving", "http://ontologi.es/giving#");
	context.setPrefix("lang", "http://ontologi.es/lang/core#");
	context.setPrefix("like", "http://ontologi.es/like#");
	context.setPrefix("status", "http://ontologi.es/status#");
	context.setPrefix("og", "http://opengraphprotocol.org/schema/");
	context.setPrefix("protege", "http://protege.stanford.edu/system#");
	context.setPrefix("dady", "http://purl.org/NET/dady#");
	context.setPrefix("uri", "http://purl.org/NET/uri#");
	context.setPrefix("audio", "http://purl.org/media/audio#");
	context.setPrefix("video", "http://purl.org/media/video#");
	context.setPrefix("gridworks", "http://purl.org/net/opmv/types/gridworks#");
	context.setPrefix("hcterms", "http://purl.org/uF/hCard/terms/");
	context.setPrefix("bio", "http://purl.org/vocab/bio/0.1/");
	context.setPrefix("cs", "http://purl.org/vocab/changeset/schema#");
	context.setPrefix("geographis", "http://telegraphis.net/ontology/geography/geography#");
	context.setPrefix("doap", "http://usefulinc.com/ns/doap#");
	context.setPrefix("daml", "http://www.daml.org/2001/03/daml+oil#");
	context.setPrefix("geonames", "http://www.geonames.org/ontology#");
	context.setPrefix("sesame", "http://www.openrdf.org/schema/sesame#");
	context.setPrefix("cv", "http://rdfs.org/resume-rdf/");
	context.setPrefix("wot", "http://xmlns.com/wot/0.1/");
	context.setPrefix("media", "http://purl.org/microformat/hmedia/");
	context.setPrefix("ctag", "http://commontag.org/ns#");
};

},{}],18:[function(require,module,exports){
"use strict";

function xsdns(v){ return 'http://www.w3.org/2001/XMLSchema#'.concat(v) }

exports.stringConverter = function stringConverter(value, inputType) {
	return new String(value).valueOf();
};
exports.booleanConverter = function booleanConverter(value, inputType) {
	switch(value){
		case "false":case "0": return false;
		case "true":case "1": return true;
	}
	return(new Boolean(value)).valueOf();
};
exports.numberConverter = function numberConverter(value, inputType) {
	return(new Number(value)).valueOf();
};
exports.floatConverter = function floatConverter(value, inputType) {
	switch(value){
		case "INF": return Number.POSITIVE_INFINITY;
		case "-INF": return Number.NEGATIVE_INFINITY;
		default: return exports.numberConverter(value, inputType);
	};
};
exports.dateConverter = function dateConverter(value, inputType) {
	return new Date(value);
};

exports.loadDefaultTypeConverters = function(context){
	context.registerTypeConversion(xsdns("string"), exports.stringConverter);
	context.registerTypeConversion(xsdns("boolean"), exports.booleanConverter);
	context.registerTypeConversion(xsdns("float"), exports.floatConverter);
	context.registerTypeConversion(xsdns("integer"), exports.numberConverter);
	context.registerTypeConversion(xsdns("long"), exports.numberConverter);
	context.registerTypeConversion(xsdns("double"), exports.numberConverter);
	context.registerTypeConversion(xsdns("decimal"), exports.numberConverter);
	context.registerTypeConversion(xsdns("nonPositiveInteger"), exports.numberConverter);
	context.registerTypeConversion(xsdns("nonNegativeInteger"), exports.numberConverter);
	context.registerTypeConversion(xsdns("negativeInteger"), exports.numberConverter);
	context.registerTypeConversion(xsdns("int"), exports.numberConverter);
	context.registerTypeConversion(xsdns("unsignedLong"), exports.numberConverter);
	context.registerTypeConversion(xsdns("positiveInteger"), exports.numberConverter);
	context.registerTypeConversion(xsdns("short"), exports.numberConverter);
	context.registerTypeConversion(xsdns("unsignedInt"), exports.numberConverter);
	context.registerTypeConversion(xsdns("byte"), exports.numberConverter);
	context.registerTypeConversion(xsdns("unsignedShort"), exports.numberConverter);
	context.registerTypeConversion(xsdns("unsignedByte"), exports.numberConverter);
	context.registerTypeConversion(xsdns("date"), exports.dateConverter);
	context.registerTypeConversion(xsdns("time"), exports.dateConverter);
	context.registerTypeConversion(xsdns("dateTime"), exports.dateConverter);
};

},{}],19:[function(require,module,exports){
var api = exports;

api.encodeString = function encodeString(s) {
	var out = "";
	var skip = false;
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(!skip) {
			var code = s.charCodeAt(i);
			if(55296 <= code && code <= 56319) {
				var low = s.charCodeAt(i + 1);
				code = (code - 55296) * 1024 + (low - 56320) + 65536;
				skip = true;
			}
			if(code > 1114111) { throw new Error("Char out of range"); }
			var hex = "00000000".concat((new Number(code)).toString(16).toUpperCase());
			if(code >= 65536) {
				out += "\\U" + hex.slice(-8);
			} else {
				if(code >= 127 || code <= 31) {
					switch(code) {
						case 9:	out += "\\t"; break;
						case 10: out += "\\n"; break;
						case 13: out += "\\r"; break;
						default: out += "\\u" + hex.slice(-4); break;
					}
				} else {
					switch(code) {
						case 34: out += '\\"'; break;
						case 92: out += "\\\\"; break;
						default: out += s.charAt(i); break;
					}
				}
			}
		} else {
			skip = !skip;
		}
	}
	return out;
}

/**
 * IRI
 */
api.IRI = IRI;
function IRI(iri) { this.value = iri; };
IRI.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
//IRI.prototype = new api.RDFNode;
IRI.prototype.toString = function toString() { return this.value; }
IRI.prototype.nodeType = function nodeType() { return "IRI"; };
IRI.prototype.toNT = function toNT() { return "<" + api.encodeString(this.value) + ">"; };
IRI.prototype.n3 = function n3() { return this.toNT(); }
IRI.prototype.defrag = function defrag() {
	var i = this.value.indexOf("#");
	return (i < 0) ? this : new IRI(this.value.slice(0, i));
}
IRI.prototype.isAbsolute = function isAbsolute() {
	return this.scheme()!=null && this.heirpart()!=null && this.fragment()==null;
}
IRI.prototype.toAbsolute = function toAbsolute() {
	if(this.scheme() == null && this.heirpart() == null) { throw new Error("IRI must have a scheme and a heirpart!"); }
	return this.resolveReference(this.value).defrag();
}
IRI.prototype.authority = function authority() {
	var heirpart = this.heirpart();
	if(heirpart.substring(0, 2) != "//") return null;
	var authority = heirpart.slice(2);
	var q = authority.indexOf("/");
	return q>=0 ? authority.substring(0, q) : authority;
}
IRI.prototype.fragment = function fragment() {
	var i = this.value.indexOf("#");
	return (i<0) ? null : this.value.slice(i);
}
IRI.prototype.heirpart = function heirpart() {
	var heirpart = this.value;
	var q = heirpart.indexOf("?");
	if(q >= 0) {
		heirpart = heirpart.substring(0, q);
	} else {
		q = heirpart.indexOf("#");
		if(q >= 0) heirpart = heirpart.substring(0, q);
	}
	var q2 = this.scheme();
	if(q2 != null) heirpart = heirpart.slice(1 + q2.length);
	return heirpart;
}
IRI.prototype.host = function host() {
	var host = this.authority();
	var q = host.indexOf("@");
	if(q >= 0) host = host.slice(++q);
	if(host.indexOf("[") == 0) {
		q = host.indexOf("]");
		if(q > 0) return host.substring(0, q);
	}
	q = host.lastIndexOf(":");
	return q >= 0 ? host.substring(0, q) : host;
}
IRI.prototype.path = function path() {
	var q = this.authority();
	if(q == null) return this.heirpart();
	return this.heirpart().slice(q.length + 2);
}
IRI.prototype.port = function port() {
	var host = this.authority();
	var q = host.indexOf("@");
	if(q >= 0) host = host.slice(++q);
	if(host.indexOf("[") == 0) {
		q = host.indexOf("]");
		if(q > 0) return host.substring(0, q);
	}
	q = host.lastIndexOf(":");
	if(q < 0) return null;
	host = host.slice(++q);
	return host.length == 0 ? null : host;
}
IRI.prototype.query = function query() {
	var q = this.value.indexOf("?");
	if(q < 0) return null;
	var f = this.value.indexOf("#");
	if(f < 0) return this.value.slice(q);
	return this.value.substring(q, f)
}
api.removeDotSegments = function removeDotSegments(input) {
	var output = "";
	var q = 0;
	while(input.length > 0) {
		if(input.substr(0, 3) == "../" || input.substr(0, 2) == "./") {
			input = input.slice(input.indexOf("/"));
		}else if(input == "/.") {
			input = "/";
		}else if(input.substr(0, 3) == "/./") {
			input = input.slice(2);
		}else if(input.substr(0, 4) == "/../" || input == "/..") {
			input = (input=="/..") ? "/" : input.slice(3);
			q = output.lastIndexOf("/");
			output = (q>=0) ? output.substring(0, q) : "";
		}else if(input.substr(0, 2) == ".." || input.substr(0, 1) == ".") {
			input = input.slice(input.indexOf("."));
			q = input.indexOf(".");
			if(q >= 0) input = input.slice(q);
		}else {
			if(input.substr(0, 1) == "/") {
				output += "/";
				input = input.slice(1);
			}
			q = input.indexOf("/");
			if(q < 0) {
				output += input;
				input = "";
			}else {
				output += input.substring(0, q);
				input = input.slice(q);
			}
		}
	}
	return output;
}
IRI.prototype.resolveReference = function resolveReference(ref) {
	var reference;
	if(typeof ref == "string") {
		reference = new IRI(ref);
	}else if(ref.nodeType && ref.nodeType() == "IRI") {
		reference = ref;
	}else {
		throw new Error("Expected IRI or String");
	}
	var T = {scheme:"", authority:"", path:"", query:"", fragment:""};
	var q = "";
	if(reference.scheme() != null) {
		T.scheme = reference.scheme();
		q = reference.authority();
		T.authority += q!=null ? "//"+q : "";
		T.path = api.removeDotSegments(reference.path());
		T.query += reference.query()||'';
	}else {
		q = reference.authority();
		if(q != null) {
			T.authority = q!=null ? "//"+q : "";
			T.path = api.removeDotSegments(reference.path());
			T.query += reference.query()||'';
		}else {
			q = reference.path();
			if(q == "" || q == null) {
				T.path = this.path();
				q = reference.query();
				if(q != null) {
					T.query += q;
				}else {
					q = this.query();
					T.query += q!=null ? q : "";
				}
			}else {
				if(q.substring(0, 1) == "/") {
					T.path = api.removeDotSegments(q);
				}else {
					if(this.path() != null) {
						var q2 = this.path().lastIndexOf("/");
						if(q2 >= 0) {
							T.path = this.path().substring(0, ++q2);
						}
						T.path += reference.path();
					}else {
						T.path = "/" + q
					}
					T.path = api.removeDotSegments(T.path);
				}
				T.query += reference.query()||'';
			}
			q = this.authority();
			T.authority = q!=null ? "//" + q : "";
		}
		T.scheme = this.scheme();
	}
	T.fragment = reference.fragment()||'';
	return new IRI(T.scheme + ":" + T.authority + T.path + T.query + T.fragment);
}
IRI.prototype.scheme = function scheme() {
	var scheme = this.value.match(IRI.SCHEME_MATCH);
	return (scheme == null) ? null : scheme.shift().slice(0, -1);
}
IRI.prototype.userinfo = function userinfo() {
	var authority = this.authority();
	var q = authority.indexOf("@");
	return (q < 0) ? null : authority.substring(0, q);
}
IRI.prototype.toURIString = function toURIString(){
	return this.value.replace(/([\uA0-\uD7FF\uE000-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF])/g, function(a){return encodeURI(a);});
}
IRI.prototype.toIRIString = function toIRIString(){
	// HEXDIG requires capital characters
	// 80-BF is following bytes, (%[89AB][0-9A-F])
	// 00-7F no bytes follow (%[0-7][0-9A-F])(%[89AB][0-9A-F]){0}
	// C0-DF one byte follows (%[CD][0-9A-F])(%[89AB][0-9A-F]){1}
	// E0-EF two bytes follow (%[E][0-9A-F])(%[89AB][0-9A-F]){2}
	// F0-F7 three bytes follow (%[F][0-7])(%[89AB][0-9A-F]){3}
	// F8-FB four bytes follow (%[F][89AB])(%[89AB][0-9A-F]){4}
	// FC-FD five bytes follow (%[F][CD])(%[89AB][0-9A-F]){5}
	var utf8regexp = /%([2-7][0-9A-F])|%[CD][0-9A-F](%[89AB][0-9A-F])|%[E][0-9A-F](%[89AB][0-9A-F]){2}|%[F][0-7](%[89AB][0-9A-F]){3}|%[F][89AB](%[89AB][0-9A-F]){4}|%[F][CD](%[89AB][0-9A-F]){5}/g;
	// reserved characters := gen-delims, space, and sub-delims
	// : / ? # [ ] @   ! $ & ' ( ) * + , ; =
	var reserved = [ '3A', '2F', '3F', '23', '5B', '5D', '40', '20', '21', '24', '26', '27', '28', '29', '2A', '2B', '2C', '3B', '3D'];
	var iri = this.toString().replace(utf8regexp, function(a, b){
		if(reserved.indexOf(b)>=0) return a;
		return decodeURIComponent(a);
	});
	return iri;
}

IRI.prototype.toIRI = function toIRI(){
	return new IRI(this.toIRIString());
}

// Create a new IRI object and decode UTF-8 escaped characters
api.fromURI = function fromURI(uri){
	return new IRI(uri).toIRI();
}

api.toIRIString = function toIRIString(uri){
	return new IRI(uri).toIRIString();
}

},{}],20:[function(require,module,exports){

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
    var result = parse(baseIRI, templateRoot);
    var rdoc = result.parser.generateDocument(result.document, dataGraph);
    while(renderRoot.firstChild) renderRoot.removeChild(renderRoot.firstChild);
    renderRoot.appendChild(rdoc.getElementById('main-content'));
}

},{"rdf":27,"rdfa":43,"rdfa-template":21}],21:[function(require,module,exports){
module.exports = require('../../index.js');

},{"../../index.js":22}],22:[function(require,module,exports){

var rdf = require('rdf');
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
	// Set contextList to an Array so it will save every RDFa context in the order it encounters them
	this.contextList = [];
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
	// Make a copy of the array but skip the first query;
	// bindings for this top-level query must be provided in initialBindings.
	var outputResultSets = self.outputResultSets.slice(1);
	// Also make a copy of the contextList and recover the mapping of nodes => RDFaTemplateContext instances
	// Trim off the first context which is above the document node
	var contextList = self.contextList.slice(1);
	// Copy query information
	var node=template, clone=output;
	while(node && node!==template.nextSibling && node!==template.parentNode){
		if(outputResultSets[0] && node===outputResultSets[0].node){
			clone.rdfaTemplateQuery = outputResultSets.shift();
		}
		if(contextList[0] && node===contextList[0].node){
			clone.rdfaTemplateContext = contextList.shift();
		}else if(node.nodeType==node.ELEMENT_NODE){
			console.error(node.localName);
			console.error(contextList.map(function(e){return e.node.localName;}));
			throw new Error('Unknown node');
		}
		if(node.firstChild){
			node=node.firstChild, clone=clone.firstChild;
		}else{
			while(node && !node.nextSibling) node=node.parentNode, clone=clone.parentNode;
			if(node) node=node.nextSibling, clone=clone.nextSibling;
		}
	}
	if(outputResultSets.length){
		throw new Error('Could not find all outputResultSets nodes');
	}
	if(contextList.length){
		throw new Error('Could not find all contextList nodes');
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
				// Recursively copy the rdfaTemplateQuery, rdfaTemplateContext properties
				for(var n=itemTemplate, m=newItem; n!==itemTemplate.nextSibling && n!==itemTemplate.parentNode;){
					m.rdfaTemplateQuery = n.rdfaTemplateQuery;
					m.rdfaTemplateContext = n.rdfaTemplateContext;
					if(n.firstChild){
						n = n.firstChild, m = m.firstChild;
					}else{
						while(n && !n.nextSibling) n = n.parentNode, m = m.parentNode;
						if(n) n = n.nextSibling, m = m.nextSibling;
					}
				}
				newItem.rdfaTemplateQuery = null;
				newItem.rdfaTemplateBindings = record;
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
					}else{
						node.setAttribute(attributeName, attributeValue);
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
						var target = bindingsNode.rdfaTemplateBindings[varname].toString();
						var base = node.rdfaTemplateContext.base;
						// TODO Use a library to produce a relative URI Reference if possible
						var match = base.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?/);
						if(match && match[0]==target.substring(0, match[0].length)){
							node.setAttribute(attributeName, target.substring(match[0].length))
						}else{
							node.setAttribute(attributeName, target);
						}
						node.removeAttribute(patternName);
					}else{
						node.setAttribute(attributeName, attributeValue);
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
					}else{
						node.setAttribute(attributeName, attributeValue);
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

},{"./lib/query.js":23,"rdf":27,"rdfa":43}],23:[function(require,module,exports){
/** Memory Database, an in-memory RDF store
 */
var rdf = require('rdf');
var Query = require('../index.js').Query;

module.exports.evaluateQuery = function(dataGraph, query, initialBindings){
	var queryGraph = dataGraph;
	var self=this;

	initialBindings = initialBindings||{};
	var bindings = {};

	var matches = [];
	
	function indexVariable(v){
		if(v.termType=='BlankNode'){
			matchVariables[v] = { label:v.toString(), type:'BlankNode' };
		}else if(v.termType=='Variable'){
			matchVariables[v] = { label:v.toString(), type:'Variable' };
		}
	}

	var matchVariables = {};
	var matchStatements = [];
	for(var q = query; q; q = q.parent){
		q.statements.forEach(function parsePattern(pattern){
			matchStatements.push(pattern);
			indexVariable(pattern.subject);
			indexVariable(pattern.predicate);
			indexVariable(pattern.object);
		});
	}
	var matchVariablesList = Object.values(matchVariables);
	matchVariablesList.forEach(function(b){
		if(b.type=='Variable' && initialBindings[b.label]){
			bindings[b.label] = initialBindings[b.label];
		}
	});
	
	var stack = [ {i:0, depth:Object.keys(bindings).length, bindings:bindings} ];
	while(stack.length){
		var state = stack.pop();
		if(state.i===matchStatements.length) return []; //throw new Error('Everything already evaluated??');
		// if(state.depth===matchVariablesList.length) debugger;
		// if(state.depth===matchVariablesList.length) throw new Error('Everything already bound??'+state.depth);
		var stmt = matchStatements[state.i];
		// If it's a bnode, then map it. If it's not mapped, use `null` to search for any values.
		// in theory the predicate will never be a bnode, but the additional test shouldn't hurt anything
		var stmtsubject = (stmt.subject.termType==='BlankNode' || stmt.subject.termType==='Variable') ? (state.bindings[stmt.subject] || null) : stmt.subject ;
		var stmtpredicate = (stmt.predicate.termType==='BlankNode' || stmt.predicate.termType==='Variable') ? (state.bindings[stmt.predicate] || null) : stmt.predicate ;
		var stmtobject = (stmt.object.termType==='BlankNode' || stmt.object.termType==='Variable') ? (state.bindings[stmt.object] || null) : stmt.object ;
		var stmtMatches = dataGraph.match(stmtsubject, stmtpredicate, stmtobject).filter(function(m){
			// certain things we can filter out right away, do that here
//			if(stmtsubject===null && m.subject.nodeType()!=='BlankNode') return false;
//			if(stmtpredicate===null && m.predicate.nodeType()!=='BlankNode') return false;
//			if(stmtobject===null && m.object.nodeType()!=='BlankNode') return false;
			return true;
		});
		// otherwise there's an unbound bnode, get the possible mappings and push those onto the stack
		stmtMatches.forEach(function(match){
			var b2 = {};
			var depth = state.depth
			for(var n in state.bindings) b2[n] = state.bindings[n];
			if(stmtsubject===null){
				if(b2[stmt.subject]===undefined){
					b2[stmt.subject] = match.subject;
					depth++;
				}else{
					return;
				}
			}
			if(stmtpredicate===null && b2[stmt.predicate]===undefined){
				if(b2[stmt.predicate]===undefined){
					b2[stmt.predicate] = match.predicate;
					depth++;
				}else{
					return;
				}
			}
			if(stmtobject===null){
				if(b2[stmt.object]===undefined){
					b2[stmt.object] = match.object;
					depth++;
				}else{
					return;
				}
			}
			if(state.i+1===matchStatements.length){
				matches.push(b2);
			}else{
				stack.push({ i:state.i+1, depth:depth, bindings:b2 });
			}
		});
	}

	if(query.order){
		matches.sort(function(a, b){
			for(var i=0; i<query.order.length; i++){
				var p = query.order[i];
				if(typeof p.expression=='string' && p.expression[0]=='?'){
					var varname = p.expression.substring(1);
					var av = a[varname];
					var bv = b[varname];
					var cmp = 0;
					if(av>bv) cmp = 1;
					else if(av<bv) cmp = -1;
				}else{
					throw new Error('Unknown sort order: '+JSON.stringify(p.expression));
				}
				if(cmp) return cmp * (p.descending?-1:1);
			}
		});
	}

	//return processResult(matches);
	return matches;
}

},{"../index.js":22,"rdf":27}],24:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],25:[function(require,module,exports){
var api = exports;

api.encodeString = function encodeString(s) {
	var out = "";
	var skip = false;
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(!skip) {
			var code = s.charCodeAt(i);
			if(55296 <= code && code <= 56319) {
				var low = s.charCodeAt(i + 1);
				code = (code - 55296) * 1024 + (low - 56320) + 65536;
				skip = true;
			}
			if(code > 1114111) { throw new Error("Char out of range"); }
			var hex = "00000000".concat((new Number(code)).toString(16).toUpperCase());
			if(code >= 65536) {
				out += "\\U" + hex.slice(-8);
			} else {
				if(code >= 127 || code <= 31) {
					switch(code) {
						case 9:	out += "\\t"; break;
						case 10: out += "\\n"; break;
						case 13: out += "\\r"; break;
						default: out += "\\u" + hex.slice(-4); break;
					}
				} else {
					switch(code) {
						case 34: out += '\\"'; break;
						case 92: out += "\\\\"; break;
						default: out += s.charAt(i); break;
					}
				}
			}
		} else {
			skip = !skip;
		}
	}
	return out;
}

/**
 * IRI
 */
api.IRI = IRI;
function IRI(iri) { this.value = iri; };
IRI.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
//IRI.prototype = new api.RDFNode;
IRI.prototype.toString = function toString() { return this.value; }
IRI.prototype.nodeType = function nodeType() { return "IRI"; };
IRI.prototype.toNT = function toNT() { return "<" + api.encodeString(this.value) + ">"; };
IRI.prototype.n3 = function n3() { return this.toNT(); }
IRI.prototype.defrag = function defrag() {
	var i = this.value.indexOf("#");
	return (i < 0) ? this : new IRI(this.value.slice(0, i));
}
IRI.prototype.isAbsolute = function isAbsolute() {
	return this.getScheme()!=null && this.getHierpart()!=null && this.getFragment()==null;
}
IRI.prototype.toAbsolute = function toAbsolute() {
	if(this.getScheme() == null || this.getHierpart() == null) { throw new Error("IRI must have a scheme and a hierpart!"); }
	return this.resolveReference(this.value).defrag();
}
IRI.prototype.getAuthority = function getAuthority() {
	var hierpart = this.getHierpart();
	if(hierpart.substring(0, 2) != "//") return null;
	var authority = hierpart.slice(2);
	var q = authority.indexOf("/");
	return q>=0 ? authority.substring(0, q) : authority;
}
IRI.prototype.getFragment = function getFragment() {
	var i = this.value.indexOf("#");
	return (i<0) ? null : this.value.slice(i);
}
IRI.prototype.getHierpart = function getHierpart() {
	var hierpart = this.value;
	var q = hierpart.indexOf("?");
	if(q >= 0) {
		hierpart = hierpart.substring(0, q);
	} else {
		q = hierpart.indexOf("#");
		if(q >= 0) hierpart = hierpart.substring(0, q);
	}
	var q2 = this.getScheme();
	if(q2 != null) hierpart = hierpart.slice(1 + q2.length);
	return hierpart;
}
// Bad spelling. Deprecated.
IRI.prototype.heirpart = IRI.prototype.getHierpart;

IRI.prototype.getHost = function getHost() {
	var host = this.getAuthority();
	var q = host.indexOf("@");
	if(q >= 0) host = host.slice(++q);
	if(host.indexOf("[") == 0) {
		q = host.indexOf("]");
		if(q > 0) return host.substring(0, q);
	}
	q = host.lastIndexOf(":");
	return q >= 0 ? host.substring(0, q) : host;
}
IRI.prototype.getPath = function getPath() {
	var q = this.getAuthority();
	if(q == null) return this.getHierpart();
	return this.getHierpart().slice(q.length + 2);
}
IRI.prototype.getPort = function getPort() {
	var host = this.getAuthority();
	var q = host.indexOf("@");
	if(q >= 0) host = host.slice(++q);
	if(host.indexOf("[") == 0) {
		q = host.indexOf("]");
		if(q > 0) return host.substring(0, q);
	}
	q = host.lastIndexOf(":");
	if(q < 0) return null;
	host = host.slice(++q);
	return host.length == 0 ? null : host;
}
IRI.prototype.getQuery = function getQuery() {
	var q = this.value.indexOf("?");
	if(q < 0) return null;
	var f = this.value.indexOf("#");
	if(f < 0) return this.value.slice(q);
	return this.value.substring(q, f)
}
api.removeDotSegments = function removeDotSegments(input) {
	var output = "";
	var q = 0;
	while(input.length > 0) {
		if(input.substr(0, 3) == "../" || input.substr(0, 2) == "./") {
			input = input.slice(input.indexOf("/"));
		}else if(input == "/.") {
			input = "/";
		}else if(input.substr(0, 3) == "/./") {
			input = input.slice(2);
		}else if(input.substr(0, 4) == "/../" || input == "/..") {
			input = (input=="/..") ? "/" : input.slice(3);
			q = output.lastIndexOf("/");
			output = (q>=0) ? output.substring(0, q) : "";
		}else if(input.substr(0, 2) == ".." || input.substr(0, 1) == ".") {
			input = input.slice(input.indexOf("."));
			q = input.indexOf(".");
			if(q >= 0) input = input.slice(q);
		}else {
			if(input.substr(0, 1) == "/") {
				output += "/";
				input = input.slice(1);
			}
			q = input.indexOf("/");
			if(q < 0) {
				output += input;
				input = "";
			}else {
				output += input.substring(0, q);
				input = input.slice(q);
			}
		}
	}
	return output;
}
IRI.prototype.resolveReference = function resolveReference(ref) {
	var reference;
	if(typeof ref == "string") {
		reference = new IRI(ref);
	}else if(ref.nodeType && ref.nodeType() == "IRI") {
		reference = ref;
	}else {
		throw new Error("Expected IRI or String");
	}
	var T = {scheme:"", authority:"", path:"", query:"", fragment:""};
	var q = "";
	if(reference.getScheme() != null) {
		T.scheme = reference.getScheme();
		q = reference.getAuthority();
		T.authority += q!=null ? "//"+q : "";
		T.path = api.removeDotSegments(reference.getPath());
		T.query += reference.getQuery()||'';
	}else {
		q = reference.getAuthority();
		if(q != null) {
			T.authority = q!=null ? "//"+q : "";
			T.path = api.removeDotSegments(reference.getPath());
			T.query += reference.getQuery()||'';
		}else {
			q = reference.getPath();
			if(q == "" || q == null) {
				T.path = this.getPath();
				q = reference.getQuery();
				if(q != null) {
					T.query += q;
				}else {
					q = this.getQuery();
					T.query += q!=null ? q : "";
				}
			}else {
				if(q.substring(0, 1) == "/") {
					T.path = api.removeDotSegments(q);
				}else {
					if(this.getPath() != null) {
						var q2 = this.getPath().lastIndexOf("/");
						if(q2 >= 0) {
							T.path = this.getPath().substring(0, ++q2);
						}
						T.path += reference.getPath();
					}else {
						T.path = "/" + q
					}
					T.path = api.removeDotSegments(T.path);
				}
				T.query += reference.getQuery()||'';
			}
			q = this.getAuthority();
			T.authority = q!=null ? "//" + q : "";
		}
		T.scheme = this.getScheme();
	}
	T.fragment = reference.getFragment()||'';
	return new IRI(T.scheme + ":" + T.authority + T.path + T.query + T.fragment);
}
IRI.prototype.getScheme = function getScheme() {
	var scheme = this.value.match(IRI.SCHEME_MATCH);
	return (scheme == null) ? null : scheme.shift().slice(0, -1);
}
IRI.prototype.getUserinfo = function getUserinfo() {
	var authority = this.getAuthority();
	var q = authority.indexOf("@");
	return (q < 0) ? null : authority.substring(0, q);
}

// Deprecated function-call forms
IRI.prototype.authority = IRI.prototype.getAuthority;
IRI.prototype.fragment = IRI.prototype.getFragment;
IRI.prototype.scheme = IRI.prototype.getScheme;
IRI.prototype.hierpart = IRI.prototype.getHierpart;
IRI.prototype.host = IRI.prototype.getHost;
IRI.prototype.path = IRI.prototype.getPath;
IRI.prototype.port = IRI.prototype.getPort;
IRI.prototype.query = IRI.prototype.getQuery;
IRI.prototype.userinfo = IRI.prototype.getUserinfo;

IRI.prototype.toURIString = function toURIString(){
	return this.value.replace(/([\uA0-\uD7FF\uE000-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF])/g, function(a){return encodeURI(a);});
}
IRI.prototype.toIRIString = function toIRIString(){
	// HEXDIG requires capital characters
	// 80-BF is following bytes, (%[89AB][0-9A-F])
	// 00-7F no bytes follow (%[0-7][0-9A-F])(%[89AB][0-9A-F]){0}
	// C0-DF one byte follows (%[CD][0-9A-F])(%[89AB][0-9A-F]){1}
	// E0-EF two bytes follow (%[E][0-9A-F])(%[89AB][0-9A-F]){2}
	// F0-F7 three bytes follow (%[F][0-7])(%[89AB][0-9A-F]){3}
	// F8-FB four bytes follow (%[F][89AB])(%[89AB][0-9A-F]){4}
	// FC-FD five bytes follow (%[F][CD])(%[89AB][0-9A-F]){5}
	var utf8regexp = /%([2-7][0-9A-F])|%[CD][0-9A-F](%[89AB][0-9A-F])|%[E][0-9A-F](%[89AB][0-9A-F]){2}|%[F][0-7](%[89AB][0-9A-F]){3}|%[F][89AB](%[89AB][0-9A-F]){4}|%[F][CD](%[89AB][0-9A-F]){5}/g;
	// reserved characters := gen-delims, space, and sub-delims
	// : / ? # [ ] @   ! $ & ' ( ) * + , ; =
	var reserved = [ '3A', '2F', '3F', '23', '5B', '5D', '40', '20', '21', '24', '26', '27', '28', '29', '2A', '2B', '2C', '3B', '3D'];
	var iri = this.toString().replace(utf8regexp, function(a, b){
		if(reserved.indexOf(b)>=0) return a;
		return decodeURIComponent(a);
	});
	return iri;
}

IRI.prototype.toIRI = function toIRI(){
	return new IRI(this.toIRIString());
}

// Create a new IRI object and decode UTF-8 escaped characters
api.fromURI = function fromURI(uri){
	return new IRI(uri).toIRI();
}

api.toIRIString = function toIRIString(uri){
	return new IRI(uri).toIRIString();
}

},{}],26:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],27:[function(require,module,exports){
"use strict";

/**
 * RDF
 *
 * Implement a mash-up of the RDF Interfaces API, the RDF API, and first and foremost whatever makes sense for Node.js
 */

var api = exports;

api.Triple = require('./lib/RDFNode.js').Triple;
api.RDFNode = require("./lib/RDFNode.js").RDFNode;
api.Term = api.RDFNode;
api.NamedNode = require("./lib/RDFNode.js").NamedNode;
api.BlankNode = require("./lib/RDFNode.js").BlankNode;
api.Literal = require("./lib/RDFNode.js").Literal;

api.TriplePattern = require('./lib/RDFNode.js').TriplePattern;
api.Variable = require('./lib/RDFNode.js').Variable;

api.Profile = require('./lib/Profile.js').Profile;
api.TermMap = require('./lib/Profile.js').TermMap;
api.PrefixMap = require('./lib/Profile.js').PrefixMap;
api.RDFEnvironment = require('./lib/RDFEnvironment.js').RDFEnvironment;

api.TurtleParser = require('./lib/TurtleParser.js').Turtle;

api.Graph = require("./lib/Graph.js").Graph;
api.ResultSet = require("./lib/ResultSet.js").ResultSet;

api.environment = require('./lib/environment').environment;
api.setBuiltins = require('./lib/Builtins').setBuiltins;
api.unsetBuiltins = require('./lib/Builtins').unsetBuiltins;
api.builtins = require('./lib/Builtins');
api.parse = function(o, id){
	return api.builtins.ref.call(o, id);
}

api.ns = require('./lib/ns.js').ns;
api.rdfns = require('./lib/ns.js').rdfns;
api.rdfsns = require('./lib/ns.js').rdfsns;
api.xsdns = require('./lib/ns.js').xsdns;

},{"./lib/Builtins":28,"./lib/Graph.js":29,"./lib/Profile.js":31,"./lib/RDFEnvironment.js":32,"./lib/RDFNode.js":33,"./lib/ResultSet.js":34,"./lib/TurtleParser.js":35,"./lib/environment":37,"./lib/ns.js":38}],28:[function(require,module,exports){
"use strict";

var RDFNodeEquals = require('./RDFNode.js').RDFNodeEquals;
var RDFNode = require('./RDFNode.js').RDFNode;
var NamedNode = require('./RDFNode.js').NamedNode;
var BlankNode = require('./RDFNode.js').BlankNode;
var Literal = require('./RDFNode.js').Literal;
var defaults = require('./prefixes.js');
var encodeString = require('./encodeString.js');
var env = require('./environment.js').environment;

var rdfnil = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
var rdffirst = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
var rdfrest = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');
var rdftype = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
function xsdns(v){ return 'http://www.w3.org/2001/XMLSchema#'+v; }

function _(v) { return { writable:false, configurable:true, enumerable:false, value:v } }
function _getter(v) { return { configurable:true, enumerable:false, get:v } }
// Expands a Turtle/N3 keyword to an IRI
// p: property name
// profile: profile to use resolving prefixes
function expandprop(name, profile) {
	if(name instanceof RDFNode) return name;
	if(name == 'a') return rdftype;
	name = name.replace('$',':');
	var expanded = profile.resolve(name) || name;
	return new NamedNode(expanded);
};
function shrinkprop(ref, profile) {
	//if(rdftype.equals(ref)) return "a";
	return createNodeFrom(ref).toTurtle(profile);
};
function expandnode(p, profile) {
	if(p instanceof RDFNode){
		return p;
	}else if(p.substring(0,2)=='_:'){
		return new BlankNode(p);
	}else{
		return new NamedNode(profile.resolve(p) || p);
	}
};
function shrinknode(ref, profile) {
	return createNodeFrom(ref).toTurtle(profile);
};
function pad(v,l){
	return ('0000'+v).substr(-(l||2));
}
function createTypedLiteralFrom(value){
	if(typeof value=='string') return new Literal(value, 'http://www.w3.org/2001/XMLSchema#string');
	if(typeof value=='number') return new Literal(value.toString(), exports.Number.datatype.call(value));
	if(typeof value=='boolean') return new Literal(value.toString(), exports.Boolean.datatype.call(value));
	if(value instanceof Date) return new Literal(value.toString(), exports.Date.datatype);
	if(value && value.datatype instanceof NamedNode) return new Literal(value.toString(), value.datatype);
	throw new TypeError('Cannot create Literal from '+Object.toString.call(value));
}
function n3(value, profile){
	if(typeof value.n3=='function') return value.n3(profile);
	if(typeof value=='string') return exports.String.n3.call(value, profile);
	if(typeof value=='number') return exports.Number.n3.call(value, profile);
	if(typeof value=='boolean') return exports.Boolean.n3.call(value, profile);
	if(value instanceof Date) return exports.Date.n3.call(value, profile);
	throw new TypeError('Cannot create n3 from '+Object.toString.call(valu, profilee));
}
function createNodeFrom(value){
	if(value instanceof BlankNode) return value;
	if(value instanceof NamedNode) return value;
	if(typeof value!='string') throw new TypeError('Expected string got '+JSON.stringify(value));
	if(value.substring(0,2)=='_:') return new BlankNode(value);
	else return new NamedNode(value);
}

// JS3/JSON-LD decoding
//function graphify(o, base, parentProfile){
//	if(!o.id) var o=o.ref();
//	return o.graphify(parentProfile);
//}

exports.StructuredGraph = {};
exports.StructuredGraph.graphify = function graphifyObject(aliasmap){
	var o = this;
	var graph = env.createGraph();
	var profile = this.getProfile(aliasmap);
	//var idNode = o.id;
	var idNode = this.isNamed ? this.id : (this['$id'] || this['@id'] || this.id);
	function graphify_property(s1,p1,o1) {
		if(typeof s1=='string') var s1n = createNodeFrom(s1);
		else if(s1 instanceof NamedNode) var s1n = s1;
		else if(s1 instanceof BlankNode) var s1n = s1;
		else throw new Error('Expected string/NamedNode/BlankNode subject');
		if(p1[0]=='@' || p1[0]=='$') return;
		if(typeof(o1)=='function' || typeof(o1)=='undefined') return;
		graphify_value(s1n, expandprop(p1,profile), o1);
	}
	function graphify_value(s1n,p1n,o1) {
		if(Array.isArray(o1) || o1['$list'] || o1['@list'] || o1['$set'] || o1['@set']) {
			if(o1['$list'] || o1['@list']){
				var arr = o1['$list'] || o1['@list'];
				var list = true;
			}else if(o1['$set'] || o1['@set']){
				var arr = o1['$set'] || o1['@set'];
				var list = false;
			}else{
				var arr = o1;
				var list = false;
			}
			// o1 is a Collection or a multi-valued property
			if(!list) {
				// o1 is a multi-valued property
				arr.forEach( function(item) { graphify_value(s1n, p1n, item); });
			} else {
				// o1 is an rdf:Collection
				if(o1.length == 0) {
					graph.add( env.createTriple(s1n, p1n, rdfnil ) );
				} else {
					var bnode = env.createBlankNode();
					graph.add( env.createTriple(s1n, p1n, bnode) );
					arr.forEach(function(item,x) {
						graphify_property(bnode, rdffirst, item);
						var n = env.createBlankNode();
						graph.add( env.createTriple(bnode, rdfrest, (x==arr.length-1) ? rdfnil : n ) );
						bnode = n;
					});
				}
			}
		}else  if(o1 instanceof RDFNode){
			graph.add( env.createTriple(s1n, p1n, o1 ) );
		}else if(o1 instanceof Date){
			var literal = exports.Date.toRDFNode.call(o1);
			graph.add( env.createTriple(s1n, p1n, literal ) );
		}else if(typeof o1=='object' && !o1.id) {
			var id = o1.id || o1['$id'] || o1['@id'];
			if(typeof o1=='object' && !o1.nodeType){
				// If the Object doesn't have a bnode, give it one
				o1 = ref.call(o1);
				id = id || o1.id;
			}
			// o1 is an Object, add triple and child triples
			graph.add( env.createTriple(s1n, p1n, createNodeFrom(id) ) );
			graph.addAll( o1.graphify(profile) );
		} else if(typeof o1=='string') {
			// o1 is a string (convert to NamedNode) or RDFNode (NamedNode, BlankNode, or Literal)
			graph.add( env.createTriple(s1n, p1n, expandnode(o1,profile) ) );
		} else if(typeof o1=='number') {
			graph.add( env.createTriple(s1n, p1n, exports.Number.toRDFNode.call(o1) ) );
		} else if(typeof o1=='boolean') {
			graph.add( env.createTriple(s1n, p1n, exports.Boolean.toRDFNode.call(o1) ) );
		} else {
			throw new Error('Unknown type '+(typeof o1));
		}
	}
	if(typeof(id)=="object") throw new Error("Not an object: "+require('util').inspect(this));
	Object.keys(o).forEach(function(p) { graphify_property(idNode, p, o[p]) });
	return graph;
}

exports.StructuredGraph.n3 = function toN3(aliasmap, padding) {
	padding = padding||'\n\t';
	var outs = [];
	var o = this;
	// Determine the prefix/term profile this object is using
	var profile = exports.StructuredGraph.getProfile.call(o, aliasmap);
	var idNode = this.isNamed ? this.id : (this['$id'] || this['@id'] || this.id);
	// Go through each key and produce a predicate-object line
	Object.keys(this).forEach(toN3_property);
	function toN3_property(p) {
		// Ignore things beginning with @, they're keywords to be interperted
		if(p[0]=='$' || p[0]=='@' || (o.list&&p=='list')) return;
		var val = o[p];
		// val can be anything:
		// undefined, null, string, number, boolean, function, or object (Array, RDFNode, Date, or plain object)
		// Ignore functions, they're from the prototype probably
		if(typeof val == 'function') return;
		if(val === undefined) return;
		if(val === null) return;
		// Determine the name to output. Generate a PrefixedName if possible, otherwise output an IRIREF
		var predicateIRI = expandprop(p, profile);
		var predicateString = shrinkprop(predicateIRI, profile);
		outs.push( predicateString + ' ' + toN3_value(val) );
	}
	function toN3_value(val){
		if(typeof val=='string'){
			// If the value is an IRI, or an object without an IRI, recurse
			return shrinknode(expandnode(val, profile), profile);
		}else if(typeof val=='number' || typeof val=='boolean' || val instanceof Date){
			// If the value is an IRI, or an object without an IRI, recurse
			return n3(val, profile);
		}else if(val && typeof val.nodeType=='function' && val.nodeType() == 'IRI'){
			// If the value is a NamedNode instance, use that
			return shrinknode(val.toString(), profile);
		}else if(val && typeof val.id=='string'){
			// If the value is an object with an "id" property, use that as the object
			// Then don't forget to serialize the object out.
			var objectIRI = expandnode(val.id, profile);
			var objectName = shrinknode(objectIRI);
			return objectName;
		}
		if(val && val.nodeType && typeof val.nodeType == 'IRI'){
			return val.n3(profile);
		}else if(Array.isArray(val)){
			return val.map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(', ');
		}else if(typeof val=='object' && val['@list'] && Array.isArray(val['@list'])){
			return '( ' + val['@list'].map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(' ') + ' )';
		}else if(typeof val=='object' && val['@set'] && Array.isArray(val['@set'])){
			return val['@set'].map(function(item){ return toN3_value(item, profile, padding+'\t'); }).join(', ');
		}else{
			// Encode a Literal, or recursively encode the object and the statements in it.
			var valref = (typeof val.n3=='function') ? val : ref.call(val) ;
			return valref.n3(profile, padding+'\t');
		}
	}
	if(this.isNamed){
		if(outs.length > 1) return shrinknode(idNode,profile) + padding + outs.join(";"+padding) + ' .';
		if(outs.length == 1) return shrinknode(idNode,profile) + ' ' + outs.join(";"+padding) + ' .';
		else return '';
	}else{
		return '[' + padding + outs.join(';'+padding+'') + padding + ']';
	}
};
exports.StructuredGraph.getProfile = function(aliasmap) {
	var o = this;
	// Determine the prefix/term profile this object is using
	var profile = env.createProfile();
	//profile.importProfile(env);
	defaults.loadRequiredPrefixMap(profile);
	if(o.aliasmap) profile.importProfile(o.aliasmap, true);
	if(aliasmap){
		profile.importProfile(aliasmap, true);
		if(aliasmap.terms.vocabulary) profile.setDefaultVocabulary(aliasmap.terms.vocabulary);
	}
	var context = o['$context']||o['@context'];
	if(context){
		for(var prefix in context){
			if(prefix[0]=='@' || prefix[0]=='$'){
				var keyword = prefix.substring(1);
				if(keyword=='vocab'){
					profile.setDefaultVocabulary(context[prefix]);
				}
			}else{
				profile.setPrefix(prefix, context[prefix]);
			}
		}
	}
	return profile;
};

exports.ref = ref;
function ref(id) {
	var copy = {};
	for(var n in this) copy[n] = this[n];
	//var copy = Object.create(this);
	Object.defineProperties(copy, {
		'id': _( id ? (env.resolve(id)||id) : env.createBlankNode().toString() ),
		'isNamed': _( !!id ),
		n3: _(exports.StructuredGraph.n3),
		toNT: _( function(a) {
			return this.graphify(a).toArray().join("\n");
		}),
		graphify: _(exports.StructuredGraph.graphify),
		using: _( function() {
			Object.defineProperty(this,'aliasmap',_(Array.prototype.slice.call(arguments)));
			return this;
		}),
		getProfile: _(exports.StructuredGraph.getProfile),
	});
	return copy;
}

// All
exports.Object = {
	equals: RDFNodeEquals,
	ref: ref,
};
exports.ObjectProperties = {
	equals: _(exports.Object.equals),
	ref: _(exports.Object.ref),
};
exports.setObjectProperties = function setObjectProperties(o){
	Object.defineProperties(o, exports.ObjectProperties);
}

// String
exports.String = {
	tl: function(t) {
		return env.createLiteral(this.toString(), null, t);
	},
	l: function(l) {
		return env.createLiteral(this.toString(), l, null);
	},
	resolve: function() {
		return env.resolve(this)||this.toString();
	},
	valueGetter: function(){
		return this.toString();
	},
	nodeType: function() {
		//if(this.type) return 'TypedLiteral';
		//if(this.language || this.indexOf(' ') >= 0 || this.indexOf(':') == -1 ) return 'PlainLiteral';
		if(this.substr(0,2) == '_:') return 'BlankNode';
		return 'IRI';
	},
	termTypeGetter: function() {
		if(this.substr(0,2) == '_:') return 'BlankNode';
		return 'NamedNode';
	},
	n3: function() {
		// FIXME we don't actually use the 'PlainLiteral' or 'TypedLiteral' productions. Either remove them, or re-add detection of them to String#nodeType()
		switch(this.nodeType()) {
			case 'PlainLiteral': return ('"'+encodeString(this)+'"'+(this.language?'@'+this.language:'')).toString();
			case 'IRI':
				var resolved = this.resolve();
				return (resolved == this) ? "<"+encodeString(resolved)+">" : this.toString();
			case 'BlankNode': return this.toString();
			case 'TypedLiteral':
				if(this.type.resolve() == env.resolve("rdf:PlainLiteral")) return '"'+encodeString(this)+'"';
				return '"'+encodeString(this)+'"^^' + (new NamedNode(this.datatype)).n3(profile);
		}
	},
	toNT: function() {
		switch(this.nodeType()) {
			case 'PlainLiteral': return ('"' + encodeString(this) + '"' + ( this.language ? '@' + this.language : '')).toString();
			case 'IRI': return "<" + encodeString(this.resolve()) + ">";
			case 'BlankNode': return this.toString();
			case 'TypedLiteral':
				if(this.type.resolve() == env.resolve("rdf:PlainLiteral")) return '"' + encodeString(this) + '"';
				return '"' + encodeString(this) + '"^^<' + this.datatype + '>';
		}
	},
	toCanonical: function() {
		return this.n3()
	},
	profile: env,
};
exports.StringProperties = {
	tl: _(exports.String.tl),
	l: _(exports.String.l),
	resolve: _(exports.String.resolve),
	value: _getter(exports.String.valueGetter),
	nodeType: _(exports.String.nodeType),
	termType: _getter(exports.String.termTypeGetter),
	n3: _(exports.String.n3),
	toNT: _(exports.String.toNT),
	toCanonical: _(exports.String.toCanonical),
	profile: _(exports.String.profile),
};
exports.setStringProperties = function setStringProperties(o){
	Object.defineProperties(o, exports.StringProperties);
}

// Array
exports.Array = {
	toList: function() {
		this.list = true;
		return this;
	},
	n3: function(a, padding) {
		padding = padding||'\n\t';
		var outs = [];
		this.forEach( function(i) {
			if(typeof i == 'function') return;
			if(i.id && i.id.nodeType() == 'IRI') return outs.push( i.id.n3() );
			if(!i.nodeType) ref.call(i);
			outs.push(i.n3(a, padding+'\t'))
		});
		return this.list ? "("+padding+outs.join(padding)+" )" : outs.join(", ");
	},
};
exports.ArrayProperties = {
	toList: _(exports.Array.toList),
	n3: _(exports.Array.n3),
};

exports.setArrayProperties = function setArrayProperties(o){
	Object.defineProperties(o, exports.ArrayProperties);
}

// Boolean
exports.Boolean = {
	datatype: xsdns("boolean"),
	valueGetter: function(){ return this; },
	nodeType: function() { return "TypedLiteral"; },
	termType: "Literal",
	termTypeGetter: function() { return "Literal"; },
	n3: function() { return this.valueOf(); },
	toNT: function() { return '"' + this.valueOf() + '"' + "^^<" + this.datatype + '>'; },
	toRDFNode: function() { return env.createTypedLiteral(this.valueOf().toString(), xsdns("boolean")); },
	toCanonical: function() { return this.toNT(); },
};
exports.BooleanProperties = {
	datatype: _(exports.Boolean.datatype),
	value: _getter(exports.Boolean.valueGetter),
	nodeType: _(exports.Boolean.nodeType),
	termType: _getter( function() { return "Literal"; } ),
	n3: _(exports.Boolean.n3),
	toNT: _(exports.Boolean.toNT),
	toRDFNode: _(exports.Boolean.toRDFNode),
	toCanonical: _(exports.Boolean.toCanonical),
};
exports.setBooleanProperties = function setBooleanProperties(o){
	Object.defineProperties(o, exports.BooleanProperties);
}

// Date
exports.Date = {
	datatype: xsdns("dateTime"),
	valueGetter: function(){return this; },
	nodeType: function() { return "TypedLiteral"; },
	termTypeGetter: function() { return "Literal"; },
	n3: function(profile) {
		if(!this.getTime()) return '"NaN"^^<' + (new NamedNode(xsdns('double'))).n3(profile) + '>';
		return '"' + this.getUTCFullYear()+'-' + pad(this.getUTCMonth()+1)+'-' + pad(this.getUTCDate())+'T'
		+ pad(this.getUTCHours())+':' + pad(this.getUTCMinutes())+':' + pad(this.getUTCSeconds())+'Z"^^' + (new NamedNode(xsdns('dateTime'))).n3(profile);
	},
	toNT: function() { return this.n3() },
	toRDFNode: function() {
		return env.createTypedLiteral(
			this.getUTCFullYear()+'-' + pad(this.getUTCMonth()+1)+'-' + pad(this.getUTCDate())+'T'
			+ pad(this.getUTCHours())+':' + pad(this.getUTCMinutes())+':' + pad(this.getUTCSeconds())+'Z',
			xsdns("dateTime")
		);
	},
	toCanonical: function() { return this.n3(); },
}
exports.DateProperties = {
	datatype: _(exports.Date.datatype),
	value: _getter(exports.Date.valueGetter),
	nodeType: _(exports.Date.nodeType),
	termType: _getter(exports.Date.termTypeGetter),
	n3: _(exports.Date.n3),
	toNT: _(exports.Date.toNT),
	toRDFNode: _(exports.Date.toRDFNode),
	toCanonical: _(exports.Date.toCanonical),
}
exports.setDateProperties = function setDateProperties(o){
	Object.defineProperties(o, exports.DateProperties);
}

// Number
var INTEGER = new RegExp("^(-|\\+)?[0-9]+$", "");
var DOUBLE = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
var DECIMAL = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");
exports.Number = {
	datatypeGetter: function() {
		if(this == Number.POSITIVE_INFINITY) return xsdns('double');
		if(this == Number.NEGATIVE_INFINITY) return xsdns('double');
		if(isNaN(this)) return xsdns('double');
		var n = this.toString();
		if(INTEGER.test(n)) return xsdns('integer');
		if(DECIMAL.test(n)) return xsdns('decimal');
		if(DOUBLE.test(n)) return xsdns('double');
	},
	valueGetter: function(){
		return this;
	},
	nodeType: function() {
		return "TypedLiteral";
	},
	termTypeGetter: function() {
		return "Literal";
	},
	n3: function() {
		if(this == Number.POSITIVE_INFINITY) return '"INF"^^<' + xsdns('double') + '>';
		if(this == Number.NEGATIVE_INFINITY) return '"-INF"^^<' + xsdns('double') + '>';
		if(isNaN(this)) return '"NaN"^^<' + xsdns('double') + '>';
		return this.toString();
	},
	toNT: function() {
		if(this == Number.POSITIVE_INFINITY) return '"INF"^^<' + xsdns('double') + '>';
		if(this == Number.NEGATIVE_INFINITY) return '"-INF"^^<' + xsdns('double') + '>';
		if(isNaN(this)) return '"NaN"^^<' + xsdns('double') + '>';
		return '"' + this.toString() + '"' + "^^<" + exports.Number.datatypeGetter.call(this) + '>';
	},
	toRDFNode: function() {
		if(this == Number.POSITIVE_INFINITY) return env.createTypedLiteral('INF', xsdns('double'));
		if(this == Number.NEGATIVE_INFINITY) return env.createTypedLiteral('-INF', xsdns('double'));
		if(isNaN(this)) return env.createTypedLiteral('NaN', xsdns('double'));
		return env.createTypedLiteral(this.toString(), exports.Number.datatypeGetter.call(this));
	},
	toCanonical: function() {
		return this.nt();
	},
	toTL: function() {
		return this.nt();
	},
}
exports.NumberProperties = {
	datatype: {
		configurable:true,
		enumerable:false,
		get: exports.Number.datatypeGetter,
	},
	value: 	 _getter(exports.Number.valueGetter),
	nodeType: _( function() { return "TypedLiteral" } ),
	termType: _getter(exports.Number.termTypeGetter),
	n3: _(exports.Number.n3),
	toNT: _(exports.Number.toNT),
	toRDFNode: _(exports.Number.toRDFNode),
	toCanonical: _(exports.Number.toCanonical),
	toTL: _(exports.Number.toTL),
}
exports.setNumberProperties = function setNumberProperties(o){
	Object.defineProperties(o, exports.NumberProperties);
}

// Sometimes the standard API context isn't global, and an Object in one context isn't an Object in another.
// For these cases, you'll need to call these functions by hand.
exports.setBuiltins = function setBuiltins(){
	function setOn(map, target){
		for(var n in map) if(target[n]!==undefined) throw new Error('Builtin already set');
	}

	setOn(exports.ObjectProperties, Object.prototype);
	setOn(exports.StringProperties, String.prototype);
	setOn(exports.ArrayProperties, Array.prototype);
	setOn(exports.BooleanProperties, Boolean.prototype);
	setOn(exports.DateProperties, Date.prototype);
	setOn(exports.NumberProperties, Number.prototype);

	exports.setObjectProperties(Object.prototype);
	exports.setStringProperties(String.prototype);
	exports.setArrayProperties(Array.prototype);
	exports.setBooleanProperties(Boolean.prototype);
	exports.setDateProperties(Date.prototype);
	exports.setNumberProperties(Number.prototype);
}

exports.unsetBuiltins = function unsetBuiltins(){
	function unsetOn(map, target){
		for(var n in map) if(target[n]===undefined) throw new Error('Builtin '+JSON.stringify(n)+' not set');
		for(var n in map){
			Object.defineProperty(target, n, {configurable:true, value:null});
			delete target[n];
		}
	}
	unsetOn(exports.ObjectProperties, Object.prototype);
	unsetOn(exports.StringProperties, String.prototype);
	unsetOn(exports.ArrayProperties, Array.prototype);
	unsetOn(exports.BooleanProperties, Boolean.prototype);
	unsetOn(exports.DateProperties, Date.prototype);
	unsetOn(exports.NumberProperties, Number.prototype);
}

},{"./RDFNode.js":33,"./encodeString.js":36,"./environment.js":37,"./prefixes.js":39,"util":42}],29:[function(require,module,exports){
"use strict";

var RDFNode = require('./RDFNode.js');
var ResultSet = require('./ResultSet.js');

/**
 * The very fastest graph for heavy read operations, but uses three indexes
 * Graph (fast, triple indexed) implements DataStore

[NoInterfaceObject]
interface Graph {
    readonly attribute unsigned long          length;
    Graph            add (in Triple triple);
    Graph            remove (in Triple triple);
    Graph            removeMatches (in any? subject, in any? predicate, in any? object);
    sequence<Triple> toArray ();
    boolean          some (in TripleFilter callback);
    boolean          every (in TripleFilter callback);
    Graph            filter (in TripleFilter filter);
    void             forEach (in TripleCallback callback);
    Graph            match (in any? subject, in any? predicate, in any? object, in optional unsigned long limit);
    Graph            merge (in Graph graph);
    Graph            addAll (in Graph graph);
    readonly attribute sequence<TripleAction> actions;
    Graph            addAction (in TripleAction action, in optional boolean run);
};

*/

/**
 * Read an RDF Collection and return it as an Array
 */
var rdfnil = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
var rdffirst = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
var rdfrest = new RDFNode.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');

function isIndex(i, a, b, c, t){
	if(!i[a]) return false;
	if(!i[a][b]) return false;
	return i[a][b][c] ? i[a][b][c].equals(t) : false ;
}

function insertIndex(i, a, b, c, t){
	if(!i[a]) i[a] = {};
	if(!i[a][b]) i[a][b] = {};
	i[a][b][c] = t;
}

function deleteIndex(i, a, b, c, t){
	if(i[a]&&i[a][b]&&i[a][b][c]){
		if(!i[a][b][c].equals(t)) throw new Error('assertion fail: deleted triple mismatch');
		delete(i[a][b][c]);
		if(!Object.keys(i[a][b]).length) delete(i[a][b]);
		if(!Object.keys(i[a]).length) delete(i[a]);
	}
}

exports.Graph = Graph;
function Graph(init){
	this.clear();
	//this._actions = [];
	Object.defineProperty(this, 'size', {get: function(){return self.length;}});
	var self = this;
	if(init && init.forEach){
		init.forEach(function(t){ self.add(t); });
	}
}
Graph.prototype.length = null;
Graph.prototype.graph = null;

Graph.prototype.importArray = function(a) { while( a.length > 0) { this.add(a.pop()) } };

Graph.prototype.insertIndex = insertIndex;
Graph.prototype.deleteIndex = deleteIndex;
Graph.prototype.add = function(triple) {
	if(!(triple instanceof RDFNode.Triple)) throw new TypeError('Expected a Triple for argument[0] `triple`');
	var st=triple.subject.toNT(), pt=triple.predicate.toNT(), ot=triple.object.toNT();
	if(isIndex(this.indexSOP, st, ot, pt, triple)) return;
	insertIndex(this.indexOPS, ot, pt, st, triple);
	insertIndex(this.indexPSO, pt, st, ot, triple);
	insertIndex(this.indexSOP, st, ot, pt, triple);
	this.length++;
	//this.actions.forEach(function(fn){ fn(triple); });
};
Graph.prototype.addAll = function(g){
	var g2 = this;
	g.forEach(function(s){ g2.add(s); });
};
Graph.prototype.union = function union(g){
	var gx = new Graph;
	gx.addAll(this);
	gx.addAll(g);
	return gx;
};
Graph.prototype.merge = Graph.prototype.union;
Graph.prototype.remove = function(triple) {
	var st=triple.subject.toNT(), pt=triple.predicate.toNT(), ot=triple.object.toNT();
	if(!isIndex(this.indexSOP, st, ot, pt, triple)) return;
	deleteIndex(this.indexOPS, ot, pt, st, triple);
	deleteIndex(this.indexPSO, pt, st, ot, triple);
	deleteIndex(this.indexSOP, st, ot, pt, triple);
	this.length--;
}
Graph.prototype.removeMatches = function(s, p, o) {
	var graph = this;
	this.match(s, p, o).forEach(function(t) {
		graph.remove(t);
	});
}
Graph.prototype.clear = function(){
	this.indexSOP = {};
	this.indexPSO = {};
	this.indexOPS = {};
	this.length = 0;
}
Graph.prototype.import = function(s) {
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.add(s.get(i))
	}
};
Graph.prototype.every = function every(filter) { return this.toArray().every(filter) };
Graph.prototype.some = function some(filter) { return this.toArray().some(filter) };
Graph.prototype.forEach = function forEach(callbck) { this.toArray().forEach(callbck) };
Graph.prototype.toArray = function toArray() {
	var triples = [];
	var data = this.indexPSO;
	if(!data) return [];
	(function go(data, c){
		if(c) Object.keys(data).forEach(function(t){go(data[t], c-1);});
		else triples.push(data);
	})(data, 3);
	return triples;
};
Graph.prototype.filter = function filter(cb){
	var result = new Graph;
	this.forEach(function(triple){
		if(cb(triple)) result.add(triple);
	});
	return result;
};
Graph.prototype.getCollection = function getCollection(subject){
	var collection=[], seen=[];
	var first, rest=subject;
	while(rest && !rest.equals(rdfnil)){
		var g = this.match(rest, rdffirst, null);
		if(g.length===0) throw new Error('Collection <'+rest+'> is incomplete');
		first = g.toArray().map(function(v){return v.object})[0];
		if(seen.indexOf(rest.toString())!==-1) throw new Error('Collection <'+rest+'> is circular');
		seen.push(rest.toString());
		collection.push(first);
		rest = this.match(rest, rdfrest, null).toArray().map(function(v){return v.object})[0];
	}
	return collection;
};
// FIXME this should return a Graph, not an Array
// FIXME ensure that the RDFNode#equals semantics are met
Graph.prototype.match = function match(subject, predicate, object){
	// if the String prototype has a nodeType/toNT function, builtins is enabled,
	if(typeof subject=="string" && typeof subject.toNT!='function') subject = new RDFNode.NamedNode(subject);
	if(subject!==null && !RDFNode.RDFNode.is(subject)) throw new Error('match subject is not an RDFNode');
	if(subject!==null && subject.termType!=='NamedNode' && subject.termType!=='BlankNode') throw new Error('match subject must be a NamedNode/BlankNode');
	if(typeof predicate=="string" && typeof predicate.toNT!='function') predicate = new RDFNode.NamedNode(predicate);
	if(predicate!==null && !RDFNode.RDFNode.is(predicate)) throw new Error('match predicate is not an RDFNode');
	if(predicate!==null && predicate.termType!=='NamedNode') throw new Error('match predicate must be a NamedNode');
	if(typeof object=="string" && typeof object.toNT!='function') object = new RDFNode.NamedNode(object);
	if(object!==null && !RDFNode.RDFNode.is(object)) throw new Error('match object is not an RDFNode');
	if(object!==null && object.termType!=='NamedNode' && object.termType!=='BlankNode' && object.termType!=='Literal') throw new Error('match object must be a NamedNode/BlankNode/Literal');
	var triples = new Graph;
	var pattern = {s:subject&&subject.toNT(), p:predicate&&predicate.toNT(), o:object&&object.toNT()};
	var patternIndexMap =
		[ {index:this.indexOPS, constants:["o", "p", "s"], variables:[]}
		, {index:this.indexPSO, constants:["p", "s"], variables:["o"]}
		, {index:this.indexSOP, constants:["s", "o"], variables:["p"]}
		, {index:this.indexSOP, constants:["s"], variables:["o", "p"]}
		, {index:this.indexOPS, constants:["o", "p"], variables:["s"]}
		, {index:this.indexPSO, constants:["p"], variables:["s", "o"]}
		, {index:this.indexOPS, constants:["o"], variables:["p", "s"]}
		, {index:this.indexPSO, constants:[], variables:["p", "s", "o"]}
		];
	var patternType = 0;
	if(!pattern.s) patternType |= 4;
	if(!pattern.p) patternType |= 2;
	if(!pattern.o) patternType |= 1;
	var index = patternIndexMap[patternType];
	var data = index.index;
	index.constants.forEach(function(v){if(data) data=data[pattern[v]];});
	if(!data) return triples;
	(function go(data, c){
		if(c) return void Object.keys(data).forEach(function(t){go(data[t], c-1);});
		if(subject && !data.subject.equals(subject)) throw new Error('assertion fail: subject');
		if(predicate && !data.predicate.equals(predicate)) throw new Error('assertion fail: predicate');
		if(object && !data.object.equals(object)) throw new Error('assertion fail: object');
		triples.add(data);
	})(data, index.variables.length);
	return triples;
};

var GraphEquals = require('./GraphEquals.js');
Graph.prototype.isomorphic = function isomorphic(b){
	return GraphEquals(this, b);
}
Graph.prototype.equals = function equals(b){
	return GraphEquals(this, b);
}

//Graph.prototype.addAction = function(action, run){
//	this._actions.push(action);
//	if(run){
//		this.forEach(action);
//	}
//}
//
//Object.defineProperty(Graph.prototype, 'actions', { get: function(){ return this._actions; } });

// Gets a reference to a particular subject
Graph.prototype.reference = function reference(subject){
	return new ResultSet.ResultSet(this, subject);
};

},{"./GraphEquals.js":30,"./RDFNode.js":33,"./ResultSet.js":34}],30:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],31:[function(require,module,exports){
"use strict";

/** Implements interfaces from http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/ */

var api = exports;

var NamedNode = require("./RDFNode.js").NamedNode;

api.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");

// This is the same as the XML NCName
// Note how [\uD800-\uDBFF][\uDC00-\uDFFF] is a surrogate pair that encodes #x10000-#xEFFFF
api.CURIE_PREFIX = new RegExp("^([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD.0-9\u00B7\u0300-\u036F\u203F-\u2040\\-]|[\uD800-\uDBFF][\uDC00-\uDFFF])*$", "i");


// For implementations that don't have Map defined...???
function GoodEnoughMap(){
	this.map = {};
}
GoodEnoughMap.prototype.has = function has(key){
	return Object.hasOwnProperty.call(this.map, key+':');
}
GoodEnoughMap.prototype.get = function get(key){
	return Object.hasOwnProperty.call(this.map, key+':') ? this.map[key+':'] : undefined;
}
GoodEnoughMap.prototype.set = function set(key, value){
	// Store with some suffix to avoid certain magic keywords
	this.map[key+':'] = value;
}
GoodEnoughMap.prototype.delete = function del(key){
	delete this.map[key+':'];
}
GoodEnoughMap.prototype.forEach = function forEach(it){
	var map = this.map;
	Object.keys(this.map).forEach(function(k){
		it(map[k], k.substring(0, k.length-1));
	});
}
var StringMap = (typeof Map=='function') ? Map : GoodEnoughMap ;

/**
 * Implements PrefixMap http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-PrefixMap
 */
api.PrefixMap = function PrefixMap(){
	this.prefixMap = new StringMap;
}
api.PrefixMap.prototype.get = function(prefix){
	// strip a trailing ":"
	if(prefix.slice(-1)==":") prefix=prefix.slice(0, -1);
	return this.prefixMap.get(prefix);
}
api.PrefixMap.prototype.set = function(prefix, iri){
	// strip a trailing ":"
	if(prefix.slice(-1)==":") prefix=prefix.slice(0, -1);
	if(typeof prefix!='string') throw new TypeError('Expected a string argument[0] `prefix`');
	if(iri===null) return void this.prefixMap.delete(prefix);
	if(typeof iri!='string') throw new TypeError('Expected a string argument[1] `iri`');
	if(prefix.length && !api.CURIE_PREFIX.exec(prefix)) throw new Error('Invalid prefix name');
	this.prefixMap.set(prefix, iri);
}
api.PrefixMap.prototype.list = function(){
	var list = [];
	return this.prefixMap.forEach(function(expansion, prefix){
		list.push(prefix);
	});
	return list;
}
api.PrefixMap.prototype.remove = function(prefix){
	this.prefixMap.delete(prefix);
}
api.PrefixMap.prototype.resolve = function(curie){
	var index = curie.indexOf(":");
	if(index<0) return null;
	var prefix = curie.slice(0, index);
	var iri = this.get(prefix);
	if(!iri) return null;
	var resolved = iri.concat(curie.slice(index+1));
	if(resolved.match(api.SCHEME_MATCH)==null && this.base!=null){
		resolved = this.base.resolveReference(resolved);
	}
	return resolved.toString();
}
api.PrefixMap.prototype.shrink = function(uri) {
	if(typeof uri!='string') throw new TypeError('Expected string arguments[0] `uri`');
	var shrunk = uri;
	var matchedLen = '';
	this.prefixMap.forEach(function(expansion, prefix){
		if(uri.substr(0,expansion.length)==expansion && expansion.length>matchedLen){
			shrunk = prefix + ':' + uri.substring(expansion.length);
			matchedLen = expansion.length;
		}
	});
	return shrunk;
}
api.PrefixMap.prototype.setDefault = function(uri){
	this.set('', uri);
}
api.PrefixMap.prototype.addAll = function(prefixes, override){
	var localPrefixMap = this.prefixMap;
	if(override){
		prefixes.prefixMap.forEach(function(expansion, prefix){
			localPrefixMap.set(prefix, expansion);
		});
	}else{
		prefixes.prefixMap.forEach(function(expansion, prefix){
			if(!localPrefixMap.has(prefix)) localPrefixMap.set(prefix, expansion);
		});
	}
}

/**
 * Implements TermMap http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-TermMap
 */
api.TermMap = function TermMap(){
	this.termMap = new StringMap;
	this.vocabulary = null;
}
api.TermMap.prototype.get = function(term){
	return this.termMap.get(term);
}
api.TermMap.prototype.set = function(term, iri){
	if(typeof term!='string') throw new TypeError('Expected a string argument[0] `prefix`');
	if(iri===null) return void this.termMap.delete(term);
	if(typeof iri!='string') throw new TypeError('Expected a string argument[1] `iri`');
	if(!api.CURIE_PREFIX.exec(term)) throw new Error('Invalid term name');
	this.termMap.set(term, iri);
}
api.TermMap.prototype.list = function(){
	var list = [];
	return this.prefixMap.forEach(function(definition, term){
		list.push(term);
	});
	return list;
}
api.TermMap.prototype.remove = function(term){
	this.termMap.delete(term);
}
api.TermMap.prototype.resolve = function(term){
	var expansion = this.termMap.get(term);
	if(typeof expansion=='string') return expansion;
	if(typeof this.vocabulary=='string') return this.vocabulary+term;
	return null;
}
api.TermMap.prototype.shrink = function(uri){
	var shrunk = uri;
	this.termMap.forEach(function(definition, term){
		if(uri==definition){
			shrunk = term;
		}
	});
	return shrunk;
}
api.TermMap.prototype.setDefault = function(uri){
	this.vocabulary = (uri==='') ? null : uri;
}
api.TermMap.prototype.addAll = function(terms, override){
	var termMap = this.termMap;
	if(override){
		terms.termMap.forEach(function(definition, term){
			termMap.set(term, definition);
		});
	}else{
		terms.termMap.forEach(function(definition, term){
			if(!termMap.has(term)) termMap.set(term, definition);
		});
	}
}


/**
 * Implements Profile http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Profile
 */
api.Profile = function Profile() {
	this.prefixes = new api.PrefixMap;
	this.terms = new api.TermMap;
};
api.Profile.prototype.resolve = function(toresolve){
	if(toresolve.indexOf(":")<0) return this.terms.resolve(toresolve);
	else return this.prefixes.resolve(toresolve);
}
api.Profile.prototype.setDefaultVocabulary = function(uri){
	this.terms.setDefault(uri);
}
api.Profile.prototype.setDefaultPrefix = function(uri){
	this.prefixes.setDefault(uri);
}
api.Profile.prototype.setTerm = function(term, uri){
	this.terms.set(term, uri);
}
api.Profile.prototype.setPrefix = function(prefix, uri){
	this.prefixes.set(prefix, uri);
}
api.Profile.prototype.shrink = function(uri){
	return this.terms.shrink(this.prefixes.shrink(uri));
}
api.Profile.prototype.importProfile = function(profile, override){
	this.prefixes.addAll(profile.prefixes, override);
	this.terms.addAll(profile.terms, override);
}

},{"./RDFNode.js":33}],32:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"./Graph.js":29,"./Profile.js":31,"./RDFNode.js":33,"./prefixes.js":39,"dup":10}],33:[function(require,module,exports){
"use strict";

var encodeString = require('./encodeString.js');
var api = exports;

function inherits(ctor, superCtor) {
	//ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: { value: ctor, enumerable: false },
	});
};

function nodeType(v){
	if(v.nodeType) return v.nodeType();
	if(typeof v=='string') return (v.substr(0,2)=='_:')?'BlankNode':'IRI';
	return 'TypedLiteral';
}
api.nodeType = nodeType;

function RDFNodeEquals(other) {
	if(typeof other=='string'){
		return this.termType=="NamedNode" && this.value==other;
	}
	if(api.RDFNode.is(other)){
		if(nodeType(this)!=nodeType(other)) return false;
		switch(this.termType) {
			case "NamedNode":
			case "BlankNode":
				return this.toString()==other.toString();
			case "Literal":
				return ( this.language==other.language
					&& this.nominalValue==other.nominalValue
					&& this.datatype.toString()==other.datatype.toString()
					);
		}
		if(typeof this.toNT=='function' && typeof other.toNT=='function'){
			return this.toNT() == other.toNT();
		}
	}
	//throw new Error('Cannot compare values');
	return false;
}
api.RDFNodeEquals = RDFNodeEquals;

function RDFNodeCompare(other) {
	// Node type order: IRI, BlankNode, Literal
	var typeThis=this.termType, typeOther=other.termType;
	if(typeThis != typeOther){
		switch(typeThis) {
			case "IRI":
			case "NamedNode":
				// must be a BlankNode or Literal
				return -1;
			case "BlankNode":
				if(typeOther=="Literal") return -1;
				else return 1;
			case "Literal":
				return 1;
		}
		throw new Error(typeThis);
	}
	// node types are the same, compare nomialValue
	if(typeof this.nominalValue=='string' && typeof other.nominalValue=='string'){
		if(this.nominalValue < other.nominalValue) return -1;
		if(this.nominalValue > other.nominalValue) return 1;
	}
	// values are the same, compare by datatype
	if(typeof this.datatype=='string' && typeof other.datatype=='string'){
		if(this.datatype < other.datatype) return -1;
		if(this.datatype > other.datatype) return 1;
	}
	if(typeof this.language=='string' || typeof other.language=='string'){
		if(typeof this.language=='string' && typeof other.language=='string'){
			if(this.language < other.language) return -1;
			if(this.language > other.language) return 1;
		}else{
			if(other.language) return -1;
			if(this.language) return 1;
		}
	}
	// Compare by any other metric?
	if(typeof this.valueOf=='function'){
		if(this.valueOf() < other) return -1;
		if(this.valueOf() > other) return 1;
		//if(this.valueOf() == other) return 0;
	}
	if(this.equals(other)) return 0;
	throw new Error('Cannot compare values');
}
api.RDFNodeEquals = RDFNodeEquals;

/**
* Implements Triple http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Triple
*/
api.Triple = function Triple(s, p, o) {
	if(typeof s=='string') s = new NamedNode(s);
	if(!api.RDFNode.is(s)) throw new Error('Triple subject is not an RDFNode');
	if(s.termType!=='NamedNode' && s.termType!=='BlankNode') throw new Error('subject must be a NamedNode/BlankNode');

	if(typeof p=='string') p = new NamedNode(p);
	if(!api.RDFNode.is(p)) throw new Error('Triple predicate is not an RDFNode');
	if(p.termType!=='NamedNode') throw new Error('predicate must be a NamedNode');

	if(typeof o=='string') o = new NamedNode(o);
	if(!api.RDFNode.is(o)) throw new Error('Triple object is not an RDFNode');
	if(o.termType!=='NamedNode' && o.termType!=='BlankNode' && o.termType!=='Literal') throw new Error('object must be a NamedNode/BlankNode/Literal');

	this.subject = s;
	this.predicate = p;
	this.object = o;
};
api.Triple.prototype.size = 3;
api.Triple.prototype.length = 3;
api.Triple.prototype.toString = function() {
	return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " .";
}
api.Triple.prototype.toNT = function toNT() {
	return this.subject.toNT() + " " + this.predicate.toNT() + " " + this.object.toNT() + " .";
}
api.Triple.prototype.toTurtle = function toTurtle(profile) {
	return this.subject.toTurtle(profile) + " " + this.predicate.toTurtle(profile) + " " + this.object.toTurtle(profile) + " .";
}
api.Triple.prototype.equals = function(t) {
	return RDFNodeEquals.call(this.subject,t.subject) && RDFNodeEquals.call(this.predicate,t.predicate) && RDFNodeEquals.call(this.object,t.object);
}
api.Triple.prototype.compare = function(other) {
	var r = 0;
	if(r = this.subject.compare(other.subject)) return r;
	if(r = this.predicate.compare(other.predicate)) return r;
	if(r = this.object.compare(other.object)) return r;
}

/**
 * Implements RDFNode http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-RDFNode
 */
api.RDFNode = function RDFNode() {};
api.RDFNode.is = function isRDFNode(n){
	if(!n) return false;
	if(n instanceof api.RDFNode) return true;
	if(typeof n.nodeType=='function') return true;
	return false;
}
api.RDFNode.prototype.equals = api.RDFNodeEquals = RDFNodeEquals;
api.RDFNode.prototype.compare = api.RDFNodeCompare = RDFNodeCompare;
api.RDFNode.prototype.nodeType = function() { return "RDFNode"; }
api.RDFNode.prototype.toNT = function() { return ""; }
api.RDFNode.prototype.toCanonical = function() { return this.toNT(); }
api.RDFNode.prototype.toString = function() { return this.nominalValue; }
api.RDFNode.prototype.valueOf = function() { return this.nominalValue; }
// Alignment to "Interface Specification: RDF Representation"
Object.defineProperty(api.RDFNode.prototype, 'value', { get: function(){
	return this.nominalValue;
} });

/**
 * BlankNode
 */
api.BlankNode = BlankNode;
inherits(api.BlankNode, api.RDFNode);
function BlankNode(id) {
	if(typeof id=='string' && id.substr(0,2)=='_:') this.nominalValue=id.substr(2);
	else if(id) this.nominalValue=id;
	else this.nominalValue = 'b'+(++api.BlankNode.NextId).toString();
}
api.BlankNode.NextId = 0;
api.BlankNode.prototype.nodeType = function() { return "BlankNode"; }
api.BlankNode.prototype.interfaceName = "BlankNode";
api.BlankNode.prototype.termType = "BlankNode";
api.BlankNode.prototype.toNT = function() {
	return "_:"+this.nominalValue;
}
api.BlankNode.prototype.toTurtle = function toTurtle() {
	return this.toNT();
}
api.BlankNode.prototype.n3 = function() {
	return this.toNT();
}
api.BlankNode.prototype.toString =  function() {
	return "_:"+this.nominalValue;
}

/**
 * Implements Literal http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/#idl-def-Literal
 */
api.Literal = Literal;
inherits(api.Literal, api.RDFNode);
function Literal(value, type) {
	if(typeof value!='string') throw new TypeError('Expected argument[0] `value` to be a string');
	if(type!==null && type!==undefined && typeof type!='string' && !(type instanceof api.NamedNode)) throw new TypeError('Expected optional argument[1] `type` to be a string/RDFNode');
	this.nominalValue = value;
	if(type instanceof NamedNode){
		this.datatype = type;
		this.language = null;
	}else if(typeof type=='string'){
		if(type.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			this.datatype = rdflangString;
			this.language = type;
		}else if(type.match(/^@[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			this.datatype = rdflangString;
			this.language = type.substring(1);
		}else if(type.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)){
			this.datatype = new NamedNode(type);
			this.language = null;
		}else{
			throw new Error('Expected argument[1] `type` to look like a LangTag or IRI');
		}
	}else{
		this.datatype = xsdstring;
		this.language = null;
	}
};
api.Literal.typed = function createTypedLiteral(value, datatype){
	if(typeof value!='string') throw new Error('Expected argument[0] `value` to be a string');
	if(typeof datatype!='string' && !(datatype instanceof api.NamedNode)) throw new Error('Expected argument[1] `datatype` to be a string');
	if(!datatype.toString().match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)) throw new Error('Expected argument[1] `datatype` to be an IRI');
	var literal = new api.Literal(value);
	if(datatype.toString()!=='http://www.w3.org/2001/XMLSchema#string'){
		literal.datatype = datatype;
	}
	return literal;
}
api.Literal.language = function createLanguageLiteral(value, language){
	if(typeof value!='string') throw new Error('Expected argument[0] `value` to be a string');
	if(typeof language!='string') throw new Error('Expected argument[1] `language` to be a string');
	if(!language.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)) throw new Error('Expected argument[1] `language` to be a BCP47 language tag');
	var literal = new api.Literal(value);
	literal.language = language;
	return literal;
}
api.Literal.prototype.nodeType = function() {
	if(rdflangString.equals(this.datatype) && this.language) return 'PlainLiteral';
	if(xsdstring.equals(this.datatype)) return 'PlainLiteral';
	return 'TypedLiteral';
}
api.Literal.prototype.interfaceName = "Literal";
api.Literal.prototype.termType = "Literal";
api.Literal.prototype.toNT = function toNT() {
	var string = '"'+encodeString(this.nominalValue)+'"';
	if(this.language) return string+"@"+this.language;
	else if(xsdstring.equals(this.datatype)) return string;
	else if(this.datatype) return string+'^^<'+this.datatype+">";
	throw new Error('Unknown datatype');
}
api.Literal.prototype.toTurtle = function toTurtle(profile){
	if(xsdinteger.equals(this.datatype) && this.value.match(INTEGER)){
		return this.value;
	}
	if(xsddecimal.equals(this.datatype) && this.value.match(DECIMAL)){
		return this.value;
	}
	if(xsddouble.equals(this.datatype) && this.value.match(DOUBLE)){
		return this.value;
	}
	if(xsdboolean.equals(this.datatype) && this.value.match(BOOLEAN)){
		return this.value;
	}
	if(profile && this.type){
		var shrunk = profile.shrink(this.datatype.toString());
		if(shrunk!=this.datatype.toString()) return shrunk;
	}
	// TODO if it's xsd:integer/xsd:decimal/xsd:double/xsd:boolean, return simplified form
	return this.toNT();
}
api.Literal.prototype.n3 = function n3(profile){
	return this.toTurtle(profile);
}
// Literal#valueOf returns a language-native value - e.g. a number, boolean, or Date where possible
api.Literal.prototype.valueOf = function() {
	if(this.datatype && typeof api.Literal.typeValueOf[this.datatype]=="function"){
		return api.Literal.typeValueOf[this.datatype](this.nominalValue, this.datatype);
	}
	return this.nominalValue;
}
Object.defineProperty(api.Literal.prototype, 'type', { get: function(){
	if(rdflangString.equals(this.datatype)) return null;
	if(xsdstring.equals(this.datatype)) return null;
	return this.datatype.nominalValue;
} });


api.Literal.typeValueOf = {};
api.Literal.registerTypeConversion = function(datatype, f){
	api.Literal.typeValueOf[datatype] = f;
}
require('./space.js').loadDefaultTypeConverters(api.Literal);

/**
 * NamedNode
 */
api.NamedNode = NamedNode;
inherits(api.NamedNode, api.RDFNode);
function NamedNode(iri) {
	if(typeof iri!='string') throw new TypeError('argument iri not a string');
	if(iri[0]=='_' && iri[1]==':') throw new Error('unexpected BlankNode syntax');
	if(!iri.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/)) throw new Error('Expected arguments[0] `iri` to look like an IRI');
	if(iri.indexOf(' ') >= 0) throw new Error('Unexpected whitespace in arguments[0] `iri`');
	this.nominalValue = iri;
};
api.NamedNode.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
api.NamedNode.prototype.nodeType = function nodeType() { return "IRI" };
api.NamedNode.prototype.interfaceName = "NamedNode";
api.NamedNode.prototype.termType = "NamedNode";
api.NamedNode.prototype.toNT = function toNT() {
	return "<" + encodeString(this.nominalValue) + ">";
};
api.NamedNode.prototype.toTurtle = function toTurtle(profile) {
	if(profile){
		var shrunk = profile.shrink(this.nominalValue);
		if(shrunk!=this.nominalValue) return shrunk;
	}
	return this.toNT();
}
api.NamedNode.prototype.n3 = function n3(profile) {
	return this.toTurtle(profile);
}

/**
 * TriplePattern
 */
api.TriplePattern = function TriplePattern(s, p, o) {
	if(typeof s=='string') s = new NamedNode(s);
	if(!api.RDFNode.is(s)) throw new Error('TriplePattern subject is not an RDFNode');
	if(s.termType!=='NamedNode' && s.termType!=='BlankNode' && s.termType!=='Variable') throw new Error('subject must be a NamedNode/BlankNode/Variable');

	if(typeof p=='string') p = new NamedNode(p);
	if(!api.RDFNode.is(p)) throw new Error('TriplePattern predicate is not an RDFNode');
	if(p.termType!=='NamedNode' && p.termType!=='Variable') throw new Error('predicate must be a NamedNode/Variable');

	if(typeof o=='string') o = new NamedNode(o);
	if(!api.RDFNode.is(o)) throw new Error('TriplePattern object is not an RDFNode');
	if(o.termType!=='NamedNode' && o.termType!=='BlankNode' && o.termType!=='Literal' && o.termType!=='Variable') throw new Error('object must be a NamedNode/BlankNode/Literal/Variable');

	this.subject = s;
	this.predicate = p;
	this.object = o;
};
api.TriplePattern.prototype.size = 3;
api.TriplePattern.prototype.length = 3;
api.TriplePattern.prototype.toString = function() {
	return this.subject.n3() + " " + this.predicate.n3() + " " + this.object.n3() + " .";
}
api.TriplePattern.prototype.equals = function(t) {
	return RDFNodeEquals.call(this.subject,t.subject) && RDFNodeEquals.call(this.predicate,t.predicate) && RDFNodeEquals.call(this.object,t.object);
}

/**
 * Variable
 */
api.Variable = Variable;
inherits(api.Variable, api.RDFNode);
function Variable(name) {
	if(typeof name!='string') throw new Error('Expected arguments[0] `name` to be a string');
	if(name[0]=='?' || name[0]=='$') name = name.substring(1);
	this.nominalValue = name;
};
api.Variable.SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
api.Variable.prototype.nodeType = function nodeType() { return "Variable" };
api.Variable.prototype.interfaceName = "Variable";
api.Variable.prototype.termType = "Variable";
api.RDFNode.prototype.toNT = function() {
	throw new Error('Cannot serialize variable to N-Triples');
}
api.Variable.prototype.toTurtle = function toTurtle() {
	throw new Error('Cannot serialize variable to Turtle');
}
api.Variable.prototype.n3 = function n3() {
	return '?'+this.nominalValue;
}

var xsdstring = new NamedNode('http://www.w3.org/2001/XMLSchema#string');
var rdflangString = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');

// Shamelessly copied from Builtins.js, also found in TurtleParser.js
var xsdns = require('./ns.js').xsdns;
var INTEGER = new RegExp("^(-|\\+)?[0-9]+$", "");
var xsdinteger = new NamedNode(xsdns('integer'));
var DOUBLE = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
var xsddouble = new NamedNode(xsdns('double'));
var DECIMAL = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");
var xsddecimal = new NamedNode(xsdns('decimal'));
var BOOLEAN = new RegExp("^(true|false)", "");
var xsdboolean = new NamedNode(xsdns('boolean'));

},{"./encodeString.js":36,"./ns.js":38,"./space.js":40}],34:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./Graph.js":29,"./RDFNode.js":33,"dup":12}],35:[function(require,module,exports){
"use strict";

var parsers = exports;

var Triple = require("./RDFNode.js").Triple;
var IRI = require('iri').IRI;
var env = require('./environment.js').environment;
function rdfns(v){return 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'+v;};
function xsdns(v){return 'http://www.w3.org/2001/XMLSchema#'+v;};

parsers.u8 = new RegExp("\\\\U([0-9A-Fa-f]{8})", "g");
parsers.u4 = new RegExp("\\\\u([0-9A-Fa-f]{4})", "g");
parsers.hexToChar = function hexToChar(hex) {
	var result = "";
	var n = parseInt(hex, 16);
	if(n <= 65535) {
		result += String.fromCharCode(n);
	} else if(n <= 1114111) {
		n -= 65536;
		result += String.fromCharCode(55296 + (n >> 10), 56320 + (n & 1023))
	} else {
		throw new Error("code point isn't known: " + n);
	}
	return result;
};
parsers.decodeString = function decodeString(str) {
	str = str.replace(parsers.u8, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(parsers.u4, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(new RegExp("\\\\t", "g"), "\t");
	str = str.replace(new RegExp("\\\\b", "g"), "\b");
	str = str.replace(new RegExp("\\\\n", "g"), "\n");
	str = str.replace(new RegExp("\\\\r", "g"), "\r");
	str = str.replace(new RegExp("\\\\f", "g"), "\f");
	str = str.replace(new RegExp('\\\\"', "g"), '"');
	str = str.replace(new RegExp("\\\\\\\\", "g"), "\\");
	return str;
};
parsers.decodePrefixedName = function(str){
	var decoded = '';
	for(var i=0; i<str.length; i++){
		if(str[i]=='\\'){
			decoded += str[++i];
		}else{
			decoded += str[i];
		}
	}
	return decoded;
}
parsers.decodeIRIREF = function decodeIRIREF(str) {
	str = str.replace(parsers.u8, function(matchstr, parens) { return parsers.hexToChar(parens); });
	str = str.replace(parsers.u4, function(matchstr, parens) { return parsers.hexToChar(parens); });
	return str;
};

/**
 * Turtle implements DataParser
 * doc param of parse() and process() must be a string
 */
function Turtle(environment) {
	if(!environment) environment = env.createProfile();
	this.environment = environment;
	this.base = new IRI('');
	this.bnHash = {};
	this.filter = null;
	this.processor = null;
	this.quick = null;
	this.graph = null;
};
parsers.Turtle = Turtle;

Turtle.parse = function parse(document, base){
	var parser = new Turtle();
	parser.parse(document, null, base);
	return parser;
}

Turtle.isWhitespace = new RegExp("^[ \t\r\n#]+", "");
Turtle.initialWhitespace = new RegExp("^[ \t\r\n]+", "");
Turtle.initialComment = new RegExp("^#[^\r\n]*", "");
Turtle.simpleToken = new RegExp("^[^ \t\r\n](\\.*[^ \t\r\n,;\\.])*", "");
Turtle.simpleObjectToken = /^(\\[_\~\.\-\!\$&'()*+,;=\/?#@%]|%[0-9A-Fa-f]{2}|[^ \t\r\n;,\[\]()])+/;
Turtle.tokenInteger = new RegExp("^(-|\\+)?[0-9]+", "");
Turtle.tokenDouble = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))", "");
Turtle.tokenDecimal = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?", "");
Turtle.PrefixedName = /^(([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD](([\-.0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])*[\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])?)?:([A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~])((([\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[.0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~]))*([\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]|[0-9:]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[!#$%&'()*+,\-.\/;=?@_~]))?|([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD](([\-.0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])*[\-0-9A-Z_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD])?)?:)/;

Turtle.prototype.parse = function parse(doc, callback, base, filter, graph) {
	this.graph = graph==null ? env.createGraph() : graph;
	if(base) this.base = new IRI(base.toString());
	this.filter = filter;
	this.quick = false;
	this.parseStatements(new String(doc));
	if((typeof callback)=="function") callback(this.graph);
	return true;
};
Turtle.prototype.process = function(doc, processor, filter) {
	this.processor = processor;
	if(base) this.base = new IRI(base.toString());
	this.filter = filter;
	this.quick = true;
	return this.parseStatements(new String(doc));
};
Turtle.prototype.t = function t(){ return {o:null} };
Turtle.prototype.expect = function(s, t) {
	if(typeof t.test=='function'){
		if(t.test(s)) return;
	}else if(typeof t=='string'){
		if(s.substring(0, t.length) == t) return;
	}
	throw new Error("Expected token: " + t + " at " + JSON.stringify(s.substring(0, 50)));
};
Turtle.prototype.parseStatements = function(s) {
	s = s.toString();
	while(s.length > 0) {
		s = this.skipWS(s);
		if(s.length == 0) return true;
		s = (s.charAt(0)=="@" || s.substring(0,4).toUpperCase()=='BASE' || s.substring(0,6).toUpperCase()=='PREFIX') ? this.consumeDirective(s) : this.consumeStatement(s);
		s = this.skipWS(s);
	}
	return true;
};
Turtle.prototype.add = function(t) {
	var $use = true;
	if(this.filter != null) $use = this.filter(t, null, null);
	if(!$use) return;
	this.quick ? this.processor(t) : this.graph.add(t);
};
Turtle.prototype.consumeBlankNode = function(s, t) {
	t.o = env.createBlankNode();
	s = this.skipWS(s.slice(1));
	if(s.charAt(0) == "]") return s.slice(1);
	s = this.skipWS(this.consumePredicateObjectList(s, t));
	this.expect(s, "]");
	return this.skipWS(s.slice(1));
};
Turtle.prototype.consumeCollection = function(s, subject) {
	subject.o = env.createBlankNode();
	var listject = this.t();
	listject.o = subject.o;
	s = this.skipWS(s.slice(1));
	var cont = s.charAt(0) != ")";
	if(!cont) { subject.o = env.createNamedNode(rdfns("nil")); }
	while(cont) {
		var o = this.t();
		switch(s.charAt(0)) {
			case "[": s = this.consumeBlankNode(s, o); break;
			case "_": s = this.consumeKnownBlankNode(s, o); break;
			case "(": s = this.consumeCollection(s, o); break;
			case "<": s = this.consumeURI(s, o); break;
			case '"': case "'": s = this.consumeLiteral(s, o); break;
			case '+': case '-': case '.':
			case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				var token;
				if(token = Turtle.tokenDouble.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("double"));
				} else if(token = Turtle.tokenDecimal.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("decimal"));
				} else if(token = Turtle.tokenInteger.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("integer"));
				} else {
					throw new Error("Expected NumericLiteral");
				}
				s = s.slice(token.length);
				break;
			default:
				var token = s.match(Turtle.simpleObjectToken).shift();
				if(token.charAt(token.length - 1) == ")") {
					token = token.substring(0, token.length - 1);
				}
				if(token==="false" || token==="true"){
					o.o = env.createLiteral(token, null, xsdns("boolean"));
				}else if(token.indexOf(":") >= 0) {
					o.o = env.createNamedNode(this.environment.resolve(token));
				}
				s = s.slice(token.length);
				break;
		}
		this.add(env.createTriple(listject.o, env.createNamedNode(rdfns("first")), o.o));
		s = this.skipWS(s);
		cont = s.charAt(0) != ")";
		if(cont) {
			this.add(env.createTriple(listject.o, env.createNamedNode(rdfns("rest")), listject.o = env.createBlankNode()));
		} else {
			this.add(env.createTriple(listject.o, env.createNamedNode(rdfns("rest")), env.createNamedNode(rdfns("nil"))));
		}
	}
	return this.skipWS(s.slice(1));
};
Turtle.prototype.consumeDirective = function(s) {
	var p = 0;
	if(s.substring(1, 7) == "prefix") {
		s = this.skipWS(s.slice(7));
		p = s.indexOf(":");
		var prefix = s.substring(0, p);
		s = this.skipWS(s.slice(++p));
		this.expect(s, "<");
		this.environment.setPrefix(prefix, this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">")))).toString());
		s = this.skipWS(s.slice(++p));
		this.expect(s, ".");
		s = s.slice(1);
	} else if(s.substring(0, 6).toUpperCase() == "PREFIX") {
		// SPARQL-style
		s = this.skipWS(s.slice(7));
		p = s.indexOf(":");
		var prefix = s.substring(0, p);
		s = this.skipWS(s.slice(++p));
		this.expect(s, "<");
		this.environment.setPrefix(prefix, this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">")))).toString());
		s = this.skipWS(s.slice(++p));
	} else if(s.substring(1, 5) == "base") {
		s = this.skipWS(s.slice(5));
		this.expect(s, "<");
		this.base = this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">"))));
		s = this.skipWS(s.slice(++p));
		this.expect(s, ".");
		s = s.slice(1);
	} else if(s.substring(0, 4).toUpperCase() == "BASE") {
		// SPARQL-style
		s = this.skipWS(s.slice(5));
		this.expect(s, "<");
		this.base = this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p = s.indexOf(">"))));
		s = this.skipWS(s.slice(++p));
	} else {
		throw new Error("Unknown directive: " + s.substring(0, 50));
	}
	return s;
};
Turtle.prototype.consumeKnownBlankNode = function(s, t) {
	this.expect(s, "_:");
	var bname = s.slice(2).match(Turtle.simpleToken).shift();
	t.o = this.getBlankNode(bname);
	return s.slice(bname.length + 2);
};
Turtle.prototype.consumeLiteral = function(s, o) {
	var char = s[0];
	var value = "";
	var hunt = true;
	var end = 0;
	var longchar = char+char+char;
	if(s.substring(0, 3) == longchar) {
		for(end=3; end<s.length; end++){
			if(s[end]=='\\') end++;
			else if(s[end]==char && s[end+1]==char && s[end+2]==char) break;
		}
		value = s.substring(3, end);
		s = s.slice(value.length + 6);
	} else {
		for(end=1; end<s.length; end++){
			if(s[end]=='\\') end++;
			else if(s[end]==char) break;
		}
		value = s.substring(1, end);
		s = s.slice(value.length + 2);
	}
	value = parsers.decodeString(value);
	switch(s.charAt(0)) {
		case "@":
			var langtag = s.match(Turtle.simpleObjectToken).shift();
			o.o = env.createLiteral(value, langtag.slice(1), null);
			s = s.slice(langtag.length);
			break;
		case "^":
			this.expect(s, "^^");
			s = s.substring(2);
			if(s.charAt(0) == "<"){
				var iri_end = s.indexOf(">");
				if(iri_end<0) throw new Error('Could not find terminating ">"');
				var iri_esc = s.substring(1, iri_end);
				var iri = env.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(iri_esc)).toString());
				s = this.skipWS(s.substring(iri_end+1));
			}else{
				var prefixedName = Turtle.PrefixedName.exec(s);
				if(!prefixedName) throw new Error('Expected PrefixedName');
				prefixedName = prefixedName[0];
				var iri = this.environment.resolve(parsers.decodePrefixedName(prefixedName));
				if(!iri) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(prefixedName)));
				s = this.skipWS(s.slice(prefixedName.length));
			}
			o.o = env.createLiteral(value, null, iri);
			break;
		default:
			o.o = env.createLiteral(value, null, null);
			break;
	}
	return s;
};
Turtle.prototype.consumeObjectList = function(s, subject, property) {
	var cont = true;
	while(cont) {
		var o = this.t();
		switch(s.charAt(0)) {
			case "[": s = this.consumeBlankNode(s, o); break;
			case "_": s = this.consumeKnownBlankNode(s, o); break;
			case "(": s = this.consumeCollection(s, o); break;
			case "<": s = this.consumeURI(s, o); break;
			case '"': case "'": s = this.consumeLiteral(s, o); break;
			case '+': case '-': case '.':
			case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				var token;
				if(token = Turtle.tokenDouble.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("double"));
				} else if(token = Turtle.tokenDecimal.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("decimal"));
				} else if(token = Turtle.tokenInteger.exec(s)){
					token = token[0];
					o.o = env.createLiteral(token, null, xsdns("integer"));
				} else {
					throw new Error("Expected NumericLiteral");
				}
				s = s.slice(token.length);
				break;
			default:
				var token = s.match(Turtle.simpleObjectToken);
				var prefixedName;
				token = token&&token[0] || "";
				if(token.charAt(token.length - 1) == ".") {
					token = token.substring(0, token.length - 1);
				}
				if(token==="true" || token==="false"){
					o.o = env.createLiteral(token, null, xsdns("boolean"));
					s = s.slice(token.length);
				}else if(prefixedName=Turtle.PrefixedName.exec(token)) {
					var prefixedName = prefixedName[0];
					var iri = this.environment.resolve(parsers.decodePrefixedName(prefixedName));
					if(!iri) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(prefixedName)));
					o.o = env.createNamedNode(iri);
					if(!o.o) throw new Error('Prefix not defined for '+token);
					s = s.slice(prefixedName.length);
				} else {
					throw new Error("Unrecognised token in ObjectList: " + token);
				}
				break;
		}
		s = this.skipWS(s);
		this.add(env.createTriple(subject.o, property, o.o));
		cont = s.charAt(0)==",";
		if(cont) { s = this.skipWS(s.slice(1)); }
	}
	return s;
};
Turtle.prototype.consumePredicateObjectList = function(s, subject) {
	var cont = true;
	while(cont) {
		var predicate = s.match(Turtle.PrefixedName);
		if(predicate){
			predicate = predicate.shift();
			var iri = this.environment.resolve(parsers.decodePrefixedName(predicate));
			if(!iri) throw new Error('Could not resolve PrefixedName '+JSON.stringify(parsers.decodePrefixedName(predicate)));
			property = env.createNamedNode(iri);
			s = this.skipWS(s.slice(predicate.length));
			s = this.consumeObjectList(s, subject, property);
			continue;
		}
		switch(s.charAt(0)) {
			case "a":
				var property = env.createNamedNode(rdfns("type"));
				s = this.skipWS(s.substring(1));
				break;
			case "<":
				var iri_end = s.indexOf(">");
				var iri = s.substring(1, iri_end);
				property = env.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(iri)).toString());
				s = this.skipWS(s.substring(iri_end+1));
				break;
			case "]": return s;
			case ".": return s;
			case ";":
				// empty predicate, skip
				s = this.skipWS(s.substring(1));
				continue;
			default:
				throw new Error('Expected PrefixedName');
		}
		s = this.consumeObjectList(s, subject, property);
		cont = s.charAt(0)==";";
		if(cont) { s = this.skipWS(s.slice(1)); }
	}
	return s;
};
Turtle.prototype.consumePrefixedName = function(s, t) {
	var name = s.match(Turtle.PrefixedName).shift();
	var iri = this.environment.resolve(parsers.decodePrefixedName(name));
	if(!iri) throw new Error('Could not resolve '+JSON.stringify(parsers.decodePrefixedName(predicate)));
	t.o = env.createNamedNode(iri);
	return s.slice(name.length);
};
Turtle.prototype.consumeStatement = function(s) {
	var t = this.t();
	switch(s.charAt(0)) {
		case "[":
			s = this.consumeBlankNode(s, t);
			if(s.charAt(0) == ".") return s.slice(1);
			break;
		case "_": s = this.consumeKnownBlankNode(s, t); break;
		case "(": s = this.consumeCollection(s, t); break;
		case "<": s = this.consumeURI(s, t); break;
		default: s = this.consumePrefixedName(s, t); break;
	}
	s = this.consumePredicateObjectList(this.skipWS(s), t);
	this.expect(s, ".");
	return s.slice(1);
};
Turtle.prototype.consumeURI = function(s, t) {
	this.expect(s, "<");
	var p = 0;
	t.o = env.createNamedNode(this.base.resolveReference(parsers.decodeIRIREF(s.substring(1, p=s.indexOf(">")))).toString());
	return s.slice(++p);
};
Turtle.prototype.getBlankNode = function(id) {
	if(this.bnHash[id]) return this.bnHash[id];
	return this.bnHash[id]=env.createBlankNode();
};
Turtle.prototype.skipWS = function(s) {
	while(Turtle.isWhitespace.test(s.charAt(0))) {
		s = s.replace(Turtle.initialWhitespace, "");
		if(s.charAt(0) == "#") {
			s = s.replace(Turtle.initialComment, "");
		}
	}
	return s;
};

},{"./RDFNode.js":33,"./environment.js":37,"iri":25}],36:[function(require,module,exports){
"use strict";

// Takes a string and produces an escaped Turtle String production but without quotes
module.exports = function encodeString(str) {
	var out = "";
	for(var i=0; i<str.length; i++) {
		var code = str.charCodeAt(i);
		if(0xD800<=code && code<=0xDBFF) {
			var low = str.charCodeAt(i + 1);
			if(low>=0xDC00 && low<=0xDFFF){
				code = (code - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000;
				++i;
			}
		}
		if(code > 0x10FFFF) { throw new Error("Char out of range"); }
		var hex = "00000000".concat((new Number(code)).toString(16).toUpperCase());
		if(code >= 0x10000) {
			out += "\\U" + hex.slice(-8);
		} else {
			if(code >= 0x7F || code <= 31) {
				switch(code) {
					case 0x09:	out += "\\t"; break;
					case 0x0A: out += "\\n"; break;
					case 0x0D: out += "\\r"; break;
					default: out += "\\u" + hex.slice(-4); break;
				}
			} else {
				switch(code) {
					case 0x22: out += '\\"'; break;
					case 0x5C: out += "\\\\"; break;
					default: out += str.charAt(i); break;
				}
			}
		}
	}
	return out;
}

},{}],37:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./RDFEnvironment.js":32,"./prefixes.js":39,"dup":15}],38:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],39:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],40:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],41:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],42:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":41,"_process":26,"inherits":24}],43:[function(require,module,exports){

exports.tokenize = require('./lib/core.js').tokenize;
exports.inherits = require('./lib/core.js').inherits;
exports.RDFaContext = require('./lib/core.js').RDFaContext;
exports.RDFaParser = require('./lib/core.js').RDFaParser;

exports.RDFaCoreParser = require('./lib/core.js').RDFaCoreParser;
exports.RDFaXMLParser = require('./lib/host-xml.js').RDFaXMLParser;
exports.RDFaHTMLParser = require('./lib/host-html.js').RDFaHTMLParser;
exports.RDFaXHTMLParser = require('./lib/host-xhtml.js').RDFaXHTMLParser;

},{"./lib/core.js":47,"./lib/host-html.js":48,"./lib/host-xhtml.js":49,"./lib/host-xml.js":50}],44:[function(require,module,exports){
module.exports={
	"source": "https://www.w3.org/2011/rdfa-context/rdfa-1.1",
	"prefixes": {
		":": "http://www.w3.org/1999/xhtml/vocab#"
	},
	"context": {
		"as:": "https://www.w3.org/ns/activitystreams#",
		"csvw:": "http://www.w3.org/ns/csvw#",
		"dcat:": "http://www.w3.org/ns/dcat#",
		"dqv:": "http://www.w3.org/ns/dqv#",
		"duv:": "https://www.w3.org/TR/vocab-duv#",
		"grddl:": "http://www.w3.org/2003/g/data-view#",
		"ldp:": "http://www.w3.org/ns/ldp#",
		"ma:": "http://www.w3.org/ns/ma-ont#",
		"oa:": "http://www.w3.org/ns/oa#",
		"org:": "http://www.w3.org/ns/org#",
		"owl:": "http://www.w3.org/2002/07/owl#",
		"prov:": "http://www.w3.org/ns/prov#",
		"qb:": "http://purl.org/linked-data/cube#",
		"rdf:": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
		"rdfa:": "http://www.w3.org/ns/rdfa#",
		"rdfs:": "http://www.w3.org/2000/01/rdf-schema#",
		"rif:": "http://www.w3.org/2007/rif#",
		"rr:": "http://www.w3.org/ns/r2rml#",
		"sd:": "http://www.w3.org/ns/sparql-service-description#",
		"skos:": "http://www.w3.org/2004/02/skos/core#",
		"skosxl:": "http://www.w3.org/2008/05/skos-xl#",
		"ssn:": "http://www.w3.org/ns/ssn/",
		"sosa:": "http://www.w3.org/ns/sosa/",
		"time:": "http://www.w3.org/2006/time#",
		"void:": "http://rdfs.org/ns/void#",
		"wdr:": "http://www.w3.org/2007/05/powder#",
		"wdrs:": "http://www.w3.org/2007/05/powder-s#",
		"xhv:": "http://www.w3.org/1999/xhtml/vocab#",
		"xml:": "http://www.w3.org/XML/1998/namespace",
		"xsd:": "http://www.w3.org/2001/XMLSchema#",
		"earl:": "http://www.w3.org/ns/earl#",
		"odrl:": "http://www.w3.org/ns/odrl/2/",
		"cc:": "http://creativecommons.org/ns#",
		"ctag:": "http://commontag.org/ns#",
		"dc:": "http://purl.org/dc/terms/",
		"dcterms:": "http://purl.org/dc/terms/",
		"dc11:": "http://purl.org/dc/elements/1.1/",
		"foaf:": "http://xmlns.com/foaf/0.1/",
		"gr:": "http://purl.org/goodrelations/v1#",
		"ical:": "http://www.w3.org/2002/12/cal/icaltzd#",
		"og:": "http://ogp.me/ns#",
		"rev:": "http://purl.org/stuff/rev#",
		"sioc:": "http://rdfs.org/sioc/ns#",
		"v:": "http://rdf.data-vocabulary.org/#",
		"vcard:": "http://www.w3.org/2006/vcard/ns#",
		"schema:": "http://schema.org/"
	},
	"terms": {
		"describedby": "http://www.w3.org/2007/05/powder-s#describedby",
		"license": "http://www.w3.org/1999/xhtml/vocab#license",
		"role": "http://www.w3.org/1999/xhtml/vocab#role"
	}
}

},{}],45:[function(require,module,exports){
module.exports={
	"source": "http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1",
	"prefixes": {
	},
	"context": {
	},
	"terms": {
		"alternate": "http://www.w3.org/1999/xhtml/vocab#alternate",
		"appendix": "http://www.w3.org/1999/xhtml/vocab#appendix",
		"cite": "http://www.w3.org/1999/xhtml/vocab#cite",
		"bookmark": "http://www.w3.org/1999/xhtml/vocab#bookmark",
		"contents": "http://www.w3.org/1999/xhtml/vocab#contents",
		"chapter": "http://www.w3.org/1999/xhtml/vocab#chapter",
		"copyright": "http://www.w3.org/1999/xhtml/vocab#copyright",
		"first": "http://www.w3.org/1999/xhtml/vocab#first",
		"glossary": "http://www.w3.org/1999/xhtml/vocab#glossary",
		"help": "http://www.w3.org/1999/xhtml/vocab#help",
		"icon": "http://www.w3.org/1999/xhtml/vocab#icon",
		"index": "http://www.w3.org/1999/xhtml/vocab#index",
		"last": "http://www.w3.org/1999/xhtml/vocab#last",
		"license": "http://www.w3.org/1999/xhtml/vocab#license",
		"meta": "http://www.w3.org/1999/xhtml/vocab#meta",
		"next": "http://www.w3.org/1999/xhtml/vocab#next",
		"prev": "http://www.w3.org/1999/xhtml/vocab#prev",
		"previous": "http://www.w3.org/1999/xhtml/vocab#previous",
		"section": "http://www.w3.org/1999/xhtml/vocab#section",
		"start": "http://www.w3.org/1999/xhtml/vocab#start",
		"stylesheet": "http://www.w3.org/1999/xhtml/vocab#stylesheet",
		"subsection": "http://www.w3.org/1999/xhtml/vocab#subsection",
		"top": "http://www.w3.org/1999/xhtml/vocab#top",
		"up": "http://www.w3.org/1999/xhtml/vocab#up",
		"p3pv1": "http://www.w3.org/1999/xhtml/vocab#p3pv1"
	}
}

},{}],46:[function(require,module,exports){

exports['http://www.w3.org/2011/rdfa-context/rdfa-1.1'] = require('./context-rdfa-1.1.json');
exports['http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1'] = require('./context-xhtml-rdfa-1.1.json');

},{"./context-rdfa-1.1.json":44,"./context-xhtml-rdfa-1.1.json":45}],47:[function(require,module,exports){

var rdf = require('rdf');
var IRI = require('iri');
var XMLSerializer = function(xmlNode){
	var s = new (require('xmldom').XMLSerializer);
	return s.serializeToString(xmlNode);
}

var context = require('./context.js');

var rdfaNS = rdf.ns('http://www.w3.org/ns/rdfa#');
var dcNS = rdf.ns('http://purl.org/dc/terms/');

const StringLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral";
const XMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral";
const HTMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML";
const XHTMLNS = "http://www.w3.org/1999/xhtml/vocab#";
const XSDString = "http://www.w3.org/2001/XMLSchema#string";

module.exports.inherits = inherits;
function inherits(ctor, superCtor) {
	//ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: { value: ctor, enumerable: false },
	});
};

module.exports.tokenize = tokenize;
function tokenize(s){
	return s.trim().split(/\s+/);
}

module.exports.RDFaContext = RDFaContext;
function RDFaContext(parser, node){
	// Settings
	this.depth = 0;
	this.parser = parser;
	this.base = parser.base;
	this.node = node;
	this.rdfenv = parser.rdfenv;
	this.bm = null; // bnode map
	// RDFa context
	this.parentContext = null;
	this.parentSubject = this.rdfenv.createNamedNode(parser.base);
	this.parentObject = null;
	this.pendingincomplete = [];
	this.listMapping = {};
	this.language = null;
	this.prefixes = {};
	this.prefixesDefault = parser.contextPrefixes;
	this.terms = parser.contextTerms;
	this.vocabulary = null;
	this.query = null;
	// Local variables, set based on local attributes and child elements
	this.skipElement = true;
	this.currentObjectResource = null;
	this.newSubject = null;
	this.localListMapping = {};
	this.incomplete = [];
}
RDFaContext.prototype.child = function child(node){
	var ctx = new this.parser.RDFaContext(this.parser, node);
	ctx.rdfenv = this.rdfenv;
	ctx.bm = this.bm;
	ctx.parentContext = this;
	ctx.depth = this.depth + 1;
	ctx.base = this.base;
	ctx.prefixesDefault = this.prefixesDefault;
	//ctx.terms = this.terms;
	if(this.skipElement){
		ctx.parentSubject = this.parentSubject;
		ctx.parentObject = this.parentObject;
		ctx.incomplete = this.incomplete;
		ctx.pendingincomplete = this.pendingincomplete;
		ctx.listMapping = this.listMapping;
		ctx.language = this.language;
		ctx.prefixes = {};
		for(var n in this.prefixes) ctx.prefixes[n] = this.prefixes[n];
		ctx.terms = {};
		for(var n in this.terms) ctx.terms[n] = this.terms[n];
		ctx.vocabulary = this.vocabulary;
		ctx.query = this.query;
	}else{
		ctx.parentSubject = this.newSubject || this.parentSubject;
		ctx.parentObject = this.currentObjectResource || this.newSubject || this.parentSubject;
		ctx.prefixes = {};
		for(var n in this.prefixes) ctx.prefixes[n] = this.prefixes[n];
		ctx.pendingincomplete = this.incomplete;
		ctx.listMapping = this.localListMapping;
		ctx.language = this.language;
		ctx.vocabulary = this.vocabulary;
	}
	return ctx;
}
RDFaContext.prototype.onPop = function onPop(){
	var rdfaContext = this;
	var self = rdfaContext.parser;
	for(var prop in rdfaContext.localListMapping){
		// only process lists that were created in the current context
		if(rdfaContext.listMapping[prop]) return;
		var list = rdfaContext.localListMapping[prop];
		if(list.length == 0){
			self.emit(
				rdfaContext.parentSubject,
				prop,
				rdf.rdfns('nil')
			);
		}else{
			var rest = rdfaContext.rdfenv.createBlankNode();
			self.emit(
				rdfaContext.parentSubject,
				prop,
				rest
			);
			rdfaContext.localListMapping[prop].forEach(function(first, i){
				var next = rdfaContext.rdfenv.createBlankNode();
				self.emit(
					rest,
					rdf.rdfns('first'),
					first
				);
				self.emit(
					rest,
					rdf.rdfns('rest'),
					(i==list.length-1) ? rdf.rdfns('nil') : next
				);
				rest = next;
			});
		}
	}
}
RDFaContext.prototype.mapBlankNode = function mapBlankNode(name){
	if(this.bm[name]){
		return this.bm[name];
	}
	var bnode = this.bm[name] = this.rdfenv.createBlankNode();
	bnode.nominalValue += '_'+name.substring(2);
	return bnode;
}
RDFaContext.prototype.resolveReference = function resolveReference(iriref){
	return new IRI.IRI(this.base).resolveReference(iriref).toString();
}
RDFaContext.prototype.fromSafeCURIEorCURIEorIRI = function fromSafeCURIEorCURIEorIRI(str){
	// @about and @resource support the datatype SafeCURIEorCURIEorIRI - allowing a SafeCURIE, a CURIE, or an IRI.
	var ctx = this;
	if(str.charAt(0)=='[' && str.charAt(str.length-1)==']'){
		var safecurie = str.substring(1, str.length-1).trim();
		if (safecurie.length === 0) {
			return null;
			//throw new Error('Bad SafeCURIE');
		}else{
			return ctx.fromCURIE(safecurie);
		}
	}else{
		var iriref = str.trim();
		var iproto = iriref.indexOf(':');
		if(iproto>=0) var proto = iriref.substring(0, iproto+1);
		if(proto=='_:'){
			return this.mapBlankNode(iriref);
		}else if(proto && Object.hasOwnProperty.call(ctx.prefixes, proto)){
			return this.rdfenv.createNamedNode(ctx.prefixes[proto] + str.substring(iproto+1));
		}else if(proto && Object.hasOwnProperty.call(ctx.prefixesDefault, proto)){
			this.parser.warning('Assumed prefix for '+proto+' = <'+ctx.prefixesDefault[proto]+'>');
			return this.rdfenv.createNamedNode(ctx.prefixesDefault[proto] + str.substring(iproto+1));
		}else{
			return this.rdfenv.createNamedNode(this.resolveReference(iriref));
		}
	}
}
RDFaContext.prototype.fromCURIE = function fromCURIE(str){
	// @href and @src are as defined in the Host Language (e.g., XHTML), and support only an IRI.
	// @vocab supports an IRI.
	var ctx = this;
	var iri = str.trim();
	var iproto = iri.indexOf(':');
	var proto = iri.substring(0, iproto+1);
	if(proto=='_:'){
		return this.mapBlankNode(iri);
	}else if(Object.hasOwnProperty.call(ctx.prefixes, proto)){
		return this.rdfenv.createNamedNode(ctx.prefixes[proto] + str.substring(iproto+1));
	}else if(Object.hasOwnProperty.call(ctx.prefixesDefault, proto)){
		this.parser.warning('Assumed prefix for '+proto+' = <'+ctx.prefixesDefault[proto]+'>');
		return this.rdfenv.createNamedNode(ctx.prefixesDefault[proto] + str.substring(iproto+1));
	}else{
		throw new Error('CURIE not found');
	}
}
RDFaContext.prototype.fromIRI = function fromIRI(str){
	// @href and @src are as defined in the Host Language (e.g., XHTML), and support only an IRI.
	// @vocab supports an IRI.
	var iri = this.resolveReference(str.trim()).toString();
	return this.rdfenv.createNamedNode(iri);
}
RDFaContext.prototype.fromTERMorCURIEorAbsIRI = function fromTERMorCURIEorAbsIRI(str){
	// @datatype supports the datatype TERMorCURIEorAbsIRI - allowing a single Term, CURIE, or Absolute IRI.
	var ctx = this;
	var iproto = str.indexOf(':');
	if(iproto<0){
		var term = str.trim().toLowerCase();
		// No colon, this must be a term
		if(ctx.vocabulary && str){
			return ctx.rdfenv.createNamedNode(ctx.vocabulary + str);
		}else if(Object.hasOwnProperty.call(ctx.terms, term)){
			return ctx.rdfenv.createNamedNode(ctx.terms[term]);
		}else{
			return null;
		}
	}else{
		// Colon present, check for CURIE
		var proto = str.substring(0, iproto+1);
		if(proto==='_:'){
			return ctx.mapBlankNode(str.trim());
		}else if(Object.hasOwnProperty.call(ctx.prefixes, proto)){
			return ctx.rdfenv.createNamedNode(ctx.prefixes[proto] + str.substring(iproto+1));
		}else if(Object.hasOwnProperty.call(ctx.prefixesDefault, proto)){
			this.parser.warning('Assumed prefix for '+proto+' = <'+ctx.prefixesDefault[proto]+'>');
			return ctx.rdfenv.createNamedNode(ctx.prefixesDefault[proto] + str.substring(iproto+1));
		}else{
			return ctx.rdfenv.createNamedNode(str);
		}
	}
}
RDFaContext.prototype.fromTERMorCURIEorAbsIRIs = function fromTERMorCURIEorAbsIRIs(str){
	// @property, @typeof, @rel, and @rev use TERMorCURIEorAbsIRIs
	var ctx = this;
	return tokenize(str).map(function(term){
		return ctx.fromTERMorCURIEorAbsIRI(term);
	}).filter(function(v){ return !!v; });
}

module.exports.RDFaParser = RDFaParser;
function RDFaParser(base, documentElement, rdfenv){
	this.base = base;
	this.documentElement = documentElement;
	this.stack = [];
	this.queries = [];
	// If set to an array, save every RDFaContext in order in contextList
	this.contextList = null;
	this.contextPrefixes = {};
	this.contextTerms = {};
	// Host language configuration/feature switches
	this.setNewSubject = null;
	// Runtime options
	this.emitUsesVocabulary = true;
	if(rdfenv) this.rdfenv = rdfenv;
	this.outputGraph = this.rdfenv.createGraph();
	this.processorGraph = this.rdfenv.createGraph();
	this.XMLSerializer = XMLSerializer;
}

RDFaParser.prototype.RDFaContext = RDFaContext;
RDFaParser.prototype.rdfenv = rdf.environment;

RDFaParser.prototype.initialize = function initialize(){
	this.stack = [];
	var ctx = new this.RDFaContext(this, null);
	ctx.bm = {};
	ctx.skipElement = true;
	// RDFa the 'default prefix' mapping is the XHTML NS
	ctx.prefixes[':'] = XHTMLNS;
	ctx.parentSubject = this.rdfenv.createNamedNode(ctx.base);
	ctx.parentObject = this.rdfenv.createNamedNode(ctx.base);
	ctx.newSubject = this.rdfenv.createNamedNode(ctx.base);
	this.stack.push(ctx);
	if(this.contextList) this.contextList.push(ctx);
}

RDFaParser.prototype.importContext = function importContext(data){
	var self = this;
	for(var k in data.context){
		self.contextPrefixes[k] = data.context[k];
	}
	for(var k in data.terms){
		self.contextTerms[k] = data.terms[k];
	}
}

RDFaParser.prototype.log = function log(message){
	if(this.console) this.console.log.apply(console, arguments);
	var event = this.rdfenv.createBlankNode();
	this.processorGraph.add(this.rdfenv.createTriple(
		event, rdf.rdfns('type'), rdfaNS('Info')
	));
	this.processorGraph.add(this.rdfenv.createTriple(
		event, dcNS('description'), this.rdfenv.createLiteral(message.toString())
	));
}

RDFaParser.prototype.warning = function warning(message){
	if(this.console) this.console.error.apply(console, arguments);
	var event = this.rdfenv.createBlankNode();
	this.processorGraph.add(this.rdfenv.createTriple(
		event, rdf.rdfns('type'), rdfaNS('Warning')
	));
	this.processorGraph.add(this.rdfenv.createTriple(
		event, dcNS('description'), this.rdfenv.createLiteral(message.toString())
	));
}

RDFaParser.prototype.error = function error(message){
	if(this.console) this.console.error.apply(console, arguments);
	var event = this.rdfenv.createBlankNode();
	this.processorGraph.add(this.rdfenv.createTriple(
		event, rdf.rdfns('type'), rdfaNS('Error')
	));
	this.processorGraph.add(this.rdfenv.createTriple(
		event, dcNS('description'), this.rdfenv.createLiteral(message.toString())
	));
}

RDFaParser.prototype.emit = function emit(s, p, o){
	this.outputGraph.add(this.rdfenv.createTriple(s, p, o));
}

RDFaParser.prototype.walkDocument = function walkDocument(document){
	var self = this;
	// Visit each element recursively
	var node = document;
	while(node){
		if(node.nodeType==node.ELEMENT_NODE){
			this.processElement(node);
			var rdfaContext = self.stack[this.stack.length-1];
		}else if(node.nodeType==node.PROCESSING_INSTRUCTION_NODE){
			self.warning('Unhandled PROCESSING_INSTRUCTION_NODE');
		}else if(node.nodeType==node.TEXT_NODE){
		}else if(node.nodeType==node.DOCUMENT_NODE){
			self.processDocument(node);
		}else if(node.nodeType==node.DOCUMENT_TYPE_NODE){
		}else if(node.nodeType==node.COMMENT_NODE){
		}else{
			throw new Error('Unknown node type '+node.nodeType);
		}
		// Visit the next element recursively
		// If there's a child, visit that
		// Otherwise, try to visit the next sibling
		// Failing that, walk up the tree until there's an element with a nextSibling, and visit that sibling
		if(node.firstChild){
			node = node.firstChild;
		}else{
			while(node && !node.nextSibling){
				if(node.nodeType==node.ELEMENT_NODE || node.nodeType==node.DOCUMENT_NODE){
						self.processNodeEnd(node);
				}
				node = node.parentNode;
			}
			if(node){
				if(node.nodeType==node.ELEMENT_NODE || node.nodeType==node.DOCUMENT_NODE){
						self.processNodeEnd(node);
				}
				node = node.nextSibling;
			}
		}
	}
}

RDFaParser.prototype.getVocab = function getVocab(node){
	return node.hasAttribute('vocab') ? node.getAttribute('vocab') : null;
};
RDFaParser.prototype.getPrefix = function getPrefix(node){
	return node.hasAttribute('prefix') ? node.getAttribute('prefix') : null;
};
RDFaParser.prototype.getRel = function getRel(node){
	return node.hasAttribute('rel') ? node.getAttribute('rel') : null;
};
RDFaParser.prototype.getRev = function getRev(node){
	return node.hasAttribute('rev') ? node.getAttribute('rev') : null;
};
RDFaParser.prototype.getTypeof = function getTypeof(node){
	return node.hasAttribute('typeof') ? node.getAttribute('typeof') : null;
};
RDFaParser.prototype.getProperty = function getProperty(node){
	return node.hasAttribute('property') ? node.getAttribute('property') : null;
};
RDFaParser.prototype.getDatatype = function getDatatype(node){
	return node.hasAttribute('datatype') ? node.getAttribute('datatype') : null;
};
RDFaParser.prototype.getDatetime = function getDatetime(node){
	return node.hasAttribute('datetime') ? node.getAttribute('datetime') : null;
};
RDFaParser.prototype.getContent = function getContent(node){
	return node.hasAttribute('content') ? node.getAttribute('content') : null;
};
RDFaParser.prototype.getAbout = function getAbout(node){
	return node.hasAttribute('about') ? node.getAttribute('about') : null;
};
RDFaParser.prototype.getSrc = function getSrc(node){
	return node.hasAttribute('src') ? node.getAttribute('src') : null;
};
RDFaParser.prototype.getResource = function getResource(node){
	return node.hasAttribute('resource') ? node.getAttribute('resource') : null;
};
RDFaParser.prototype.getHref = function getHref(node){
	return node.hasAttribute('href') ? node.getAttribute('href') : null;
};
RDFaParser.prototype.getInlist = function getInlist(node){
	return node.hasAttribute('inlist') ? node.getAttribute('inlist') : null;
};

RDFaContext.prototype.getRelNode = function getRelNode(node){
	var attr = this.parser.getRel(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaContext.prototype.getRevNode = function getRevNode(node){
	var attr = this.parser.getRev(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaContext.prototype.getTypeofNode = function getTypeofNode(node){
	var attr = this.parser.getTypeof(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaContext.prototype.getPropertyNode = function getPropertyNode(node){
	var attr = this.parser.getProperty(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRIs(attr);
	return attr;
};
RDFaContext.prototype.getDatatypeNode = function getDatatypeNode(node){
	var attr = this.parser.getDatatype(node);
	if(typeof attr=='string') return this.fromTERMorCURIEorAbsIRI(attr);
	return attr;
};
// RDFaContext.prototype.getContentNode = function getContentNode(node){
// 	var attr = this.parser.getContent(node);
// 	if(typeof attr=='string') return this.from(attr);
// 	return attr;
// };
RDFaContext.prototype.getAboutNode = function getAboutNode(node){
	var attr = this.parser.getAbout(node);
	if(typeof attr=='string') return this.fromSafeCURIEorCURIEorIRI(attr);
	return attr;
};
RDFaContext.prototype.getSrcNode = function getSrcNode(node){
	var attr = this.parser.getSrc(node);
	if(typeof attr=='string') return this.fromIRI(attr);
	return attr;
};
RDFaContext.prototype.getResourceNode = function getResourceNode(node){
	var attr = this.parser.getResource(node);
	if(typeof attr=='string') return this.fromSafeCURIEorCURIEorIRI(attr);
	return attr;
};
RDFaContext.prototype.getHrefNode = function getHrefNode(node){
	var attr = this.parser.getHref(node);
	if(typeof attr=='string') return this.fromIRI(attr);
	return attr;
};

RDFaParser.prototype.processDocument = function processDocument(node){
	var self = this;
	self.initialize();
	var rdfaContext = self.stack[self.stack.length-1].child(node);
	self.stack.push(rdfaContext);
	if(this.contextList) this.contextList.push(rdfaContext);
}

RDFaParser.prototype.processElement = function processElement(node){
	var self = this;
	var rdfaContext = self.stack[self.stack.length-1].child(node);
//	node.rdfaContext = rdfaContext;
//	console.log('set rdfaContext');
	self.stack.push(rdfaContext);
	if(this.contextList) this.contextList.push(rdfaContext);

	// Step 1
	var typedResource = null;
	// these functions are expected to return null for no attribute, string for attribute
	var setVocab = this.getVocab(node);
	var setPrefix = this.getPrefix(node);
	var setRel = this.getRel(node);
	var setRev = this.getRev(node);
	var setTypeof = this.getTypeof(node);
	var setProperty = this.getProperty(node);
	var setDatatype = this.getDatatype(node);
	var setDatetime = this.getDatetime(node);
	var setContent = this.getContent(node);
	var setAbout = this.getAbout(node);
	var setSrc = this.getSrc(node);
	var setResource = this.getResource(node);
	var setHref = this.getHref(node);
	var setInlist = this.getInlist(node);


	// Amendment. Change IRI base with xml:base
	if(node.hasAttribute('xml:base')){
		rdfaContext.base = rdfaContext.resolveReference(node.getAttribute('xml:base')).toString();
	}
	
	// Step 2. set default vocab
	if(typeof setVocab=='string' && setVocab.trim().length){
		var vocabIRI = rdfaContext.fromIRI(setVocab);
	}
	if(vocabIRI){
		if(this.emitUsesVocabulary){
			this.emit(
				rdfaContext.rdfenv.createNamedNode(rdfaContext.base),
				rdfaNS('usesVocabulary'),
				vocabIRI
			);
		}
		rdfaContext.vocabulary = vocabIRI;
	}else if(setVocab===""){
		rdfaContext.vocabulary = null;
	}

	// Amendment: Import IRI mappings from xmlns
	for(var i=0; i<node.attributes.length; i++){
		var name = node.attributes[i].name;
		if(name.substring(0, 6)=='xmlns:'){
			rdfaContext.prefixes[name.substring(6)+':'] = rdfaContext.fromIRI(node.attributes[i].value.trim());
		}
	}

	// Step 3. set IRI mappings
	if(setPrefix){
		// TODO scan for xmlns assignments too
		var list = tokenize(setPrefix);
		for(var i=0; i<list.length; i+=2){
			var prefixName = list[i];
			// FIXME this is the ASCII subset of allowed names
			// FIXME does NCName allow empty prefixes?
			if(!prefixName.match(/^([A-Za-z_][-.0-9A-Za-z_]*)?:$/)) throw new Error('Invalid prefix');
			// A Conforming RDFa Processor must ignore any definition of a mapping for the '_' prefix
			if(prefixName=='_:') continue;
			// Validate mapped URI @@@TODO Allow Unicode
			var prefixUri = list[i+1];
			if(!prefixUri.match(/^(([^:\/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)) throw new Error('Invalid URI/IRI');
			rdfaContext.prefixes[prefixName] = rdfaContext.fromIRI(prefixUri);
		}
	}

	var termRel = rdfaContext.getRelNode(node);
	var termRev = rdfaContext.getRevNode(node);
	var termTypeof = rdfaContext.getTypeofNode(node);
	var termProperty = rdfaContext.getPropertyNode(node);
	var termDatatype = rdfaContext.getDatatypeNode(node);
	var termAbout = rdfaContext.getAboutNode(node);
	var termSrc = rdfaContext.getSrcNode(node);
	var termResource = rdfaContext.getResourceNode(node);
	var termHref = rdfaContext.getHrefNode(node);

	if(typeof setAbout=='string') var aboutIRI = termAbout;
	else if(node==this.documentElement) var aboutIRI = rdfaContext.base.toString();
	// According to the test suite, even if @about is invalid, it still sometimes considered present and affects processing
	// Handle the condition where @about is invalid, but not otherwise used and still considered present
	var hasAbout = aboutIRI || typeof setAbout=='string';

	if(typeof setResource=='string') var resourceIRI = termResource;

	// Step 4. Set language
	if(node.hasAttribute('lang')){
		var setLang = node.getAttribute('lang');
		if(setLang.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			rdfaContext.language = setLang;
		}else if(setLang==''){
			rdfaContext.language = null;
		}else{
			throw new Error('Expected @lang to look like a LangTag');
		}
	}
	if(node.hasAttribute('xml:lang')){
		var setLang = node.getAttribute('xml:lang');
		if(setLang.match(/^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/)){
			rdfaContext.language = setLang;
		}else if(setLang==''){
			rdfaContext.language = null;
		}else{
			throw new Error('Expected @xml:lang to look like a LangTag');
		}
	}

	// Step 5. establish new subject
	if(typeof setRel!='string' && typeof setRev!='string'){
		if(typeof setProperty=='string' && typeof setContent!='string' && typeof setDatatype!='string'){
			// Step 5.1.
			// If the current element contains the @property attribute, but does not contain either the @content or @datatype attributes, then
			// Set new subject
			if(aboutIRI){
				// by using the resource from @about, if present, obtained according to the section on CURIE and IRI Processing;
				rdfaContext.newSubject = aboutIRI;
			}else if(this.setNewSubject && this.setNewSubject(node)){
				rdfaContext.newSubject = rdfaContext.parentObject;
			}else{
				// otherwise, if parent object is present, new subject is set to the value of parent object.
				// parentObject should always be defined at this point
				if(!rdfaContext.parentObject) throw new Error('Expected parentObject');
				rdfaContext.newSubject = rdfaContext.parentObject;
			}
			// If @typeof is present then typed resource is set to the resource obtained from the first match from the following rules:
			if(typeof setTypeof=='string'){
				if(aboutIRI) typedResource = aboutIRI;
				else {
					// "otherwise"
					if(resourceIRI) typedResource = resourceIRI;
					else if(typeof setHref=='string') typedResource = termHref;
					else if(typeof setSrc=='string') typedResource = termSrc;
					else typedResource = rdfaContext.rdfenv.createBlankNode();
					// typeof on an object sets currentObjectResource
					rdfaContext.currentObjectResource = typedResource;
				}
			}
		}else{
			// Step 5.2.
			if(aboutIRI){
				rdfaContext.newSubject = aboutIRI;
			}else if(resourceIRI){
				rdfaContext.newSubject = resourceIRI;
			}else if(typeof setHref=='string'){
				rdfaContext.newSubject = termHref;
			}else if(typeof setSrc=='string'){
				rdfaContext.newSubject = termSrc;
//			}else if(node===this.documentElement){
				// This is set earlier when aboutIRI is computed
//				rdfaContext.newSubject = base.toString();
		}else if(this.setNewSubject && this.setNewSubject(node)){
				rdfaContext.newSubject = rdfaContext.parentObject;
			}else if(typeof setTypeof=='string'){
				rdfaContext.newSubject = rdfaContext.rdfenv.createBlankNode();
			}else{
				// parentObject should always be defined at this point
				if(!rdfaContext.parentObject) throw new Error('Expected parentObject');
				rdfaContext.newSubject = rdfaContext.parentObject;
			}
			if(typeof setTypeof=='string'){
				typedResource = rdfaContext.newSubject;
			}
		}
	}else{
		// Step 6. the current element contains a @rel or @rev attribute.
		// establish both a value for new subject and a value for current object resource.
		if(aboutIRI){
			rdfaContext.newSubject = aboutIRI;
			if(typeof setTypeof=='string'){
				typedResource = rdfaContext.newSubject;
			}
		}else if(this.setNewSubject && this.setNewSubject(node)){
				// by using the resource from @about, if present, obtained according to the section on CURIE and IRI Processing;
				rdfaContext.newSubject = rdfaContext.parentObject;
		}else{
			// rel/rev is present, so statements are chained onto the parent object
			// parentObject should always be defined at this point
			if(!rdfaContext.parentObject) throw new Error('Expected parentObject');
			rdfaContext.newSubject = rdfaContext.parentObject;
		}
		if(resourceIRI){
			rdfaContext.currentObjectResource = resourceIRI;
		}else if(typeof setHref=='string'){
			rdfaContext.currentObjectResource = termHref;
		}else if(typeof setSrc=='string'){
			rdfaContext.currentObjectResource = termSrc;
		}else if(this.setNewSubject && this.setNewSubject(node)){
			rdfaContext.newSubject = rdfaContext.parentObject;
		}else if(typeof setTypeof=='string' && !hasAbout){
			rdfaContext.currentObjectResource = rdfaContext.rdfenv.createBlankNode();
		}
		if(typeof setTypeof=='string' && typeof setAbout!='string'){
			typedResource = rdfaContext.currentObjectResource;
		}
	}

	// If the element does not contain @rel, @rev, @property, @about, @href, @src, @resource, @typeof: then set skipElement <- true
	if(
		typeof setRel!='string'
		&& typeof setRev!='string'
		&& typeof setProperty!='string'
		&& !hasAbout
		&& typeof setHref!='string'
		&& typeof setSrc!='string'
		&& !resourceIRI
		&& typeof setTypeof!='string'
	){
		rdfaContext.skipElement = true;
	}else{
		rdfaContext.skipElement = false;
	}

	// Step 7. Type resources
	if(typedResource && typeof setTypeof=='string'){
		termTypeof.forEach(function(type){
			self.emit(
				typedResource,
				rdfaContext.rdfenv.createNamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
				type
			);
		});
	}
	// Step 8
	if(rdfaContext.newSubject && rdfaContext.newSubject.toString()!=rdfaContext.parentObject.toString()){
		rdfaContext.listMapping = {};
	}
	// Step 9.
	if(rdfaContext.currentObjectResource){
		if(!rdfaContext.newSubject) throw new Error('assertion fail: Expected new_subject from an earlier step');
		if(typeof setInlist=='string' && typeof setRel=='string'){
			termRel.forEach(function(predicate){
				if(!rdfaContext.listMapping[predicate]) rdfaContext.listMapping[predicate] = [];
				rdfaContext.listMapping[predicate].push(rdfaContext.currentObjectResource);
			});
		}else if (setRel) {
			termRel.forEach(function(predicate){
				if(predicate.termType=='BlankNode') return;
				self.emit(
					rdfaContext.newSubject,
					predicate,
					rdfaContext.currentObjectResource
				);
			});
		}
		if (setRev) {
			termRev.forEach(function(predicate){
				if(predicate.termType=='BlankNode') return;
				self.emit(
					rdfaContext.currentObjectResource,
					predicate,
					rdfaContext.newSubject
				);
			});
		}
	}else{
		// Step 10.
		// If however current object resource was set to null, but there are predicates present, then they must be stored as incomplete triples, pending the discovery of a subject that can be used as the object.
		// Also, current object resource should be set to a newly created bnode (so that the incomplete triples have a subject to connect to if they are ultimately turned into triples);

		if(rdfaContext.newSubject && !rdfaContext.currentObjectResource && (typeof setRel=='string' || typeof setRev=='string')){
			rdfaContext.currentObjectResource = rdfaContext.rdfenv.createBlankNode();
		}
		if(typeof setRel=='string' && typeof setInlist=='string'){
			termRel.forEach(function(predicate){
				rdfaContext.listMapping[predicate] = [];
				rdfaContext.incomplete.push({direction:0, list:rdfaContext.listMapping[predicate]});
			});
		}else if(typeof setRel=='string'){
			termRel.forEach(function(predicate){
				rdfaContext.incomplete.push({direction:+1, predicate:predicate});
			});
		}
		if(typeof setRev=='string'){
			termRev.forEach(function(predicate){
				rdfaContext.incomplete.push({direction:-1, predicate:predicate});
			});
		}
	}
	// Step 11. Determine the currentPropertyValue, if @property is present
	if(typeof setProperty=='string'){
		var currentPropertyValue = null;
		if(typeof setDatatype=='string' && setDatatype.trim()===''){
			// 2: if @datatype is present and empty
			if(typeof setContent=='string') currentPropertyValue = rdfaContext.rdfenv.createLiteral(setContent, rdfaContext.language);
			else currentPropertyValue = rdfaContext.rdfenv.createLiteral(node.textContent, rdfaContext.language);
		}else if(termDatatype && setDatatype){
			if(self.XMLSerializer && termDatatype.equals(XMLLiteralURI)){
				// 3: as an XML literal if @datatype is present and is set to XMLLiteral
				// The value of the XML literal is a string created by serializing to text, all nodes that are descendants of the current element, i.e., not including the element itself, and giving it a datatype of XMLLiteral in the vocabulary http://www.w3.org/1999/02/22-rdf-syntax-ns#. The format of the resulting serialized content is as defined in Exclusive XML Canonicalization Version 1.0 [XML-EXC-C14N]
				for(var sibling=node.firstChild, xmlData=''; sibling; sibling=sibling.nextSibling) xmlData += self.XMLSerializer(sibling);
				currentPropertyValue = rdfaContext.rdfenv.createLiteral(xmlData, termDatatype);
			}else{
				// 1: if @datatype is present and is not XMLLiteral
				if(typeof setContent=='string') currentPropertyValue = rdfaContext.rdfenv.createLiteral(setContent, null, termDatatype.toString());
				else currentPropertyValue = rdfaContext.rdfenv.createLiteral(node.textContent, null, termDatatype.toString());
			}
		}else if(typeof setContent=='string'){
			// termDatatype = XSDString;
			currentPropertyValue = rdfaContext.rdfenv.createLiteral(setContent, rdfaContext.language);
		}else if((resourceIRI || setHref || setSrc) && typeof setRel!='string' && typeof setRev!='string' && typeof setContent!='string'){
			if(resourceIRI) currentPropertyValue = resourceIRI;
			else if(typeof setHref=='string') currentPropertyValue = termHref;
			else if(typeof setSrc=='string') currentPropertyValue = termSrc;
		}else if(typedResource && !hasAbout){
			// Spec says "if @typeof is present" but it probably really means typed_resource?
			currentPropertyValue = typedResource;
		}else{
			currentPropertyValue = rdfaContext.rdfenv.createLiteral(node.textContent, rdfaContext.language);
		}
		if(!currentPropertyValue){
			console.error(currentPropertyValue);
			throw new Error('Could not determine currentPropertyValue');
		}
		termProperty.forEach(function(predicate){
			if(predicate.termType=='BlankNode') return;
			if(typeof setInlist=='string'){
				if(!rdfaContext.listMapping[predicate]) rdfaContext.listMapping[predicate] = [];
				rdfaContext.listMapping[predicate].push(currentPropertyValue);
			}else{
				self.emit(
					rdfaContext.newSubject,
					predicate,
					currentPropertyValue
				);
			}
		});
	}

	// Step 12. If skip element is false, and new subject is non-null, then complete any incomplete triples from the current context
	if(rdfaContext.skipElement==false && rdfaContext.newSubject){
		rdfaContext.pendingincomplete.forEach(function(statement){
			// If `direction` is 'none' then... what? We don't have a 'none' direction
			if(statement.direction===1){
				self.emit(
					rdfaContext.parentSubject,
					statement.predicate,
					rdfaContext.newSubject
				);
			}else if(statement.direction===-1){
				self.emit(
					rdfaContext.newSubject,
					statement.predicate,
					rdfaContext.parentSubject
				);
			}else if(statement.list){
				statement.list.push(rdfaContext.newSubject);
			}else{
				throw new Error('Unknown direction');
			}
		});
	}

	// Step 13. Process child elements (performed after this function returns)
	// Step 14. see RDFaContext#onPop
}

RDFaParser.prototype.processText = function processText(){
}

RDFaParser.prototype.processNodeEnd = function processElementEnd(){
	this.stack.pop().onPop();
}

},{"./context.js":46,"iri":51,"rdf":1,"xmldom":52}],48:[function(require,module,exports){
"use strict";

var IRI = require('iri');

var core = require('./core.js');
var RDFaParser = core.RDFaParser;
var context = require('./context.js');

module.exports.RDFaHTMLParser = RDFaHTMLParser;
core.inherits(RDFaHTMLParser, RDFaParser);
function RDFaHTMLParser(){
	RDFaParser.apply(this, arguments);
	// 1. The default vocabulary URI is undefined.
	this.initialVocabulary = null;
	// 2. HTML+RDFa uses an additional initial context by default
	this.importContext(context['http://www.w3.org/2011/rdfa-context/rdfa-1.1']);
	this.importContext(context['http://www.w3.org/2011/rdfa-context/html-rdfa-1.1']);
}

RDFaHTMLParser.computeBase = function computeBase(base, document){
	// Visit each element recursively
	var node = document.documentElement.firstChild;
	while(node && (node.namespaceURI!='http://www.w3.org/1999/xhtml' || node.nodeName!='head')) node=node.nextSibling;
	node = node.firstChild;
	do {
		if(node.namespaceURI=='http://www.w3.org/1999/xhtml' && node.nodeName=='base'){
			return new IRI.IRI(base).resolveReference(node.getAttribute('href')).defrag().toString();
		}
		node = node.nextSibling;
	} while (node);
	return base;
}

RDFaHTMLParser.parse = parse;
function parse(base, document, options){
	if(typeof base!=='string') throw new Error('Expected `base` to be a string');
	if(typeof document!=='object') throw new Error('Unexpected argument');
	if(typeof options==='object'){
	}
	var parser = new RDFaHTMLParser(base, document.documentElement);
	var node = document;
	if(typeof options==='object'){
		if(options.rdfenv) parser.rdfenv = options.rdfenv;
	}
	parser.base = RDFaHTMLParser.computeBase(parser.base, document);
	parser.walkDocument(document);
	return {
		document: document,
		parser: parser,
		outputGraph: parser.outputGraph,
		processorGraph: parser.processorGraph,
	};
}

},{"./context.js":46,"./core.js":47,"iri":51}],49:[function(require,module,exports){
"use strict";

var IRI = require('iri');

var core = require('./core.js');
var RDFaParser = core.RDFaParser;
var context = require('./context.js');

module.exports.RDFaXHTMLParser = RDFaXHTMLParser;
core.inherits(RDFaXHTMLParser, RDFaParser);
function RDFaXHTMLParser(){
	RDFaParser.apply(this, arguments);
	// 1. The default vocabulary URI is undefined.
	this.initialVocabulary = null;
	// 2. HTML+RDFa uses an additional initial context by default
	this.importContext(context['http://www.w3.org/2011/rdfa-context/rdfa-1.1']);
	this.importContext(context['http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1']);
	// 3. The base can be set using the base element.
	// This is performed in parse()
	// 4. The current language can be set using either the @lang or @xml:lang attributes. @xml:lang attribute takes precedence.
	// 5. When determining which set of RDFa processing rules to use for documents served with the application/xhtml+xml media type, a conforming RDFa processor must look at the value in the DOCTYPE declaration of the document.
}

RDFaXHTMLParser.computeBase = function computeBase(base, document){
	// Visit each element recursively
	var node = document.documentElement.firstChild;
	while(node && (node.namespaceURI!='http://www.w3.org/1999/xhtml' || node.nodeName!='head')) node=node.nextSibling;
	node = node.firstChild;
	do {
		if(node.namespaceURI=='http://www.w3.org/1999/xhtml' && node.nodeName=='base'){
			return new IRI.IRI(base).resolveReference(node.getAttribute('href')).defrag().toString();
		}
		node = node.nextSibling;
	} while (node);
	return base;
}

RDFaXHTMLParser.parse = parse;
function parse(base, document, options){
	if(typeof base!=='string') throw new Error('Expected `base` to be a string');
	if(typeof document!=='object') throw new Error('Unexpected argument');
	if(typeof options==='object'){
	}
	// @@@TODO Test conformance here
	// See https://www.w3.org/TR/xhtml-rdfa/ section 2.1. Document Conformance
	var parser = new RDFaXHTMLParser(base, document.documentElement);
	var node = document;
	if(typeof options==='object'){
		if(options.rdfenv) parser.rdfenv = options.rdfenv;
	}
	parser.base = RDFaXHTMLParser.computeBase(parser.base, document);
	parser.setNewSubject = function(node){
		return (
			node.parentNode==parser.documentElement
			&& node.namespaceURI=='http://www.w3.org/1999/xhtml'
			&& (node.tagName=='head' || node.tagName=='body')
		);
	};
	parser.walkDocument(document);
	return {
		document: document,
		parser: parser,
		outputGraph: parser.outputGraph,
		processorGraph: parser.processorGraph,
	};
}

},{"./context.js":46,"./core.js":47,"iri":51}],50:[function(require,module,exports){
"use strict";

var core = require('./core.js');
var RDFaParser = core.RDFaParser;
var context = require('./context.js');

module.exports.RDFaXMLParser = RDFaXMLParser;
core.inherits(RDFaXMLParser, RDFaParser);
function RDFaXMLParser(){
	RDFaParser.apply(this, arguments);
	this.initialVocabulary = null;
	this.importContext(context['http://www.w3.org/2011/rdfa-context/rdfa-1.1']);
}

RDFaXMLParser.parse = parse;
function parse(base, document, options){
	if(typeof base!=='string') throw new Error('Expected `base` to be a string');
	if(typeof document!=='object') throw new Error('Unexpected argument');
	if(typeof options==='object'){
	}
	var parser = new RDFaXMLParser(base, document.documentElement);
	var node = document;
	if(typeof options==='object'){
		if(options.rdfenv) parser.rdfenv = options.rdfenv;
	}
	parser.walkDocument(document);
	return {
		document: document,
		parser: parser,
		outputGraph: parser.outputGraph,
		processorGraph: parser.processorGraph,
	};
}

},{"./context.js":46,"./core.js":47}],51:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],52:[function(require,module,exports){
function DOMParser(options){
	this.options = options ||{locator:{}};
	
}
DOMParser.prototype.parseFromString = function(source,mimeType){
	var options = this.options;
	var sax =  new XMLReader();
	var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
	var errorHandler = options.errorHandler;
	var locator = options.locator;
	var defaultNSMap = options.xmlns||{};
	var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
	if(locator){
		domBuilder.setDocumentLocator(locator)
	}
	
	sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
	sax.domBuilder = options.domBuilder || domBuilder;
	if(/\/x?html?$/.test(mimeType)){
		entityMap.nbsp = '\xa0';
		entityMap.copy = '\xa9';
		defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
	}
	defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
	if(source){
		sax.parse(source,defaultNSMap,entityMap);
	}else{
		sax.errorHandler.error("invalid doc source");
	}
	return domBuilder.doc;
}
function buildErrorHandler(errorImpl,domBuilder,locator){
	if(!errorImpl){
		if(domBuilder instanceof DOMHandler){
			return domBuilder;
		}
		errorImpl = domBuilder ;
	}
	var errorHandler = {}
	var isCallback = errorImpl instanceof Function;
	locator = locator||{}
	function build(key){
		var fn = errorImpl[key];
		if(!fn && isCallback){
			fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
		}
		errorHandler[key] = fn && function(msg){
			fn('[xmldom '+key+']\t'+msg+_locator(locator));
		}||function(){};
	}
	build('warning');
	build('error');
	build('fatalError');
	return errorHandler;
}

//console.log('#\n\n\n\n\n\n\n####')
/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler 
 * 
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */
function DOMHandler() {
    this.cdata = false;
}
function position(locator,node){
	node.lineNumber = locator.lineNumber;
	node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */ 
DOMHandler.prototype = {
	startDocument : function() {
    	this.doc = new DOMImplementation().createDocument(null, null, null);
    	if (this.locator) {
        	this.doc.documentURI = this.locator.systemId;
    	}
	},
	startElement:function(namespaceURI, localName, qName, attrs) {
		var doc = this.doc;
	    var el = doc.createElementNS(namespaceURI, qName||localName);
	    var len = attrs.length;
	    appendElement(this, el);
	    this.currentElement = el;
	    
		this.locator && position(this.locator,el)
	    for (var i = 0 ; i < len; i++) {
	        var namespaceURI = attrs.getURI(i);
	        var value = attrs.getValue(i);
	        var qName = attrs.getQName(i);
			var attr = doc.createAttributeNS(namespaceURI, qName);
			this.locator &&position(attrs.getLocator(i),attr);
			attr.value = attr.nodeValue = value;
			el.setAttributeNode(attr)
	    }
	},
	endElement:function(namespaceURI, localName, qName) {
		var current = this.currentElement
		var tagName = current.tagName;
		this.currentElement = current.parentNode;
	},
	startPrefixMapping:function(prefix, uri) {
	},
	endPrefixMapping:function(prefix) {
	},
	processingInstruction:function(target, data) {
	    var ins = this.doc.createProcessingInstruction(target, data);
	    this.locator && position(this.locator,ins)
	    appendElement(this, ins);
	},
	ignorableWhitespace:function(ch, start, length) {
	},
	characters:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
		//console.log(chars)
		if(chars){
			if (this.cdata) {
				var charNode = this.doc.createCDATASection(chars);
			} else {
				var charNode = this.doc.createTextNode(chars);
			}
			if(this.currentElement){
				this.currentElement.appendChild(charNode);
			}else if(/^\s*$/.test(chars)){
				this.doc.appendChild(charNode);
				//process xml
			}
			this.locator && position(this.locator,charNode)
		}
	},
	skippedEntity:function(name) {
	},
	endDocument:function() {
		this.doc.normalize();
	},
	setDocumentLocator:function (locator) {
	    if(this.locator = locator){// && !('lineNumber' in locator)){
	    	locator.lineNumber = 0;
	    }
	},
	//LexicalHandler
	comment:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
	    var comm = this.doc.createComment(chars);
	    this.locator && position(this.locator,comm)
	    appendElement(this, comm);
	},
	
	startCDATA:function() {
	    //used in characters() methods
	    this.cdata = true;
	},
	endCDATA:function() {
	    this.cdata = false;
	},
	
	startDTD:function(name, publicId, systemId) {
		var impl = this.doc.implementation;
	    if (impl && impl.createDocumentType) {
	        var dt = impl.createDocumentType(name, publicId, systemId);
	        this.locator && position(this.locator,dt)
	        appendElement(this, dt);
	    }
	},
	/**
	 * @see org.xml.sax.ErrorHandler
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	warning:function(error) {
		console.warn('[xmldom warning]\t'+error,_locator(this.locator));
	},
	error:function(error) {
		console.error('[xmldom error]\t'+error,_locator(this.locator));
	},
	fatalError:function(error) {
		console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
	    throw error;
	}
}
function _locator(l){
	if(l){
		return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
	}
}
function _toString(chars,start,length){
	if(typeof chars == 'string'){
		return chars.substr(start,length)
	}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
		if(chars.length >= start+length || start){
			return new java.lang.String(chars,start,length)+'';
		}
		return chars;
	}
}

/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
	DOMHandler.prototype[key] = function(){return null}
})

/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
function appendElement (hander,node) {
    if (!hander.currentElement) {
        hander.doc.appendChild(node);
    } else {
        hander.currentElement.appendChild(node);
    }
}//appendChild and setAttributeNS are preformance key

//if(typeof require == 'function'){
	var XMLReader = require('./sax').XMLReader;
	var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;
	exports.XMLSerializer = require('./dom').XMLSerializer ;
	exports.DOMParser = DOMParser;
//}

},{"./dom":53,"./sax":54}],53:[function(require,module,exports){
/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */

function copy(src,dest){
	for(var p in src){
		dest[p] = src[p];
	}
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */
function _extends(Class,Super){
	var pt = Class.prototype;
	if(Object.create){
		var ppt = Object.create(Super.prototype)
		pt.__proto__ = ppt;
	}
	if(!(pt instanceof Super)){
		function t(){};
		t.prototype = Super.prototype;
		t = new t();
		copy(pt,t);
		Class.prototype = pt = t;
	}
	if(pt.constructor != Class){
		if(typeof Class != 'function'){
			console.error("unknow Class:"+Class)
		}
		pt.constructor = Class
	}
}
var htmlns = 'http://www.w3.org/1999/xhtml' ;
// Node Types
var NodeType = {}
var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

// ExceptionCode
var ExceptionCode = {}
var ExceptionMessage = {};
var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
//level2
var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


function DOMException(code, message) {
	if(message instanceof Error){
		var error = message;
	}else{
		error = this;
		Error.call(this, ExceptionMessage[code]);
		this.message = ExceptionMessage[code];
		if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	error.code = code;
	if(message) this.message = this.message + ": " + message;
	return error;
};
DOMException.prototype = Error.prototype;
copy(ExceptionCode,DOMException)
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */
function NodeList() {
};
NodeList.prototype = {
	/**
	 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
	 * @standard level1
	 */
	length:0, 
	/**
	 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
	 * @standard level1
	 * @param index  unsigned long 
	 *   Index into the collection.
	 * @return Node
	 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
	 */
	item: function(index) {
		return this[index] || null;
	},
	toString:function(isHTML,nodeFilter){
		for(var buf = [], i = 0;i<this.length;i++){
			serializeToString(this[i],buf,isHTML,nodeFilter);
		}
		return buf.join('');
	}
};
function LiveNodeList(node,refresh){
	this._node = node;
	this._refresh = refresh
	_updateLiveList(this);
}
function _updateLiveList(list){
	var inc = list._node._inc || list._node.ownerDocument._inc;
	if(list._inc != inc){
		var ls = list._refresh(list._node);
		//console.log(ls.length)
		__set__(list,'length',ls.length);
		copy(ls,list);
		list._inc = inc;
	}
}
LiveNodeList.prototype.item = function(i){
	_updateLiveList(this);
	return this[i];
}

_extends(LiveNodeList,NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */
function NamedNodeMap() {
};

function _findNodeIndex(list,node){
	var i = list.length;
	while(i--){
		if(list[i] === node){return i}
	}
}

function _addNamedNode(el,list,newAttr,oldAttr){
	if(oldAttr){
		list[_findNodeIndex(list,oldAttr)] = newAttr;
	}else{
		list[list.length++] = newAttr;
	}
	if(el){
		newAttr.ownerElement = el;
		var doc = el.ownerDocument;
		if(doc){
			oldAttr && _onRemoveAttribute(doc,el,oldAttr);
			_onAddAttribute(doc,el,newAttr);
		}
	}
}
function _removeNamedNode(el,list,attr){
	//console.log('remove attr:'+attr)
	var i = _findNodeIndex(list,attr);
	if(i>=0){
		var lastIndex = list.length-1
		while(i<lastIndex){
			list[i] = list[++i]
		}
		list.length = lastIndex;
		if(el){
			var doc = el.ownerDocument;
			if(doc){
				_onRemoveAttribute(doc,el,attr);
				attr.ownerElement = null;
			}
		}
	}else{
		throw DOMException(NOT_FOUND_ERR,new Error(el.tagName+'@'+attr))
	}
}
NamedNodeMap.prototype = {
	length:0,
	item:NodeList.prototype.item,
	getNamedItem: function(key) {
//		if(key.indexOf(':')>0 || key == 'xmlns'){
//			return null;
//		}
		//console.log()
		var i = this.length;
		while(i--){
			var attr = this[i];
			//console.log(attr.nodeName,key)
			if(attr.nodeName == key){
				return attr;
			}
		}
	},
	setNamedItem: function(attr) {
		var el = attr.ownerElement;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		var oldAttr = this.getNamedItem(attr.nodeName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},
	/* returns Node */
	setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
		var el = attr.ownerElement, oldAttr;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},

	/* returns Node */
	removeNamedItem: function(key) {
		var attr = this.getNamedItem(key);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
		
		
	},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
	
	//for level2
	removeNamedItemNS:function(namespaceURI,localName){
		var attr = this.getNamedItemNS(namespaceURI,localName);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
	},
	getNamedItemNS: function(namespaceURI, localName) {
		var i = this.length;
		while(i--){
			var node = this[i];
			if(node.localName == localName && node.namespaceURI == namespaceURI){
				return node;
			}
		}
		return null;
	}
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */
function DOMImplementation(/* Object */ features) {
	this._features = {};
	if (features) {
		for (var feature in features) {
			 this._features = features[feature];
		}
	}
};

DOMImplementation.prototype = {
	hasFeature: function(/* string */ feature, /* string */ version) {
		var versions = this._features[feature.toLowerCase()];
		if (versions && (!version || version in versions)) {
			return true;
		} else {
			return false;
		}
	},
	// Introduced in DOM Level 2:
	createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
		var doc = new Document();
		doc.implementation = this;
		doc.childNodes = new NodeList();
		doc.doctype = doctype;
		if(doctype){
			doc.appendChild(doctype);
		}
		if(qualifiedName){
			var root = doc.createElementNS(namespaceURI,qualifiedName);
			doc.appendChild(root);
		}
		return doc;
	},
	// Introduced in DOM Level 2:
	createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
		var node = new DocumentType();
		node.name = qualifiedName;
		node.nodeName = qualifiedName;
		node.publicId = publicId;
		node.systemId = systemId;
		// Introduced in DOM Level 2:
		//readonly attribute DOMString        internalSubset;
		
		//TODO:..
		//  readonly attribute NamedNodeMap     entities;
		//  readonly attribute NamedNodeMap     notations;
		return node;
	}
};


/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {
};

Node.prototype = {
	firstChild : null,
	lastChild : null,
	previousSibling : null,
	nextSibling : null,
	attributes : null,
	parentNode : null,
	childNodes : null,
	ownerDocument : null,
	nodeValue : null,
	namespaceURI : null,
	prefix : null,
	localName : null,
	// Modified in DOM Level 2:
	insertBefore:function(newChild, refChild){//raises 
		return _insertBefore(this,newChild,refChild);
	},
	replaceChild:function(newChild, oldChild){//raises 
		this.insertBefore(newChild,oldChild);
		if(oldChild){
			this.removeChild(oldChild);
		}
	},
	removeChild:function(oldChild){
		return _removeChild(this,oldChild);
	},
	appendChild:function(newChild){
		return this.insertBefore(newChild,null);
	},
	hasChildNodes:function(){
		return this.firstChild != null;
	},
	cloneNode:function(deep){
		return cloneNode(this.ownerDocument||this,this,deep);
	},
	// Modified in DOM Level 2:
	normalize:function(){
		var child = this.firstChild;
		while(child){
			var next = child.nextSibling;
			if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
				this.removeChild(next);
				child.appendData(next.data);
			}else{
				child.normalize();
				child = next;
			}
		}
	},
  	// Introduced in DOM Level 2:
	isSupported:function(feature, version){
		return this.ownerDocument.implementation.hasFeature(feature,version);
	},
    // Introduced in DOM Level 2:
    hasAttributes:function(){
    	return this.attributes.length>0;
    },
    lookupPrefix:function(namespaceURI){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			for(var n in map){
    				if(map[n] == namespaceURI){
    					return n;
    				}
    			}
    		}
    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI:function(prefix){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			if(prefix in map){
    				return map[prefix] ;
    			}
    		}
    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace:function(namespaceURI){
    	var prefix = this.lookupPrefix(namespaceURI);
    	return prefix == null;
    }
};


function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
         c == '>' && '&gt;' ||
         c == '&' && '&amp;' ||
         c == '"' && '&quot;' ||
         '&#'+c.charCodeAt()+';'
}


copy(NodeType,Node);
copy(NodeType,Node.prototype);

/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */
function _visitNode(node,callback){
	if(callback(node)){
		return true;
	}
	if(node = node.firstChild){
		do{
			if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}



function Document(){
}
function _onAddAttribute(doc,el,newAttr){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
	}
}
function _onRemoveAttribute(doc,el,newAttr,remove){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		delete el._nsMap[newAttr.prefix?newAttr.localName:'']
	}
}
function _onUpdateChild(doc,el,newChild){
	if(doc && doc._inc){
		doc._inc++;
		//update childNodes
		var cs = el.childNodes;
		if(newChild){
			cs[cs.length++] = newChild;
		}else{
			//console.log(1)
			var child = el.firstChild;
			var i = 0;
			while(child){
				cs[i++] = child;
				child =child.nextSibling;
			}
			cs.length = i;
		}
	}
}

/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */
function _removeChild(parentNode,child){
	var previous = child.previousSibling;
	var next = child.nextSibling;
	if(previous){
		previous.nextSibling = next;
	}else{
		parentNode.firstChild = next
	}
	if(next){
		next.previousSibling = previous;
	}else{
		parentNode.lastChild = previous;
	}
	_onUpdateChild(parentNode.ownerDocument,parentNode);
	return child;
}
/**
 * preformance key(refChild == null)
 */
function _insertBefore(parentNode,newChild,nextChild){
	var cp = newChild.parentNode;
	if(cp){
		cp.removeChild(newChild);//remove and update
	}
	if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
		var newFirst = newChild.firstChild;
		if (newFirst == null) {
			return newChild;
		}
		var newLast = newChild.lastChild;
	}else{
		newFirst = newLast = newChild;
	}
	var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

	newFirst.previousSibling = pre;
	newLast.nextSibling = nextChild;
	
	
	if(pre){
		pre.nextSibling = newFirst;
	}else{
		parentNode.firstChild = newFirst;
	}
	if(nextChild == null){
		parentNode.lastChild = newLast;
	}else{
		nextChild.previousSibling = newLast;
	}
	do{
		newFirst.parentNode = parentNode;
	}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
	_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
	//console.log(parentNode.lastChild.nextSibling == null)
	if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
		newChild.firstChild = newChild.lastChild = null;
	}
	return newChild;
}
function _appendSingleChild(parentNode,newChild){
	var cp = newChild.parentNode;
	if(cp){
		var pre = parentNode.lastChild;
		cp.removeChild(newChild);//remove and update
		var pre = parentNode.lastChild;
	}
	var pre = parentNode.lastChild;
	newChild.parentNode = parentNode;
	newChild.previousSibling = pre;
	newChild.nextSibling = null;
	if(pre){
		pre.nextSibling = newChild;
	}else{
		parentNode.firstChild = newChild;
	}
	parentNode.lastChild = newChild;
	_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
	return newChild;
	//console.log("__aa",parentNode.lastChild.nextSibling == null)
}
Document.prototype = {
	//implementation : null,
	nodeName :  '#document',
	nodeType :  DOCUMENT_NODE,
	doctype :  null,
	documentElement :  null,
	_inc : 1,
	
	insertBefore :  function(newChild, refChild){//raises 
		if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
			var child = newChild.firstChild;
			while(child){
				var next = child.nextSibling;
				this.insertBefore(child,refChild);
				child = next;
			}
			return newChild;
		}
		if(this.documentElement == null && newChild.nodeType == ELEMENT_NODE){
			this.documentElement = newChild;
		}
		
		return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
	},
	removeChild :  function(oldChild){
		if(this.documentElement == oldChild){
			this.documentElement = null;
		}
		return _removeChild(this,oldChild);
	},
	// Introduced in DOM Level 2:
	importNode : function(importedNode,deep){
		return importNode(this,importedNode,deep);
	},
	// Introduced in DOM Level 2:
	getElementById :	function(id){
		var rtv = null;
		_visitNode(this.documentElement,function(node){
			if(node.nodeType == ELEMENT_NODE){
				if(node.getAttribute('id') == id){
					rtv = node;
					return true;
				}
			}
		})
		return rtv;
	},
	
	//document factory method:
	createElement :	function(tagName){
		var node = new Element();
		node.ownerDocument = this;
		node.nodeName = tagName;
		node.tagName = tagName;
		node.childNodes = new NodeList();
		var attrs	= node.attributes = new NamedNodeMap();
		attrs._ownerElement = node;
		return node;
	},
	createDocumentFragment :	function(){
		var node = new DocumentFragment();
		node.ownerDocument = this;
		node.childNodes = new NodeList();
		return node;
	},
	createTextNode :	function(data){
		var node = new Text();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createComment :	function(data){
		var node = new Comment();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createCDATASection :	function(data){
		var node = new CDATASection();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createProcessingInstruction :	function(target,data){
		var node = new ProcessingInstruction();
		node.ownerDocument = this;
		node.tagName = node.target = target;
		node.nodeValue= node.data = data;
		return node;
	},
	createAttribute :	function(name){
		var node = new Attr();
		node.ownerDocument	= this;
		node.name = name;
		node.nodeName	= name;
		node.localName = name;
		node.specified = true;
		return node;
	},
	createEntityReference :	function(name){
		var node = new EntityReference();
		node.ownerDocument	= this;
		node.nodeName	= name;
		return node;
	},
	// Introduced in DOM Level 2:
	createElementNS :	function(namespaceURI,qualifiedName){
		var node = new Element();
		var pl = qualifiedName.split(':');
		var attrs	= node.attributes = new NamedNodeMap();
		node.childNodes = new NodeList();
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.tagName = qualifiedName;
		node.namespaceURI = namespaceURI;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		attrs._ownerElement = node;
		return node;
	},
	// Introduced in DOM Level 2:
	createAttributeNS :	function(namespaceURI,qualifiedName){
		var node = new Attr();
		var pl = qualifiedName.split(':');
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.name = qualifiedName;
		node.namespaceURI = namespaceURI;
		node.specified = true;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		return node;
	}
};
_extends(Document,Node);


function Element() {
	this._nsMap = {};
};
Element.prototype = {
	nodeType : ELEMENT_NODE,
	hasAttribute : function(name){
		return this.getAttributeNode(name)!=null;
	},
	getAttribute : function(name){
		var attr = this.getAttributeNode(name);
		return attr && attr.value || '';
	},
	getAttributeNode : function(name){
		return this.attributes.getNamedItem(name);
	},
	setAttribute : function(name, value){
		var attr = this.ownerDocument.createAttribute(name);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	removeAttribute : function(name){
		var attr = this.getAttributeNode(name)
		attr && this.removeAttributeNode(attr);
	},
	
	//four real opeartion method
	appendChild:function(newChild){
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			return this.insertBefore(newChild,null);
		}else{
			return _appendSingleChild(this,newChild);
		}
	},
	setAttributeNode : function(newAttr){
		return this.attributes.setNamedItem(newAttr);
	},
	setAttributeNodeNS : function(newAttr){
		return this.attributes.setNamedItemNS(newAttr);
	},
	removeAttributeNode : function(oldAttr){
		//console.log(this == oldAttr.ownerElement)
		return this.attributes.removeNamedItem(oldAttr.nodeName);
	},
	//get real attribute name,and remove it by removeAttributeNode
	removeAttributeNS : function(namespaceURI, localName){
		var old = this.getAttributeNodeNS(namespaceURI, localName);
		old && this.removeAttributeNode(old);
	},
	
	hasAttributeNS : function(namespaceURI, localName){
		return this.getAttributeNodeNS(namespaceURI, localName)!=null;
	},
	getAttributeNS : function(namespaceURI, localName){
		var attr = this.getAttributeNodeNS(namespaceURI, localName);
		return attr && attr.value || '';
	},
	setAttributeNS : function(namespaceURI, qualifiedName, value){
		var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	getAttributeNodeNS : function(namespaceURI, localName){
		return this.attributes.getNamedItemNS(namespaceURI, localName);
	},
	
	getElementsByTagName : function(tagName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
					ls.push(node);
				}
			});
			return ls;
		});
	},
	getElementsByTagNameNS : function(namespaceURI, localName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
					ls.push(node);
				}
			});
			return ls;
			
		});
	}
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


_extends(Element,Node);
function Attr() {
};
Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr,Node);


function CharacterData() {
};
CharacterData.prototype = {
	data : '',
	substringData : function(offset, count) {
		return this.data.substring(offset, offset+count);
	},
	appendData: function(text) {
		text = this.data+text;
		this.nodeValue = this.data = text;
		this.length = text.length;
	},
	insertData: function(offset,text) {
		this.replaceData(offset,0,text);
	
	},
	appendChild:function(newChild){
		throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR])
	},
	deleteData: function(offset, count) {
		this.replaceData(offset,count,"");
	},
	replaceData: function(offset, count, text) {
		var start = this.data.substring(0,offset);
		var end = this.data.substring(offset+count);
		text = start + text + end;
		this.nodeValue = this.data = text;
		this.length = text.length;
	}
}
_extends(CharacterData,Node);
function Text() {
};
Text.prototype = {
	nodeName : "#text",
	nodeType : TEXT_NODE,
	splitText : function(offset) {
		var text = this.data;
		var newText = text.substring(offset);
		text = text.substring(0, offset);
		this.data = this.nodeValue = text;
		this.length = text.length;
		var newNode = this.ownerDocument.createTextNode(newText);
		if(this.parentNode){
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
		return newNode;
	}
}
_extends(Text,CharacterData);
function Comment() {
};
Comment.prototype = {
	nodeName : "#comment",
	nodeType : COMMENT_NODE
}
_extends(Comment,CharacterData);

function CDATASection() {
};
CDATASection.prototype = {
	nodeName : "#cdata-section",
	nodeType : CDATA_SECTION_NODE
}
_extends(CDATASection,CharacterData);


function DocumentType() {
};
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType,Node);

function Notation() {
};
Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation,Node);

function Entity() {
};
Entity.prototype.nodeType = ENTITY_NODE;
_extends(Entity,Node);

function EntityReference() {
};
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference,Node);

function DocumentFragment() {
};
DocumentFragment.prototype.nodeName =	"#document-fragment";
DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment,Node);


function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction,Node);
function XMLSerializer(){}
XMLSerializer.prototype.serializeToString = function(node,isHtml,nodeFilter){
	return nodeSerializeToString.call(node,isHtml,nodeFilter);
}
Node.prototype.toString = nodeSerializeToString;
function nodeSerializeToString(isHtml,nodeFilter){
	var buf = [];
	var refNode = this.nodeType == 9?this.documentElement:this;
	var prefix = refNode.prefix;
	var uri = refNode.namespaceURI;
	
	if(uri && prefix == null){
		//console.log(prefix)
		var prefix = refNode.lookupPrefix(uri);
		if(prefix == null){
			//isHTML = true;
			var visibleNamespaces=[
			{namespace:uri,prefix:null}
			//{namespace:uri,prefix:''}
			]
		}
	}
	serializeToString(this,buf,isHtml,nodeFilter,visibleNamespaces);
	//console.log('###',this.nodeType,uri,prefix,buf.join(''))
	return buf.join('');
}
function needNamespaceDefine(node,isHTML, visibleNamespaces) {
	var prefix = node.prefix||'';
	var uri = node.namespaceURI;
	if (!prefix && !uri){
		return false;
	}
	if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace" 
		|| uri == 'http://www.w3.org/2000/xmlns/'){
		return false;
	}
	
	var i = visibleNamespaces.length 
	//console.log('@@@@',node.tagName,prefix,uri,visibleNamespaces)
	while (i--) {
		var ns = visibleNamespaces[i];
		// get namespace prefix
		//console.log(node.nodeType,node.tagName,ns.prefix,prefix)
		if (ns.prefix == prefix){
			return ns.namespace != uri;
		}
	}
	//console.log(isHTML,uri,prefix=='')
	//if(isHTML && prefix ==null && uri == 'http://www.w3.org/1999/xhtml'){
	//	return false;
	//}
	//node.flag = '11111'
	//console.error(3,true,node.flag,node.prefix,node.namespaceURI)
	return true;
}
function serializeToString(node,buf,isHTML,nodeFilter,visibleNamespaces){
	if(nodeFilter){
		node = nodeFilter(node);
		if(node){
			if(typeof node == 'string'){
				buf.push(node);
				return;
			}
		}else{
			return;
		}
		//buf.sort.apply(attrs, attributeSorter);
	}
	switch(node.nodeType){
	case ELEMENT_NODE:
		if (!visibleNamespaces) visibleNamespaces = [];
		var startVisibleNamespaces = visibleNamespaces.length;
		var attrs = node.attributes;
		var len = attrs.length;
		var child = node.firstChild;
		var nodeName = node.tagName;
		
		isHTML =  (htmlns === node.namespaceURI) ||isHTML 
		buf.push('<',nodeName);
		
		
		
		for(var i=0;i<len;i++){
			// add namespaces for attributes
			var attr = attrs.item(i);
			if (attr.prefix == 'xmlns') {
				visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
			}else if(attr.nodeName == 'xmlns'){
				visibleNamespaces.push({ prefix: '', namespace: attr.value });
			}
		}
		for(var i=0;i<len;i++){
			var attr = attrs.item(i);
			if (needNamespaceDefine(attr,isHTML, visibleNamespaces)) {
				var prefix = attr.prefix||'';
				var uri = attr.namespaceURI;
				var ns = prefix ? ' xmlns:' + prefix : " xmlns";
				buf.push(ns, '="' , uri , '"');
				visibleNamespaces.push({ prefix: prefix, namespace:uri });
			}
			serializeToString(attr,buf,isHTML,nodeFilter,visibleNamespaces);
		}
		// add namespace for current node		
		if (needNamespaceDefine(node,isHTML, visibleNamespaces)) {
			var prefix = node.prefix||'';
			var uri = node.namespaceURI;
			var ns = prefix ? ' xmlns:' + prefix : " xmlns";
			buf.push(ns, '="' , uri , '"');
			visibleNamespaces.push({ prefix: prefix, namespace:uri });
		}
		
		if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
			buf.push('>');
			//if is cdata child node
			if(isHTML && /^script$/i.test(nodeName)){
				while(child){
					if(child.data){
						buf.push(child.data);
					}else{
						serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
					}
					child = child.nextSibling;
				}
			}else
			{
				while(child){
					serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
					child = child.nextSibling;
				}
			}
			buf.push('</',nodeName,'>');
		}else{
			buf.push('/>');
		}
		// remove added visible namespaces
		//visibleNamespaces.length = startVisibleNamespaces;
		return;
	case DOCUMENT_NODE:
	case DOCUMENT_FRAGMENT_NODE:
		var child = node.firstChild;
		while(child){
			serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
			child = child.nextSibling;
		}
		return;
	case ATTRIBUTE_NODE:
		return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
	case TEXT_NODE:
		return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
	case CDATA_SECTION_NODE:
		return buf.push( '<![CDATA[',node.data,']]>');
	case COMMENT_NODE:
		return buf.push( "<!--",node.data,"-->");
	case DOCUMENT_TYPE_NODE:
		var pubid = node.publicId;
		var sysid = node.systemId;
		buf.push('<!DOCTYPE ',node.name);
		if(pubid){
			buf.push(' PUBLIC "',pubid);
			if (sysid && sysid!='.') {
				buf.push( '" "',sysid);
			}
			buf.push('">');
		}else if(sysid && sysid!='.'){
			buf.push(' SYSTEM "',sysid,'">');
		}else{
			var sub = node.internalSubset;
			if(sub){
				buf.push(" [",sub,"]");
			}
			buf.push(">");
		}
		return;
	case PROCESSING_INSTRUCTION_NODE:
		return buf.push( "<?",node.target," ",node.data,"?>");
	case ENTITY_REFERENCE_NODE:
		return buf.push( '&',node.nodeName,';');
	//case ENTITY_NODE:
	//case NOTATION_NODE:
	default:
		buf.push('??',node.nodeName);
	}
}
function importNode(doc,node,deep){
	var node2;
	switch (node.nodeType) {
	case ELEMENT_NODE:
		node2 = node.cloneNode(false);
		node2.ownerDocument = doc;
		//var attrs = node2.attributes;
		//var len = attrs.length;
		//for(var i=0;i<len;i++){
			//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
		//}
	case DOCUMENT_FRAGMENT_NODE:
		break;
	case ATTRIBUTE_NODE:
		deep = true;
		break;
	//case ENTITY_REFERENCE_NODE:
	//case PROCESSING_INSTRUCTION_NODE:
	////case TEXT_NODE:
	//case CDATA_SECTION_NODE:
	//case COMMENT_NODE:
	//	deep = false;
	//	break;
	//case DOCUMENT_NODE:
	//case DOCUMENT_TYPE_NODE:
	//cannot be imported.
	//case ENTITY_NODE:
	//case NOTATION_NODE：
	//can not hit in level3
	//default:throw e;
	}
	if(!node2){
		node2 = node.cloneNode(false);//false
	}
	node2.ownerDocument = doc;
	node2.parentNode = null;
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(importNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}
//
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
function cloneNode(doc,node,deep){
	var node2 = new node.constructor();
	for(var n in node){
		var v = node[n];
		if(typeof v != 'object' ){
			if(v != node2[n]){
				node2[n] = v;
			}
		}
	}
	if(node.childNodes){
		node2.childNodes = new NodeList();
	}
	node2.ownerDocument = doc;
	switch (node2.nodeType) {
	case ELEMENT_NODE:
		var attrs	= node.attributes;
		var attrs2	= node2.attributes = new NamedNodeMap();
		var len = attrs.length
		attrs2._ownerElement = node2;
		for(var i=0;i<len;i++){
			node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
		}
		break;;
	case ATTRIBUTE_NODE:
		deep = true;
	}
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(cloneNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}

function __set__(object,key,value){
	object[key] = value
}
//do dynamic
try{
	if(Object.defineProperty){
		Object.defineProperty(LiveNodeList.prototype,'length',{
			get:function(){
				_updateLiveList(this);
				return this.$$length;
			}
		});
		Object.defineProperty(Node.prototype,'textContent',{
			get:function(){
				return getTextContent(this);
			},
			set:function(data){
				switch(this.nodeType){
				case ELEMENT_NODE:
				case DOCUMENT_FRAGMENT_NODE:
					while(this.firstChild){
						this.removeChild(this.firstChild);
					}
					if(data || String(data)){
						this.appendChild(this.ownerDocument.createTextNode(data));
					}
					break;
				default:
					//TODO:
					this.data = data;
					this.value = data;
					this.nodeValue = data;
				}
			}
		})
		
		function getTextContent(node){
			switch(node.nodeType){
			case ELEMENT_NODE:
			case DOCUMENT_FRAGMENT_NODE:
				var buf = [];
				node = node.firstChild;
				while(node){
					if(node.nodeType!==7 && node.nodeType !==8){
						buf.push(getTextContent(node));
					}
					node = node.nextSibling;
				}
				return buf.join('');
			default:
				return node.nodeValue;
			}
		}
		__set__ = function(object,key,value){
			//console.log(value)
			object['$$'+key] = value
		}
	}
}catch(e){//ie8
}

//if(typeof require == 'function'){
	exports.DOMImplementation = DOMImplementation;
	exports.XMLSerializer = XMLSerializer;
//}

},{}],54:[function(require,module,exports){
//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
var S_TAG = 0;//tag name offerring
var S_ATTR = 1;//attr name offerring 
var S_ATTR_SPACE=2;//attr name end and space offer
var S_EQ = 3;//=space?
var S_ATTR_NOQUOT_VALUE = 4;//attr value(no quot value only)
var S_ATTR_END = 5;//attr value end and no space(quot end)
var S_TAG_SPACE = 6;//(attr value end || tag end ) && (space offer)
var S_TAG_CLOSE = 7;//closed el<el />

function XMLReader(){
	
}

XMLReader.prototype = {
	parse:function(source,defaultNSMap,entityMap){
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap ,defaultNSMap = {})
		parse(source,defaultNSMap,entityMap,
				domBuilder,this.errorHandler);
		domBuilder.endDocument();
	}
}
function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
	function fixedFromCharCode(code) {
		// String.prototype.fromCharCode does not supports
		// > 2 bytes unicode chars directly
		if (code > 0xffff) {
			code -= 0x10000;
			var surrogate1 = 0xd800 + (code >> 10)
				, surrogate2 = 0xdc00 + (code & 0x3ff);

			return String.fromCharCode(surrogate1, surrogate2);
		} else {
			return String.fromCharCode(code);
		}
	}
	function entityReplacer(a){
		var k = a.slice(1,-1);
		if(k in entityMap){
			return entityMap[k]; 
		}else if(k.charAt(0) === '#'){
			return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
		}else{
			errorHandler.error('entity not found:'+a);
			return a;
		}
	}
	function appendText(end){//has some bugs
		if(end>start){
			var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
			locator&&position(start);
			domBuilder.characters(xt,0,end-start);
			start = end
		}
	}
	function position(p,m){
		while(p>=lineEnd && (m = linePattern.exec(source))){
			lineStart = m.index;
			lineEnd = lineStart + m[0].length;
			locator.lineNumber++;
			//console.log('line++:',locator,startPos,endPos)
		}
		locator.columnNumber = p-lineStart+1;
	}
	var lineStart = 0;
	var lineEnd = 0;
	var linePattern = /.*(?:\r\n?|\n)|.*$/g
	var locator = domBuilder.locator;
	
	var parseStack = [{currentNSMap:defaultNSMapCopy}]
	var closeMap = {};
	var start = 0;
	while(true){
		try{
			var tagStart = source.indexOf('<',start);
			if(tagStart<0){
				if(!source.substr(start).match(/^\s*$/)){
					var doc = domBuilder.doc;
	    			var text = doc.createTextNode(source.substr(start));
	    			doc.appendChild(text);
	    			domBuilder.currentElement = text;
				}
				return;
			}
			if(tagStart>start){
				appendText(tagStart);
			}
			switch(source.charAt(tagStart+1)){
			case '/':
				var end = source.indexOf('>',tagStart+3);
				var tagName = source.substring(tagStart+2,end);
				var config = parseStack.pop();
				if(end<0){
					
	        		tagName = source.substring(tagStart+2).replace(/[\s<].*/,'');
	        		//console.error('#@@@@@@'+tagName)
	        		errorHandler.error("end tag name: "+tagName+' is not complete:'+config.tagName);
	        		end = tagStart+1+tagName.length;
	        	}else if(tagName.match(/\s</)){
	        		tagName = tagName.replace(/[\s<].*/,'');
	        		errorHandler.error("end tag name: "+tagName+' maybe not complete');
	        		end = tagStart+1+tagName.length;
				}
				//console.error(parseStack.length,parseStack)
				//console.error(config);
				var localNSMap = config.localNSMap;
				var endMatch = config.tagName == tagName;
				var endIgnoreCaseMach = endMatch || config.tagName&&config.tagName.toLowerCase() == tagName.toLowerCase()
		        if(endIgnoreCaseMach){
		        	domBuilder.endElement(config.uri,config.localName,tagName);
					if(localNSMap){
						for(var prefix in localNSMap){
							domBuilder.endPrefixMapping(prefix) ;
						}
					}
					if(!endMatch){
		            	errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
					}
		        }else{
		        	parseStack.push(config)
		        }
				
				end++;
				break;
				// end elment
			case '?':// <?...?>
				locator&&position(tagStart);
				end = parseInstruction(source,tagStart,domBuilder);
				break;
			case '!':// <!doctype,<![CDATA,<!--
				locator&&position(tagStart);
				end = parseDCC(source,tagStart,domBuilder,errorHandler);
				break;
			default:
				locator&&position(tagStart);
				var el = new ElementAttributes();
				var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
				//elStartEnd
				var end = parseElementStartPart(source,tagStart,el,currentNSMap,entityReplacer,errorHandler);
				var len = el.length;
				
				
				if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
					el.closed = true;
					if(!entityMap.nbsp){
						errorHandler.warning('unclosed xml attribute');
					}
				}
				if(locator && len){
					var locator2 = copyLocator(locator,{});
					//try{//attribute position fixed
					for(var i = 0;i<len;i++){
						var a = el[i];
						position(a.offset);
						a.locator = copyLocator(locator,{});
					}
					//}catch(e){console.error('@@@@@'+e)}
					domBuilder.locator = locator2
					if(appendElement(el,domBuilder,currentNSMap)){
						parseStack.push(el)
					}
					domBuilder.locator = locator;
				}else{
					if(appendElement(el,domBuilder,currentNSMap)){
						parseStack.push(el)
					}
				}
				
				
				
				if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
					end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
				}else{
					end++;
				}
			}
		}catch(e){
			errorHandler.error('element parse error: '+e)
			//errorHandler.error('element parse error: '+e);
			end = -1;
			//throw e;
		}
		if(end>start){
			start = end;
		}else{
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(Math.max(tagStart,start)+1);
		}
	}
}
function copyLocator(f,t){
	t.lineNumber = f.lineNumber;
	t.columnNumber = f.columnNumber;
	return t;
}

/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function parseElementStartPart(source,start,el,currentNSMap,entityReplacer,errorHandler){
	var attrName;
	var value;
	var p = ++start;
	var s = S_TAG;//status
	while(true){
		var c = source.charAt(p);
		switch(c){
		case '=':
			if(s === S_ATTR){//attrName
				attrName = source.slice(start,p);
				s = S_EQ;
			}else if(s === S_ATTR_SPACE){
				s = S_EQ;
			}else{
				//fatalError: equal must after attrName or space after attrName
				throw new Error('attribute equal must after attrName');
			}
			break;
		case '\'':
		case '"':
			if(s === S_EQ || s === S_ATTR //|| s == S_ATTR_SPACE
				){//equal
				if(s === S_ATTR){
					errorHandler.warning('attribute value must after "="')
					attrName = source.slice(start,p)
				}
				start = p+1;
				p = source.indexOf(c,start)
				if(p>0){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					el.add(attrName,value,start-1);
					s = S_ATTR_END;
				}else{
					//fatalError: no end quot match
					throw new Error('attribute value no end \''+c+'\' match');
				}
			}else if(s == S_ATTR_NOQUOT_VALUE){
				value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
				//console.log(attrName,value,start,p)
				el.add(attrName,value,start);
				//console.dir(el)
				errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
				start = p+1;
				s = S_ATTR_END
			}else{
				//fatalError: no equal before
				throw new Error('attribute value must after "="');
			}
			break;
		case '/':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_ATTR_END:
			case S_TAG_SPACE:
			case S_TAG_CLOSE:
				s =S_TAG_CLOSE;
				el.closed = true;
			case S_ATTR_NOQUOT_VALUE:
			case S_ATTR:
			case S_ATTR_SPACE:
				break;
			//case S_EQ:
			default:
				throw new Error("attribute invalid close char('/')")
			}
			break;
		case ''://end document
			//throw new Error('unexpected end of input')
			errorHandler.error('unexpected end of input');
			if(s == S_TAG){
				el.setTagName(source.slice(start,p));
			}
			return p;
		case '>':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_ATTR_END:
			case S_TAG_SPACE:
			case S_TAG_CLOSE:
				break;//normal
			case S_ATTR_NOQUOT_VALUE://Compatible state
			case S_ATTR:
				value = source.slice(start,p);
				if(value.slice(-1) === '/'){
					el.closed  = true;
					value = value.slice(0,-1)
				}
			case S_ATTR_SPACE:
				if(s === S_ATTR_SPACE){
					value = attrName;
				}
				if(s == S_ATTR_NOQUOT_VALUE){
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
				}else{
					if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !value.match(/^(?:disabled|checked|selected)$/i)){
						errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
					}
					el.add(value,value,start)
				}
				break;
			case S_EQ:
				throw new Error('attribute value missed!!');
			}
//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
			return p;
		/*xml space '\x20' | #x9 | #xD | #xA; */
		case '\u0080':
			c = ' ';
		default:
			if(c<= ' '){//space
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));//tagName
					s = S_TAG_SPACE;
					break;
				case S_ATTR:
					attrName = source.slice(start,p)
					s = S_ATTR_SPACE;
					break;
				case S_ATTR_NOQUOT_VALUE:
					var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value,start)
				case S_ATTR_END:
					s = S_TAG_SPACE;
					break;
				//case S_TAG_SPACE:
				//case S_EQ:
				//case S_ATTR_SPACE:
				//	void();break;
				//case S_TAG_CLOSE:
					//ignore warning
				}
			}else{//not space
//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
				switch(s){
				//case S_TAG:void();break;
				//case S_ATTR:void();break;
				//case S_ATTR_NOQUOT_VALUE:void();break;
				case S_ATTR_SPACE:
					var tagName =  el.tagName;
					if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !attrName.match(/^(?:disabled|checked|selected)$/i)){
						errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead2!!')
					}
					el.add(attrName,attrName,start);
					start = p;
					s = S_ATTR;
					break;
				case S_ATTR_END:
					errorHandler.warning('attribute space is required"'+attrName+'"!!')
				case S_TAG_SPACE:
					s = S_ATTR;
					start = p;
					break;
				case S_EQ:
					s = S_ATTR_NOQUOT_VALUE;
					start = p;
					break;
				case S_TAG_CLOSE:
					throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
		}//end outer switch
		//console.log('p++',p)
		p++;
	}
}
/**
 * @return true if has new namespace define
 */
function appendElement(el,domBuilder,currentNSMap){
	var tagName = el.tagName;
	var localNSMap = null;
	//var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
	var i = el.length;
	while(i--){
		var a = el[i];
		var qName = a.qName;
		var value = a.value;
		var nsp = qName.indexOf(':');
		if(nsp>0){
			var prefix = a.prefix = qName.slice(0,nsp);
			var localName = qName.slice(nsp+1);
			var nsPrefix = prefix === 'xmlns' && localName
		}else{
			localName = qName;
			prefix = null
			nsPrefix = qName === 'xmlns' && ''
		}
		//can not set prefix,because prefix !== ''
		a.localName = localName ;
		//prefix == null for no ns prefix attribute 
		if(nsPrefix !== false){//hack!!
			if(localNSMap == null){
				localNSMap = {}
				//console.log(currentNSMap,0)
				_copy(currentNSMap,currentNSMap={})
				//console.log(currentNSMap,1)
			}
			currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
			a.uri = 'http://www.w3.org/2000/xmlns/'
			domBuilder.startPrefixMapping(nsPrefix, value) 
		}
	}
	var i = el.length;
	while(i--){
		a = el[i];
		var prefix = a.prefix;
		if(prefix){//no prefix attribute has no namespace
			if(prefix === 'xml'){
				a.uri = 'http://www.w3.org/XML/1998/namespace';
			}if(prefix !== 'xmlns'){
				a.uri = currentNSMap[prefix || '']
				
				//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
			}
		}
	}
	var nsp = tagName.indexOf(':');
	if(nsp>0){
		prefix = el.prefix = tagName.slice(0,nsp);
		localName = el.localName = tagName.slice(nsp+1);
	}else{
		prefix = null;//important!!
		localName = el.localName = tagName;
	}
	//no prefix element has default namespace
	var ns = el.uri = currentNSMap[prefix || ''];
	domBuilder.startElement(ns,localName,tagName,el);
	//endPrefixMapping and startPrefixMapping have not any help for dom builder
	//localNSMap = null
	if(el.closed){
		domBuilder.endElement(ns,localName,tagName);
		if(localNSMap){
			for(prefix in localNSMap){
				domBuilder.endPrefixMapping(prefix) 
			}
		}
	}else{
		el.currentNSMap = currentNSMap;
		el.localNSMap = localNSMap;
		//parseStack.push(el);
		return true;
	}
}
function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
	if(/^(?:script|textarea)$/i.test(tagName)){
		var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
		var text = source.substring(elStartEnd+1,elEndStart);
		if(/[&<]/.test(text)){
			if(/^script$/i.test(tagName)){
				//if(!/\]\]>/.test(text)){
					//lexHandler.startCDATA();
					domBuilder.characters(text,0,text.length);
					//lexHandler.endCDATA();
					return elEndStart;
				//}
			}//}else{//text area
				text = text.replace(/&#?\w+;/g,entityReplacer);
				domBuilder.characters(text,0,text.length);
				return elEndStart;
			//}
			
		}
	}
	return elStartEnd+1;
}
function fixSelfClosed(source,elStartEnd,tagName,closeMap){
	//if(tagName in closeMap){
	var pos = closeMap[tagName];
	if(pos == null){
		//console.log(tagName)
		pos =  source.lastIndexOf('</'+tagName+'>')
		if(pos<elStartEnd){//忘记闭合
			pos = source.lastIndexOf('</'+tagName)
		}
		closeMap[tagName] =pos
	}
	return pos<elStartEnd;
	//} 
}
function _copy(source,target){
	for(var n in source){target[n] = source[n]}
}
function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
	var next= source.charAt(start+2)
	switch(next){
	case '-':
		if(source.charAt(start + 3) === '-'){
			var end = source.indexOf('-->',start+4);
			//append comment source.substring(4,end)//<!--
			if(end>start){
				domBuilder.comment(source,start+4,end-start-4);
				return end+3;
			}else{
				errorHandler.error("Unclosed comment");
				return -1;
			}
		}else{
			//error
			return -1;
		}
	default:
		if(source.substr(start+3,6) == 'CDATA['){
			var end = source.indexOf(']]>',start+9);
			domBuilder.startCDATA();
			domBuilder.characters(source,start+9,end-start-9);
			domBuilder.endCDATA() 
			return end+3;
		}
		//<!DOCTYPE
		//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
		var matchs = split(source,start);
		var len = matchs.length;
		if(len>1 && /!doctype/i.test(matchs[0][0])){
			var name = matchs[1][0];
			var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
			var sysid = len>4 && matchs[4][0];
			var lastMatch = matchs[len-1]
			domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
					sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
			domBuilder.endDTD();
			
			return lastMatch.index+lastMatch[0].length
		}
	}
	return -1;
}



function parseInstruction(source,start,domBuilder){
	var end = source.indexOf('?>',start);
	if(end){
		var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
		if(match){
			var len = match[0].length;
			domBuilder.processingInstruction(match[1], match[2]) ;
			return end+2;
		}else{//error
			return -1;
		}
	}
	return -1;
}

/**
 * @param source
 */
function ElementAttributes(source){
	
}
ElementAttributes.prototype = {
	setTagName:function(tagName){
		if(!tagNamePattern.test(tagName)){
			throw new Error('invalid tagName:'+tagName)
		}
		this.tagName = tagName
	},
	add:function(qName,value,offset){
		if(!tagNamePattern.test(qName)){
			throw new Error('invalid attribute:'+qName)
		}
		this[this.length++] = {qName:qName,value:value,offset:offset}
	},
	length:0,
	getLocalName:function(i){return this[i].localName},
	getLocator:function(i){return this[i].locator},
	getQName:function(i){return this[i].qName},
	getURI:function(i){return this[i].uri},
	getValue:function(i){return this[i].value}
//	,getIndex:function(uri, localName)){
//		if(localName){
//			
//		}else{
//			var qName = uri
//		}
//	},
//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
//	getType:function(uri,localName){}
//	getType:function(i){},
}




function _set_proto_(thiz,parent){
	thiz.__proto__ = parent;
	return thiz;
}
if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
	_set_proto_ = function(thiz,parent){
		function p(){};
		p.prototype = parent;
		p = new p();
		for(parent in thiz){
			p[parent] = thiz[parent];
		}
		return p;
	}
}

function split(source,start){
	var match;
	var buf = [];
	var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
	reg.lastIndex = start;
	reg.exec(source);//skip <
	while(match = reg.exec(source)){
		buf.push(match);
		if(match[1])return buf;
	}
}

exports.XMLReader = XMLReader;


},{}]},{},[20])(20)
});
