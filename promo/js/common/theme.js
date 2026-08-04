// AMEVA Theme Manager
export function initTheme() {
  const storedTheme = localStorage.getItem('promo-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', storedTheme);
  
  // Theme toggle button binding
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('promo-theme', next);
      updateToggleIcon(next);
    });
    updateToggleIcon(storedTheme);
  }
}

function updateToggleIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}
