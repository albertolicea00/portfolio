import { announceStatus } from './a11y.js';

const UI_GLYPHS = { menuClosed: '☰', menuOpen: '✕' };

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  const setMenuState = (isOpen, shouldAnnounce = false) => {
    navLinks.classList.toggle('active', isOpen);
    const icon = menuToggle.querySelector('.toggle-glyph');
    if (icon) icon.textContent = isOpen ? UI_GLYPHS.menuOpen : UI_GLYPHS.menuClosed;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    const label = isOpen ? menuToggle.dataset.labelClose : menuToggle.dataset.labelOpen;
    if (label) {
      menuToggle.setAttribute('aria-label', label);
      menuToggle.setAttribute('data-tooltip', label);
    }
    if (shouldAnnounce) {
      const announcement = isOpen ? menuToggle.dataset.announceExpanded : menuToggle.dataset.announceCollapsed;
      announceStatus(announcement || '');
    }
  };

  menuToggle.addEventListener('click', () => {
    setMenuState(!navLinks.classList.contains('active'), true);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) setMenuState(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('active')) {
      setMenuState(false, true);
      menuToggle.focus();
    }
  });
}
