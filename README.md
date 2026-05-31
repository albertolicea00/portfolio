# Modern Developer Portfolio

Responsive portfolio built with plain HTML, CSS, and JavaScript. The site ships as a static frontend with no build step and loads its UI copy and dynamic sections from per-language JSON files in `assets/i18n/`.

## Features

- Light and dark theme toggle
- Multi-language interface with automatic browser detection and English fallback
- Custom language dropdown with keyboard support
- Dynamic project and experience rendering from JSON
- Responsive layout for desktop and mobile
- Functional contact form using Vercel serverless functions and Resend
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

- GitHub Pages
- Netlify
- Vercel

**Note on Contact Form API:**
The contact form requires a serverless backend. It is pre-configured to use Vercel Serverless Functions (`api/contact.js`) and the [Telegram Bot API](https://core.telegram.org/bots/api) for message delivery.

To enable the contact form:
1. Deploy the project to **Vercel** or **Netlify**. Both are fully supported out of the box (Vercel uses `api/contact.js` and Netlify uses `netlify/functions/contact.js` via `netlify.toml`).
2. Create a Telegram Bot via [BotFather](https://t.me/botfather) and get your Bot Token.
3. Find your Chat ID (you can use bots like `@userinfobot` to get your numeric ID).
4. Add the following Environment Variables to your project settings in Vercel or Netlify (and your local `.env` for testing):
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.
   - `TELEGRAM_CHAT_ID`: Your Telegram numeric Chat ID.

*(If you deploy to GitHub Pages, the static site will work perfectly, but because GitHub Pages has no backend support, the contact form will require replacing the endpoint with an external service like Formspree or Web3Forms.)*

## Author

[Alberto Licea](https://github.com/albertolicea00)
