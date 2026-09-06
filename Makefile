.PHONY: help build start test

help:
	@echo "Available targets:"
	@echo "  make build  - copy api/contact.mjs into functions/api/ (Cloudflare Pages build step)"
	@echo "  make start  - run the local Node server (server.mjs) at http://localhost:3000"
	@echo "  make test   - run the Python test suite (tests/run_all.py)"

build:
	mkdir -p functions/api
	cp api/contact.mjs functions/api/contact.mjs

start:
	node server.mjs

test:
	python3 tests/run_all.py
