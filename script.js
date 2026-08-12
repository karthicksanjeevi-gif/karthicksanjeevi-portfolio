async function loadPortfolioData() {
    return await getPortfolioData();
}

// Initialize Data
let portfolioData = defaultData;
(async () => {
    portfolioData = await loadPortfolioData();
    renderSite();
})();

/* ==========================================================================
   Render Functions
   ========================================================================== */
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setElementSrc(id, src) {
    const el = document.getElementById(id);
    if (el) el.src = src;
}

function setElementHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function renderSite() {
    const theme = portfolioData.theme || {};
    const p = portfolioData.personal || {};
    const socials = Array.isArray(portfolioData.socials) && portfolioData.socials.length ? portfolioData.socials : defaultData.socials;
    const skills = Array.isArray(portfolioData.skills) && portfolioData.skills.length ? portfolioData.skills : defaultData.skills;
    const experience = Array.isArray(portfolioData.experience) && portfolioData.experience.length ? portfolioData.experience : defaultData.experience;
    const education = Array.isArray(portfolioData.education) && portfolioData.education.length ? portfolioData.education : defaultData.education;
    const services = Array.isArray(portfolioData.services) && portfolioData.services.length ? portfolioData.services : defaultData.services;
    const projects = Array.isArray(portfolioData.projects) ? portfolioData.projects : defaultData.projects;
    const achievements = Array.isArray(portfolioData.achievements) && portfolioData.achievements.length ? portfolioData.achievements : defaultData.achievements;
    const contact = { ...defaultData.contact, ...(portfolioData.contact || {}) };
    const stats = Array.isArray(p.stats) && p.stats.length ? p.stats : defaultData.personal.stats;
    const titles = Array.isArray(p.title) && p.title.length ? p.title : defaultData.personal.title;

    // 1. Meta & Theme
    setElementText('site-title', theme.title || "Portfolio");
    document.documentElement.style.setProperty('--hue', theme.primaryColorHue || 250);
    // Favicon
    if(theme.favicon) {
        const favEl = document.getElementById('site-favicon');
        if (favEl) favEl.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${theme.favicon}</text></svg>`;
    }

    // 2. Personal Info
    setElementText('nav-logo-text', p.name || "Portfolio");
    setElementText('hero-name', p.name || "Your Name");
    setElementText('hero-description', p.description || defaultData.personal.description);
    setElementSrc('hero-img', p.profilePic || defaultData.personal.profilePic);
    setElementSrc('about-img', p.aboutPic || defaultData.personal.aboutPic);
    setElementText('about-description', p.aboutMe || defaultData.personal.aboutMe);
    
    const heroResumeBtn = document.getElementById('hero-resume-btn');
    const aboutDownloadBtn = document.getElementById('about-download-btn');
    if(p.resumeLink && p.resumeLink !== "#") {
        if (typeof p.resumeLink === 'string' && p.resumeLink.startsWith('data:')) {
            if (heroResumeBtn) {
                heroResumeBtn.removeAttribute('href');
                heroResumeBtn.onclick = (e) => { e.preventDefault(); openDataUrlInNewTab(p.resumeLink); };
            }
            if (aboutDownloadBtn) {
                aboutDownloadBtn.removeAttribute('href');
                aboutDownloadBtn.onclick = (e) => { e.preventDefault(); downloadDataUrl(p.resumeLink, 'resume.pdf'); };
            }
        } else {
            if (heroResumeBtn) {
                heroResumeBtn.href = p.resumeLink;
                heroResumeBtn.onclick = null;
            }
            if (aboutDownloadBtn) {
                aboutDownloadBtn.href = p.resumeLink;
                aboutDownloadBtn.setAttribute('download', 'resume.pdf');
                aboutDownloadBtn.onclick = null;
            }
        }
    } else {
        if (heroResumeBtn) {
            heroResumeBtn.removeAttribute('href');
            heroResumeBtn.onclick = (e) => { e.preventDefault(); showToast("Resume not available yet.", "error"); };
        }
        if (aboutDownloadBtn) {
            aboutDownloadBtn.removeAttribute('href');
            aboutDownloadBtn.onclick = (e) => { e.preventDefault(); showToast("Resume not available yet.", "error"); };
        }
    }

    // About Stats
    setElementHTML('about-info-cards', stats.map(stat => `
        <div class="about-box">
            <i class="${stat.icon} about-icon"></i>
            <h3 class="about-title">${stat.title}</h3>
            <span class="about-subtitle">${stat.subtitle}</span>
        </div>
    `).join(''));

    // Typing Animation Setup
    initTypingAnimation(titles);

    // 3. Socials
    const socialsHTML = socials.map(s => `
        <a href="${s.url}" target="_blank" class="home-social-link" title="${s.platform}">
            <i class="${s.icon}"></i>
        </a>
    `).join('');
    setElementHTML('hero-socials', socialsHTML);
    setElementHTML('footer-socials', socialsHTML.replace(/home-social-link/g, ''));

    // 4. Skills
    setElementHTML('skills-container', skills.map(skill => `
        <div class="skills-content">
            <div class="skills-box">
                <div class="skills-data">
                    <i class="${skill.icon} skills-icon"></i>
                    <div style="width: 100%;">
                        <div style="display:flex; justify-content:space-between;">
                            <h3 class="skills-name">${skill.name}</h3>
                            <span class="skills-name">${skill.percentage}%</span>
                        </div>
                        <div class="skills-bar-container">
                            <div class="skills-bar" style="width: ${skill.percentage}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join(''));

    // 5. Timeline (Experience & Education)
    const renderTimeline = (items) => items.map((item, index) => `
        <div class="timeline-data">
            ${index % 2 === 0 ? `
                <div>
                    <h3 class="timeline-title">${item.title}</h3>
                    <span class="timeline-subtitle">${item.subtitle}</span>
                    <p class="timeline-desc">${item.desc}</p>
                    <div class="timeline-calendar"><i class="fa-regular fa-calendar"></i> ${item.date}</div>
                </div>
                <div>
                    <span class="timeline-rounder"></span>
                    ${index !== items.length -1 ? '<span class="timeline-line"></span>' : ''}
                </div>
                <div></div>
            ` : `
                <div></div>
                <div>
                    <span class="timeline-rounder"></span>
                    ${index !== items.length -1 ? '<span class="timeline-line"></span>' : ''}
                </div>
                <div>
                    <h3 class="timeline-title">${item.title}</h3>
                    <span class="timeline-subtitle">${item.subtitle}</span>
                    <p class="timeline-desc">${item.desc}</p>
                    <div class="timeline-calendar"><i class="fa-regular fa-calendar"></i> ${item.date}</div>
                </div>
            `}
        </div>
    `).join('');
    setElementHTML('exp-content', renderTimeline(experience));
    setElementHTML('edu-content', renderTimeline(education));

    // 6. Services
    setElementHTML('services-container', services.map(s => `
        <div class="services-card">
            <i class="${s.icon} services-icon"></i>
            <h3 class="services-title">${s.title}</h3>
            <p class="services-desc">${s.desc}</p>
        </div>
    `).join(''));

    // 7. Projects
    renderProjects(projects, 'all');
    
    // Extract unique categories for filters
    const categories = ['all', ...new Set(projects.map(p => p.category || 'Other'))];
    setElementHTML('projects-filters', categories.map(cat => `
        <span class="filter-item ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
    `).join(''));

    // 8. Achievements
    setElementHTML('achievements-container', achievements.map(a => `
        <div class="achievement-card">
            <i class="${a.icon} achievement-icon"></i>
            <h3 class="skills-name">${a.title}</h3>
        </div>
    `).join(''));

    // 9. Contact
    const rawMapIframe = contact.mapIframe || '';
    const locationUrl = contact.mapLink || (isPlainUrl(rawMapIframe) ? rawMapIframe : '');
    const showMap = !locationUrl && rawMapIframe && rawMapIframe.trim().toLowerCase().includes('<iframe');

    setElementHTML('contact-details-container', `
        <div class="contact-card">
            <i class="fa-regular fa-envelope contact-card-icon"></i>
            <h3 class="contact-card-title">Email</h3>
            <span class="contact-card-data">${contact.email}</span>
        </div>
        <div class="contact-card">
            <i class="fa-solid fa-phone contact-card-icon"></i>
            <h3 class="contact-card-title">Phone</h3>
            <span class="contact-card-data">${contact.phone}</span>
        </div>
        <div class="contact-card location-card${locationUrl ? ' clickable' : ''}" id="location-card">
            <i class="fa-solid fa-location-dot contact-card-icon"></i>
            <h3 class="contact-card-title">Location</h3>
            <span class="contact-card-data">${contact.location}</span>
        </div>
    `);
    const locationCard = document.getElementById('location-card');
    if (locationUrl && locationCard) {
        locationCard.addEventListener('click', () => window.open(locationUrl, '_blank'));
    }
    setElementHTML('map-container', showMap ? rawMapIframe : '');

    // Footer Year
    setElementText('current-year', new Date().getFullYear());
    setElementText('footer-title', p.name || "Portfolio");
    
    // Hide Loader
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

function renderProjects(projects, filter) {
    const container = document.getElementById('projects-container');
    const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);
    
    container.innerHTML = filtered.map((p, idx) => `
        <div class="project-card glass">
            <div class="project-img-box">
                <img src="${p.img}" alt="${p.name}">
            </div>
            <h3 class="project-title">${p.name}</h3>
            <div class="project-tags">
                ${p.tech.map(t => `<span class="project-tag">${t}</span>`).join('')}
            </div>
            <span class="project-btn" onclick="openProjectModal(${idx})">View Details <i class="fa-solid fa-arrow-right"></i></span>
        </div>
    `).join('');
}

// Global scope for modal
window.openProjectModal = function(index) {
    const project = portfolioData.projects[index];
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <img src="${project.img}" alt="${project.name}" class="modal-img">
        <h2 class="modal-title">${project.name}</h2>
        <div style="margin-bottom: 1rem; color: var(--first-color); font-size: 0.9rem;">
            <span><i class="fa-regular fa-calendar"></i> ${project.date}</span> | 
            <span><i class="fa-solid fa-signal"></i> ${project.status}</span>
        </div>
        <p class="modal-desc">${project.desc}</p>
        <div class="project-tags" style="margin-bottom: 1.5rem;">
            ${project.tech.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <div class="modal-links">
            ${project.github !== '#' ? `<a href="${project.github}" target="_blank" class="btn btn-ghost"><i class="fa-brands fa-github"></i> Code</a>` : ''}
            ${project.live !== '#' ? `<a href="${project.live}" target="_blank" class="btn"><i class="fa-solid fa-link"></i> Live Demo</a>` : ''}
            ${project.docs !== '#' ? `<a href="${project.docs}" target="_blank" class="btn btn-ghost"><i class="fa-solid fa-file-alt"></i> Docs</a>` : ''}
        </div>
    `;
    
    const modalElem = document.getElementById('project-modal');
    if (modalElem) {
        modalElem.classList.add('active-modal');
    }
};

/* ==========================================================================
   Interactivity & UI Features
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Menu Show/Hide
    const navMenu = document.getElementById('nav-menu'),
          navToggle = document.getElementById('nav-toggle'),
          navClose = document.getElementById('nav-close');

    if(navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.add('show-menu'));
    }
    if(navClose && navMenu) {
        navClose.addEventListener('click', () => navMenu.classList.remove('show-menu'));
    }

    // Remove menu on mobile link click
    const navLinks = document.querySelectorAll('.nav-link');
    if (navMenu) {
        navLinks.forEach(n => n.addEventListener('click', () => navMenu.classList.remove('show-menu')));
    }

    // Change Background Header on Scroll
    function scrollHeader() {
        const header = document.getElementById('header');
        if (!header) return;
        if (window.scrollY >= 50) header.classList.add('scroll-header');
        else header.classList.remove('scroll-header');
    }
    window.addEventListener('scroll', scrollHeader);

    // Timeline Tabs
    const tabs = document.querySelectorAll('.timeline-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (!tab.dataset || !tab.dataset.target) return;
            const target = document.querySelector(tab.dataset.target);
            document.querySelectorAll('.timeline-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.timeline-button').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (target) target.classList.add('active');
        });
    });

    // Project Filters
    const filterContainer = document.getElementById('projects-filters');
    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('filter-item')) {
                document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active'));
                e.target.classList.add('active');
                if (typeof renderProjects === 'function' && portfolioData && portfolioData.projects) {
                    renderProjects(portfolioData.projects, e.target.dataset.filter);
                }
            }
        });
    }

    // Project Modal Close
    const modalClose = document.getElementById('modal-close');
    const projectModal = document.getElementById('project-modal');
    if (modalClose && projectModal) {
        modalClose.addEventListener('click', () => projectModal.classList.remove('active-modal'));
    }
    if (projectModal) {
        window.addEventListener('click', (e) => {
            if (e.target === projectModal) projectModal.classList.remove('active-modal');
        });
    }

    // Dark/Light Theme Toggle
    const themeButton = document.getElementById('theme-button');
    const darkTheme = 'dark';
    const iconTheme = 'fa-sun';
    
    // Check local storage for preference
    const selectedTheme = localStorage.getItem('selected-theme');
    const selectedIcon = localStorage.getItem('selected-icon');
    
    const getCurrentTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const getCurrentIcon = () => (themeButton && themeButton.classList.contains(iconTheme)) ? 'fa-moon' : 'fa-sun';
    
    if (selectedTheme) {
        document.documentElement.setAttribute('data-theme', selectedTheme);
        if (themeButton) {
            themeButton.className = `fa-solid theme-toggle ${selectedIcon === 'fa-moon' ? 'fa-moon' : 'fa-sun'}`;
        }
    }
    
    if (themeButton) {
        themeButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            themeButton.classList.toggle('fa-sun');
            themeButton.classList.toggle('fa-moon');
            
            localStorage.setItem('selected-theme', newTheme);
            localStorage.setItem('selected-icon', getCurrentIcon());
        });
    }

    // Scroll Up
    function scrollUp() {
        const scrollUpElem = document.getElementById('scroll-up');
        if (!scrollUpElem) return;
        if (window.scrollY >= 350) scrollUpElem.classList.add('show-scroll');
        else scrollUpElem.classList.remove('show-scroll');
    }
    window.addEventListener('scroll', scrollUp);

    // Active Link Highlighting on Scroll
    const sections = document.querySelectorAll('section[id]');
    function scrollActive() {
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight,
                  sectionTop = current.offsetTop - 58,
                  sectionId = current.getAttribute('id');
            const navLink = document.querySelector('.nav-menu a[href*=' + sectionId + ']');
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    }
    window.addEventListener('scroll', scrollActive);

    // Contact Form Submission (Gmail compose — user Gmail → admin Gmail)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameEl = document.getElementById('name');
            const emailEl = document.getElementById('email');
            const subjectEl = document.getElementById('subject');
            const messageEl = document.getElementById('message');

            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const subject = subjectEl ? subjectEl.value.trim() : '';
            const message = messageEl ? messageEl.value.trim() : '';

            const isValidGmail = (address) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(address);

            if (!isValidGmail(email)) {
                showToast("It is not a valid gmail", "error");
                return;
            }
            
            const adminEmail = (portfolioData && portfolioData.contact && portfolioData.contact.email)
                ? portfolioData.contact.email.trim()
                : '';

            if (!adminEmail) {
                showToast("Admin email is not configured yet.", "error");
                return;
            }
            
            const bodyText = `Name: ${name}\n\n${message}`;
            const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
            const gmailUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=${encodeURIComponent(composeUrl)}`;

            window.open(gmailUrl, '_blank');
            
            showToast("Opening Gmail to send your message to admin...", "success");
            contactForm.reset();
        });
    }

    // Hidden Admin Access Listener (Ctrl + Shift + A)
    window.addEventListener('keydown', (e) => {
        if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
            window.location.href = 'admin.html';
        }
    });
});

