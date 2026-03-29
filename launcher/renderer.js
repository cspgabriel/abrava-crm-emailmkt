const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view-content, .app-view');

function switchTab(tabId) {
    // Nav Items Update
    navItems.forEach(item => item.classList.remove('active'));
    const targetNav = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetNav) targetNav.classList.add('active');

    // Views Update
    views.forEach(v => v.classList.remove('active'));
    if (tabId === 'dashboard') {
        document.getElementById('tab-dashboard').classList.add('active');
    } else if (tabId === 'view-crm') {
        document.getElementById('wv-crm').classList.add('active');
    } else if (tabId === 'view-site') {
        document.getElementById('wv-site').classList.add('active');
    } else if (tabId === 'config') {
        document.getElementById('tab-config').classList.add('active');
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        switchTab(tabId);
    });
});

window.switchTab = switchTab;
