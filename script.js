/**
 * PORTFOLIO ARCHITECTURE
 * Lazy-loads per-language JSON from assets/i18n/{lang}.json.
 * Auto-detects browser language (navigator.language) with fallback to 'en'.
 */

const SUPPORTED_LANGS = ['en', 'en.cav', 'es', 'es.cav', 'de', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'zh', 'cat', 'alien'];
const FALLBACK_LANG = 'en';
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
    menuOpen: '\u2715',
    external: '\u2197',
    github: 'GH',
    arrowRight: '\u2192',
    download: '\u2193',
    tools: '\ud83d\udee0'
};

let siteData = null;
let currentLang = detectLanguage();
let currentTheme = localStorage.getItem('theme') || 'dark';
let tokenSaverAttentionTimeoutId = null;
const syntheticLanguageCache = {};

function getBaseLanguage(lang = currentLang) {
    return lang.split('.')[0];
}

function getDocumentLanguageCode(lang = currentLang) {
    const baseLang = getBaseLanguage(lang);
    return baseLang === 'cat' || baseLang === 'alien' ? 'en' : baseLang;
}

function getLanguageConfigValue(map, lang = currentLang) {
    return map[lang] || map[getBaseLanguage(lang)] || map[FALLBACK_LANG];
}

function detectLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'en').split('-')[0].toLowerCase();
    return SUPPORTED_LANGS.includes(nav) ? nav : FALLBACK_LANG;
}

