# Modern Developer Portfolio

Responsive portfolio built with plain HTML, CSS, and JavaScript. The site ships as a static frontend with no build step and loads its UI copy and dynamic sections from per-language JSON files in `assets/i18n/`.

## Features

- Light and dark theme toggle
- Multi-language interface with automatic browser detection and English fallback
- Custom language dropdown with keyboard support
- Dynamic project and experience rendering from JSON
- Responsive layout for desktop and mobile
- Zero runtime dependencies beyond CDN fonts and icons

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Font Awesome
- Google Fonts

## Project Structure

```text
├── index.html
├── projects.html
├── style.css
├── script.js
└── assets/
    ├── i18n/
    │   ├── en.json
    │   ├── es.json
    │   ├── ...
    ├── img/
    └── pdf/
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
- Replace assets in `assets/img/` or `assets/pdf/` when needed

## Local Preview

Open `index.html` directly in the browser for a quick check, or serve the folder with any static file server if you want to avoid local `fetch` restrictions in stricter browser setups.

## Deployment

This project can be deployed to any static hosting provider, including:

- GitHub Pages
- Netlify
- Vercel

## Author

[Alberto Licea](https://github.com/albertolicea00)
