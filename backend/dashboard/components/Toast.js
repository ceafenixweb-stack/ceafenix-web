// ═══════════════════════════════════════════════════════════════
// TOAST COMPONENT
// Notificaciones tipo toast
// ═══════════════════════════════════════════════════════════════

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = "success", duration = 3500) {
  const container = getContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close">×</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));

  const remove = () => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".toast-close").addEventListener("click", remove);
  setTimeout(remove, duration);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function showModal({ title, content, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close-btn">×</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer">
        <button class="btn btn-ghost modal-cancel">${cancelText}</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"} modal-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  const close = () => {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 250);
  };

  overlay.querySelector(".modal-cancel").addEventListener("click", close);
  overlay.querySelector(".modal-close-btn").addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelector(".modal-confirm").addEventListener("click", async () => {
    if (onConfirm) await onConfirm();
    close();
  });

  return { close };
}
