// ═══════════════════════════════════════════════════════════════
// PAGE: AUDITORÍA (solo admin) — con botón deshacer
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

export class AuditoriaPage extends Component {
  constructor(props) {
    super(props);
    this.state = { logs: [], loading: true, filter: "" };
  }

  actionMeta(action) {
    const map = {
      LOGIN:           { label:"Inicio sesión",       cls:"tag-info" },
      LOGOUT:          { label:"Cierre sesión",        cls:"tag-default" },
      UPDATE_SETTINGS: { label:"Actualizó config.",   cls:"tag-success" },
      UNDO_SETTINGS:   { label:"Deshizo cambio",      cls:"tag-warning" },
      CREATE_USER:     { label:"Creó usuario",         cls:"tag-warning" },
      UPDATE_USER:     { label:"Editó usuario",        cls:"tag-warning" },
      DELETE_USER:     { label:"Eliminó usuario",      cls:"tag-danger" },
      CREATE_PRODUCTO: { label:"Creó producto",        cls:"tag-success" },
      UPDATE_PRODUCTO: { label:"Editó producto",       cls:"tag-info" },
      DELETE_PRODUCTO: { label:"Eliminó producto",     cls:"tag-danger" },
    };
    return map[action] || { label: action, cls:"tag-default" };
  }

  render() {
    const { logs, loading, filter } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    const filtered = filter
      ? logs.filter(l =>
          l.username.toLowerCase().includes(filter.toLowerCase()) ||
          l.action.toLowerCase().includes(filter.toLowerCase()) ||
          l.detail?.toLowerCase().includes(filter.toLowerCase())
        )
      : logs;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Registro de Auditoría</h1>
            <p class="page-subtitle">${logs.length} eventos registrados</p>
          </div>
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="filterInput" placeholder="Filtrar por usuario, acción..." value="${filter}" class="search-input">
          </div>
        </div>

        <div class="preview-card" style="margin-bottom:1rem">
          <p style="font-size:.85rem;color:var(--text-sub)">
            ↩️ El botón <strong>Deshacer</strong> aparece solo en cambios de configuración que tienen una instantánea guardada. Al deshacer se restauran los valores anteriores.
          </p>
        </div>

        <div class="table-card">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                  <th>Fecha y hora</th>
                  <th>Deshacer</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="6" class="td-empty">No se encontraron eventos</td></tr>
                ` : filtered.map((log, i) => {
                  const { label, cls } = this.actionMeta(log.action);
                  const canUndo = log.action === "UPDATE_SETTINGS" && log.snapshot;
                  return `
                    <tr>
                      <td class="td-num">${i + 1}</td>
                      <td><code class="username-code">${log.username}</code></td>
                      <td><span class="tag ${cls}">${label}</span></td>
                      <td class="td-detail">${log.detail || "—"}</td>
                      <td class="td-date">${new Date(log.created_at).toLocaleString("es-CO")}</td>
                      <td class="td-actions">
                        ${canUndo
                          ? `<button class="icon-btn icon-btn-edit btn-undo" data-id="${log.id}" title="Deshacer cambio">↩️</button>`
                          : `<span style="color:var(--text-sub);font-size:.8rem">—</span>`
                        }
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    document.getElementById("filterInput")?.addEventListener("input", (e) => {
      this.setState({ filter: e.target.value });
    });

    document.querySelectorAll(".btn-undo").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("¿Deshacer este cambio de configuración? Se restaurarán los valores anteriores.")) return;
        try {
          const res = await Api.undoAudit(id);
          showToast("↩️ " + res.message, "success");
          const logs = await Api.getAudit();
          this.setState({ logs });
        } catch (err) {
          showToast(err.message || "Error al deshacer", "error");
        }
      });
    });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container === "string" ? document.querySelector(container) : container).appendChild(this._el);
    this._mounted = true;
    const logs = await Api.getAudit();
    this.setState({ logs, loading: false });
    return this;
  }
}
