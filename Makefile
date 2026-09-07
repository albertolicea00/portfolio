.PHONY: help build dev preview start test test-structure test-assets test-links fetch-icons validate-translations

help:
	@echo "Available targets:"
	@echo "  make build [DEPLOY_TARGET=vercel|netlify|cloudflare|node]"
	@echo "                              - astro build (defaults to the Vercel adapter)"
	@echo "  make dev                    - astro dev server with HMR"
	@echo "  make preview                - astro preview (serves the last build)"
	@echo "  make start                  - run the built Node standalone server (Render/Coolify/Dokploy)"
	@echo "  make test                   - run the full Python test suite (tests/run_all.py)"
	@echo "  make test-structure         - run tests/test_structure.py"
	@echo "  make test-assets            - run tests/test_assets.py"
	@echo "  make test-links             - run tests/test_links.py"
	@echo "  make fetch-icons            - run scripts/fetch_icons.py (download tech icons)"
	@echo "  make validate-translations  - run scripts/validate_translations.py (check src/content/i18n)"

build:
	DEPLOY_TARGET=$${DEPLOY_TARGET:-vercel} npm run build

dev:
	npm run dev

preview:
	npm run preview

start:
	node ./dist/server/entry.mjs

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
