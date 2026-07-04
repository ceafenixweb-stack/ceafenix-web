// modal-tienda.js — Gestión del modal de producto
// Las cards son dinámicas (creadas por fetch), así que aquí
// solo manejamos el cierre del modal. La apertura la hace buildCard en store.html.

document.addEventListener('DOMContentLoaded', () => {
  const modal      = document.getElementById('product-modal');
  const closeBtn   = document.querySelector('.close-modal');
  if (!modal) return;

  // Cerrar con la X
  if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

  // Cerrar al clic fuera del contenido
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.style.display = 'none';
  });
});
