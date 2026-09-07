import { announceStatus } from './a11y.js';

const UI_GLYPHS = { themeDark: '☾', themeLight: '☀' };

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function syncThemeUI(themeToggle) {
  const theme = getCurrentTheme();
  const icon = themeToggle.querySelector('.toggle-glyph');
  if (icon) icon.textContent = theme === 'dark' ? UI_GLYPHS.themeDark : UI_GLYPHS.themeLight;
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  const label = theme === 'dark' ? themeToggle.dataset.labelToLight : themeToggle.dataset.labelToDark;
  if (label) {
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('data-tooltip', label);
  }
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  syncThemeUI(themeToggle);

  themeToggle.addEventListener('click', () => {
    const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    syncThemeUI(themeToggle);
    const announcement = nextTheme === 'dark' ? themeToggle.dataset.announceDark : themeToggle.dataset.announceLight;
    announceStatus(announcement || '');
  });
}
