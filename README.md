# Modern Developer Portfolio

Responsive portfolio built with plain HTML, CSS, and JavaScript. The site ships as a static frontend with no build step and loads its UI copy and dynamic sections from per-language JSON files in `assets/i18n/`.

## Features

- Light and dark theme toggle
- Multi-language interface with automatic browser detection and English fallback
- Custom language dropdown with keyboard support
- Dynamic project and experience rendering from JSON
- Responsive layout for desktop and mobile
- Functional contact form using Vercel serverless functions and Telegram Bot API
- Anti-spam protection via Honeypot and Cloudflare Turnstile
- Local SVG icons for high-quality, crisp rendering (emoji-free)
- Zero runtime frontend dependencies beyond CDN fonts

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- **Serverless API:** Vercel Functions (Node.js) & Resend
- **Automated Testing:** Python (pytest)
- **CI/CD:** GitHub Actions
- Google Fonts

## Project Structure

```text
├── index.html
├── projects.html
├── style.css
├── script.js
├── api/                  # Serverless backend functions (Contact form)
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

## Content Model

Each file in `assets/i18n/` contains:

- `home`: UI text, labels, accessibility copy, and section content
- `projects`: project cards rendered on the home page and projects page
- `experience`: timeline entries rendered dynamically

`script.js` loads `assets/i18n/{lang}.json`, applies translated UI strings, and falls back to `en.json` if a language file cannot be loaded.

## Updating Content

- Edit `assets/i18n/en.json` to update the default content
- Mirror those changes in the other language files if you want localized versions
- Add or update entries in the `projects` array to change the portfolio cards
- Add or update entries in the `experience` array to change the timeline
- Replace assets in `assets/img/`, `assets/icons/`, or `assets/pdf/` when needed

## Local Preview

Open `index.html` directly in the browser for a quick check, or serve the folder with any static file server if you want to avoid local `fetch` restrictions in stricter browser setups.
If you need to test the contact form API locally, use Vercel CLI (`vercel dev`) with your `.env` configured.

## Deployment

This project can be deployed to any static hosting provider, including:

- Cloudflare Pages
- GitHub Pages
- Netlify
- Vercel

**Note on Contact Form API:**
The contact form requires a serverless backend. It is pre-configured to use Vercel Serverless Functions (`api/contact.js`) and the [Telegram Bot API](https://core.telegram.org/bots/api) for message delivery.

To enable the contact form:
1. Deploy the project to **Cloudflare Pages**, **Vercel**, or **Netlify**. All are fully supported out of the box:
   - **Cloudflare Pages:** Uses `functions/api/contact.js` automatically.
   - **Vercel:** Uses `api/contact.js` automatically.
   - **Netlify:** Uses `netlify/functions/contact.js` via `netlify.toml` or `api/contact.js`.
2. Create a Telegram Bot via [BotFather](https://t.me/botfather) and get your Bot Token.
3. Find your Chat ID (you can use bots like `@userinfobot` to get your numeric ID).
4. Create a [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) widget for your domain and get your Site Key and Secret Key.
5. Add the Turnstile Site Key to `index.html` inside the `<div class="cf-turnstile">` element.
6. Add the following Environment Variables to your project settings in Vercel or Netlify (and your local `.env` for testing):
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.
   - `TELEGRAM_CHAT_ID`: Your Telegram numeric Chat ID.
   - `TURNSTILE_SECRET_KEY`: Your Cloudflare Turnstile Secret Key.

### Self-Hosted PaaS (Coolify, Dokploy, etc.)

If you deploy this project to a self-hosted PaaS like **Coolify** or **Dokploy** as a "Static Site", the HTML/CSS/JS will work perfectly, but the `/api/contact` endpoint will return a 404 error. This is because these platforms do not provide native "Serverless Functions" out of the box for static sites.

To fix this, you have two options:
1. **Use an external service:** Change the form action in `index.html` to an external provider like Formspree or Web3Forms.
2. **Convert to a Node.js App:** Create a simple `server.js` (e.g., using Express) to serve the static files and handle the `/api/contact` POST request, then deploy the project as a Node.js application instead of a Static Site.

*(Similarly, if you deploy to **GitHub Pages**, the static site will work perfectly, but because it has no backend support, you must use an external form service).*

## Author

[Alberto Licea](https://github.com/albertolicea00)
