// ═══════════════════════════════════════════════════════════════
// PAGE: DASHBOARD HOME
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { AuthService } from "../services/auth.js";
import { showToast } from "../components/Toast.js";

export class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = { stats: null, settings: null, loading: true };
  }

  fmtDate(d) {
    return new Date(d).toLocaleString("es-CO", {
      day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"
    });
  }

  actionMeta(action) {
    const map = {
      LOGIN:           { icon:"🔓", label:"Inicio sesión",      cls:"tag-info" },
      LOGOUT:          { icon:"🔒", label:"Cierre sesión",       cls:"tag-default" },
      UPDATE_SETTINGS: { icon:"⚙️",  label:"Actualizó config.",  cls:"tag-success" },
      UNDO_SETTINGS:   { icon:"↩️",  label:"Deshizo cambio",     cls:"tag-warning" },
      CREATE_USER:     { icon:"👤", label:"Creó usuario",        cls:"tag-warning" },
      UPDATE_USER:     { icon:"✏️",  label:"Editó usuario",      cls:"tag-warning" },
      DELETE_USER:     { icon:"🗑️",  label:"Eliminó usuario",    cls:"tag-danger" },
      CREATE_PRODUCTO: { icon:"📦", label:"Creó producto",       cls:"tag-success" },
      UPDATE_PRODUCTO: { icon:"📝", label:"Editó producto",      cls:"tag-info" },
      DELETE_PRODUCTO: { icon:"❌", label:"Eliminó producto",    cls:"tag-danger" },
      CREATE_PREGUNTA: { icon:"❓", label:"Creó pregunta",        cls:"tag-success" },
      UPDATE_PREGUNTA: { icon:"✏️",  label:"Editó pregunta",      cls:"tag-info" },
      DELETE_PREGUNTA: { icon:"🗑️",  label:"Eliminó pregunta",    cls:"tag-danger" },
      UPDATE_RESTRICCION_PREGUNTAS: { icon:"⏰", label:"Config. restricción", cls:"tag-warning" },
    };
    return map[action] || { icon:"📋", label: action, cls:"tag-default" };
  }

  render() {
    const { stats, settings, loading } = this.state;
    const isAdmin = AuthService.isAdmin();

    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    const hora = new Date();
    const hCOL = (hora.getUTCHours() - 5 + 24) % 24;
    const restricted = hCOL >= 0 && hCOL < 5;
    const horaBanner = restricted
      ? `<div class="alert alert-warning" style="margin-bottom:1.25rem;padding:.75rem 1rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;color:#92400e;font-size:.9rem">
          ⏰ <strong>Cambios bloqueados:</strong> El horario de mantenimiento es de 12:00 AM a 5:00 AM (hora Colombia). Los cambios de precios y productos no están disponibles ahora.
        </div>` : "";

    const recentActivity = stats?.recent_activity || [];

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Panel Principal</h1>
            <p class="page-subtitle">Bienvenido, ${AuthService.getFullName()}</p>
          </div>
          <div class="header-badge ${isAdmin ? "badge-admin" : "badge-manager"}">
            ${isAdmin ? "✦ Administrador" : "◈ Gerente"}
          </div>
        </div>

        ${horaBanner}

        <!-- STATS GRID -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Usuarios</span>
              <span class="stat-value">${stats?.total_users ?? "—"}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Productos activos</span>
              <span class="stat-value">${stats?.total_productos ?? "—"}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Preguntas activas</span>
              <span class="stat-value">${stats?.total_preguntas ?? "—"}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Acciones hoy</span>
              <span class="stat-value">${stats?.actions_today ?? "—"}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total acciones</span>
              <span class="stat-value">${stats?.total_actions ?? "—"}</span>
            </div>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS -->
        <h2 class="section-label" style="margin-top:1.75rem">⚡ Acciones rápidas</h2>
        <div class="quick-actions">
          <button class="quick-btn" data-nav="precios">
            <span class="quick-icon">💰</span>
            <span>Cambiar precios</span>
          </button>
          <button class="quick-btn" data-nav="productos">
            <span class="quick-icon">📦</span>
            <span>Gestionar tienda</span>
          </button>
          <button class="quick-btn" data-nav="sedes">
            <span class="quick-icon">🏢</span>
            <span>Sedes</span>
          </button>
          <button class="quick-btn" data-nav="telefonos">
            <span class="quick-icon">📞</span>
            <span>Teléfonos</span>
          </button>
          <button class="quick-btn" data-nav="media">
            <span class="quick-icon">🎨</span>
            <span>Contenido</span>
          </button>
          ${isAdmin ? `
          <button class="quick-btn" data-nav="usuarios">
            <span class="quick-icon">👥</span>
            <span>Usuarios</span>
          </button>
          <button class="quick-btn" data-nav="auditoria">
            <span class="quick-icon">📋</span>
            <span>Auditoría</span>
          </button>
          ` : ""}
        </div>

        <!-- ACTIVIDAD RECIENTE -->
        <h2 class="section-label" style="margin-top:1.75rem">🕒 Actividad reciente</h2>
        <div class="table-card">
          ${recentActivity.length === 0
            ? `<p style="padding:1.5rem;color:var(--text-sub);text-align:center">No hay actividad registrada todavía.</p>`
            : `<div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Acción</th>
                      <th>Usuario</th>
                      <th>Detalle</th>
                      <th>Fecha</th>
                      ${isAdmin ? "<th>Deshacer</th>" : ""}
                    </tr>
                  </thead>
                  <tbody>
                    ${recentActivity.map(entry => {
                      const { icon, label, cls } = this.actionMeta(entry.action);
                      const canUndo = isAdmin && entry.action === "UPDATE_SETTINGS" && entry.snapshot;
                      return `
                        <tr>
                          <td><span class="tag ${cls}">${icon} ${label}</span></td>
                          <td><code class="username-code">${entry.username}</code></td>
                          <td class="td-detail">${entry.detail || "—"}</td>
                          <td class="td-date">${this.fmtDate(entry.created_at)}</td>
                          ${isAdmin ? `<td>
                            ${canUndo
                              ? `<button class="icon-btn icon-btn-edit btn-undo" data-id="${entry.id}" title="Deshacer este cambio">↩️</button>`
                              : `<span style="color:var(--text-sub);font-size:.8rem">—</span>`
                            }
                          </td>` : ""}
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              </div>`
          }
        </div>

        ${isAdmin ? `<p style="font-size:.8rem;color:var(--text-sub);margin-top:.5rem">
          Para ver el historial completo y deshacer más cambios, ve a <strong>Auditoría</strong>.
        </p>` : ""}
      </div>
    `;
  }

  afterRender() {
    document.querySelectorAll(".quick-btn[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const path = "/" + btn.dataset.nav;
        this.props?.onNavigate?.(path, btn.dataset.nav);
      });
    });

    document.querySelectorAll(".btn-undo").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("¿Deshacer este cambio? Se restaurarán los valores anteriores.")) return;
        try {
          const res = await Api.undoAudit(id);
          showToast("↩️ " + res.message, "success");
          await this.load();
        } catch (err) {
          showToast(err.message || "Error al deshacer", "error");
        }
      });
    });
  }

  async load() {
    const [stats, settings] = await Promise.all([Api.getStats(), Api.getSettings()]);
    this.setState({ stats, settings, loading: false });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container === "string" ? document.querySelector(container) : container)
      .appendChild(this._el);
    this._mounted = true;
    await this.load();
    return this;
  }
}
