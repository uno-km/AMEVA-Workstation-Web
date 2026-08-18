// Neon Toast Notification Module
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `promo-toast toast-${type}`;
  
  // Icon select
  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
               
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  
  // Slide in & Slide out
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
