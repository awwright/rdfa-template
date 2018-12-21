
BROWSERIFY = ./node_modules/.bin/browserify
TARGETS = demo/app.js

all: $(TARGETS)

demo/app.js: demo/app.src.js
	$(BROWSERIFY) -s RDF $< > $@

clean:
	rm -f $(TARGETS)

.PHONY: clean
