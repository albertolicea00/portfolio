/**
 * PORTFOLIO ARCHITECTURE
 * English is static in the HTML (no fetch/render, no fallback logic — it's
 * just what's already there). The URL is the only source of truth for which
 * other language to show: a ?lang=<code> query param. No param (or one that
 * doesn't match a supported language) means the DOM is left exactly as-is.
 * Picking a language navigates to that URL (a real page load); nothing is
 * swapped in place. Languages preload in the background after load so a
 * later switch's fetch is served from the HTTP cache instantly.
 */

// 'en' is intentionally absent: English is static in the HTML, not a
// fetchable JSON language (see hydrateInitialContent/navigateToLanguage below).
const SUPPORTED_LANGS = ['en.cav', 'es', 'es.cav', 'de', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'zh', 'cat', 'alien'];
const DEFAULT_LANG = 'en';
const I18N_ASSET_VERSION = '20260531-1';
// Tech-stack chip names/categories are static HTML now (never translated),
// so the TECH_NAMES/TECH_CATEGORIES lookup tables that used to drive
// renderTechStack() no longer have a caller — removed along with it.
const EXPERIENCE_START_DATE = { year: 2019, month: 0, day: 1 };
const LANGUAGE_CONTROL_LABELS = {
    en: 'Select language',
    cat: 'Select cat language',
    alien: 'Select alien language',
    es: 'Seleccionar idioma',
    de: 'Sprache w\u00e4hlen',
    fr: 'Choisir la langue',
    it: 'Seleziona lingua',
    ja: '\u8a00\u8a9e\u3092\u9078\u629e',
    ko: '\uc5b8\uc5b4 \uc120\ud0dd',
    pt: 'Selecionar idioma',
    ru: '\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u044f\u0437\u044b\u043a',
    zh: '\u9009\u62e9\u8bed\u8a00'
};
const LANGUAGE_CHANGED_LABELS = {
    en: 'Language changed to English',
    'en.cav': 'Caveman English active',
    cat: 'Cat language active',
    alien: 'Alien language active',
    es: 'Idioma cambiado a espa\u00f1ol',
    'es.cav': 'Espa\u00f1ol cavern\u00edcola activo',
    de: 'Sprache auf Deutsch ge\u00e4ndert',
    fr: 'Langue chang\u00e9e en fran\u00e7ais',
    it: 'Lingua cambiata in italiano',
    ja: '\u65e5\u672c\u8a9e\u306b\u5909\u66f4\u3057\u307e\u3057\u305f',
    ko: '\ud55c\uad6d\uc5b4\ub85c \ubcc0\uacbd\ub418\uc5c8\uc2b5\ub2c8\ub2e4',
    pt: 'Idioma alterado para portugu\u00eas',
    ru: '\u042f\u0437\u044b\u043a \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0451\u043d \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u0438\u0439',
    zh: '\u8bed\u8a00\u5df2\u5207\u6362\u4e3a\u4e2d\u6587'
};
const TOKEN_SAVER_VARIANTS = {
    en: {
        variant: 'en.cav',
        icon: '\ud83e\uddb4',
        text: 'Save tokens',
        activateLabel: 'Switch to Caveman English',
        deactivateLabel: 'Switch back to standard English'
    },
    es: {
        variant: 'es.cav',
        icon: '\ud83e\udea8',
        text: 'Ahorra tokens',
        activateLabel: 'Cambiar a espa\u00f1ol cavern\u00edcola',
        deactivateLabel: 'Volver a espa\u00f1ol est\u00e1ndar'
    }
};
const CAT_SOUNDS = ['meow', 'miau', 'mrrp', 'nya', 'mew', 'purr'];
const ALIEN_SYMBOLS = [
    '⟟', '⌿', '⌇', '⟒', '⍀', '⌰', '⏃', '⍜', '⏁', '⊑', '⍙', '⌖',
    '⊕', '⊗', '⊙', '⊚', '⊛', '⊞', '⊟', '⊠', '⊡',
    '◉', '◎', '◌', '◍', '◐', '◑', '◒', '◓', '◔', '◕',
    '▣', '▤', '▥', '▦', '▧', '▨', '▩',
    '╬', '╠', '╣', '╦', '╩', '╔', '╗', '╚', '╝',
    'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛉ', 'ᛊ', 'ᛏ',
    '☌', '☍', '☊', '☋', '☿', '⚚', '⚛', '⚝', '⛧', '⛤', '🜁', '🜂', '🜃', '🜄'
];
const SYNTHETIC_LANGUAGE_GENERATORS = {
    cat: generateCatLanguageData,
    alien: generateAlienLanguageData
};
const UI_GLYPHS = {
    themeDark: '\u263e',
    themeLight: '\u2600',
    menuClosed: '\u2630',
    menuOpen: '\u2715'
};

let siteData = null;
let currentLang = detectLanguage();
let currentTheme = localStorage.getItem('theme') || 'dark';
let tokenSaverAttentionTimeoutId = null;
const syntheticLanguageCache = {};
const languageDataCache = {};
const languageRequestCache = {};
let hasScheduledLanguagePreload = false;

function getLanguageAssetPath(lang) {
    return `assets/i18n/${lang}.json?v=${I18N_ASSET_VERSION}`;
}

// The cat/alien generators need real English sentences to mutate. Rather
// than fetch a separate JSON copy of English (a second source of truth to
// keep in sync with the HTML), this reads the static English page itself —
// the same DOM every visitor already has — once, before anything can have
// changed it, and caches that snapshot for the rest of the session.
let capturedEnglishSourceData = null;

function setNestedPath(obj, path, value) {
    const parts = path.split('.');
    let node = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
        node = node[parts[i]] ??= {};
    }
    node[parts[parts.length - 1]] = value;
}

