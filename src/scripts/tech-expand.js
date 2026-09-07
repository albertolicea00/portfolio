const container = document.getElementById('tech-stack-container');
const expandBtn = document.getElementById('tech-expand-btn');

if (container && expandBtn) {
  const textEl = document.getElementById('tech-expand-text');

  expandBtn.addEventListener('click', () => {
    const hiddenCats = container.querySelectorAll('.tech-category.is-hidden');
    const isExpanded = hiddenCats.length === 0;

    if (isExpanded) {
      const allCats = container.querySelectorAll('[data-tech-category]');
      allCats.forEach((cat, idx) => {
        if (idx > 0) cat.classList.add('is-hidden');
      });
      if (textEl) textEl.textContent = expandBtn.dataset.viewMore || '';
      expandBtn.setAttribute('data-tooltip', expandBtn.dataset.viewMoreTooltip || '');
      expandBtn.classList.add('pulse-animation');
    } else {
      hiddenCats.forEach((cat) => cat.classList.remove('is-hidden'));
      if (textEl) textEl.textContent = expandBtn.dataset.viewLess || '';
      expandBtn.setAttribute('data-tooltip', expandBtn.dataset.viewLessTooltip || '');
      expandBtn.classList.remove('pulse-animation');
    }
  });
}
