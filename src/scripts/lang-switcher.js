const langWrapper = document.querySelector('.lang-select-wrapper');
const langToggle = document.getElementById('lang-toggle');
const langDropdown = document.getElementById('lang-dropdown');
const langOptions = langDropdown ? Array.from(langDropdown.querySelectorAll('[role="option"]')) : [];

if (langToggle && langDropdown && langOptions.length) {
  langOptions.forEach((option, index) => {
    if (!option.id) option.id = `lang-option-${index}`;
    option.tabIndex = -1;
  });

  const setMenuState = (isOpen) => {
    langDropdown.classList.toggle('is-open', isOpen);
    langToggle.setAttribute('aria-expanded', String(isOpen));
  };

  const activeOption = langOptions.find((option) => option.getAttribute('aria-selected') === 'true') || langOptions[0];

  const focusOption = (target = activeOption) => {
    (target || langOptions[0])?.focus();
  };

  const activateOption = (option) => {
    if (!option) return;
    const trigger = option.querySelector('a[href], button');
    trigger?.click();
  };

  const moveFocus = (direction) => {
    const focused = document.activeElement?.closest?.('[role="option"]');
    const currentIndex = langOptions.indexOf(focused);
    const startIndex = currentIndex >= 0 ? currentIndex : langOptions.indexOf(activeOption);
    const nextIndex = (Math.max(0, startIndex) + direction + langOptions.length) % langOptions.length;
    langOptions[nextIndex]?.focus();
  };

  langToggle.addEventListener('click', () => {
    const shouldOpen = !langDropdown.classList.contains('is-open');
    setMenuState(shouldOpen);
    if (shouldOpen) focusOption();
  });

  langToggle.addEventListener('keydown', (event) => {
    if (!['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setMenuState(true);
    if (event.key === 'ArrowUp') {
      langOptions[langOptions.length - 1]?.focus();
      return;
    }
    focusOption();
  });

  langDropdown.addEventListener('click', (event) => {
    const option = event.target.closest('[role="option"]');
    if (!option) return;
    if (event.target.closest('a[href], button') === event.target) return; // let native activation run
    activateOption(option);
  });

  langDropdown.addEventListener('keydown', (event) => {
    const option = event.target.closest('[role="option"]');
    if (!option) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      langOptions[0]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      langOptions[langOptions.length - 1]?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateOption(option);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuState(false);
      langToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (langWrapper && !langWrapper.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && langDropdown.classList.contains('is-open')) {
      setMenuState(false);
      langToggle.focus();
    }
  });
}
