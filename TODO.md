# rdfa-template

## Definitions

* "empty RDFa document" refers to having no RDF statements or patterns, but possibly other content.
* "statement" refers to a standard RDF statement (triple), without any variables.
* "pattern" refers to a variant of the RDF statement where at least one of the terms is instead a variable.


## Features

* Feature: Standard mode returns a record set of documents, a document for each matching record in the query result set. Useful for 
* Feature: Fill mode returns a single document and errors in the event of multiple or zero matching documents.


## Test cases
* No changes to empty RDFa documents
* Empty document produces a single result
* The only RDFa document that can be filled by an empty graph is an empty RDFa document, and it won't change after filled.
* An RDFa document with a statement not in the graph produces an empty record set.
* An RDFa document with only statements in the graph produces a single record
* An RDFa document with a pattern produces a record for each match

