/* Admin Logic */
// Allow opening admin via file:// by falling back to LocalStorage-based save/load.

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth & Inactivity
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('admin-password');
    const logoutBtn = document.getElementById('logout-btn');

    let inactivityTimer;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes session expiry
    let expiryWatcher = null;

    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logout, INACTIVITY_LIMIT);
        // extend session expiry if authenticated
        if (sessionStorage.getItem('adminAuth') === 'true') {
            sessionStorage.setItem('admin-expires', String(Date.now() + INACTIVITY_LIMIT));
        }
    }

    function setupInactivity() {
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);
        resetTimer();
    }

    const emailInput = document.getElementById('login-email');

    function login(e) {
        if (e && e.preventDefault) e.preventDefault();
        const enteredPass = passwordInput ? passwordInput.value.trim() : '';
        const enteredEmail = emailInput ? emailInput.value.trim() : '';
        
        if (!enteredEmail || !enteredPass) {
            showToast("Please enter both email and password.", "error");
            return;
        }
        
        if (auth && auth.signInWithEmailAndPassword) {
            showToast("Authenticating with Firebase...", "info");
            auth.signInWithEmailAndPassword(enteredEmail, enteredPass)
                .then((userCredential) => {
                    sessionStorage.setItem('adminAuth', 'true');
                    showDashboard();
                    showToast("Login successful!", "success");
                })
                .catch((error) => {
                    let userMsg = error.message;
                    if (error.code === 'auth/user-not-found') {
                        userMsg = "No account found with this email in Firebase.";
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        userMsg = "Invalid password or email combination.";
                    } else if (error.code === 'auth/invalid-email') {
                        userMsg = "Invalid email format.";
                    } else if (error.code === 'auth/too-many-requests') {
                        userMsg = "Access temporarily blocked due to many failed attempts. Try later.";
                    } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
                        userMsg = "Firebase is not configured. Update firebase-config.js with your Firebase web app credentials.";
                    } else if (error.code === 'auth/unauthorized-domain') {
                        userMsg = "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
                    }
                    showToast("Firebase Login Failed: " + userMsg, "error");
                });
        } else {
            showToast("Firebase Auth is not initialized or configured. Update firebase-config.js with your Firebase web app credentials.", "error");
        }
    }

    function logout() {
        sessionStorage.removeItem('adminAuth');
        dashboardScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
        if (passwordInput) passwordInput.value = '';
        if (emailInput) emailInput.value = '';
        clearTimeout(inactivityTimer);
        if (expiryWatcher) { clearInterval(expiryWatcher); expiryWatcher = null; }
        
        if (auth && auth.signOut) {
            auth.signOut().catch(() => {});
        }
        showToast("Logged out.", "success");
    }

    function checkAuth() {
        if (auth && auth.onAuthStateChanged) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    sessionStorage.setItem('adminAuth', 'true');
                    showDashboard();
                } else {
                    sessionStorage.removeItem('adminAuth');
                    dashboardScreen.style.display = 'none';
                    loginScreen.style.display = 'flex';
                }
            });
        } else {
            dashboardScreen.style.display = 'none';
            loginScreen.style.display = 'flex';
        }
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        setupInactivity();
        loadDataToForms();
    }

    loginForm.addEventListener('submit', login);
    logoutBtn.addEventListener('click', logout);
    checkAuth();

    // UI Interactions
    const menuItems = document.querySelectorAll('.menu-item');
    const panels = document.querySelectorAll('.panel');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active menu
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show panel
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                const targetPanel = document.querySelector(targetId);
                if (targetPanel) {
                    panels.forEach(p => p.classList.remove('active'));
                    targetPanel.classList.add('active');
                }
            }

            // Hide sidebar on mobile
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });

    if (toggleSidebar && sidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    function renderStatsEditor(statsArray) {
        const list = document.getElementById('stats-editor-list');
        if (!list) return;
        list.innerHTML = '';
        
        const stats = Array.isArray(statsArray) && statsArray.length ? statsArray : [
            { title: "Experience", subtitle: "5+ Years", icon: "fa-solid fa-award" },
            { title: "Projects", subtitle: "50+ Completed", icon: "fa-solid fa-briefcase" },
            { title: "Support", subtitle: "Online 24/7", icon: "fa-solid fa-headset" }
        ];

        stats.forEach((stat) => addStatRow(stat));
    }

    function addStatRow(stat = { title: '', subtitle: '', icon: 'fa-solid fa-star' }) {
        const list = document.getElementById('stats-editor-list');
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'array-item stat-item';
        row.style.marginBottom = '0.5rem';
        row.innerHTML = `
            <div style="flex: 1; min-width: 140px;">
                <label style="font-size: 0.75rem; color: #666; display: block; margin-bottom: 2px;">Title</label>
                <input type="text" class="stat-title" placeholder="e.g. Experience" value="${stat.title || ''}" />
            </div>
            <div style="flex: 1; min-width: 140px;">
                <label style="font-size: 0.75rem; color: #666; display: block; margin-bottom: 2px;">Subtitle</label>
                <input type="text" class="stat-subtitle" placeholder="e.g. 5+ Years" value="${stat.subtitle || ''}" />
            </div>
            <div style="flex: 1; min-width: 140px;">
                <label style="font-size: 0.75rem; color: #666; display: block; margin-bottom: 2px;">Icon Class</label>
                <input type="text" class="stat-icon" placeholder="e.g. fa-solid fa-award" value="${stat.icon || ''}" />
            </div>
            <button type="button" class="btn btn-outline remove" style="margin-top: 18px; width: auto;"><i class="fa-solid fa-trash"></i></button>
        `;

        row.querySelector('.remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    }

    function collectStatsData() {
        const list = document.getElementById('stats-editor-list');
        if (!list) return [];
        const rows = list.querySelectorAll('.stat-item');
        const stats = [];
        rows.forEach(row => {
            const title = row.querySelector('.stat-title').value.trim();
            const subtitle = row.querySelector('.stat-subtitle').value.trim();
            const icon = row.querySelector('.stat-icon').value.trim();
            if (title || subtitle) {
                stats.push({ title, subtitle, icon: icon || 'fa-solid fa-award' });
            }
        });
        return stats;
    }

    async function loadDataToForms() {
        const data = await getPortfolioData();
        if (!data || Object.keys(data).length === 0) return;

        // Personal
        if (data.personal) {
            const f = document.getElementById('form-personal');
            f.name.value = data.personal.name || '';
            f.title.value = (data.personal.title || []).join(', ');
            f.description.value = data.personal.description || '';
            f.aboutMe.value = data.personal.aboutMe || '';
            f.profilePic.value = data.personal.profilePic || '';
            f.aboutPic.value = data.personal.aboutPic || '';
            f.resumeLink.value = data.personal.resumeLink || '';
            renderStatsEditor(data.personal.stats);
        }

        const addStatBtn = document.getElementById('add-stat-btn');
        if (addStatBtn) {
            addStatBtn.onclick = () => addStatRow();
        }

        // Contact
        if (data.contact) {
            const f = document.getElementById('form-contact');
            f.email.value = data.contact.email || '';
            f.phone.value = data.contact.phone || '';
            f.location.value = data.contact.location || '';
            f.mapLink.value = data.contact.mapLink || '';
            f.address.value = data.contact.address || '';
            f.mapIframe.value = data.contact.mapIframe || '';
        }

        // Theme
        if (data.theme) {
            const f = document.getElementById('form-theme');
            f.title.value = data.theme.title || '';
            f.favicon.value = data.theme.favicon || '';
            f.primaryColorHue.value = data.theme.primaryColorHue || '';
        }

        // JSON Editors (Arrays)
        document.getElementById('json-skills').value = JSON.stringify(data.skills || [], null, 4);
        document.getElementById('json-projects').value = JSON.stringify(data.projects || [], null, 4);
        document.getElementById('json-experience').value = JSON.stringify(data.experience || [], null, 4);
        document.getElementById('json-education').value = JSON.stringify(data.education || [], null, 4);
        document.getElementById('json-services').value = JSON.stringify(data.services || [], null, 4);
        document.getElementById('json-achievements').value = JSON.stringify(data.achievements || [], null, 4);
        document.getElementById('json-socials').value = JSON.stringify(data.socials || [], null, 4);

        // Initialize form-style array editors (replace JSON textareas with structured forms)
        initArrayEditors();
    }

    async function saveAllData() {
        const data = await getPortfolioData();

        try {
            // Personal
            const fp = document.getElementById('form-personal');
            data.personal = {
                ...data.personal,
                name: fp.name.value,
                title: fp.title.value.split(',').map(s => s.trim()).filter(Boolean),
                description: fp.description.value,
                aboutMe: fp.aboutMe.value,
                profilePic: fp.profilePic.value,
                aboutPic: fp.aboutPic.value,
                resumeLink: fp.resumeLink.value,
                stats: collectStatsData()
            };

            // Contact
            const fc = document.getElementById('form-contact');
            data.contact = {
                ...data.contact,
                email: fc.email.value,
                phone: fc.phone.value,
                location: fc.location.value,
                mapLink: fc.mapLink.value,
                address: fc.address.value,
                mapIframe: fc.mapIframe.value
            };

            // Theme
            const ft = document.getElementById('form-theme');
            data.theme = {
                ...data.theme,
                title: ft.title.value,
                favicon: ft.favicon.value,
                primaryColorHue: ft.primaryColorHue.value
            };

            // JSON Editors
            // If form editors exist, read from them; otherwise fallback to textarea JSON
            data.skills = readArrayEditor('json-skills') || JSON.parse(document.getElementById('json-skills').value || '[]');
            data.projects = readArrayEditor('json-projects') || JSON.parse(document.getElementById('json-projects').value || '[]');
            data.experience = readArrayEditor('json-experience') || JSON.parse(document.getElementById('json-experience').value || '[]');
            data.education = readArrayEditor('json-education') || JSON.parse(document.getElementById('json-education').value || '[]');
            data.services = readArrayEditor('json-services') || JSON.parse(document.getElementById('json-services').value || '[]');
            data.achievements = readArrayEditor('json-achievements') || JSON.parse(document.getElementById('json-achievements').value || '[]');
            data.socials = readArrayEditor('json-socials') || JSON.parse(document.getElementById('json-socials').value || '[]');

            await setPortfolioData(data);
            showToast("All changes saved to cloud! Visible on all devices.", "success");
            
        } catch (e) {
            console.error(e);
            showToast("Error saving to cloud: " + (e.message || "Check MongoDB connection on Vercel."), "error");
        }
    }

    document.getElementById('save-all-btn').addEventListener('click', () => saveAllData());

    // Export Data
    document.getElementById('export-btn').addEventListener('click', async () => {
        const data = await getPortfolioData();
        if (!data || Object.keys(data).length === 0) return showToast("No data to export.", "error");
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_backup_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Data exported successfully!", "success");
    });

    // Import Data
    document.getElementById('import-btn').addEventListener('click', () => {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            return showToast("Please select a file to import.", "error");
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation
                if(importedData && typeof importedData === 'object' && importedData.personal) {
                    setPortfolioData(importedData).then(() => {
                        loadDataToForms();
                        showToast("Data imported successfully!", "success");
                    }).catch(() => {
                        showToast("Failed to import data.", "error");
                    });
                    fileInput.value = '';
                } else {
                    showToast("Invalid portfolio data file.", "error");
                }
            } catch (err) {
                showToast("Error parsing file.", "error");
            }
        };
        reader.readAsText(file);
    });

    // Reset Data
    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm("Are you sure you want to factory reset? ALL your custom data will be deleted and replaced with defaults!")) {
            // Try to clear LocalStorage backup and reload default data
            try {
                localStorage.removeItem(STORAGE_KEY);
                fetch('/api/portfolio/reset', { method: 'POST' }).catch(() => {});
                showToast("Data reset to defaults. Reloading...", "success");
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            } catch (e) {
                console.error(e);
                showToast("Failed to reset data.", "error");
            }
        }
    });

    // Backup and data management buttons exist in DOM below
    // File Upload Handlers (Base64)
    function setupFileUpload(inputId, targetInputName) {
        const fileInput = document.getElementById(inputId);
        if(!fileInput) return;
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if(file) {
                // 2MB limit for localStorage
                if(file.size > 2 * 1024 * 1024) {
                    showToast("File is too large! Please keep it under 2MB.", "error");
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Str = e.target.result;
                    const textInput = document.querySelector(`input[name="${targetInputName}"]`);
                    if(textInput) textInput.value = base64Str;
                    showToast("File processed successfully!", "success");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    setupFileUpload('upload-profilePic', 'profilePic');
    setupFileUpload('upload-aboutPic', 'aboutPic');
    setupFileUpload('upload-resume', 'resumeLink');
});

/* ---------- Array Editors (structured form view for JSON arrays) ---------- */
function initArrayEditors() {
    // Skills
    createSkillsEditor('json-skills');
    createProjectsEditor('json-projects');
    createSimpleEditor('json-experience', ['title','subtitle','date','desc']);
    createSimpleEditor('json-education', ['title','subtitle','date','desc']);
    createSimpleEditor('json-services', ['title','desc','icon']);
    createSimpleEditor('json-achievements', ['title','icon']);
    createSimpleEditor('json-socials', ['platform','url','icon']);
}

function safeParse(val){ try { return JSON.parse(val||'[]'); } catch(e){ return null; } }

function readArrayEditor(textareaId){
    const container = document.getElementById(`${textareaId}-editor`);
    if(!container) return null;
    const items = [];
    const rows = container.querySelectorAll('.array-item');
    rows.forEach(row => {
        const obj = {};
        row.querySelectorAll('[data-key]').forEach(input => {
            const key = input.getAttribute('data-key');
            obj[key] = input.value;
        });
        // special handling for comma-separated tech list
        if(textareaId === 'json-projects' && obj.tech) {
            obj.tech = obj.tech.split(',').map(s=>s.trim()).filter(Boolean);
        }
        // numeric conversion for skill percentage
        if(textareaId === 'json-skills' && obj.percentage) obj.percentage = Number(obj.percentage)||0;
        items.push(obj);
    });
    return items;
}

function createContainerAfter(textareaId){
    const ta = document.getElementById(textareaId);
    if(!ta) return null;
    // hide textarea but keep it for fallback
    ta.style.display = 'none';
    let existing = document.getElementById(`${textareaId}-editor`);
    if(existing) existing.remove();
    const container = document.createElement('div');
    container.id = `${textareaId}-editor`;
    container.className = 'array-editor';
    ta.parentNode.insertBefore(container, ta.nextSibling);
    return container;
}

function createSkillsEditor(textareaId){
    const data = safeParse(document.getElementById(textareaId).value) || [];
    const container = createContainerAfter(textareaId);
    if(!container) return;
    const title = document.createElement('div'); title.className='editor-header'; title.textContent='Skills (form view)'; container.appendChild(title);
    const list = document.createElement('div'); list.className='editor-list'; container.appendChild(list);
    function addItem(item={name:'',percentage:0,category:'',icon:''}){
        const row = document.createElement('div'); row.className='array-item skill-item';
        row.innerHTML = `
            <input data-key="name" placeholder="Name" value="${item.name||''}" />
            <input data-key="percentage" placeholder="Percentage" value="${item.percentage||0}" />
            <input data-key="category" placeholder="Category" value="${item.category||''}" />
            <input data-key="icon" placeholder="Icon class" value="${item.icon||''}" />
            <button class="btn btn-outline remove">Remove</button>
        `;
        row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); });
        list.appendChild(row);
    }
    data.forEach(d=>addItem(d));
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Add Skill';
    addBtn.addEventListener('click', ()=>addItem()); container.appendChild(addBtn);
}

