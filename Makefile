.PHONY: help build start dev test test-structure test-assets test-links fetch-icons validate-translations

help:
	@echo "Available targets:"
	@echo "  make build                 - copy api/contact.mjs into functions/api/ (Cloudflare Pages build step)"
	@echo "  make start                 - run the local Node server (server.mjs) at http://localhost:3000"
	@echo "  make dev                   - serve the site with live-server (auto-reload) and open the browser"
	@echo "  make test                  - run the full Python test suite (tests/run_all.py)"
	@echo "  make test-structure        - run tests/test_structure.py"
	@echo "  make test-assets           - run tests/test_assets.py"
	@echo "  make test-links            - run tests/test_links.py"
	@echo "  make fetch-icons           - run scripts/fetch_icons.py (download tech icons)"
	@echo "  make validate-translations - run scripts/validate_translations.py (check assets/i18n)"

build:
	mkdir -p functions/api
	cp api/contact.mjs functions/api/contact.mjs

start:
	node server.mjs

dev:
	npx live-server .

test:
	python3 tests/run_all.py

test-structure:
	python3 tests/test_structure.py

test-assets:
	python3 tests/test_assets.py

test-links:
	python3 tests/test_links.py

fetch-icons:
	python3 scripts/fetch_icons.py

validate-translations:
	python3 scripts/validate_translations.py