function captureEnglishSourceFromDom() {
    if (capturedEnglishSourceData) return capturedEnglishSourceData;

    const home = {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
        setNestedPath(home, el.getAttribute('data-i18n'), el.innerHTML.trim());
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        setNestedPath(home, el.getAttribute('data-i18n-placeholder'), el.placeholder);
    });
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        setNestedPath(home, el.getAttribute('data-i18n-tooltip'), el.getAttribute('data-tooltip') || el.textContent.trim());
    });

    const projects = Array.from(document.querySelectorAll('.project-title')).map(titleEl => {
        const card = titleEl.closest('.project-card');
        return {
            id: Number(titleEl.id.replace('project-title-', '')),
            title: titleEl.innerHTML,
            description: card?.querySelector('.project-desc')?.innerHTML || '',
            tags: Array.from(card?.querySelectorAll('.tag') || []).map(tag => tag.textContent)
        };
    });

    const experience = Array.from(document.querySelectorAll('.timeline-item')).map(item => ({
        date: item.querySelector('.timeline-date')?.textContent || '',
        title: item.querySelector('h3')?.innerHTML || '',
        desc: item.querySelector('p')?.innerHTML || '',
        links: Array.from(item.querySelectorAll('.timeline-link')).map(link => ({
            label: link.querySelector('span:not(.inline-icon)')?.textContent || ''
        }))
    }));

    capturedEnglishSourceData = { home, projects, experience };
    return capturedEnglishSourceData;
}

function getBaseLanguage(lang = currentLang) {
    return lang.split('.')[0];
}

function getDocumentLanguageCode(lang = currentLang) {
    const baseLang = getBaseLanguage(lang);
    return baseLang === 'cat' || baseLang === 'alien' ? 'en' : baseLang;
}

function getLanguageConfigValue(map, lang = currentLang) {
    return map[lang] || map[getBaseLanguage(lang)] || map[DEFAULT_LANG];
}

function detectLanguage() {
    // The URL is the only source of truth for which language to show — no
    // localStorage, no browser-locale guessing. No ?lang= (or an
    // unrecognized one) means: leave the DOM exactly as it already is.
    const requested = new URLSearchParams(window.location.search).get('lang');
    return requested && SUPPORTED_LANGS.includes(requested) ? requested : DEFAULT_LANG;
}

async function loadLanguage(lang) {
    if (SYNTHETIC_LANGUAGE_GENERATORS[lang]) {
        return loadSyntheticLanguage(lang);
    }

    try {
        return await fetchConcreteLanguage(lang);
    } catch {
        const baseLang = getBaseLanguage(lang);
        if (lang !== baseLang) {
            console.warn(`Failed to load i18n/${lang}.json, falling back to ${baseLang}`);
            return loadLanguage(baseLang);
        }
        // No further fallback: English isn't a fetchable i18n file anymore
        // (it's static in the HTML). Callers catch this and leave the
        // static English page as-is.
        throw new Error('Failed to load i18n data');
    }
}

async function fetchConcreteLanguage(lang) {
    if (languageDataCache[lang]) return languageDataCache[lang];
    if (languageRequestCache[lang]) return languageRequestCache[lang];

    const request = fetch(getLanguageAssetPath(lang))
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            languageDataCache[lang] = data;
            return data;
        })
        .finally(() => {
            delete languageRequestCache[lang];
        });

    languageRequestCache[lang] = request;
    return request;
}

async function loadSyntheticLanguage(lang) {
    if (syntheticLanguageCache[lang]) return syntheticLanguageCache[lang];

    const baseData = captureEnglishSourceFromDom();
    const generator = SYNTHETIC_LANGUAGE_GENERATORS[lang];
    const generatedData = generator(baseData);
    syntheticLanguageCache[lang] = generatedData;
    return generatedData;
}

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
        .map(fragment => (fragment.startsWith('<') && fragment.endsWith('>') ? fragment : transformer(fragment)))
        .join('');
}

function mapVisibleContent(data, stringTransformer) {
    return {
        home: transformNestedStrings(data.home, stringTransformer),
        projects: data.projects.map(project => ({
            ...project,
            title: stringTransformer(project.title),
            description: stringTransformer(project.description),
            tags: project.tags.map(tag => stringTransformer(tag))
        })),
        experience: data.experience.map(item => ({
            ...item,
            date: stringTransformer(item.date),
            title: stringTransformer(item.title),
            desc: stringTransformer(item.desc),
            links: (item.links || []).map(link => ({
                ...link,
                label: stringTransformer(link.label)
            }))
        }))
    };
}

function transformNestedStrings(value, stringTransformer) {
    if (typeof value === 'string') return stringTransformer(value);
    if (Array.isArray(value)) return value.map(item => transformNestedStrings(item, stringTransformer));
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, transformNestedStrings(nestedValue, stringTransformer)])
    );
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
    return transformHtmlText(input, segment => {
        const rng = createSeededRandom(`${seedKey}:${segment}`);
        return segment
            .split(/(\s+)/)
            .map(token => transformWordToken(token, (coreWord, trailing) => getCatSound(coreWord, trailing, rng)))
            .join('');
    });
}

function randomAlienText(length, rng) {
    return Array.from({ length }, () => ALIEN_SYMBOLS[Math.floor(rng() * ALIEN_SYMBOLS.length)]).join('');
}

function toAlienLanguage(input, seedKey) {
    return transformHtmlText(input, segment => {
        const rng = createSeededRandom(`${seedKey}:${segment}`);
        return segment
            .split(/(\s+)/)
            .map(token => transformWordToken(token, coreWord => randomAlienText(Math.max(2, Math.min(coreWord.length, 12)), rng)))
            .join('');
    });
}

