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
	query.statements.forEach(function parsePattern(pattern){
		matchStatements.push(pattern);
		indexVariable(pattern.subject);
		indexVariable(pattern.predicate);
		indexVariable(pattern.object);
	});
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
					if(p.desc){
						cmp = -cmp;
					}
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
