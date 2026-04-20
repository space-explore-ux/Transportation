/* ============================================
   Vehicle Management CRM - Shared App JS
   ============================================ */

// --- Configuration ---
const API_BASE_URL = 'https://client-project-45sv.onrender.com/'; // Set your API base URL here, e.g. 'https://your-api.ngrok.io'

// --- Auth Helpers ---
function getToken() {
    return localStorage.getItem('crm_token');
}

function setToken(token) {
    localStorage.setItem('crm_token', token);
}

function setUser(user) {
    localStorage.setItem('crm_user', JSON.stringify(user));
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('crm_user')); } catch { return null; }
}

function logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// --- Theme System ---
function applyTheme() {
    const themeKey = localStorage.getItem('crm_theme') || 'purple';
    const theme = (typeof APP_THEMES !== 'undefined' && APP_THEMES[themeKey]) ? APP_THEMES[themeKey] : null;
    if (theme) {
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--primary-hover', theme.hover);
        document.documentElement.style.setProperty('--primary-light', theme.light);
        document.documentElement.style.setProperty('--primary-rgb', theme.rgb);
        document.documentElement.style.setProperty('--shadow-purple', `0 4px 14px rgba(${theme.rgb}, 0.2)`);
        // Update sidebar brand icon bg
        const iconEl = document.querySelector('.sidebar-brand-icon');
        if (iconEl) iconEl.style.background = theme.primary;
    }
}

// --- API Helper ---
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    // Remove headers from options to avoid duplication
    delete config.headers;

    const finalConfig = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    };

    try {
        const response = await fetch(url, finalConfig);
        const data = await response.json();

        if (!response.ok) {
            throw { status: response.status, message: data.message || data.error || 'Request failed', data };
        }

        return data;
    } catch (err) {
        if (err.status === 401) {
            logout();
        }
        throw err;
    }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;height:18px;flex-shrink:0"></i><span>${message}</span>`;

    container.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- Sidebar Toggle (Mobile) ---
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
}

// --- Set Active Sidebar Link ---
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

// --- User Greeting ---
function setUserGreeting() {
    const user = getUser();
    const greetingEl = document.getElementById('header-greeting-name');
    const avatarEl = document.getElementById('sidebar-avatar-text');
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');

    if (user) {
        const name = user.name || 'User';
        const hour = new Date().getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17) greeting = 'Good Evening';

        if (greetingEl) greetingEl.textContent = `${greeting}, ${name.split(' ')[0]}`;
        if (avatarEl) avatarEl.textContent = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = user.role || 'User';
    }
}

// --- Format Date ---
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Format Currency ---
function formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

// --- Days Until ---
function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// --- Expiry Status Dot ---
function expiryDotHTML(dateStr) {
    const days = daysUntil(dateStr);
    if (days === Infinity) return '';
    const dot = days <= 0 ? 'red' : days <= 30 ? 'yellow' : 'green';
    return `<span class="status-dot ${dot}"></span>`;
}

// --- Get Initials ---
function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// --- Avatar Color ---
function getAvatarColor(index) {
    const colors = ['purple', 'blue', 'emerald', 'amber', 'rose'];
    return colors[index % colors.length];
}

// --- Get Config Value ---
function getConfig(key, fallback) {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG[key] !== undefined) return APP_CONFIG[key];
    return fallback;
}

