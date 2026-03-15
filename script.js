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
    
    // Auto update year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function initLanguage() {
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

    containers.forEach(item => {
        if (item.el) {
            item.el.innerHTML = '';
            siteData.projects.filter(item.filter).forEach(project => {
                const card = document.createElement('div');
                card.className = 'project-card';
                const tagsHtml = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                
                card.innerHTML = `
                    <div class="project-img-container">
                        <img src="${project.image}" alt="${project.title[currentLang]}" class="project-img" loading="lazy">
                    </div>
                    <div class="project-content">
                        <h3 class="project-title">${project.title[currentLang]}</h3>
                        <div class="project-tags">${tagsHtml}</div>
                        <p class="project-desc">${project.description[currentLang]}</p>
                        <div class="project-links">
                            <a href="${project.liveUrl}" target="_blank" class="project-btn">
                                <i class="fas fa-external-link-alt"></i> ${viewProjectLabel}
                            </a>
                            <a href="${project.githubUrl}" target="_blank" class="project-btn">
                                <i class="fab fa-github"></i> ${repoLabel}
                            </a>
                        </div>
                    </div>
                `;
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
    siteData.experience.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-date">${exp.date}</div>
            <div class="timeline-content glass-panel">
                <h3>${exp.title[currentLang]}</h3>
                <p>${exp.desc[currentLang]}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

function setupEventListeners() {
    // Theme Toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        initTheme();
    });

    // Language Toggle
    document.getElementById('lang-toggle')?.addEventListener('click', (e) => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        localStorage.setItem('lang', currentLang);
        e.target.textContent = currentLang.toUpperCase();
        updatePageText();
        renderDynamicContent();
    });

    // Mobile Menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    menuToggle?.addEventListener('click', () => {
        navLinks?.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if(icon) {
            if(navLinks.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
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
