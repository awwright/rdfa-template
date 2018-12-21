
BROWSERIFY = ./node_modules/.bin/browserify
TARGETS = demo/app.js index.xhtml app.js style.css

all: $(TARGETS)

gh-pages: index.xhtml app.js style.css

demo/app.js: demo/app.src.js
	$(BROWSERIFY) -s RDF $< > $@

index.xhtml: demo/index.xhtml
	cp $< $@

app.js: demo/app.js
	cp $< $@

style.css: demo/style.css
	cp $< $@

clean:
	rm -f $(TARGETS)

.PHONY: clean gh-pages