/* ==========================================================================
   Utilities
   ========================================================================== */
function initTypingAnimation(titles) {
    const typingElement = document.getElementById('hero-typing');
    if(!typingElement || !titles || titles.length === 0) return;
    
    let titleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentTitle = titles[titleIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingElement.textContent = currentTitle.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentTitle.length) {
            typingSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
            typingSpeed = 500; // Pause before new word
        }

        setTimeout(type, typingSpeed);
    }
    
    setTimeout(type, 1000); // Initial delay
}

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

function isPlainUrl(value) {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) && !trimmed.toLowerCase().includes('<iframe');
}

/* Utilities to handle data: URLs safely for viewing/downloading */
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function openDataUrlInNewTab(dataUrl) {
    try {
        const blob = dataURLtoBlob(dataUrl);
        const url = URL.createObjectURL(blob);
        // Open in new tab; some browsers block direct data: navigation, object URLs are safer
        window.open(url, '_blank');
        // Revoke after a minute
        setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (e) {
        console.error('Failed to open resume', e);
        showToast('Unable to open resume.', 'error');
    }
}

function downloadDataUrl(dataUrl, filename = 'file') {
    try {
        const blob = dataURLtoBlob(dataUrl);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (e) {
        console.error('Failed to download resume', e);
        showToast('Unable to download file.', 'error');
    }
}
