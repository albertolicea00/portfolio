function adjustTooltip(el) {
  el.classList.remove('tooltip-pos-right', 'tooltip-pos-left');
  const rect = el.getBoundingClientRect();
  const maxW = Math.min(360, window.innerWidth * 0.82);
  const cx = rect.left + rect.width / 2;
  if (cx + maxW / 2 > window.innerWidth - 8) {
    el.classList.add('tooltip-pos-right');
  } else if (cx - maxW / 2 < 8) {
    el.classList.add('tooltip-pos-left');
  }
}

document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('[data-tooltip]');
  if (el) adjustTooltip(el);
});

document.addEventListener('focusin', (e) => {
  const el = e.target.closest('[data-tooltip]');
  if (el) adjustTooltip(el);
});
