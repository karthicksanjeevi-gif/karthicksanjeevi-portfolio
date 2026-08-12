const defaultData = {
    personal: {
        name: "Alex Smith",
        title: ["Full Stack Developer", "UI/UX Designer", "Freelancer"],
        description: "I craft scalable, high-performance web applications with stunning user interfaces. Let's build something amazing together.",
        aboutMe: "I am a passionate Full Stack Developer with over 5 years of experience in building modern web applications. I specialize in React, Node.js, and stunning UI/UX design.",
        profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=400&h=400",
        aboutPic: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?fit=crop&w=600&q=80",
        resumeLink: "#",
        stats: [
            { title: "Experience", subtitle: "5+ Years", icon: "fa-solid fa-award" },
            { title: "Projects", subtitle: "50+ Completed", icon: "fa-solid fa-briefcase" },
            { title: "Support", subtitle: "Online 24/7", icon: "fa-solid fa-headset" }
        ]
    },
    skills: [
        { name: "HTML & CSS", percentage: 95, category: "Frontend", icon: "fa-brands fa-html5" },
        { name: "JavaScript", percentage: 90, category: "Frontend", icon: "fa-brands fa-js" },
        { name: "React", percentage: 85, category: "Frontend", icon: "fa-brands fa-react" },
        { name: "Node.js", percentage: 80, category: "Backend", icon: "fa-brands fa-node-js" },
        { name: "Python", percentage: 75, category: "Backend", icon: "fa-brands fa-python" },
        { name: "UI/UX Design", percentage: 90, category: "Design", icon: "fa-solid fa-pen-nib" }
    ],
    experience: [
        { title: "Senior Developer", subtitle: "Tech Corp", date: "2021 - Present", desc: "Leading the frontend team." },
        { title: "Web Developer", subtitle: "Web Solutions", date: "2018 - 2021", desc: "Developed responsive web apps." }
    ],
    education: [
        { title: "Master in Computer Science", subtitle: "University Tech", date: "2016 - 2018", desc: "Graduated with honors." },
        { title: "Bachelor's Degree", subtitle: "City College", date: "2012 - 2016", desc: "Software Engineering." }
    ],
    services: [
        { title: "Web Development", desc: "Custom web applications tailored to your business needs.", icon: "fa-solid fa-code" },
        { title: "UI/UX Design", desc: "Stunning interfaces that engage users.", icon: "fa-solid fa-palette" },
        { title: "SEO Optimization", desc: "Rank higher on search engines.", icon: "fa-solid fa-chart-line" }
    ],
    projects: [
        {
            name: "E-commerce Platform",
            img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=600",
            desc: "A full-stack e-commerce app with payment integration.",
            tech: ["React", "Node.js", "MongoDB"],
            github: "#", live: "#", docs: "#", status: "Completed", date: "2023", category: "Web App"
        },
        {
            name: "Portfolio Theme",
            img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?fit=crop&w=600",
            desc: "A modern, customizable portfolio template.",
            tech: ["HTML", "CSS", "JS"],
            github: "#", live: "#", docs: "#", status: "Completed", date: "2023", category: "Frontend"
        },
        {
            name: "Weather App",
            img: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?fit=crop&w=600",
            desc: "Real-time weather data fetching app.",
            tech: ["JavaScript", "API"],
            github: "#", live: "#", docs: "#", status: "In Progress", date: "2024", category: "Web App"
        }
    ],
    achievements: [
        { title: "AWS Certified", icon: "fa-brands fa-aws" },
        { title: "Best Developer Award 2022", icon: "fa-solid fa-trophy" }
    ],
    contact: {
        email: "alex@example.com",
        phone: "+1 234 567 890",
        address: "123 Main St, Tech City, USA",
        location: "Tech City",
        mapIframe: "<iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1422937950147!2d-73.98731968459391!3d40.75889497932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1621530650998!5m2!1sen!2sus' allowfullscreen='' loading='lazy'></iframe>"
    },
    socials: [
        { platform: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" },
        { platform: "LinkedIn", url: "https://linkedin.com", icon: "fa-brands fa-linkedin" },
        { platform: "Twitter", url: "https://twitter.com", icon: "fa-brands fa-twitter" }
    ],
    theme: {
        title: "Alex - Portfolio",
        favicon: "👨‍💻",
        primaryColorHue: 250, /* Default hue */
    }
};

const STORAGE_KEY = 'portfolio_data_v1';

function deepMerge(base, incoming) {
    if (Array.isArray(base)) {
        return Array.isArray(incoming) ? incoming : base;
    }

    if (base && typeof base === 'object' && !Array.isArray(base)) {
        const result = { ...base };
        if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
            Object.entries(incoming).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                result[key] = deepMerge(base[key], value);
            });
        }
        return result;
    }

    return incoming ?? base;
}

function normalizePortfolioData(data) {
    return deepMerge(defaultData, data || {});
}

async function getPortfolioData() {
    // Always load from server first so all devices see the same data
    try {
        const response = await fetch(`/api/portfolio?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.ok) {
            const apiData = await response.json();
            if (apiData && Object.keys(apiData).length > 0) {
                const merged = normalizePortfolioData(apiData);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                } catch (e) {}
                return merged;
            }
        }
    } catch (e) {
        console.info('Backend API unavailable. Using local cache.');
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return normalizePortfolioData(JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Error reading from localStorage:', e);
    }

    return defaultData;
}

async function setPortfolioData(data) {
    const normalized = normalizePortfolioData(data);
    normalized._updatedAt = Date.now();

    let cloudSaved = false;
    try {
        const response = await fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalized)
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
            cloudSaved = true;
        } else {
            throw new Error(result.message || 'Cloud save failed');
        }
    } catch (e) {
        console.error('Could not sync with backend:', e);
        throw e;
    }

    if (cloudSaved) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    return normalized;
}