function createProjectsEditor(textareaId){
    const data = safeParse(document.getElementById(textareaId).value) || [];
    const container = createContainerAfter(textareaId);
    if(!container) return;
    const title = document.createElement('div'); title.className='editor-header'; title.textContent='Projects (form view)'; container.appendChild(title);
    const list = document.createElement('div'); list.className='editor-list'; container.appendChild(list);
    function addItem(item={name:'',img:'',desc:'',tech:[],github:'',live:'',docs:'',status:'',date:'',category:''}){
        const row = document.createElement('div'); row.className='array-item project-item';
        row.innerHTML = `
            <input data-key="name" placeholder="Project name" value="${item.name||''}" />
            <input data-key="img" placeholder="Image URL or base64" value="${item.img||''}" />
            <input data-key="desc" placeholder="Short description" value="${item.desc||''}" />
            <input data-key="tech" placeholder="Tech (comma separated)" value="${(item.tech||[]).join(', ')}" />
            <input data-key="github" placeholder="Github URL" value="${item.github||''}" />
            <input data-key="live" placeholder="Live URL" value="${item.live||''}" />
            <input data-key="docs" placeholder="Docs URL" value="${item.docs||''}" />
            <input data-key="status" placeholder="Status" value="${item.status||''}" />
            <input data-key="date" placeholder="Date" value="${item.date||''}" />
            <input data-key="category" placeholder="Category" value="${item.category||''}" />
            <button class="btn btn-outline remove">Remove</button>
        `;
        row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); });
        list.appendChild(row);
    }
    data.forEach(d=>addItem(d));
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Add Project';
    addBtn.addEventListener('click', ()=>addItem()); container.appendChild(addBtn);
}

function createSimpleEditor(textareaId, fields){
    const data = safeParse(document.getElementById(textareaId).value) || [];
    const container = createContainerAfter(textareaId);
    if(!container) return;
    const title = document.createElement('div'); title.className='editor-header'; title.textContent=`${textareaId} (form view)`; container.appendChild(title);
    const list = document.createElement('div'); list.className='editor-list'; container.appendChild(list);
    function addItem(item={}){
        const row = document.createElement('div'); row.className='array-item simple-item';
        let html = '';
        fields.forEach(f => {
            html += `<input data-key="${f}" placeholder="${f}" value="${item[f]||''}" />`;
        });
        html += `<button class="btn btn-outline remove">Remove</button>`;
        row.innerHTML = html;
        row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); });
        list.appendChild(row);
    }
    data.forEach(d=>addItem(d));
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Add Item';
    addBtn.addEventListener('click', ()=>addItem()); container.appendChild(addBtn);
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
