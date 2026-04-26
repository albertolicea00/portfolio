/**
 * PORTFOLIO ARCHITECTURE
 * Logic to fetch content.json and manage Theme/Language state.
 */

let siteData = null;
let currentLang = localStorage.getItem('lang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

// Helper function to get nested properties using dot notation
function getNestedValue(obj, path) {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj);
}

function getLocalizedText(path, fallback = '') {
    const valueObj = getNestedValue(siteData, path);
    if (valueObj && typeof valueObj === 'object' && valueObj[currentLang]) {
        return valueObj[currentLang];
    }

    if (typeof valueObj === 'string') {
        return valueObj;
    }

    return fallback;
}

function announceStatus(message) {
    const liveRegion = document.getElementById('a11y-status');
    if (!liveRegion || !message) return;

    liveRegion.textContent = '';
    window.setTimeout(() => {
        liveRegion.textContent = message;
    }, 30);
}

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('content.json');
        siteData = await response.json();
        initApp();
    } catch (error) {
        console.error("Error loading content.json:", error);
    }
});

function initApp() {
    initTheme();
    initLanguage();
    renderDynamicContent();
    setupEventListeners();
    syncAccessibilityUI();
    
    // Auto update year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
    }
}

function initLanguage() {
    document.documentElement.lang = currentLang;
    updatePageText();
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = currentLang.toUpperCase();
}

