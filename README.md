# rdfa-template

Fill variables on an RDFa page with data from an RDF graph.

Guarentees that the generated RDFa document will contain data also present in the source graph.

An RDFa template document is first compiled into one or more queries: one top query, and any additional subqueries nested within other queries.
The top-level query is filled out into any number of documents; if the top-level query has zero variables to expand, it's filled out into exactly one document (because the multiplicative identity is one).
In each of these documents, subqueries may be attached to elements, which are cloned for every subquery result. Subqueries may refer to variables from higher-level queries.

## Features

### Generate a graph query from placeholders in an RDFa document

Use `rdfat.parse(baseIRI, template)` to parse a given DOM document `template`:

```javascript
const parse = require('rdfa-template').parse;
const tpl = parse(document.location.toString(), document);
parser.queries.forEach(function(v){
	console.log(v.toString());
});
```

### Generate a recordset of documents given a top-level query

Documents may have variables that are filled in to match statements in the graph. The resulting document will produce only RDF data that exists in the database.

Use the `RDFaTemplateParser#evaluate` call to get this record set of variable bindings:

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
const recordset = template.evaluate(dataGraph, {});
assert.equal(recordset.length, 1);
const filledDOM = template.fillSingle(dataGraph, recordset[0]);
```


### Fill variables in a document given top-level query bindings

Documents may have variables that are filled in to match statements in the graph. The resulting document will produce RDF that exists in the database.

Use the `RDFaTemplateParser#evaluate` call to get this record set of variable bindings:


```javascript
const baseIRI = 'http://example.com/';
const template = parse(baseIRI, templateDocument);
const documentList = template.fillRecordset(dataGraph, {});
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


## Interface

### parse(base, document, options)

* base: URI base of document (location where document was downloaded)
* document: DOM document
* options: object with some settings (none yet)

Returns: DocumentGenerator (see below)


### DocumentGenerator#evaluate(db, bindings)

* db: Graph/Dataset object
* bindings: list of variable bindings to apply

Returns an array of variable bindings for the the top-level query in the document, run against `db`.

If there are no variables, returns a single empty result.

If `bindings` is supplied, results are filtered (that is, query is initialized with given bindings).


### DocumentGenerator#data(bindings)

* bindings: optional list of variable bindings to apply

Returns a list of the RDF statements that can be extracted from the document.

If any variables in `bindings` are specified, they will be used to generate additional RDF statements.


### DocumentGenerator#fillRecordset(db, bindings)

* db: Graph/Dataset object
* bindings: list of variable bindings to apply

Returns an array of documents that match.

In cases where there's no variables in the top-level query, this will return a single document.

This is the same thing as first calling `evaluate` then mapping the result set through `fillSingle`.


### DocumentGenerator#fillSingle(db, bindings)

* db: Graph/Dataset object
* bindings: list of variable bindings to apply

Returns a document with values from `db` after applying `bindings` to variables.


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
