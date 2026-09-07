import type { APIRoute } from 'astro';
import { processRequest } from '../../lib/contact';

// The only non-prerendered route in the site — every adapter (Vercel,
// Netlify, Cloudflare, Node) serves this one endpoint via SSR; every other
// page stays fully static.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await processRequest(payload, process.env);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
