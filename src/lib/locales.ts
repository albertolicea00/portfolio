export const DEFAULT_LOCALE = 'en';

export interface LocaleMeta {
  id: string;
  htmlLang: string;
  buttonLabel: string;
}

// The 10 real, navigable UI locales shown in the language dropdown.
// (Content-wise these map 1:1 to src/content/i18n/{id}.json.)
export const DROPDOWN_LOCALES: LocaleMeta[] = [
  { id: 'en', htmlLang: 'en', buttonLabel: '🇺🇸 EN' },
  { id: 'es', htmlLang: 'es', buttonLabel: '🇨🇺 ES' },
  { id: 'de', htmlLang: 'de', buttonLabel: '🇩🇪 DE' },
  { id: 'fr', htmlLang: 'fr', buttonLabel: '🇫🇷 FR' },
  { id: 'it', htmlLang: 'it', buttonLabel: '🇮🇹 IT' },
  { id: 'ja', htmlLang: 'ja', buttonLabel: '🇯🇵 JA' },
  { id: 'ko', htmlLang: 'ko', buttonLabel: '🇰🇷 KO' },
  { id: 'pt', htmlLang: 'pt', buttonLabel: '🇧🇷 PT' },
  { id: 'ru', htmlLang: 'ru', buttonLabel: '🇷🇺 RU' },
  { id: 'zh', htmlLang: 'zh', buttonLabel: '🇨🇳 ZH' },
];

// Pre-baked "token saver" (caveman) variants — reachable only via the
// separate token-saver pill next to the language dropdown, not listed as
// dropdown options themselves. One real static page each.
export const TOKEN_SAVER_VARIANTS: Record<string, { id: string; icon: string; text: string; activateLabel: string; deactivateLabel: string }> = {
  en: { id: 'en.cav', icon: '🦴', text: 'Save tokens', activateLabel: 'Switch to Caveman English', deactivateLabel: 'Switch back to standard English' },
  es: { id: 'es.cav', icon: '🪨', text: 'Ahorra tokens', activateLabel: 'Cambiar a español cavernícola', deactivateLabel: 'Volver a español estándar' },
};

// Client-side-only joke transforms — never real routes, never prerendered.
export const SYNTHETIC_LOCALES = [
  { id: 'cat', buttonLabel: '🐱 MEW' },
  { id: 'alien', buttonLabel: '👽 ???' },
];

// Every id that has a real src/content/i18n/{id}.json entry and gets a
// prerendered page.
export const ALL_CONTENT_LOCALES: string[] = [
  ...DROPDOWN_LOCALES.map((l) => l.id),
  ...Object.values(TOKEN_SAVER_VARIANTS).map((v) => v.id),
];

export function getBaseLocale(id: string): string {
  return id.split('.')[0];
}

export function routeSegment(id: string): string {
  return id === DEFAULT_LOCALE ? '' : `/${id}`;
}

export function localeHref(id: string, page: '' | 'projects' = ''): string {
  const seg = routeSegment(id);
  return page ? `${seg}/${page}/` : `${seg}/`;
}

export function htmlLangFor(id: string): string {
  const base = getBaseLocale(id);
  const known = DROPDOWN_LOCALES.find((l) => l.id === base);
  return known ? known.htmlLang : DEFAULT_LOCALE;
}
