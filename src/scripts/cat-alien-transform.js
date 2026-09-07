import { announceStatus } from './a11y.js';

// Cat/alien are the two "joke" languages: never real routes, never
// prerendered (per the site's own ai-content-note, they're playful,
// non-authoritative variants). They're a deterministic client-side
// transform layered on top of whatever real locale is currently rendered.

const CAT_SOUNDS = ['meow', 'miau', 'mrrp', 'nya', 'mew', 'purr'];
const ALIEN_SYMBOLS = [
  '⟟', '⌿', '⌇', '⟒', '⍀', '⌰', '⏃', '⍜', '⏁', '⊑', '⍙', '⌖',
  '⊕', '⊗', '⊙', '⊚', '⊛', '⊞', '⊟', '⊠', '⊡',
  '◉', '◎', '◌', '◍', '◐', '◑', '◒', '◓', '◔', '◕',
  '▣', '▤', '▥', '▦', '▧', '▨', '▩',
  '╬', '╠', '╣', '╦', '╩', '╔', '╗', '╚', '╝',
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛉ', 'ᛊ', 'ᛏ',
  '☌', '☍', '☊', '☋', '☿', '⚚', '⚛', '⚝', '⛧', '⛤', '🜁', '🜂', '🜃', '🜄',
];

const TRANSLATABLE_SELECTOR = [
  '[data-i18n]',
  '[data-i18n-placeholder]',
  '[data-i18n-tooltip]',
  '.project-title',
  '.project-desc',
  '.tag',
  '.timeline-date',
  '.timeline-content h3',
  '.timeline-content p',
  '.timeline-link span',
].join(', ');

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seedSource) {
  let seed = hashString(seedSource);
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function transformHtmlText(input, transformer) {
  return input
    .split(/(<[^>]+>)/g)
    .map((fragment) => (fragment.startsWith('<') && fragment.endsWith('>') ? fragment : transformer(fragment)))
    .join('');
}

function looksProtectedToken(word) {
  return (
    !word
    || /^https?:/i.test(word)
    || /^www\./i.test(word)
    || /^[@#]/.test(word)
    || /^[0-9]+([./:-][0-9]+)*$/.test(word)
  );
}

function getCatSound(coreWord, trailingPunctuation, rng) {
  if (trailingPunctuation.includes('!')) return 'HISSS';
  if (trailingPunctuation.includes('?')) return 'mrrp';
  if (coreWord.length > 6) return 'meooow';

  let sound = CAT_SOUNDS[Math.floor(rng() * CAT_SOUNDS.length)];
  if (rng() > 0.6) sound = sound.replace('o', 'oooo').replace('a', 'aaa');
  return sound;
}

function transformWordToken(token, transformWord) {
  if (!token || /^\s+$/.test(token)) return token;

  const leading = token.match(/^[^A-Za-z0-9@#]+/)?.[0] || '';
  const trailing = token.match(/[^A-Za-z0-9]+$/)?.[0] || '';
  const start = leading.length;
  const end = token.length - trailing.length;
  const coreWord = token.slice(start, end);

  if (!coreWord) return token;
  if (looksProtectedToken(coreWord)) return token;

  return `${leading}${transformWord(coreWord, trailing)}${trailing}`;
}

function toCatLanguage(input, seedKey) {
  return transformHtmlText(input, (segment) => {
    const rng = createSeededRandom(`${seedKey}:${segment}`);
    return segment
      .split(/(\s+)/)
      .map((token) => transformWordToken(token, (coreWord, trailing) => getCatSound(coreWord, trailing, rng)))
      .join('');
  });
}

function randomAlienText(length, rng) {
  return Array.from({ length }, () => ALIEN_SYMBOLS[Math.floor(rng() * ALIEN_SYMBOLS.length)]).join('');
}

function toAlienLanguage(input, seedKey) {
  return transformHtmlText(input, (segment) => {
    const rng = createSeededRandom(`${seedKey}:${segment}`);
    return segment
      .split(/(\s+)/)
      .map((token) => transformWordToken(token, (coreWord) => randomAlienText(Math.max(2, Math.min(coreWord.length, 12)), rng)))
      .join('');
  });
}

const TRANSFORMERS = { cat: toCatLanguage, alien: toAlienLanguage };

const originalHtml = new WeakMap();
const originalPlaceholder = new WeakMap();
const originalTooltip = new WeakMap();

function applyTransform(activeLang) {
  const transform = TRANSFORMERS[activeLang];
  document.querySelectorAll(TRANSLATABLE_SELECTOR).forEach((el) => {
    if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
    el.innerHTML = transform ? transform(originalHtml.get(el), activeLang) : originalHtml.get(el);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    if (!originalPlaceholder.has(el)) originalPlaceholder.set(el, el.placeholder);
    el.placeholder = transform ? transform(originalPlaceholder.get(el), activeLang) : originalPlaceholder.get(el);
  });

  document.querySelectorAll('[data-i18n-tooltip]').forEach((el) => {
    if (!originalTooltip.has(el)) originalTooltip.set(el, el.getAttribute('data-tooltip') || '');
    const value = transform ? transform(originalTooltip.get(el), activeLang) : originalTooltip.get(el);
    el.setAttribute('data-tooltip', value);
  });
}

function updateOptionsUI(activeLang) {
  document.querySelectorAll('[role="option"][data-lang]').forEach((option) => {
    option.setAttribute('aria-selected', String(option.dataset.lang === activeLang));
  });

  const langToggle = document.getElementById('lang-toggle');
  if (!langToggle) return;
  if (activeLang) {
    const activeOption = document.querySelector(`[role="option"][data-lang="${activeLang}"]`);
    const label = activeOption?.dataset.buttonLabel;
    if (label) langToggle.textContent = label;
  } else {
    const previouslySelected = document.querySelector('[role="option"][aria-selected="true"][data-lang]:not([data-synthetic-lang])');
    const label = previouslySelected?.dataset.buttonLabel;
    if (label) langToggle.textContent = label;
  }
}

function setSyntheticLanguage(nextLang) {
  const current = localStorage.getItem('synthetic-lang');
  const activeLang = current === nextLang ? null : nextLang;

  if (activeLang) {
    localStorage.setItem('synthetic-lang', activeLang);
  } else {
    localStorage.removeItem('synthetic-lang');
  }

  applyTransform(activeLang);
  updateOptionsUI(activeLang);

  const button = document.querySelector(`[data-synthetic-lang="${nextLang}"]`);
  const announcement = activeLang ? button?.dataset.announceActive : button?.dataset.announceInactive;
  if (announcement) announceStatus(announcement);
}

document.querySelectorAll('[data-synthetic-lang]').forEach((button) => {
  button.addEventListener('click', () => {
    setSyntheticLanguage(button.dataset.syntheticLang);
  });
});

const persisted = localStorage.getItem('synthetic-lang');
if (persisted && TRANSFORMERS[persisted]) {
  applyTransform(persisted);
  updateOptionsUI(persisted);
}
