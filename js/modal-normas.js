// modal-normas.js — Modal fullscreen para las tarjetas de señales de tránsito
// Abre al hacer clic (o Enter/Espacio con teclado) sobre una .norma-card
// y muestra la imagen de esa categoría ampliada en toda la pantalla.

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('norma-modal');
  if (!modal) return;

  const modalImg   = document.getElementById('norma-modal-img');
  const modalTitle = document.getElementById('norma-modal-title');
  const modalDesc  = document.getElementById('norma-modal-desc');
  const closeBtn   = modal.querySelector('.norma-modal-close');
  const cards      = document.querySelectorAll('.norma-card[data-img]');

  function openModal(card) {
    const { img, title, desc } = card.dataset;
    modalImg.src        = img;
    modalImg.alt        = title || 'Señal de tránsito';
    modalTitle.textContent = title || '';
    modalDesc.textContent  = desc || '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  cards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
});