function generateCatLanguageData(baseData) {
    return mapVisibleContent(baseData, value => toCatLanguage(value, 'cat'));
}

function generateAlienLanguageData(baseData) {
    return mapVisibleContent(baseData, value => toAlienLanguage(value, 'alien'));
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((prev, curr) => prev?.[curr] ?? null, obj);
}

function getLocalizedText(path, fallback = '') {
    const value = getNestedValue(siteData, path);
    return typeof value === 'string' ? value : fallback;
}

function getSamePageHashTarget(link) {
    if (!(link instanceof HTMLAnchorElement)) return null;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) {
        return null;
    }

    const targetId = decodeURIComponent(url.hash.slice(1));
    if (!targetId) return null;
    return document.getElementById(targetId);
}

function announceStatus(message) {
    const liveRegion = document.getElementById('a11y-status');
    if (!liveRegion || !message) return;
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 30);
}

function getBackgroundPreloadLanguages() {
    return SUPPORTED_LANGS.filter(lang => (
        !SYNTHETIC_LANGUAGE_GENERATORS[lang]
        && !languageDataCache[lang]
        && !languageRequestCache[lang]
    ));
}

async function preloadLanguagesInBackground() {
    const languagesToPreload = getBackgroundPreloadLanguages();
    if (!languagesToPreload.length) return;

    const results = await Promise.allSettled(
        languagesToPreload.map(lang => fetchConcreteLanguage(lang))
    );

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.warn(`Background preload failed for ${getLanguageAssetPath(languagesToPreload[index])}`, result.reason);
        }
    });
}

function scheduleBackgroundLanguagePreload() {
    if (hasScheduledLanguagePreload) return;
    hasScheduledLanguagePreload = true;

    const startPreload = () => {
        void preloadLanguagesInBackground();
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(startPreload, { timeout: 2500 });
        return;
    }

    window.setTimeout(startPreload, 1200);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    hydrateInitialContent();
});

async function hydrateInitialContent() {
    // English is already fully rendered as static markup in the HTML (SEO:
    // crawlers and first paint get real English content with no JS/JSON
    // round-trip). Only fetch and render when the URL asked for a different
    // language (see detectLanguage/navigateToLanguage).
    if (currentLang === DEFAULT_LANG) {
        scheduleBackgroundLanguagePreload();
        return;
    }

    try {
        siteData = await loadLanguage(currentLang);
        initLanguage();
        renderDynamicContent();
        syncAccessibilityUI();
        announceStatus(getLanguageConfigValue(LANGUAGE_CHANGED_LABELS) || 'Language changed');
        scheduleBackgroundLanguagePreload();
    } catch (error) {
        console.error('Error loading i18n data:', error);
    }
}

function initApp() {
    initTheme();
    initLanguage();
    renderDynamicContent();
    setupEventListeners();
    syncAccessibilityUI();
    initTooltipPositioning();
    initCursorParticles();
    updateExperienceYearsStat();
    // Cards are static HTML now and never get torn down on a language
    // switch, so this only ever needs to run once, here — not per-render.
    initScrollAnimations();

    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

function getCompletedYearsSince({ year, month, day }) {
    const now = new Date();
    let years = now.getFullYear() - year;
    const hasReachedAnniversary = (
        now.getMonth() > month
        || (now.getMonth() === month && now.getDate() >= day)
    );

    if (!hasReachedAnniversary) years -= 1;
    return Math.max(0, years);
}

function updateExperienceYearsStat() {
    const experienceYearsStat = document.getElementById('experience-years-stat');
    if (!experienceYearsStat) return;

    const completedYears = getCompletedYearsSince(EXPERIENCE_START_DATE);
    experienceYearsStat.textContent = `+ ${completedYears}`;
}

function initTooltipPositioning() {
    function adjustTooltip(el) {
        el.classList.remove('tooltip-pos-right', 'tooltip-pos-left');
        const rect = el.getBoundingClientRect();
        const maxW = Math.min(360, window.innerWidth * 0.82);
        const cx = rect.left + rect.width / 2;
        if (cx + maxW / 2 > window.innerWidth - 8) {
            el.classList.add('tooltip-pos-right');
        } else if (cx - maxW / 2 < 8) {
            el.classList.add('tooltip-pos-left');
        }
    }
    document.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-tooltip]');
        if (el) adjustTooltip(el);
    });
    document.addEventListener('focusin', e => {
        const el = e.target.closest('[data-tooltip]');
        if (el) adjustTooltip(el);
    });
}

