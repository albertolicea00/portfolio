const form = document.getElementById('contact-form');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('contact-submit-btn');
  const statusEl = document.getElementById('contact-form-status');

  const name = form.querySelector('#name').value.trim();
  const email = form.querySelector('#email').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const message = form.querySelector('#message').value.trim();
  const website = form.querySelector('#website')?.value.trim() || '';
  const formData = new FormData(form);
  const turnstileResponse = formData.get('cf-turnstile-response') || '';

  if (!name || (!email && !phone) || !message) return;

  btn.disabled = true;
  btn.style.opacity = '0.7';
  statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, message, website, turnstileResponse }),
    });

    if (res.ok) {
      statusEl.textContent = statusEl.dataset.successMsg || "Message sent! I'll get back to you soon.";
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--accent, #6ee7b7)';
      form.reset();
    } else {
      let serverError = '';
      try {
        const data = await res.json();
        serverError = data.error;
      } catch {
        // ignore, fall back to the generic error message below
      }
      statusEl.textContent = serverError || statusEl.dataset.errorMsg || 'Something went wrong. Please try again or use the social links.';
      statusEl.style.display = 'block';
      statusEl.style.color = '#f87171';
    }
  } catch {
    statusEl.textContent = statusEl.dataset.errorMsg || 'Something went wrong. Please try again or use the social links.';
    statusEl.style.display = 'block';
    statusEl.style.color = '#f87171';
  } finally {
    btn.disabled = false;
    btn.style.opacity = '';
    if (window.turnstile) {
      window.turnstile.reset();
    }
  }
});
