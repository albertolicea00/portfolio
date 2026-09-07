export interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  website?: string;
  turnstileResponse?: string;
}

export interface ContactResult {
  status: number;
  body: Record<string, unknown>;
}

export type ContactEnv = Record<string, string | undefined>;

/**
 * Shared across every deploy target's adapter entry point — the one piece of
 * the old "single master handler, multi-cloud" trick that survives the move
 * to Astro adapters unchanged.
 */
export async function processRequest(payload: ContactPayload, env: ContactEnv): Promise<ContactResult> {
  const { name, email, phone, message, website, turnstileResponse } = payload;

  // Honeypot: humans will never fill this field
  if (website) {
    console.log('Honeypot triggered, silently dropping request.');
    return { status: 200, body: { success: true } };
  }

  // Cloudflare Turnstile verification
  if (!turnstileResponse) {
    return { status: 400, body: { error: 'Please complete the security verification before submitting.' } };
  }

  try {
    const secret = env.TURNSTILE_SECRET_KEY;
    const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secret ?? '',
        response: turnstileResponse,
      }),
    });

    const turnstileData = await turnstileVerify.json();
    if (!turnstileData.success) {
      console.error('Turnstile verification failed:', turnstileData);
      return { status: 400, body: { error: 'Security verification failed. Please try again.' } };
    }
  } catch (err) {
    console.error('Error verifying Turnstile:', err);
    return { status: 500, body: { error: 'Failed to verify security challenge' } };
  }

  // Form fields validations
  if (!name || (!email && !phone) || !message) {
    return { status: 400, body: { error: 'Name, message, and at least one contact method (email or phone) are required' } };
  }

  let hasValidContact = false;

  let emailDisplay = email || '';
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailDisplay += ' ⚠️ (Invalid Format)';
    } else hasValidContact = true;
  }

  let phoneDisplay = phone || '';
  if (phone) {
    const phoneRegex = /^\+[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      phoneDisplay += ' ⚠️ (Invalid Format / Missing Country Code)';
    } else hasValidContact = true;
  }

  if (!hasValidContact) {
    return { status: 400, body: { error: 'At least one valid contact method (email or phone) is required' } };
  }

  // Telegram bot integration
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { status: 500, body: { error: 'Telegram service not configured' } };
  }

  const text = `
📩 New message from your portfolio!

Name: ${name}
${email ? `Email: ${emailDisplay}\n` : ''}
${phone ? `Phone: ${phoneDisplay}\n` : ''}
Message:
${message}
    `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Telegram error:', JSON.stringify(err));
      return { status: 500, body: { error: 'Failed to send message', detail: err } };
    }

    return { status: 200, body: { success: true } };
  } catch (err) {
    console.error('Contact handler error:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
