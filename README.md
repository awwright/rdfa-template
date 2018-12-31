# rdfa-template

Fill variables on an RDFa page with data from an RDF graph.

Guarentees that the generated RDFa document will contain triples also present in the source graph.

## Features

Note: API is subject to change

### Generate a graph query from placeholders in an RDFa document

Use `rdfat.parse(baseIRI, template)` to parse a given DOM document `template`:

```javascript
const parse = require('rdfa-template').parse;
const tpl = parse(document.location.toString(), document);
parser.outputResultSets.forEach(function(v){
	console.log(v.toString());
});
```

### Generate a recordset of documents with top-level variables

Documents may have variables that are filled in to match statements in the graph. The resulting document will produce RDF that exists in the database.

Use the `RDFaTemplateParser#generateInitialList` call to get this record set of variable bindings:

```xml
<html
  xmlns="http://www.w3.org/1999/xhtml"
  prefix="dc: http://purl.org/dc/terms/"
  >
  <head><title>{?title}</title></head>
  <body>
    <h1 property="dc:title">{?title}</h1>
  </body>
</html>
```

```javascript
const baseIRI = 'http://example.com/';
const template = parse(baseIRI, templateDocument);
const recordSet = template.parser.generateInitialList(dataGraph, {});
assert.equal(recordSet.length, 1);
const filledDOM = template.parser.generateDocument(template.document, dataGraph, recordSet[0]);
```


### Fill variables in a document

Documents may have variables that are filled in to match statements in the graph. The resulting document will produce RDF that exists in the database.

Use the `RDFaTemplateParser#generateInitialList` call to get this record set of variable bindings:


```javascript
const baseIRI = 'http://example.com/';
const template = parse(baseIRI, templateDocument);
const documentList = template.parser.generateInitialList(dataGraph, {}).map(function(bindings){
	return template.parser.generateDocument(template.document, dataGraph, bindings);
});
```


### Repeat an element for multiple matches

Subqueries are supported using a `subquery` attribute. This will execute an additional query and use the results for a specified purpose.

Use `subquery="each"` to repeat that element multiple times for each match:

```xml
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>My home-page</title>
    <meta subquery="each" property="http://purl.org/dc/terms/creator" content-bind="{?content}" />
    <link subquery="each" rel="related" href-bind="{?topic}" />
  </head>
  <body>...</body>
</html>
```

If multiple values for the "related" link are specified in the graph, this will output the element multiple times, one for every match.


## Tests

Run `mocha` to run tests.


## Index of Files

* bin/process.js - command line executable
* demo/index.xhtml - Browser demo of library (run `make` first)
* lib/query.js - library to query the RDF graph
* test/ - Mocha tests
* index.js - Entry point
* Makefile - generates browser bundle
* README.md - You're looking at it