function updatePageText() {
    if (!siteData) return;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.getAttribute('data-i18n');
        const valueObj = getNestedValue(siteData, path);
        if (valueObj && valueObj[currentLang]) {
            el.innerHTML = valueObj[currentLang];
        } else if (typeof valueObj === 'string') {
            el.innerHTML = valueObj;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const path = el.getAttribute('data-i18n-placeholder');
        const valueObj = getNestedValue(siteData, path);
        if (valueObj && valueObj[currentLang]) {
            el.placeholder = valueObj[currentLang];
        }
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

    const viewProjectLabel = siteData.home.common.view_project[currentLang];
    const repoLabel = siteData.home.common.repository[currentLang];
    const liveProjectA11y = getLocalizedText('home.accessibility.view_live_project', 'Open live project in a new tab');
    const repoA11y = getLocalizedText('home.accessibility.view_repository', 'Open repository in a new tab');
    const technologiesLabel = getLocalizedText('home.accessibility.technologies_used', 'Technologies used');

    containers.forEach(item => {
        if (item.el) {
            item.el.innerHTML = '';
            const filteredProjects = siteData.projects.filter(item.filter);

            if (filteredProjects.length === 0) {
                const comingSoon = document.createElement('div');
                comingSoon.className = 'coming-soon-box glass-panel';
                comingSoon.style.padding = '4rem';
                comingSoon.style.width = '100%';
                comingSoon.style.gridColumn = '1 / -1';
                comingSoon.style.textAlign = 'center';
                comingSoon.innerHTML = `
                    <i class="fas fa-tools" style="font-size: 3rem; color: var(--brand-yellow); margin-bottom: 2rem; display: block;"></i>
                    <h3 style="font-size: 1.8rem; margin-bottom: 1rem;">Coming Soon</h3>
                    <p style="opacity: 0.8; font-size: 1.1rem;">${siteData.home.common.coming_soon[currentLang]}</p>
                `;
                item.el.appendChild(comingSoon);
                return;
            }

            filteredProjects.forEach(project => {
                const card = document.createElement('article');
                card.className = 'project-card';
                const titleId = `project-title-${project.id}-${currentLang}`;
                const descId = `project-desc-${project.id}-${currentLang}`;
                const tagsHtml = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                const projectTitle = project.title[currentLang];
                const projectDescription = project.description[currentLang];
                const techList = project.tags.join(', ');
                
                card.innerHTML = `
                    <div class="project-img-container">
                        <img src="${project.image}" alt="${projectTitle} preview" class="project-img" loading="lazy">
                    </div>
                    <div class="project-content">
                        <h3 class="project-title" id="${titleId}">${projectTitle}</h3>
                        <div class="project-tags" aria-label="${technologiesLabel}: ${techList}">${tagsHtml}</div>
                        <p class="project-desc" id="${descId}">${projectDescription}</p>
                        <div class="project-links">
                            <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-btn" aria-label="${liveProjectA11y}: ${projectTitle}" data-tooltip="${liveProjectA11y}: ${projectTitle}">
                                <i class="fas fa-external-link-alt" aria-hidden="true"></i> ${viewProjectLabel}
                            </a>
                            <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-btn" aria-label="${repoA11y}: ${projectTitle}" data-tooltip="${repoA11y}: ${projectTitle}">
                                <i class="fab fa-github" aria-hidden="true"></i> ${repoLabel}
                            </a>
                        </div>
                    </div>
                `;
                card.setAttribute('aria-labelledby', titleId);
                card.setAttribute('aria-describedby', descId);
                item.el.appendChild(card);
            });
        }
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
        const titleId = `timeline-title-${index}-${currentLang}`;
        const descId = `timeline-desc-${index}-${currentLang}`;

        const logoHtml = exp.logo ? `
            <div class="${logoClasses}">
                <img src="${exp.logo}" alt="" aria-hidden="true" class="timeline-logo" loading="lazy">
            </div>
        ` : '';

        const linksHtml = (exp.links || []).map(link => {
            const label = typeof link.label === 'string'
                ? link.label
                : link.label?.[currentLang] || link.url;

            return `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="timeline-link" aria-label="${websiteA11y}: ${label}" data-tooltip="${websiteA11y}: ${label}">
                    <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
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
                        <h3 id="${titleId}">${exp.title[currentLang]}</h3>
                        <p id="${descId}">${exp.desc[currentLang]}</p>
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
    const languageLabel = getLocalizedText(
        currentLang === 'en' ? 'home.accessibility.language_to_spanish' : 'home.accessibility.language_to_english',
        currentLang === 'en' ? 'Switch language to Spanish' : 'Switch language to English'
    );
    const scrollProjectsLabel = getLocalizedText('home.accessibility.scroll_to_projects', 'Scroll to projects section');
    const downloadCvLabel = getLocalizedText('home.accessibility.download_cv', 'Download CV in PDF format');
    const allProjectsLabel = getLocalizedText('home.accessibility.all_projects', 'Browse all projects');
    const contactShortcutLabel = getLocalizedText('home.accessibility.contact_shortcut', 'Jump to contact section');
    const openNewTabLabel = getLocalizedText('home.accessibility.opens_new_tab', 'Opens in a new tab');
    const socialLabels = {
        github: getLocalizedText('home.accessibility.open_github', 'Open GitHub profile in a new tab'),
        linkedin: getLocalizedText('home.accessibility.open_linkedin', 'Open LinkedIn profile in a new tab'),
        instagram: getLocalizedText('home.accessibility.open_instagram', 'Open Instagram profile in a new tab')
    };

    document.querySelectorAll('i[class*="fa"]').forEach(icon => {
        icon.setAttribute('aria-hidden', 'true');
    });

    const siteNavigation = document.getElementById('site-navigation');
    if (siteNavigation) {
        siteNavigation.setAttribute('aria-label', navLabel);
    }

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.setAttribute('aria-label', homeLabel);
        logo.setAttribute('data-tooltip', homeLabel);
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', themeLabel);
        themeToggle.setAttribute('data-tooltip', themeLabel);
    }

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.setAttribute('aria-label', languageLabel);
        langToggle.setAttribute('data-tooltip', languageLabel);
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

    document.querySelectorAll('.nav-links a').forEach(link => {
        const text = link.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
            link.setAttribute('data-tooltip', text);
        }
    });

    document.querySelectorAll('.outline-btn:not(#download-cv-link):not(#hero-contact-link):not(#view-all-projects-link)').forEach(link => {
        const text = link.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
            link.setAttribute('data-tooltip', text);
        }
    });

    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
        const currentLabel = link.getAttribute('aria-label');
        if (!currentLabel && link.textContent.trim()) {
            link.setAttribute('aria-label', `${link.textContent.trim()}. ${openNewTabLabel}`);
        }
    });

    document.querySelectorAll('.active-link').forEach(link => {
        link.setAttribute('aria-current', 'page');
    });
}

function setupEventListeners() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    const setMenuState = (isOpen, shouldAnnounce = false) => {
        if (!navLinks || !menuToggle) return;

        navLinks.classList.toggle('active', isOpen);
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        }

        syncAccessibilityUI();

        if (shouldAnnounce) {
            announceStatus(getLocalizedText(
                isOpen ? 'home.accessibility.menu_expanded' : 'home.accessibility.menu_collapsed',
                isOpen ? 'Navigation menu expanded' : 'Navigation menu collapsed'
            ));
        }
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

    // Language Toggle
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        localStorage.setItem('lang', currentLang);
        initLanguage();
        renderDynamicContent();
        syncAccessibilityUI();
        announceStatus(getLocalizedText(
            currentLang === 'en' ? 'home.accessibility.language_changed_english' : 'home.accessibility.language_changed_spanish',
            currentLang === 'en' ? 'Language changed to English' : 'Language changed to Spanish'
        ));
    });

    // Mobile Menu
    menuToggle?.addEventListener('click', () => {
        setMenuState(!navLinks?.classList.contains('active'), true);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setMenuState(false);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks?.classList.contains('active')) {
            setMenuState(false, true);
            menuToggle?.focus();
        }
    });

    // Simple Form Handler
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const successMsg = siteData.home.contact_section.success_msg[currentLang];
        alert(successMsg);
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

    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
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