function initCursorParticles() {
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!supportsFinePointer.matches || prefersReducedMotion.matches) return;

    const particleCanvas = document.createElement('canvas');
    particleCanvas.className = 'cursor-particles';
    particleCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(particleCanvas);

    const context = particleCanvas.getContext('2d');
    if (!context) {
        particleCanvas.remove();
        return;
    }

    const particleLimit = 24;
    const maxDevicePixelRatio = 1.25;
    const particlePalettes = {
        dark: {
            warm: [254, 217, 164],
            hot: [255, 199, 92],
            soft: [255, 255, 255],
            glow: [255, 221, 120]
        },
        light: {
            warm: [217, 119, 6],
            hot: [180, 83, 9],
            soft: [15, 23, 42],
            glow: [245, 158, 11]
        }
    };
    let activeTheme = currentTheme;
    let particleColors = currentTheme === 'light' ? particlePalettes.light : particlePalettes.dark;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
    const particles = [];
    let animationFrameId = 0;
    let lastFrameTime = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastSpawnTime = 0;
    let hasPointer = false;

    const resizeCanvas = () => {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
        devicePixelRatio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
        particleCanvas.width = Math.round(viewportWidth * devicePixelRatio);
        particleCanvas.height = Math.round(viewportHeight * devicePixelRatio);
        particleCanvas.style.width = `${viewportWidth}px`;
        particleCanvas.style.height = `${viewportHeight}px`;
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const requestRender = () => {
        if (!animationFrameId && particles.length) {
            animationFrameId = window.requestAnimationFrame(renderParticles);
        }
    };

    const syncPalette = () => {
        if (activeTheme === currentTheme) return;
        activeTheme = currentTheme;
        particleColors = currentTheme === 'light' ? particlePalettes.light : particlePalettes.dark;
    };

    const clearParticles = () => {
        particles.length = 0;
        hasPointer = false;
        lastFrameTime = 0;
        context.clearRect(0, 0, viewportWidth, viewportHeight);
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    };

    const rgba = (channels, alpha) => `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;

    const spawnParticle = (x, y, dx, dy, energy = 1) => {
        if (particles.length >= particleLimit) particles.shift();

        const speed = Math.min(2.45, Math.hypot(dx, dy) * 0.05 + 0.4) * energy;
        const angle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.9;
        const life = 15 + Math.random() * 10;
        const toneRoll = Math.random();
        particles.push({
            x: x - dx * 0.04,
            y: y - dy * 0.04,
            prevX: x,
            prevY: y,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.3,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.3,
            life,
            ttl: life,
            size: 1.35 + Math.random() * 1.9,
            tone: toneRoll > 0.82 ? 'soft' : toneRoll > 0.26 ? 'warm' : 'hot'
        });
    };

    function renderParticles(timestamp) {
        syncPalette();
        if (!lastFrameTime) lastFrameTime = timestamp;
        const delta = Math.min(24, timestamp - lastFrameTime);
        lastFrameTime = timestamp;

        context.clearRect(0, 0, viewportWidth, viewportHeight);

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.prevX = particle.x;
            particle.prevY = particle.y;
            particle.x += particle.vx * delta * 0.06;
            particle.y += particle.vy * delta * 0.06;
            particle.vx *= 0.985;
            particle.vy *= 0.985;
            particle.life -= delta * 0.065;

            if (particle.life <= 0) {
                particles.splice(index, 1);
                continue;
            }

            const progress = particle.life / particle.ttl;
            const trailAlpha = (
                particle.tone === 'hot' ? 0.44
                    : particle.tone === 'warm' ? 0.34
                        : 0.24
            ) * progress;
            const fillAlpha = (
                particle.tone === 'hot' ? 0.8
                    : particle.tone === 'warm' ? 0.66
                        : 0.48
            ) * progress;
            const glowAlpha = (
                particle.tone === 'soft' ? 0.12 : 0.2
            ) * progress;
            const strokeChannels = particle.tone === 'soft'
                ? particleColors.soft
                : particle.tone === 'hot'
                    ? particleColors.hot
                    : particleColors.warm;
            const fillChannels = particle.tone === 'soft'
                ? particleColors.soft
                : particle.tone === 'hot'
                    ? particleColors.hot
                    : particleColors.warm;
            const strokeColor = rgba(strokeChannels, trailAlpha);
            const fillColor = rgba(fillChannels, fillAlpha);
            const glowColor = rgba(
                particle.tone === 'soft' ? fillChannels : particleColors.glow,
                glowAlpha
            );

            context.beginPath();
            context.arc(
                particle.x,
                particle.y,
                Math.max(1, particle.size * (0.85 + progress * 0.55)),
                0,
                Math.PI * 2
            );
            context.fillStyle = glowColor;
            context.fill();

            context.beginPath();
            context.moveTo(particle.prevX, particle.prevY);
            context.lineTo(particle.x, particle.y);
            context.strokeStyle = strokeColor;
            context.lineWidth = Math.max(1, particle.size * (0.35 + progress * 0.55));
            context.lineCap = 'round';
            context.stroke();

            context.beginPath();
            context.arc(
                particle.x,
                particle.y,
                Math.max(0.7, particle.size * (0.38 + progress * 0.72)),
                0,
                Math.PI * 2
            );
            context.fillStyle = fillColor;
            context.fill();
        }

        if (!particles.length) {
            animationFrameId = 0;
            lastFrameTime = 0;
            context.clearRect(0, 0, viewportWidth, viewportHeight);
            return;
        }

        animationFrameId = window.requestAnimationFrame(renderParticles);
    }

    resizeCanvas();

    document.addEventListener('pointermove', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;

        const pointerX = event.clientX;
        const pointerY = event.clientY;
        const now = performance.now();

        if (!hasPointer) {
            hasPointer = true;
            lastPointerX = pointerX;
            lastPointerY = pointerY;
            lastSpawnTime = now;
            return;
        }

        const dx = pointerX - lastPointerX;
        const dy = pointerY - lastPointerY;
        const distance = Math.hypot(dx, dy);
        if (distance < 7 || now - lastSpawnTime < 16) {
            lastPointerX = pointerX;
            lastPointerY = pointerY;
            return;
        }

        const spawnCount = Math.min(3, 1 + Math.floor(distance / 24));
        for (let index = 0; index < spawnCount; index += 1) {
            const offset = (index + 1) / (spawnCount + 1);
            spawnParticle(
                lastPointerX + dx * offset,
                lastPointerY + dy * offset,
                dx,
                dy
            );
        }

        lastPointerX = pointerX;
        lastPointerY = pointerY;
        lastSpawnTime = now;
        requestRender();
    }, { passive: true });

    document.addEventListener('pointerdown', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        if (!hasPointer) return;

        for (let index = 0; index < 5; index += 1) {
            spawnParticle(lastPointerX, lastPointerY, Math.random() - 0.5, Math.random() - 0.5, 1.25);
        }
        requestRender();
    }, { passive: true });

    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('mouseout', event => {
        if (event.relatedTarget) return;
        clearParticles();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearParticles();
    });
    window.addEventListener('blur', clearParticles);
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeIcon = document.querySelector('#theme-toggle .toggle-glyph');
    if (themeIcon) themeIcon.textContent = currentTheme === 'dark' ? UI_GLYPHS.themeDark : UI_GLYPHS.themeLight;
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
}

function getLanguageElements() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOptions = langDropdown ? Array.from(langDropdown.querySelectorAll('[data-lang]')) : [];
    return { langToggle, langDropdown, langOptions };
}

function getTokenSaverElements() {
    const tokenSaverToggles = Array.from(document.querySelectorAll('[data-token-saver-toggle]'));
    return { tokenSaverToggles };
}

function triggerTokenSaverAttention() {
    const { tokenSaverToggles } = getTokenSaverElements();
    if (!tokenSaverToggles.length) return;

    tokenSaverToggles.forEach(toggle => {
        toggle.classList.remove('is-attention');
    });
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            tokenSaverToggles.forEach(toggle => {
                toggle.classList.add('is-attention');
            });
        });
    });

    if (tokenSaverAttentionTimeoutId) window.clearTimeout(tokenSaverAttentionTimeoutId);
    tokenSaverAttentionTimeoutId = window.setTimeout(() => {
        tokenSaverToggles.forEach(toggle => {
            toggle.classList.remove('is-attention');
        });
    }, 1800);
}

function getLanguageControlLabel() {
    return getLanguageConfigValue(LANGUAGE_CONTROL_LABELS);
}

function setLanguageMenuState(isOpen) {
    const { langToggle, langDropdown } = getLanguageElements();
    if (!langToggle || !langDropdown) return;
    langDropdown.classList.toggle('is-open', isOpen);
    langToggle.setAttribute('aria-expanded', String(isOpen));
}

function focusLanguageOption(targetLang = currentLang) {
    const { langOptions } = getLanguageElements();
    const targetOption = (
        langOptions.find(option => option.dataset.lang === targetLang)
        || langOptions.find(option => option.dataset.lang === getBaseLanguage(targetLang))
        || langOptions[0]
    );
    targetOption?.focus();
}

function updateTokenSaverUI() {
    const { tokenSaverToggles } = getTokenSaverElements();
    if (!tokenSaverToggles.length) return;

    const baseLang = getBaseLanguage(currentLang);
    const tokenSaverConfig = TOKEN_SAVER_VARIANTS[baseLang];

    if (!tokenSaverConfig) {
        tokenSaverToggles.forEach(toggle => {
            toggle.hidden = true;
            toggle.classList.remove('is-visible', 'is-active', 'is-attention');
            toggle.removeAttribute('aria-label');
            toggle.removeAttribute('aria-pressed');
            toggle.removeAttribute('data-tooltip');
            toggle.removeAttribute('data-state');
            toggle.innerHTML = '';
        });
        return;
    }

    const isActive = currentLang === tokenSaverConfig.variant;
    const actionLabel = isActive ? tokenSaverConfig.deactivateLabel : tokenSaverConfig.activateLabel;
    let shouldTriggerAttention = false;

    tokenSaverToggles.forEach(toggle => {
        const wasHidden = toggle.hidden || !toggle.classList.contains('is-visible');
        const previousPressed = toggle.getAttribute('aria-pressed');

        toggle.hidden = false;
        toggle.innerHTML = `
        <span class="lang-variant-icon" aria-hidden="true">${tokenSaverConfig.icon}</span>
        <span class="lang-variant-copy">${tokenSaverConfig.text}</span>
        <span class="lang-variant-rail" aria-hidden="true"></span>
    `;
        toggle.classList.add('is-visible');
        toggle.classList.toggle('is-active', isActive);
        toggle.setAttribute('aria-label', actionLabel);
        toggle.setAttribute('aria-pressed', String(isActive));
        toggle.setAttribute('data-tooltip', actionLabel);
        toggle.setAttribute('data-state', isActive ? 'active' : 'idle');

        if (wasHidden || previousPressed !== String(isActive)) {
            shouldTriggerAttention = true;
        }
    });

    if (shouldTriggerAttention) triggerTokenSaverAttention();
}

function updateLanguageUI() {
    const { langToggle, langDropdown, langOptions } = getLanguageElements();
    if (!langToggle || !langDropdown || !langOptions.length) return;

    const selectedOption = (
        langOptions.find(option => option.dataset.lang === currentLang)
        || langOptions.find(option => option.dataset.lang === getBaseLanguage(currentLang))
        || langOptions[0]
    );

    langOptions.forEach((option, index) => {
        if (!option.id) option.id = `lang-option-${option.dataset.lang || index}`;
        option.tabIndex = -1;
        option.setAttribute('aria-selected', String(option === selectedOption));
    });

    const controlLabel = getLanguageControlLabel();
    const buttonLabel = selectedOption.dataset.buttonLabel
        || selectedOption.querySelector('.lang-option-main')?.textContent.trim()
        || selectedOption.textContent.trim();
    langToggle.textContent = buttonLabel;
    langToggle.setAttribute('aria-label', controlLabel);
    langToggle.setAttribute('data-tooltip', controlLabel);
    langToggle.setAttribute('aria-expanded', String(langDropdown.classList.contains('is-open')));
    langDropdown.setAttribute('aria-label', controlLabel);
    langDropdown.setAttribute('aria-activedescendant', selectedOption.id);
    updateTokenSaverUI();
}

// Picking a language is a real navigation, not an in-place fetch+swap: the
// URL is the only state that matters, so a switch just sets/clears ?lang=
// and reloads. hydrateInitialContent() (which runs on every load) does the
// actual fetch+render for whatever the URL asks for.
function navigateToLanguage(lang) {
    const targetLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    const url = new URL(window.location.href);
    if (targetLang === DEFAULT_LANG) {
        url.searchParams.delete('lang');
    } else {
        url.searchParams.set('lang', targetLang);
    }
    window.location.href = url.toString();
}

function initLanguage() {
    document.documentElement.lang = getDocumentLanguageCode(currentLang);
    updatePageText();
    updateLanguageUI();
}

function updatePageText() {
    if (!siteData) return;
    
    const completedYears = getCompletedYearsSince(EXPERIENCE_START_DATE);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.getAttribute('data-i18n');
        let value = getNestedValue(siteData, path);
        if (typeof value === 'string') {
            value = value.replace(/\{\{years\}\}/g, completedYears);
            el.innerHTML = value;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const path = el.getAttribute('data-i18n-placeholder');
        let value = getNestedValue(siteData, path);
        if (typeof value === 'string') {
            value = value.replace(/\{\{years\}\}/g, completedYears);
            el.placeholder = value;
        }
    });

    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const path = el.getAttribute('data-i18n-tooltip');
        let value = getNestedValue(siteData, path);
        if (typeof value === 'string') {
            value = value.replace(/\{\{years\}\}/g, completedYears);
            el.setAttribute('data-tooltip', value);
        }
    });
}

function renderDynamicContent() {
    if (!siteData) return;
    // Tech-stack chips are static HTML (never translated: tech names stay the
    // same in every language) and the category headers already carry
    // data-i18n attributes, so updatePageText() alone keeps them in sync —
    // no render step needed for that section anymore.
    renderProjects();
    renderExperience();
}

// Project/experience cards are static HTML now (baked into index.html /
// projects.html). Their DOM shape never differs between languages — only
// the text does (structure/count parity across locales is enforced by
// tests/test_structure.py) — so a language switch just swaps text on the
// existing nodes instead of tearing down and rebuilding the cards.
function renderProjects() {
    if (!siteData) return;

    const viewProjectLabel = getLocalizedText('home.common.view_project', 'View Project');
    const repoLabel = getLocalizedText('home.common.repository', 'Repository');
    const liveProjectA11y = getLocalizedText('home.accessibility.view_live_project', 'Open live project in a new tab');
    const repoA11y = getLocalizedText('home.accessibility.view_repository', 'Open repository in a new tab');
    const technologiesLabel = getLocalizedText('home.accessibility.technologies_used', 'Technologies used');

    siteData.projects.forEach(project => {
        const titleEl = document.getElementById(`project-title-${project.id}`);
        if (!titleEl) return; // not shown on this page (e.g. non-featured on the homepage)
        const card = titleEl.closest('.project-card');

        titleEl.innerHTML = project.title;

        const descEl = document.getElementById(`project-desc-${project.id}`);
        if (descEl) descEl.innerHTML = project.description;

        const figcaption = card.querySelector('figcaption');
        if (figcaption) figcaption.textContent = project.description || project.title;

        const tagsEl = card.querySelector('.project-tags');
        if (tagsEl) {
            tagsEl.setAttribute('aria-label', `${technologiesLabel}: ${project.tags.join(', ')}`);
            tagsEl.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }

        const [liveLink, repoLink] = card.querySelectorAll('.project-btn');
        if (liveLink) {
            liveLink.setAttribute('aria-label', `${liveProjectA11y}: ${project.title}`);
            liveLink.setAttribute('data-tooltip', `${liveProjectA11y}: ${project.title}`);
            const label = liveLink.querySelector('.project-btn-label');
            if (label) label.textContent = viewProjectLabel;
        }
        if (repoLink) {
            repoLink.setAttribute('aria-label', `${repoA11y}: ${project.title}`);
            repoLink.setAttribute('data-tooltip', `${repoA11y}: ${project.title}`);
            const label = repoLink.querySelector('.project-btn-label');
            if (label) label.textContent = repoLabel;
        }
    });
}

function renderExperience() {
    if (!siteData) return;
    const websiteA11y = getLocalizedText('home.accessibility.view_company_site', 'Open website in a new tab');

    siteData.experience.forEach((exp, index) => {
        const titleEl = document.getElementById(`timeline-title-${index}`);
        if (!titleEl) return;
        const item = titleEl.closest('.timeline-item');

        const dateEl = item?.querySelector('.timeline-date');
        if (dateEl) dateEl.textContent = exp.date;

        titleEl.innerHTML = exp.title;

        const descEl = document.getElementById(`timeline-desc-${index}`);
        if (descEl) descEl.innerHTML = exp.desc;

        const linkEls = item?.querySelectorAll('.timeline-link') || [];
        (exp.links || []).forEach((link, linkIndex) => {
            const linkEl = linkEls[linkIndex];
            if (!linkEl) return;
            const label = typeof link.label === 'string' ? link.label : link.url;
            linkEl.setAttribute('aria-label', `${websiteA11y}: ${label}`);
            linkEl.setAttribute('data-tooltip', `${websiteA11y}: ${label}`);
            const labelEl = linkEl.querySelector('span:not(.inline-icon)');
            if (labelEl) labelEl.textContent = label;
        });
    });
}

function syncAccessibilityUI() {
    if (!siteData) return;

    const navLabel = getLocalizedText('home.accessibility.navigation', 'Primary navigation');
    const homeLabel = getLocalizedText('home.nav.home', 'Home');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const menuOpen = navLinks?.classList.contains('active');
    const menuLabel = getLocalizedText(
        menuOpen ? 'home.accessibility.close_menu' : 'home.accessibility.open_menu',
        menuOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
    const themeLabel = getLocalizedText(
        currentTheme === 'dark' ? 'home.accessibility.theme_to_light' : 'home.accessibility.theme_to_dark',
        currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
    const scrollProjectsLabel = getLocalizedText('home.accessibility.scroll_to_projects', 'Scroll to projects section');
    const downloadCvLabel = getLocalizedText('home.accessibility.download_cv', 'Download CV in PDF format');
    const allProjectsLabel = getLocalizedText('home.accessibility.all_projects', 'Browse all apps');
    const contactShortcutLabel = getLocalizedText('home.accessibility.contact_shortcut', 'Jump to contact section');
    const openNewTabLabel = getLocalizedText('home.accessibility.opens_new_tab', 'Opens in a new tab');
    const socialLabels = {
        github: getLocalizedText('home.accessibility.open_github', 'Open GitHub profile in a new tab'),
        linkedin: getLocalizedText('home.accessibility.open_linkedin', 'Open LinkedIn profile in a new tab'),
        x: getLocalizedText('home.accessibility.open_x', 'Open X profile in a new tab'),
        instagram: getLocalizedText('home.accessibility.open_instagram', 'Open Instagram profile in a new tab')
    };

    const siteNavigation = document.getElementById('site-navigation');
    if (siteNavigation) siteNavigation.setAttribute('aria-label', navLabel);

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.setAttribute('aria-label', homeLabel);
        logo.removeAttribute('data-tooltip');
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', themeLabel);
        themeToggle.setAttribute('data-tooltip', themeLabel);
    }

    if (menuToggle) {
        menuToggle.setAttribute('aria-label', menuLabel);
        menuToggle.setAttribute('data-tooltip', menuLabel);
        menuToggle.setAttribute('aria-expanded', String(Boolean(menuOpen)));
    }

    const scrollIndicator = document.getElementById('scroll-projects-link');
    if (scrollIndicator) {
        scrollIndicator.setAttribute('aria-label', scrollProjectsLabel);
        scrollIndicator.setAttribute('data-tooltip', scrollProjectsLabel);
    }

    const downloadCvLink = document.getElementById('download-cv-link');
    if (downloadCvLink) {
        downloadCvLink.setAttribute('aria-label', downloadCvLabel);
        downloadCvLink.setAttribute('data-tooltip', downloadCvLabel);
    }

    const allProjectsLink = document.getElementById('view-all-projects-link');
    if (allProjectsLink) {
        allProjectsLink.setAttribute('aria-label', allProjectsLabel);
        allProjectsLink.setAttribute('data-tooltip', allProjectsLabel);
    }

    const heroContactLink = document.getElementById('hero-contact-link');
    if (heroContactLink) {
        heroContactLink.setAttribute('aria-label', contactShortcutLabel);
        heroContactLink.setAttribute('data-tooltip', contactShortcutLabel);
    }

    document.querySelectorAll('[data-social]').forEach(link => {
        const socialType = link.getAttribute('data-social');
        const label = socialLabels[socialType];
        if (label) {
            link.setAttribute('aria-label', label);
            link.setAttribute('data-tooltip', label);
        }
        link.setAttribute('rel', 'noopener noreferrer');
    });

    document.querySelectorAll('.nav-links a').forEach(link => link.removeAttribute('data-tooltip'));

    document.querySelectorAll('.outline-btn:not(#download-cv-link):not(#hero-contact-link):not(#view-all-projects-link)').forEach(link => {
        const text = link.textContent.replace(/\s+/g, ' ').trim();
        if (text) link.setAttribute('data-tooltip', text);
    });

    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
        const currentLabel = link.getAttribute('aria-label');
        if (!currentLabel && link.textContent.trim()) {
            link.setAttribute('aria-label', `${link.textContent.trim()}. ${openNewTabLabel}`);
        }
    });

    document.querySelectorAll('.active-link').forEach(link => link.setAttribute('aria-current', 'page'));
    updateLanguageUI();
}

function setupEventListeners() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const langWrapper = document.querySelector('.lang-select-wrapper');
    const { langToggle, langDropdown, langOptions } = getLanguageElements();
    const { tokenSaverToggles } = getTokenSaverElements();

    // Tech-stack expand/collapse: the categories are static HTML and persist
    // across language switches, so this listener is attached once, here,
    // instead of being re-attached on every render.
    const techStackContainer = document.getElementById('tech-stack-container');
    const techExpandBtn = document.getElementById('tech-expand-btn');
    techExpandBtn?.addEventListener('click', () => {
        const hiddenCats = techStackContainer.querySelectorAll('.tech-category.is-hidden');
        const isExpanded = hiddenCats.length === 0;
        const textEl = document.getElementById('tech-expand-text');

        if (isExpanded) {
            const allCats = techStackContainer.querySelectorAll('[data-tech-category]');
            allCats.forEach((cat, idx) => {
                if (idx > 0) cat.classList.add('is-hidden');
            });
            textEl.setAttribute('data-i18n', 'home.skills_section.view_more');
            textEl.textContent = getLocalizedText('home.skills_section.view_more', 'View More');
            techExpandBtn.setAttribute('data-i18n-tooltip', 'home.skills_section.view_more_tooltip');
            techExpandBtn.setAttribute('data-tooltip', getLocalizedText('home.skills_section.view_more_tooltip', 'Click to expand'));
            techExpandBtn.classList.add('pulse-animation');
        } else {
            hiddenCats.forEach(cat => cat.classList.remove('is-hidden'));
            textEl.setAttribute('data-i18n', 'home.skills_section.view_less');
            textEl.textContent = getLocalizedText('home.skills_section.view_less', 'View Less');
            techExpandBtn.setAttribute('data-i18n-tooltip', 'home.skills_section.view_less_tooltip');
            techExpandBtn.setAttribute('data-tooltip', getLocalizedText('home.skills_section.view_less_tooltip', 'Click to collapse'));
            techExpandBtn.classList.remove('pulse-animation');
        }
    });

    const setMenuState = (isOpen, shouldAnnounce = false) => {
        if (!navLinks || !menuToggle) return;
        navLinks.classList.toggle('active', isOpen);
        const icon = menuToggle.querySelector('.toggle-glyph');
        if (icon) icon.textContent = isOpen ? UI_GLYPHS.menuOpen : UI_GLYPHS.menuClosed;
        syncAccessibilityUI();
        if (shouldAnnounce) {
            announceStatus(getLocalizedText(
                isOpen ? 'home.accessibility.menu_expanded' : 'home.accessibility.menu_collapsed',
                isOpen ? 'Navigation menu expanded' : 'Navigation menu collapsed'
            ));
        }
    };

    const moveLanguageFocus = direction => {
        const focusedOption = document.activeElement?.closest?.('[data-lang]');
        const currentIndex = langOptions.indexOf(focusedOption);
        const fallbackIndex = langOptions.findIndex(option => option.dataset.lang === currentLang);
        const startIndex = currentIndex >= 0 ? currentIndex : fallbackIndex >= 0 ? fallbackIndex : 0;
        const nextIndex = (startIndex + direction + langOptions.length) % langOptions.length;
        langOptions[nextIndex]?.focus();
    };

    // Theme Toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        initTheme();
        syncAccessibilityUI();
        announceStatus(getLocalizedText(
            currentTheme === 'dark' ? 'home.accessibility.theme_enabled_dark' : 'home.accessibility.theme_enabled_light',
            currentTheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'
        ));
    });

    // Language Select
    langToggle?.addEventListener('click', () => {
        const shouldOpen = !langDropdown?.classList.contains('is-open');
        setLanguageMenuState(shouldOpen);
        if (shouldOpen) focusLanguageOption();
    });

    langToggle?.addEventListener('keydown', event => {
        if (!['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        setLanguageMenuState(true);
        if (event.key === 'ArrowUp') {
            langOptions[langOptions.length - 1]?.focus();
            return;
        }
        focusLanguageOption();
    });

    langDropdown?.addEventListener('click', event => {
        const option = event.target.closest('[data-lang]');
        if (option?.dataset.lang) navigateToLanguage(option.dataset.lang);
    });

    tokenSaverToggles.forEach(tokenSaverToggle => {
        tokenSaverToggle.addEventListener('click', () => {
            const baseLang = getBaseLanguage(currentLang);
            const tokenSaverConfig = TOKEN_SAVER_VARIANTS[baseLang];
            if (!tokenSaverConfig) return;

            const nextLang = currentLang === tokenSaverConfig.variant ? baseLang : tokenSaverConfig.variant;
            navigateToLanguage(nextLang);
        });
    });

    langDropdown?.addEventListener('keydown', event => {
        const option = event.target.closest('[data-lang]');
        if (!option) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveLanguageFocus(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveLanguageFocus(-1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            langOptions[0]?.focus();
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            langOptions[langOptions.length - 1]?.focus();
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (option.dataset.lang) navigateToLanguage(option.dataset.lang);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setLanguageMenuState(false);
            langToggle?.focus();
        }
    });

    document.addEventListener('click', event => {
        const clickTarget = event.target instanceof Element ? event.target : null;
        const hashLink = clickTarget?.closest('a[href*="#"]');
        const hashTarget = hashLink ? getSamePageHashTarget(hashLink) : null;
        if (hashTarget) {
            window.setTimeout(() => {
                hashTarget.focus({ preventScroll: true });
            }, 0);
        }

        if (langWrapper && clickTarget && !langWrapper.contains(clickTarget)) {
            setLanguageMenuState(false);
        }
    });

    // Mobile Menu
    menuToggle?.addEventListener('click', () => {
        setMenuState(!navLinks?.classList.contains('active'), true);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) setMenuState(false);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && langDropdown?.classList.contains('is-open')) {
            setLanguageMenuState(false);
            langToggle?.focus();
            return;
        }

        if (event.key === 'Escape' && navLinks?.classList.contains('active')) {
            setMenuState(false, true);
            menuToggle?.focus();
        }
    });

    // Contact Form Handler
    document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
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
                statusEl.textContent = getLocalizedText('home.contact_section.success_msg', 'Message sent! I\'ll get back to you soon.');
                statusEl.style.display = 'block';
                statusEl.style.color = 'var(--accent, #6ee7b7)';
                form.reset();
            } else {
                let serverError = '';
                try {
                    const data = await res.json();
                    serverError = data.error;
                } catch(e) {}
                statusEl.textContent = serverError || getLocalizedText('home.contact_section.error_msg', 'Something went wrong. Please try again or use the social links.');
                statusEl.style.display = 'block';
                statusEl.style.color = '#f87171';
            }
        } catch {
            statusEl.textContent = getLocalizedText('home.contact_section.error_msg', 'Something went wrong. Please try again or use the social links.');
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
}

function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        document.querySelectorAll('.project-card, .timeline-item, .glass-panel').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.transition = 'none';
        });
        return;
    }

    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card, .timeline-item, .glass-panel').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}