// --- Generate Sidebar HTML ---
function generateSidebarHTML(activePage = '') {
    const user = getUser();
    const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';
    const companyName = getConfig('companyName', 'Panze');
    const companyStudio = getConfig('companyStudio', 'studio.');
    const iconLetter = getConfig('iconLetter', 'C');

    const userMgmtLink = isAdmin ? `
            <a href="users.html" class="sidebar-link ${activePage === 'users' ? 'active' : ''}">
                <i data-lucide="users"></i> User Management
            </a>` : '';

    return `
    <div id="sidebar-overlay" class="sidebar-overlay"></div>
    <aside id="sidebar" class="sidebar">
        <div class="sidebar-brand">
            <div class="sidebar-brand-icon">${iconLetter}</div>
            <div class="sidebar-brand-text">${companyName} <span>${companyStudio}</span></div>
        </div>
        <nav class="sidebar-nav">
            <p class="sidebar-section-title">Menu</p>
            <a href="index.html" class="sidebar-link ${activePage === 'index' ? 'active' : ''}">
                <i data-lucide="layout-dashboard"></i> Dashboard
            </a>
            <a href="worklog.html" class="sidebar-link ${activePage === 'worklog' ? 'active' : ''}">
                <i data-lucide="clipboard-list"></i> Work Log
            </a>
            <a href="notifications.html" class="sidebar-link ${activePage === 'notifications' ? 'active' : ''}">
                <i data-lucide="bell"></i> Notifications
            </a>
            <a href="print.html" class="sidebar-link ${activePage === 'print' ? 'active' : ''}">
                <i data-lucide="printer"></i> Reports
            </a>

            <p class="sidebar-section-title" style="margin-top:1.5rem;">Management</p>
            <a href="owners.html" class="sidebar-link ${activePage === 'owners' ? 'active' : ''}">
                <i data-lucide="user-circle"></i> Owner Profiles
            </a>
            ${userMgmtLink}

            <p class="sidebar-section-title" style="margin-top:1.5rem;">Account</p>
            <a href="myprofile.html" class="sidebar-link ${activePage === 'myprofile' ? 'active' : ''}">
                <i data-lucide="circle-user"></i> My Profile
            </a>
            <a href="settings.html" class="sidebar-link ${activePage === 'settings' ? 'active' : ''}">
                <i data-lucide="settings"></i> Settings
            </a>
        </nav>
        <div class="sidebar-footer">
            <button class="sidebar-logout-btn" onclick="logout()">
                <i data-lucide="log-out" style="width:18px;height:18px;"></i>
                Logout
            </button>
        </div>
    </aside>`;
}

// --- Generate Header HTML ---
function generateHeaderHTML() {
    return `
    <header class="top-header">
        <div style="display:flex;align-items:center;">
            <button class="hamburger-btn" id="hamburger-btn">
                <i data-lucide="menu" style="width:24px;height:24px;"></i>
            </button>
            <div class="header-greeting">
                <h1 id="header-greeting-name">Good Morning, John</h1>
                <p>Your latest system updates here</p>
            </div>
        </div>
        <div class="header-actions">
            <a href="javascript:void(0)" class="cron-badge" onclick="window.location.reload()" title="Click to refresh">
                <i data-lucide="refresh-cw" style="width:14px;height:14px;color:var(--text-muted);"></i>
                <span>Refresh</span>
            </a>
            <div class="header-icons">
                <a href="notifications.html" class="header-icon-btn" title="Notifications">
                    <i data-lucide="bell" style="width:20px;height:20px;"></i>
                    <span class="badge-dot"></span>
                </a>
                <a href="settings.html" class="header-icon-btn" title="Settings">
                    <i data-lucide="settings" style="width:20px;height:20px;"></i>
                </a>
            </div>
        </div>
    </header>`;
}

// --- Card Pin/Unpin Toggle ---
function initCardPinToggle(cardsRowId, storageKey, containerId) {
    const row = document.getElementById(cardsRowId);
    if (!row) return;

    const btn = document.createElement('button');
    btn.className = 'pin-toggle-btn';
    btn.id = 'pinToggleBtn';

    const isPinned = localStorage.getItem(storageKey) !== 'hidden';

    function updateState(pinned) {
        if (pinned) {
            row.classList.remove('cards-hidden');
            btn.classList.add('pinned');
            btn.innerHTML = '<i data-lucide="pin" style="width:14px;height:14px;"></i> Cards Pinned';
            localStorage.setItem(storageKey, 'visible');
        } else {
            row.classList.add('cards-hidden');
            btn.classList.remove('pinned');
            btn.innerHTML = '<i data-lucide="pin-off" style="width:14px;height:14px;"></i> Cards Hidden';
            localStorage.setItem(storageKey, 'hidden');
        }
        lucide.createIcons({ nodes: [btn] });
    }

    updateState(isPinned);

    btn.addEventListener('click', () => {
        const currentlyPinned = !row.classList.contains('cards-hidden');
        updateState(!currentlyPinned);
    });

    // Append to specified container or create default wrapper
    const container = containerId ? document.getElementById(containerId) : null;
    if (container) {
        container.appendChild(btn);
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'pin-toggle-wrapper';
        wrapper.appendChild(btn);
        row.parentElement.insertBefore(wrapper, row);
    }
}

// --- Populate Vehicle Type Dropdown from Config ---
function populateVehicleTypes(selectId, includeAllOption = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const types = getConfig('vehicleTypes', ['Heavy Truck', 'Light Commercial', 'Bus', 'Trailer', 'Tanker']);
    select.innerHTML = '';
    if (includeAllOption) {
        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = 'All Types';
        select.appendChild(allOpt);
    } else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select type...';
        select.appendChild(placeholder);
    }
    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}

// --- Init Common ---
function initApp() {
    applyTheme();
    initSidebar();
    setUserGreeting();
    lucide.createIcons();
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
