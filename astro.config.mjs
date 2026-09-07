// @ts-check
import { defineConfig } from 'astro/config';

// The old repo ran one static build on five hosts with zero rebuilds, via a
// single api/contact.mjs re-exported by host-specific wrappers. Astro
// requires exactly one adapter per build, so that trick can't survive
// unchanged — this is the closest equivalent: one shared handler
// (src/lib/contact.ts + src/pages/api/contact.ts), adapter picked at build
// time via DEPLOY_TARGET. One rebuild per target instead of zero rebuilds,
// but still zero code duplication.
const target = process.env.DEPLOY_TARGET || 'vercel';

let adapter;
switch (target) {
  case 'netlify': {
    const netlify = (await import('@astrojs/netlify')).default;
    adapter = netlify();
    break;
  }
  case 'cloudflare': {
    const cloudflare = (await import('@astrojs/cloudflare')).default;
    adapter = cloudflare();
    break;
  }
  case 'node': {
    const node = (await import('@astrojs/node')).default;
    adapter = node({ mode: 'standalone' });
    break;
  }
  case 'vercel':
  default: {
    const vercel = (await import('@astrojs/vercel')).default;
    adapter = vercel();
    break;
  }
}

export default defineConfig({
  site: 'https://albertolicea00.vercel.app',
  output: 'static',
  adapter,
  trailingSlash: 'ignore',
});
