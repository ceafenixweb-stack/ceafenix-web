// ═══════════════════════════════════════════════════════════════
// PAGE: TIPS DE CONDUCCIÓN SEGURA
// Modal fuera del componente (portal al body) para evitar
// que setState destruya el modal mientras está abierto.
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const ICONOS = [
  { valor:"fa-solid fa-car",                  label:"Auto"         },
  { valor:"fa-solid fa-motorcycle",           label:"Moto"         },
  { valor:"fa-solid fa-road",                 label:"Carretera"    },
  { valor:"fa-solid fa-helmet-safety",        label:"Casco"        },
  { valor:"fa-solid fa-shield-halved",        label:"Escudo"       },
  { valor:"fa-solid fa-triangle-exclamation", label:"Alerta"       },
  { valor:"fa-solid fa-eye",                  label:"Atención"     },
  { valor:"fa-solid fa-gauge-high",           label:"Velocidad"    },
  { valor:"fa-solid fa-moon",                 label:"Nocturno"     },
  { valor:"fa-solid fa-cloud-rain",           label:"Lluvia"       },
  { valor:"fa-solid fa-traffic-light",        label:"Semáforo"     },
  { valor:"fa-solid fa-mobile-screen-button", label:"Celular"      },
  { valor:"fa-solid fa-wine-bottle",          label:"Alcohol"      },
  { valor:"fa-solid fa-lightbulb",            label:"Consejo"      },
  { valor:"fa-solid fa-circle-check",         label:"Check"        },
  { valor:"fa-solid fa-person-walking",       label:"Peatón"       },
  { valor:"fa-solid fa-fire-extinguisher",    label:"Extintor"     },
  { valor:"fa-solid fa-kit-medical",          label:"Primeros aux" },
];