async function loadLanguage(lang) {
    if (SYNTHETIC_LANGUAGE_GENERATORS[lang]) {
        return loadSyntheticLanguage(lang);
    }

    try {
        const res = await fetch(`assets/i18n/${lang}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch {
        const baseLang = getBaseLanguage(lang);
        if (lang !== baseLang) {
            console.warn(`Failed to load i18n/${lang}.json, falling back to ${baseLang}`);
            return loadLanguage(baseLang);
        }
        if (lang !== FALLBACK_LANG) {
            console.warn(`Failed to load i18n/${lang}.json, falling back to ${FALLBACK_LANG}`);
            return loadLanguage(FALLBACK_LANG);
        }
        throw new Error('Failed to load i18n data');
    }
}

async function loadSyntheticLanguage(lang) {
    if (syntheticLanguageCache[lang]) return syntheticLanguageCache[lang];

    const baseData = await loadLanguage(FALLBACK_LANG);
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

function getInlineIconMarkup(name, className = 'inline-icon') {
    const glyph = UI_GLYPHS[name];
    return glyph ? `<span class="${className}" aria-hidden="true">${glyph}</span>` : '';
}

function announceStatus(message) {
    const liveRegion = document.getElementById('a11y-status');
    if (!liveRegion || !message) return;
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 30);
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        siteData = await loadLanguage(currentLang);
        initApp();
    } catch (error) {
        console.error('Error loading i18n data:', error);
    }
});

function initApp() {
    initTheme();
    initLanguage();
    renderDynamicContent();
    setupEventListeners();
    syncAccessibilityUI();
    initTooltipPositioning();

    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
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
    const tokenSaverToggle = document.getElementById('lang-variant-toggle');
    return { tokenSaverToggle };
}

function triggerTokenSaverAttention(tokenSaverToggle) {
    if (!tokenSaverToggle) return;

    tokenSaverToggle.classList.remove('is-attention');
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            tokenSaverToggle.classList.add('is-attention');
        });
    });

    if (tokenSaverAttentionTimeoutId) window.clearTimeout(tokenSaverAttentionTimeoutId);
    tokenSaverAttentionTimeoutId = window.setTimeout(() => {
        tokenSaverToggle.classList.remove('is-attention');
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
    const { tokenSaverToggle } = getTokenSaverElements();
    if (!tokenSaverToggle) return;

    const baseLang = getBaseLanguage(currentLang);
    const tokenSaverConfig = TOKEN_SAVER_VARIANTS[baseLang];

    if (!tokenSaverConfig) {
        tokenSaverToggle.hidden = true;
        tokenSaverToggle.classList.remove('is-visible', 'is-active', 'is-attention');
        tokenSaverToggle.removeAttribute('aria-label');
        tokenSaverToggle.removeAttribute('aria-pressed');
        tokenSaverToggle.removeAttribute('data-tooltip');
        tokenSaverToggle.removeAttribute('data-state');
        tokenSaverToggle.innerHTML = '';
        return;
    }

    const isActive = currentLang === tokenSaverConfig.variant;
    const actionLabel = isActive ? tokenSaverConfig.deactivateLabel : tokenSaverConfig.activateLabel;
    const wasHidden = tokenSaverToggle.hidden || !tokenSaverToggle.classList.contains('is-visible');
    const previousPressed = tokenSaverToggle.getAttribute('aria-pressed');

    tokenSaverToggle.hidden = false;
    tokenSaverToggle.innerHTML = `
        <span class="lang-variant-icon" aria-hidden="true">${tokenSaverConfig.icon}</span>
        <span class="lang-variant-copy">${tokenSaverConfig.text}</span>
    `;
    tokenSaverToggle.classList.add('is-visible');
    tokenSaverToggle.classList.toggle('is-active', isActive);
    tokenSaverToggle.setAttribute('aria-label', actionLabel);
    tokenSaverToggle.setAttribute('aria-pressed', String(isActive));
    tokenSaverToggle.removeAttribute('data-tooltip');
    tokenSaverToggle.setAttribute('data-state', isActive ? 'active' : 'idle');

    if (wasHidden) {
        triggerTokenSaverAttention(tokenSaverToggle);
    } else if (previousPressed !== String(isActive)) {
        triggerTokenSaverAttention(tokenSaverToggle);
    }
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

async function changeLanguage(nextLang) {
    const targetLang = SUPPORTED_LANGS.includes(nextLang) ? nextLang : FALLBACK_LANG;

    try {
        siteData = await loadLanguage(targetLang);
        currentLang = targetLang;
    } catch {
        currentLang = FALLBACK_LANG;
        siteData = await loadLanguage(FALLBACK_LANG);
    }

    localStorage.setItem('lang', currentLang);
    initLanguage();
    renderDynamicContent();
    syncAccessibilityUI();
    announceStatus(getLanguageConfigValue(LANGUAGE_CHANGED_LABELS) || 'Language changed');
}

function initLanguage() {
    document.documentElement.lang = getDocumentLanguageCode(currentLang);
    updatePageText();
    updateLanguageUI();
}

function updatePageText() {
    if (!siteData) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.getAttribute('data-i18n');
        const value = getNestedValue(siteData, path);
        if (typeof value === 'string') el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const path = el.getAttribute('data-i18n-placeholder');
        const value = getNestedValue(siteData, path);
        if (typeof value === 'string') el.placeholder = value;
    });
}

function renderDynamicContent() {
    if (!siteData) return;
    renderProjects();
    renderExperience();
}

function renderProjects() {
    const recentProjectsContainer = document.getElementById('recent-projects-container');
    const allProjectsContainer = document.getElementById('all-projects-container');

    if (!recentProjectsContainer && !allProjectsContainer) return;

    const containers = [
        { el: recentProjectsContainer, filter: p => p.featured },
        { el: allProjectsContainer, filter: () => true }
    ];

    const viewProjectLabel = getLocalizedText('home.common.view_project', 'View Project');
    const repoLabel = getLocalizedText('home.common.repository', 'Repository');
    const liveProjectA11y = getLocalizedText('home.accessibility.view_live_project', 'Open live project in a new tab');
    const repoA11y = getLocalizedText('home.accessibility.view_repository', 'Open repository in a new tab');
    const technologiesLabel = getLocalizedText('home.accessibility.technologies_used', 'Technologies used');
    const comingSoonTitle = getLocalizedText('home.common.coming_soon_title', 'Coming Soon');
    const comingSoonText = getLocalizedText('home.common.coming_soon', 'Coming soon!');

    containers.forEach(item => {
        if (!item.el) return;
        item.el.innerHTML = '';
        const filteredProjects = siteData.projects.filter(item.filter);

        if (filteredProjects.length === 0) {
            const comingSoon = document.createElement('div');
            comingSoon.className = 'coming-soon-box glass-panel';
            comingSoon.style.cssText = 'padding:4rem;width:100%;grid-column:1/-1;text-align:center';
            comingSoon.innerHTML = `
                ${getInlineIconMarkup('tools', 'coming-soon-icon')}
                <h3 style="font-size:1.8rem;margin-bottom:1rem;">${comingSoonTitle}</h3>
                <p style="opacity:0.8;font-size:1.1rem;">${comingSoonText}</p>
            `;
            item.el.appendChild(comingSoon);
            return;
        }

        filteredProjects.forEach(project => {
            const card = document.createElement('article');
            card.className = 'project-card';
            const titleId = `project-title-${project.id}`;
            const descId = `project-desc-${project.id}`;
            const tagsHtml = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            const projectTitle = project.title;
            const projectDescription = project.description;
            const techList = project.tags.join(', ');

            card.innerHTML = `
                <div class="project-img-container">
                    <img src="${project.image}" alt="${projectTitle} preview" class="project-img" loading="lazy" decoding="async">
                </div>
                <div class="project-content">
                    <h3 class="project-title" id="${titleId}">${projectTitle}</h3>
                    <div class="project-tags" aria-label="${technologiesLabel}: ${techList}">${tagsHtml}</div>
                    <p class="project-desc" id="${descId}">${projectDescription}</p>
                    <div class="project-links">
                        <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-btn" aria-label="${liveProjectA11y}: ${projectTitle}" data-tooltip="${liveProjectA11y}: ${projectTitle}">
                            ${getInlineIconMarkup('external')} ${viewProjectLabel}
                        </a>
                        <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-btn" aria-label="${repoA11y}: ${projectTitle}" data-tooltip="${repoA11y}: ${projectTitle}">
                            ${getInlineIconMarkup('github', 'inline-icon text-icon')} ${repoLabel}
                        </a>
                    </div>
                </div>
            `;
            card.setAttribute('aria-labelledby', titleId);
            card.setAttribute('aria-describedby', descId);
            item.el.appendChild(card);
        });
    });
    initScrollAnimations();
}

function renderExperience() {
    const container = document.getElementById('experience-timeline');
    if (!container) return;

    container.innerHTML = '';
    const websiteA11y = getLocalizedText('home.accessibility.view_company_site', 'Open website in a new tab');

    siteData.experience.forEach((exp, index) => {
        const logoClasses = [
            'timeline-logo-frame',
            exp.logoWide ? 'is-wide' : '',
            exp.logoDark ? 'is-dark' : '',
            exp.logoLight ? 'is-light' : ''
        ].filter(Boolean).join(' ');
        const titleId = `timeline-title-${index}`;
        const descId = `timeline-desc-${index}`;

        const logoHtml = exp.logo ? `
            <div class="${logoClasses}">
                <img src="${exp.logo}" alt="" aria-hidden="true" class="timeline-logo" loading="lazy" decoding="async">
            </div>
        ` : '';

        const linksHtml = (exp.links || []).map(link => {
            const label = typeof link.label === 'string' ? link.label : link.url;
            return `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="timeline-link" aria-label="${websiteA11y}: ${label}" data-tooltip="${websiteA11y}: ${label}">
                    ${getInlineIconMarkup('external')}
                    <span>${label}</span>
                </a>
            `;
        }).join('');

        const item = document.createElement('article');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-date">${exp.date}</div>
            <div class="timeline-content glass-panel">
                <div class="timeline-header">
                    ${logoHtml}
                    <div class="timeline-copy">
                        <h3 id="${titleId}">${exp.title}</h3>
                        <p id="${descId}">${exp.desc}</p>
                    </div>
                </div>
                ${linksHtml ? `<div class="timeline-links">${linksHtml}</div>` : ''}
            </div>
        `;
        item.setAttribute('aria-labelledby', titleId);
        item.setAttribute('aria-describedby', descId);
        container.appendChild(item);
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
    const { tokenSaverToggle } = getTokenSaverElements();

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

    const handleLanguageSelection = async lang => {
        if (!lang) return;
        await changeLanguage(lang);
        setLanguageMenuState(false);
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

    langDropdown?.addEventListener('click', async event => {
        const option = event.target.closest('[data-lang]');
        if (!option) return;
        await handleLanguageSelection(option.dataset.lang);
        langToggle?.focus();
    });

    tokenSaverToggle?.addEventListener('click', async () => {
        const baseLang = getBaseLanguage(currentLang);
        const tokenSaverConfig = TOKEN_SAVER_VARIANTS[baseLang];
        if (!tokenSaverConfig) return;

        const nextLang = currentLang === tokenSaverConfig.variant ? baseLang : tokenSaverConfig.variant;
        await handleLanguageSelection(nextLang);
        tokenSaverToggle.focus();
    });

    langDropdown?.addEventListener('keydown', async event => {
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
            await handleLanguageSelection(option.dataset.lang);
            langToggle?.focus();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setLanguageMenuState(false);
            langToggle?.focus();
        }
    });

    document.addEventListener('click', event => {
        if (langWrapper && !langWrapper.contains(event.target)) {
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

    // Simple Form Handler
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert(getLocalizedText('home.contact_section.success_msg', 'Message sent!'));
        e.target.reset();
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
