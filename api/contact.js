async function processRequest(payload) {
    const { name, email, phone, message } = payload;

    if (!name || !email || !message) {
        return { status: 400, body: { error: 'Name, email and message are required' } };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>';
    const emailTo = process.env.RESEND_TO || 'albertolicea00@icloud.com';

    if (!apiKey) {
        return { status: 500, body: { error: 'Email service not configured' } };
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
                reply_to: [email],
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
            console.error('Resend error:', JSON.stringify(err));
            return { status: 500, body: { error: 'Failed to send email', detail: err } };
        }

        return { status: 200, body: { success: true } };
    } catch (err) {
        console.error('Contact handler error:', err);
        return { status: 500, body: { error: 'Internal server error' } };
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------------
// VERCEL HANDLER
// ------------------------------------------------------------------
module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const result = await processRequest(req.body || {});
    return res.status(result.status).json(result.body);
};

// ------------------------------------------------------------------
// NETLIFY HANDLER
// ------------------------------------------------------------------
module.exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    
    let body = {};
    try { 
        body = JSON.parse(event.body || '{}'); 
    } catch(e) { 
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; 
    }
    
    const result = await processRequest(body);
    return {
        statusCode: result.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.body)
    };
};
