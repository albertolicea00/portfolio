# Modern Developer Portfolio 🚀

A high-end, responsive developer portfolio built with **Pure HTML, CSS, and JavaScript**. Featuring multi-language support, theme switching, and a JSON-driven content system for easy maintenance.

## ✨ Features

- 🌓 **Dynamic Theming**: Smooth transition between Dark and Light modes.
- 🌍 **Multi-language Support**: Full English and Spanish integration with instant toggle.
- 📦 **JSON-Driven**: All projects, experience, and text content are centralized in `content.json`.
- 📱 **Fully Responsive**: Optimized for all devices—from desktop to mobile.
- 💎 **Modern Aesthetics**: Glassmorphism effects, glitch transitions, and smooth scroll animations.
- 🚀 **Zero Dependencies**: Built with vanilla technologies for maximum performance.

## 🛠️ Tech Stack

- **HTML5**: Semantic structure.
- **CSS3**: Custom properties (Variables), Flexbox, Grid, and Animations.
- **JavaScript (ES6+)**: Dynamic rendering, I18n logic, and state management.
- **Font Awesome**: Professional iconography.
- **Google Fonts**: Premium typography (Outfit & Inter).

## 📂 Project Structure

```text
├── index.html          # Main landing page
├── projects.html       # Gallery for all projects
├── style.css           # Main stylesheet with theme variables
├── script.js           # Core logic (Theme, Language, Data rendering)
├── content.json        # The "CMS" - Edit this to update your info!
└── assets/             # Images and design assets
```

## ⚙️ How to Update Your Content

To update the information on the website, you only need to modify **`content.json`**.

- **Translations**: Grouped by section (nav, hero, about, etc.) in `en` and `es`.
- **Projects**: Add your own work in the `projects` array. Use `featured: true` to show them on the home page.
- **Experience**: Update your career timeline in the `experience` array.

## 🚀 Deployment

The site is ready to be hosted on any static hosting service like:

- **GitHub Pages**
- **Vercel**
- **Netlify**

Simply push your code to the repository and connect your hosting provider.

---

Developed with ❤️ by [Alberto Licea](https://github.com/albertolicea00)
