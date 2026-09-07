export function announceStatus(message) {
  const liveRegion = document.getElementById('a11y-status');
  if (!liveRegion || !message) return;
  liveRegion.textContent = '';
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 30);
}
