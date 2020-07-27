"use strict";

// Follow a subset of the SPARQL ORDER BY syntax:
// [23]  	OrderClause	  ::=  	'ORDER' 'BY' OrderCondition+
// [24]  	OrderCondition	  ::=  	( ( 'ASC' | 'DESC' ) BrackettedExpression ) | ( Constraint | Var )
// BrackettedExpression is complicated, let's simplify this to:
// let @subquery-order ::= ( ( 'ASC' | 'DESC' ) '(' ( Constraint | Var ) ')' ) | ( Constraint | Var )
module.exports.parseOrderCondition = parseOrderCondition;
function parseOrderCondition(expression){
	var list = [];
	var remaining = expression;
	while(remaining.length){
		var match = remaining.match(/^\s*((ASC|DESC)\(([^)\s]+)\)|([^(\s]+))/);
		if(match){
			remaining = remaining.substring(match[0].length);
			var direction = match[2] || 'ASC';
			var expr = match[3] || match[4];
			list.push({ direction:direction, desc:(direction=='DESC'), expression:expr });
		}else if(!remaining.match(/^\s*$/)){
			throw new Error('Unknown expression '+JSON.stringify(remaining.substring(0, 10)));
		}
	}
	return list;
}
