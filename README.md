# @albertolicea00's Portfolio

[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Render](https://img.shields.io/badge/Render-0099E5?logo=render&logoColor=white)](https://render.com)

> **Note:** The `redirect` branch (https://github.com/albertolicea00/portfolio/tree/redirect) holds a zero-config static redirect to the Target (Vercel) deployment site, for hosts where you don't want to manage env vars/functions.

Portfolio built with **Astro** — componentized, statically prerendered per locale, with a single serverless endpoint for the contact form. Migrated from a plain HTML/CSS/JS build (issue [#12](https://github.com/albertolicea00/portfolio/issues/12); the original trade-offs that motivated the migration are tracked in [#6](https://github.com/albertolicea00/portfolio/issues/6)).

[![DuckDuckGo](https://img.shields.io/badge/DuckDuckGo-FF6600?logo=duckduckgo&logoColor=white)](https://duckduckgo.com/?q=albertolicea00)
[![Google](https://img.shields.io/badge/Google-4285F4?logo=google&logoColor=white)](https://www.google.com/search?q=albertolicea00)
[![Brave](https://img.shields.io/badge/Brave-FB542B?logo=brave&logoColor=white)](https://search.brave.com/search?q=albertolicea00)
[![Bing](https://img.shields.io/badge/Bing-008373?logo=bing&logoColor=white)](https://www.bing.com/search?q=albertolicea00)
[![Yahoo](https://img.shields.io/badge/Yahoo-6001D2?logo=yahoo&logoColor=white)](https://search.yahoo.com/search?p=albertolicea00)
[![Yandex](https://img.shields.io/badge/Yandex-E00000?logo=yandex&logoColor=white)](https://yandex.com/search/?text=albertolicea00)
[![Baidu](https://img.shields.io/badge/Baidu-2932E1?logo=baidu&logoColor=white)](https://www.baidu.com/s?wd=albertolicea00)

## ✨ Features

- 🧩 **Componentized:** shared layout/nav/footer/card/timeline components — no more hand-copied markup between pages
- 🌍 **Real per-locale static HTML:** 10 languages + 2 pre-baked "caveman" variants, each prerendered at build time (not fetched client-side) — crawlable, indexable, no JS required to read content
- 🐱 **Cat/alien joke languages:** still a client-side toggle layered on top of whichever real locale is active — explicitly non-canonical, never prerendered
- 🌓 **Theme Toggle:** light/dark mode, persisted in `localStorage`
- ⌨️ **Accessibility:** keyboard-navigable language dropdown, skip link, live-region announcements
- ✉️ **Secure Contact Form:** one shared handler (`src/lib/contact.ts`), Cloudflare Turnstile + honeypot spam protection, Telegram Bot API delivery
- 📱 **Responsive:** fluid layout for desktop, tablet, and mobile
- ⚡ **Astro build:** Vite-based tree-shaking, code-splitting, and minification

## 🛠️ Tech Stack

- **Framework:** Astro (static output, one server-rendered API route)
- **Frontend:** Astro components + plain-JS islands (no UI framework — theme/lang/tooltip/particles/form behaviors ported 1:1 from the original vanilla JS)
- **Content:** Astro content collections, one typed JSON file per locale (`src/content/i18n/`)
- **Backend (serverless):** Node.js, adapter-selected at build time (Vercel, Netlify, Cloudflare Pages, or Node standalone for Render/Coolify/Dokploy)
- **Messaging:** Telegram Bot API
- **Testing:** Python (structure/asset/link checks against the i18n source files)
- **CI/CD:** GitHub Actions
- **Typography:** Google Fonts

## 🔀 Adapter-per-target (the Astro equivalent of the old "one handler, multi-cloud" trick)

The pre-Astro version ran one static build, unmodified, on five hosts, by re-exporting a single `api/contact.mjs` handler through host-specific wrapper files — zero rebuilds. **Astro requires exactly one adapter per build**, so that specific trick doesn't survive the migration. What does survive: all the actual logic still lives in one file, `src/lib/contact.ts`, imported by the one API route `src/pages/api/contact.ts`. Only the *adapter* changes per target, selected via the `DEPLOY_TARGET` env var in `astro.config.mjs`:

```bash
DEPLOY_TARGET=vercel     npm run build   # default — @astrojs/vercel
DEPLOY_TARGET=netlify    npm run build   # @astrojs/netlify
DEPLOY_TARGET=cloudflare npm run build   # @astrojs/cloudflare
DEPLOY_TARGET=node       npm run build   # @astrojs/node, standalone mode — Render/Coolify/Dokploy
```

So: one rebuild per target instead of zero rebuilds, but still zero code duplication. Every page is prerendered static HTML except `/api/contact`, which opts out via `export const prerender = false` and is the only route any adapter actually serves at runtime.

## 📁 Project Structure

```bash
├── astro.config.mjs         # adapter selection (DEPLOY_TARGET), site config
├── package.json
├── src/
│   ├── layouts/BaseLayout.astro     # <head>, skip-link, a11y-status region
│   ├── components/
│   │   ├── Navbar.astro, Hero.astro, ProjectsSection.astro, ProjectCard.astro,
│   │   ├── ExperienceSection.astro, TimelineItem.astro, TechStack.astro,
│   │   ├── AboutSection.astro, ContactSection.astro, Footer.astro, SocialLinks.astro
│   │   └── pages/HomePage.astro, ProjectsPage.astro   # shared bodies for the default + [locale] routes
│   ├── content.config.ts     # i18n collection schema (zod)
│   ├── content/i18n/*.json   # one file per locale: home / projects / experience
│   ├── scripts/               # one file per client-side behavior
│   │   ├── theme.js, mobile-menu.js, lang-switcher.js, cat-alien-transform.js,
│   │   ├── tech-expand.js, contact-form.js, tooltip.js, cursor-particles.js,
│   │   └── scroll-animations.js, a11y.js
│   ├── lib/
│   │   ├── contact.ts          # processRequest() — shared by every adapter's API route
│   │   ├── tech-data.ts        # tech chip names/categories
│   │   └── locales.ts          # locale metadata + routing helpers
│   ├── styles/global.css      # single global stylesheet
│   └── pages/
│       ├── index.astro, projects.astro           # default locale (en) at "/"
│       ├── [locale]/index.astro, [locale]/projects.astro  # the other 11 locales
│       └── api/contact.ts     # the one non-prerendered route
├── public/
│   ├── assets/                # img, icons, pdf — served as-is (icon paths are built
│   │                             dynamically from strings, so they stay outside Astro's
│   │                             optimized asset pipeline)
│   └── robots.txt, sitemap.xml, llms.txt
├── scripts/                   # standalone dev-only helper scripts (not shipped)
│   ├── fetch_icons.py, validate_translations.py, package.json
├── tests/                     # Python test suite, checked against src/content/i18n/
│   ├── run_all.py, test_structure.py, test_assets.py, test_links.py
├── .github/workflows/test.yml
├── netlify.toml, vercel.json, render.yaml
├── LICENSE
└── README.md
```

## 📝 Content Model

Each file in `src/content/i18n/` (`en`, `es`, `de`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `zh`, `en.cav`, `es.cav`) contains:
- `home`: UI text, labels, accessibility copy, and section content
- `projects`: project cards rendered on the home page and the "All Work" page
- `experience`: timeline entries

Shape is enforced at build time by the zod schema in `src/content.config.ts` — a malformed or missing key fails the build instead of silently rendering blank.

`cat` and `alien` are **not** locale files — they're a deterministic client-side transform (`src/scripts/cat-alien-transform.js`) layered over whichever real locale is currently displayed, exactly as before. Never prerendered, never indexed — consistent with the site's own `ai-content-note` metadata, which already flags them as playful, non-authoritative variants.

## 🔄 Updating Content

1. Edit `src/content/i18n/en.json` to update the default English content.
2. Mirror those changes in the other locale files if you want localized versions.
3. Add or update entries in `projects` to change the portfolio cards.
4. Add or update entries in `experience` to change the timeline.
5. Replace assets in `public/assets/img/`, `public/assets/icons/`, or `public/assets/pdf/` when needed.

## 💻 Local Preview

```bash
npm install
make dev        # astro dev, with HMR, at http://localhost:4321
```

To test a specific adapter's build output locally:
```bash
DEPLOY_TARGET=node make build   # or vercel / netlify / cloudflare
make start                      # runs the Node standalone server (Render/Coolify/Dokploy shape)
```

Run the Python test suite (validates `src/content/i18n/*.json` structure, local asset paths, and external link reachability — no build required):
```bash
make test
```
Or run a single suite (`make test-structure`, `make test-assets`, `make test-links`). Helper scripts: `make fetch-icons` and `make validate-translations`.

## 🚀 Deployment

Supports the same five targets as before, one adapter per target:
- [Vercel](https://vercel.com/) — zero-config, `DEPLOY_TARGET` unset defaults to `vercel`
- [Netlify](https://www.netlify.com/) — build command `npm run build`, `DEPLOY_TARGET=netlify` set in `netlify.toml`
- [Cloudflare Pages](https://pages.cloudflare.com/) — build command `DEPLOY_TARGET=cloudflare npm run build`, output directory `dist`
- [Render](https://render.com/) / [Coolify](https://coolify.io/) / [Dokploy](https://dokploy.com/) — Node Web Service, `DEPLOY_TARGET=node npm run build` then `node ./dist/server/entry.mjs` (see `render.yaml`)

**GitHub Pages:** not wired up in this pass. It has no functions support at all (same as before the migration — the old README already required an external form service like Formspree there), and every adapter above still expects to run its own SSR function for `/api/contact`. Serving GH Pages would need a fifth, adapter-less `output: 'static'` build profile that drops the API route entirely; left as a follow-up rather than guessed at here.

### 🔑 Contact Form Environment Variables

Regardless of where you deploy, the contact form requires:
- `TELEGRAM_BOT_TOKEN`: your Telegram Bot API token (from [@BotFather](https://t.me/botfather)).
- `TELEGRAM_CHAT_ID`: your Telegram numeric Chat ID (use `@userinfobot` to find yours).
- `TURNSTILE_SECRET_KEY`: your Cloudflare Turnstile Secret Key.

*(Don't forget to keep your Turnstile Site Key in `src/components/ContactSection.astro`'s `.cf-turnstile` element in sync with your own site!)*

### 🏢 Self-Hosted PaaS (Coolify, Dokploy) & Container Platforms (Render, Heroku)

Deploy as a **Node.js Web Service**, not a static site — `DEPLOY_TARGET=node npm run build` followed by `node ./dist/server/entry.mjs` serves both the static pages and the API on the same origin.
