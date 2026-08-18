// Premium Glassmorphism Modal Util
export function openModal(id, { title, body }) {
  let modal = document.getElementById(id);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'promo-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="promo-modal-window">
      <div class="promo-modal-header">
        <h3>${title}</h3>
        <button class="promo-modal-close-btn">&times;</button>
      </div>
      <div class="promo-modal-body">
        ${body}
      </div>
    </div>
  `;

  // Display triggers
  setTimeout(() => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }, 10);

  const close = () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 250);
  };

  modal.querySelector('.promo-modal-close-btn').addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}
