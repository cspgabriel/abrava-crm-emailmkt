const navItems = document.querySelectorAll('.nav-item');
const tabs = document.querySelectorAll('.dashboard, .app-view, .config-panel');
const sysLoader = document.getElementById('sys-loader');
const consoleLog = document.getElementById('console');

const statusCrm = document.getElementById('status-crm-local');
const statusSite = document.getElementById('status-site-local');

function log(msg, type = 'info') {
    const div = document.createElement('div');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (type === 'err') div.style.color = '#ef4444';
    consoleLog.prepend(div);
}

// Sidebar Navigation Logic
function switchTab(tabId) {
    if (sysLoader) sysLoader.classList.remove('hidden');

    // Remove active from all nav items
    navItems.forEach(item => item.classList.remove('active'));
    // Set active for current nav item
    const activeNav = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Hide all tabs
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    if (tabId === 'dashboard') {
        document.getElementById('tab-dashboard').classList.add('active');
    } else if (tabId === 'view-crm') {
        document.getElementById('wv-crm').classList.add('active');
    } else if (tabId === 'view-site') {
        document.getElementById('wv-site').classList.add('active');
    } else if (tabId === 'config') {
        document.getElementById('tab-config').classList.add('active');
    }

    // Hide loader after a delay
    setTimeout(() => {
        if (sysLoader) sysLoader.classList.add('hidden');
    }, 800);
}

// Bind Sidebar clicks
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
    });
});

// Windows Global for Dash Cards
window.switchTab = switchTab;

// Local Server Actions
async function toggleServer(name, statusEl, btn) {
    const isActive = statusEl.classList.contains('active');
    
    if (!isActive) {
        log(`Iniciando ${name} local...`);
        const res = await window.api.startServer(name);
        if (res.ok) {
            statusEl.classList.add('active');
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-outline');
        } else {
            log(`Erro ao iniciar ${name}: ${res.msg}`, 'err');
        }
    } else {
        log(`Parando ${name} local...`);
        const res = await window.api.stopServer(name);
        if (res.ok) {
            statusEl.classList.remove('active');
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
        }
    }
}

document.getElementById('local-crm').addEventListener('click', (e) => toggleServer('crm', statusCrm, e.currentTarget));
document.getElementById('local-site').addEventListener('click', (e) => toggleServer('site', statusSite, e.currentTarget));

// Auto-start toggle
const autostartCheck = document.getElementById('check-autostart');
window.api.getAutoStart().then(val => {
    autostartCheck.checked = val;
});

autostartCheck.addEventListener('change', async (e) => {
    await window.api.setAutoStart(e.target.checked);
    log(`Auto-start ${e.target.checked ? 'ativado' : 'desativado'}`);
});

// Process data listeners
window.api.onProcData(({ name, data }) => {
    if (data.includes('ready') || data.includes('Local:')) {
        log(`[${name}] ${data.trim()}`);
    }
});

window.api.onProcExit(({ name, code }) => {
    log(`[${name}] encerrou.`);
    const statusEl = name === 'crm' ? statusCrm : statusSite;
    const btnId = name === 'crm' ? 'local-crm' : 'local-site';
    const btn = document.getElementById(btnId);
    
    statusEl.classList.remove('active');
    if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    }
});
