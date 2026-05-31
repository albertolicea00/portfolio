async function processRequest(payload) {
    const { name, email, phone, message, website } = payload;

    if (website) {
        console.log('Honeypot triggered, silently dropping request.');
        return { status: 200, body: { success: true } };
    }

    if (!name || (!email && !phone) || !message) {
        return { status: 400, body: { error: 'Name, message, and at least one contact method (email or phone) are required' } };
    }

    let hasValidContact = false;

    let emailDisplay = email || "";
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailDisplay += " ⚠️ (Invalid Format)";
        } else hasValidContact = true;
    }

    let phoneDisplay = phone || "";
    if (phone) {
        const phoneRegex = /^\+[\d\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(phone)) {
            phoneDisplay += " ⚠️ (Invalid Format / Missing Country Code)";
        } else hasValidContact = true;

    if (!hasValidContact) {
        return { status: 400, body: { error: 'At least one valid contact method (email or phone) is required' } };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
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
