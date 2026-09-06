# @albertolicea00's Portfolio

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-000000?logo=github&logoColor=white)](https://pages.github.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-0099E5?logo=render&logoColor=white)](https://render.com)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com)

> **Note:** The `redirect` branch (https://github.com/albertolicea00/portfolio/tree/redirect) holds a zero-config static redirect to the Target (Vercel) deployment site, for hosts where you don't want to manage env vars/functions.

Responsive portfolio built with plain **HTML**, **CSS**, and **JavaScript**. The site ships as a pure static frontend with no build step and loads its UI copy and dynamic sections from per-language JSON files in `assets/i18n/`.

[![DuckDuckGo](https://img.shields.io/badge/DuckDuckGo-FF6600?logo=duckduckgo&logoColor=white)](https://duckduckgo.com/?q=albertolicea00)
[![Google](https://img.shields.io/badge/Google-4285F4?logo=google&logoColor=white)](https://www.google.com/search?q=albertolicea00)
[![Brave](https://img.shields.io/badge/Brave-FB542B?logo=brave&logoColor=white)](https://search.brave.com/search?q=albertolicea00)
[![Bing](https://img.shields.io/badge/Bing-008373?logo=bing&logoColor=white)](https://www.bing.com/search?q=albertolicea00)
[![Yahoo](https://img.shields.io/badge/Yahoo-6001D2?logo=yahoo&logoColor=white)](https://search.yahoo.com/search?p=albertolicea00)
[![Yandex](https://img.shields.io/badge/Yandex-E00000?logo=yandex&logoColor=white)](https://yandex.com/search/?text=albertolicea00)
[![Baidu](https://img.shields.io/badge/Baidu-2932E1?logo=baidu&logoColor=white)](https://www.baidu.com/s?wd=albertolicea00)

## ✨ Features

- 🌓 **Theme Toggle:** Light and dark mode support
- 🌍 **Localization:** Multi-language interface with automatic browser detection and English fallback
- ⌨️ **Accessibility:** Custom language dropdown with keyboard support
- 🗂️ **Dynamic Content:** Project and experience sections rendered dynamically from JSON
- 📱 **Responsive:** Fluid layout optimized for desktop, tablet, and mobile
- ✉️ **Secure Contact Form:** Powered by Serverless Functions and Telegram Bot API
- 🛡️ **Spam Protection:** Built-in Honeypot and Cloudflare Turnstile verification
- 🎨 **Premium Assets:** Local SVG icons for high-quality, crisp rendering (emoji-free)
- ⚡ **Zero Dependencies:** No heavy frontend frameworks or runtime dependencies 

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend (Serverless):** Node.js (Vercel Functions, Cloudflare Pages, Netlify)
- **Messaging:** Telegram Bot API
- **Testing:** Python (pytest)
- **CI/CD:** GitHub Actions
- **Typography:** Google Fonts

## 📁 Project Structure

```text
├── index.html
├── projects.html
├── style.css
├── script.js
├── functions/            # Used by Cloudflare Pages during deployment
├── api/                  # Unified Serverless backend function (Contact form)
├── assets/
│   ├── i18n/             # JSON localization files (en.json, es.json)
│   ├── icons/            # Local SVG icons
│   ├── img/              # Image assets
│   └── pdf/              # Document assets (e.g., Resumes)
├── scripts/              # Helper scripts (translations, icons, etc.)
├── tests/                # Python tests for structure, links, and assets
├── .github/workflows/    # CI/CD automation
├── LICENSE               # MIT License
└── README.md
```

## 📝 Content Model

Each file in `assets/i18n/` contains:
- `home`: UI text, labels, accessibility copy, and section content
- `projects`: Project cards rendered on the home page and projects page
- `experience`: Timeline entries rendered dynamically

`script.js` loads `assets/i18n/{lang}.json`, applies translated UI strings, and falls back to `en.json` if a language file cannot be loaded.

## 🔄 Updating Content

1. Edit `assets/i18n/en.json` to update the default English content.
2. Mirror those changes in the other language files (`es.json`, etc.) if you want localized versions.
3. Add or update entries in the `projects` array to change the portfolio cards.
4. Add or update entries in the `experience` array to change the timeline.
5. Replace assets in `assets/img/`, `assets/icons/`, or `assets/pdf/` when needed.

## 💻 Local Preview

Open `index.html` directly in the browser for a quick check, or serve the folder with any static file server. 
To test the full API and contact form locally, run the included server:
```bash
npm install
npm start
```
Then visit `http://localhost:3000`.

## 🚀 Deployment

This project can be deployed anywhere. It supports a **Multi-Cloud Zero-Config** architecture, meaning it runs seamlessly on:
- [Vercel](https://vercel.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Netlify](https://www.netlify.com/)
- [Render](https://render.com/)
- [Coolify](https://coolify.io/)
- [Dokploy](https://dokploy.com/)
- [GitHub Pages](https://pages.github.com/)

### 🪄 The Multi-Cloud Architecture Trick

This portfolio uses a unique "Multi-Cloud Zero-Config" approach for its backend. Instead of duplicating backend code for every cloud provider, the entire API logic lives in a single master file: `api/contact.js`. 

Here is how it seamlessly supports all major platforms with zero frontend code changes (the frontend simply calls `/api/contact`):
- **Vercel:** Natively looks for the `api/` directory and exposes the file automatically. This is a true zero-config deployment.
- **Cloudflare Pages:** Strictly requires a `functions/` directory. To avoid code duplication, the `package.json` includes a `"cloudflare:build"` script (`mkdir -p functions/api && cp api/contact.js functions/api/contact.js`). By setting your Cloudflare Pages build command to `npm run cloudflare:build`, Cloudflare dynamically creates the required folder structure during deployment.
- **Netlify:** `netlify/functions/contact.js` is a thin wrapper that imports `processRequest` from the master file and exposes it as a classic (`event`, `context`) handler. It has to live in its own file with no `export default`, because Netlify's function bundler treats any module with a default export as its newer Request/Response-style (v2) API and would otherwise route around the named `handler` export. `netlify.toml` points `functions` at that directory and rewrites `/api/*` to `/.netlify/functions/:splat`.
- **Render / Coolify / Dokploy:** The included `server.js` natively imports the master file and serves it as a standard Node.js Express-like endpoint.

### 🔑 Contact Form Environment Variables

Regardless of where you deploy, the contact form requires the following environment variables:
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token (from [@BotFather](https://t.me/botfather)).
- `TELEGRAM_CHAT_ID`: Your Telegram numeric Chat ID (use `@userinfobot` to find yours).
- `TURNSTILE_SECRET_KEY`: Your Cloudflare Turnstile Secret Key.

*(Don't forget to add your Turnstile Site Key to `index.html` inside the `<div class="cf-turnstile">` element!)*

### 🏢 Self-Hosted PaaS (Coolify, Dokploy) & Container Platforms (Render, Heroku)

If you deploy this project to platforms like **Coolify**, **Dokploy**, **Render**, or **Heroku**, do NOT deploy it as a "Static Site". Instead, deploy it as a **Node.js Web Service**.
Thanks to the included `server.js` and `package.json`, these platforms will automatically start a native web server that serves both your static portfolio and the backend API on the same domain seamlessly.

*(Note: If you deploy to **GitHub Pages**, the static site will work perfectly, but because GitHub Pages has no backend support, you must use an external form service like Formspree).*