export class TipsPage extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, tips: [] };
    this._overlay = null; // modal vive en el body, no en el componente
  }

  // ── Datos ────────────────────────────────────────────────────
  async cargarDatos() {
    try {
      const tips = await Api.getTips();
      this.setState({ tips, loading: false });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  // ── Modal como portal al body ────────────────────────────────
  _abrirModal(tip = null) {
    this._cerrarModal();
    const esNuevo = !tip;
    const datos = tip ?? { titulo:"", descripcion:"", icono:"fa-solid fa-lightbulb", activo:true, orden: this.state.tips.length };
    let iconoSel = datos.icono || "fa-solid fa-lightbulb";

    const overlay = document.createElement("div");
    overlay.id = "tips-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:560px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;display:flex;flex-direction:column;max-height:90vh">
        <!-- Header -->
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0;color:var(--title)">${esNuevo ? "➕ Nuevo tip" : "✏️ Editar tip"}</h2>
          <button id="tip-modal-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub);line-height:1">✕</button>
        </div>

        <!-- Body -->
        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1">

          <div class="form-group">
            <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:5px">Título *</label>
            <input id="tip-titulo" class="input" type="text" placeholder="Ej: Manejo defensivo" value="${datos.titulo || ""}">
          </div>

          <div class="form-group">
            <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:5px">Descripción *</label>
            <textarea id="tip-desc" class="input" rows="3" placeholder="Descripción breve del tip...">${datos.descripcion || ""}</textarea>
          </div>

          <!-- Selector de iconos -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:5px">Icono</label>
            <div id="tip-iconos-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px;max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;padding:8px;background:var(--surface-2,#f8fafc)">
              ${ICONOS.map(ic => `
                <button type="button" data-icono="${ic.valor}"
                  style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:8px;
                  border:1.5px solid ${ic.valor === iconoSel ? "var(--primary)" : "transparent"};
                  background:${ic.valor === iconoSel ? "#eff6ff" : "var(--surface)"};
                  color:${ic.valor === iconoSel ? "var(--primary)" : "var(--text-sub)"};
                  cursor:pointer;font-size:11px;transition:all .15s">
                  <i class="${ic.valor}" style="font-size:1.2rem"></i>
                  <span>${ic.label}</span>
                </button>`).join("")}
            </div>
          </div>

          <!-- Vista previa -->
          <div>
            <label style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:8px">Vista previa</label>
            <div id="tip-preview" style="background:white;padding:20px;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,.08);text-align:center;border:1px solid var(--border)">
              <i id="tip-prev-icono" class="${iconoSel}" style="font-size:2rem;color:var(--primary);display:block;margin-bottom:8px"></i>
              <h3 id="tip-prev-titulo" style="font-size:15px;font-weight:700;color:#2e2e2e;margin:0 0 6px">${datos.titulo || "Título del tip"}</h3>
              <p id="tip-prev-desc" style="font-size:13px;color:#555;line-height:1.5;margin:0">${datos.descripcion || "Descripción del tip..."}</p>
            </div>
          </div>

          <!-- Orden y activo -->
          <div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:end">
            <div class="form-group" style="margin:0">
              <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:5px">Orden</label>
              <input id="tip-orden" class="input" type="number" min="0" value="${datos.orden ?? this.state.tips.length}">
            </div>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding-bottom:8px">
              <input type="checkbox" id="tip-activo" ${datos.activo !== false && datos.activo !== 0 ? "checked" : ""} style="width:16px;height:16px;cursor:pointer">
              <span style="font-size:13px;font-weight:500;color:var(--text)">Visible en el sitio</span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="tip-modal-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="tip-modal-save" class="btn btn-primary">💾 ${esNuevo ? "Crear tip" : "Guardar cambios"}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity .2s";
      requestAnimationFrame(() => overlay.style.opacity = "1");
    });

    // ── Eventos del modal ──────────────────────────────────────
    overlay.querySelector("#tip-modal-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#tip-modal-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if (e.target === overlay) this._cerrarModal(); });

    // Selector de iconos
    overlay.querySelectorAll("#tip-iconos-grid button").forEach(btn => {
      btn.addEventListener("click", () => {
        iconoSel = btn.dataset.icono;
        overlay.querySelectorAll("#tip-iconos-grid button").forEach(b => {
          b.style.border    = "1.5px solid transparent";
          b.style.background = "var(--surface)";
          b.style.color     = "var(--text-sub)";
        });
        btn.style.border    = "1.5px solid var(--primary)";
        btn.style.background = "#eff6ff";
        btn.style.color     = "var(--primary)";
        overlay.querySelector("#tip-prev-icono").className = iconoSel;
      });
    });

    // Preview en tiempo real
    overlay.querySelector("#tip-titulo").addEventListener("input", e => {
      overlay.querySelector("#tip-prev-titulo").textContent = e.target.value || "Título del tip";
    });
    overlay.querySelector("#tip-desc").addEventListener("input", e => {
      overlay.querySelector("#tip-prev-desc").textContent = e.target.value || "Descripción del tip...";
    });

    // Guardar
    overlay.querySelector("#tip-modal-save").addEventListener("click", async () => {
      const titulo      = overlay.querySelector("#tip-titulo").value.trim();
      const descripcion = overlay.querySelector("#tip-desc").value.trim();
      const activo      = overlay.querySelector("#tip-activo").checked;
      const orden       = parseInt(overlay.querySelector("#tip-orden").value) || 0;

      if (!titulo)      return showToast("El título es obligatorio", "error");
      if (!descripcion) return showToast("La descripción es obligatoria", "error");

      const saveBtn = overlay.querySelector("#tip-modal-save");
      saveBtn.disabled    = true;
      saveBtn.textContent = "Guardando...";

      try {
        if (esNuevo) {
          await Api.createTip({ titulo, descripcion, icono: iconoSel, activo, orden });
          showToast("✅ Tip creado correctamente", "success");
        } else {
          await Api.updateTip(datos.id, { titulo, descripcion, icono: iconoSel, activo, orden });
          showToast("✅ Tip actualizado correctamente", "success");
        }
        this._cerrarModal();
        const tips = await Api.getTips();
        this.setState({ tips });
      } catch (e) {
        showToast(e.message || "Error al guardar", "error");
        saveBtn.disabled    = false;
        saveBtn.textContent = esNuevo ? "💾 Crear tip" : "💾 Guardar cambios";
      }
    });

    // Focus
    setTimeout(() => overlay.querySelector("#tip-titulo")?.focus(), 60);
  }

  _cerrarModal() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  destroy() {
    this._cerrarModal();
    super.destroy?.();
    if (this._el) this._el.remove();
    this._mounted = false;
  }

  // ── Render ───────────────────────────────────────────────────
  render() {
    const { loading, tips } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando tips...</p></div>`;

    const activos   = tips.filter(t => t.activo).length;
    const inactivos = tips.length - activos;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Tips de Conducción Segura</h1>
            <p class="page-subtitle">Gestiona las cards que aparecen en la página de normas</p>
          </div>
          <button class="btn btn-primary" id="btn-nuevo-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo tip
          </button>
        </div>

        <div class="stats-grid" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="stat-info"><span class="stat-label">Total tips</span><span class="stat-value">${tips.length}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="stat-info"><span class="stat-label">Visibles</span><span class="stat-value">${activos}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
            </div>
            <div class="stat-info"><span class="stat-label">Ocultos</span><span class="stat-value">${inactivos}</span></div>
          </div>
        </div>

        ${tips.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">💡</div>
            <h3>No hay tips todavía</h3>
            <p>Crea el primer tip de conducción segura.</p>
            <button class="btn btn-primary" id="btn-nuevo-tip-empty">+ Nuevo tip</button>
          </div>
        ` : `
          <div class="tips-dashboard-grid">
            ${tips.map(tip => `
              <div class="tip-dashboard-card ${!tip.activo ? "tip-inactivo" : ""}">
                <div class="tip-dc-preview">
                  <i class="${tip.icono || "fa-solid fa-lightbulb"}"></i>
                  <h3>${tip.titulo}</h3>
                  <p>${tip.descripcion}</p>
                </div>
                <div class="tip-dc-footer">
                  <span class="badge ${tip.activo ? "badge-success" : "badge-default"}">${tip.activo ? "Visible" : "Oculto"}</span>
                  <span style="font-size:11px;color:var(--text-sub)">Orden: ${tip.orden}</span>
                  <div class="table-actions" style="margin-left:auto">
                    <button class="btn-icon btn-edit" data-id="${tip.id}" title="Editar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${tip.id}" title="Eliminar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>`).join("")}
          </div>
        `}
      </div>`;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }

    document.getElementById("btn-nuevo-tip")?.addEventListener("click",       () => this._abrirModal());
    document.getElementById("btn-nuevo-tip-empty")?.addEventListener("click", () => this._abrirModal());

    document.querySelectorAll(".btn-edit").forEach(btn =>
      btn.addEventListener("click", () => {
        const tip = this.state.tips.find(t => t.id === parseInt(btn.dataset.id));
        if (tip) this._abrirModal(tip);
      })
    );

    document.querySelectorAll(".btn-delete").forEach(btn =>
      btn.addEventListener("click", async () => {
        const tip = this.state.tips.find(t => t.id === parseInt(btn.dataset.id));
        if (!tip || !confirm(`¿Eliminar el tip "${tip.titulo}"?`)) return;
        try {
          await Api.deleteTip(tip.id);
          showToast("Tip eliminado", "success");
          const tips = await Api.getTips();
          this.setState({ tips });
        } catch (e) { showToast(e.message, "error"); }
      })
    );
  }
}
