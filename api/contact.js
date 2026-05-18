export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>';
    const emailTo = process.env.RESEND_TO || 'albertolicea00@icloud.com';
    if (!apiKey) {
        return res.status(500).json({ error: 'Email service not configured' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: emailFrom,
                to: [emailTo],
                reply_to: email,
                subject: `Portfolio contact from ${name}`,
                html: `
                    <h2>New message from your portfolio</h2>
                    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                    ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
                    <p><strong>Message:</strong></p>
                    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
                `,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Resend error:', err);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Contact handler error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
