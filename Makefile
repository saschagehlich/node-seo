REPORTER = spec

test:
	@./node_modules/.bin/mocha \
		--require ./test/init.js \
		--require should \
		--reporter $(REPORTER) \
		test/*.test.js

.PHONY: all test
