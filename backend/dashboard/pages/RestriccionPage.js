// ═══════════════════════════════════════════════════════════════
// PAGE: RESTRICCIÓN HORARIA — Control global de edición
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

export class RestriccionPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      guardando: false,
      global: { activa: false, hora_inicio: 0, hora_fin: 24 },
      preguntas: { activa: false, hora_inicio: 8, hora_fin: 18 },
    };
  }

  async cargarDatos() {
    try {
      const [global, preguntas] = await Promise.all([
        Api.getRestriccion(),
        Api.getRestriccionPreguntas(),
      ]);
      this.setState({ global, preguntas, loading: false });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  async guardarGlobal() {
    const activa      = document.getElementById("g-activa")?.checked ?? false;
    const hora_inicio = parseInt(document.getElementById("g-inicio")?.value ?? "0");
    const hora_fin    = parseInt(document.getElementById("g-fin")?.value ?? "24");
    if (activa && hora_inicio >= hora_fin)
      return showToast("La hora de inicio debe ser menor a la de fin", "error");
    this.setState({ guardando: true });
    try {
      await Api.updateRestriccion({ activa, hora_inicio, hora_fin });
      this.setState({ global: { activa, hora_inicio, hora_fin }, guardando: false });
      showToast(activa
        ? `✅ Restricción activada: solo se puede editar entre ${String(hora_inicio).padStart(2,"0")}:00 y ${String(hora_fin).padStart(2,"0")}:00`
        : "🔓 Restricción desactivada — se puede editar en cualquier momento",
        "success");
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ guardando: false });
    }
  }

  async guardarPreguntas() {
    const activa      = document.getElementById("p-activa")?.checked ?? false;
    const hora_inicio = parseInt(document.getElementById("p-inicio")?.value ?? "8");
    const hora_fin    = parseInt(document.getElementById("p-fin")?.value ?? "18");
    if (activa && hora_inicio >= hora_fin)
      return showToast("La hora de inicio debe ser menor a la de fin", "error");
    this.setState({ guardando: true });
    try {
      await Api.updateRestriccionPreguntas({ activa, hora_inicio, hora_fin });
      this.setState({ preguntas: { activa, hora_inicio, hora_fin }, guardando: false });
      showToast(activa
        ? `✅ Restricción de preguntas activada: ${String(hora_inicio).padStart(2,"0")}:00–${String(hora_fin).padStart(2,"0")}:00`
        : "🔓 Restricción de preguntas desactivada",
        "success");
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ guardando: false });
    }
  }

  horaActualColombia() {
    const now  = new Date();
    const h    = (now.getUTCHours() - 5 + 24) % 24;
    const m    = now.getUTCMinutes();
    return { h, m, str: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}` };
  }

  estaBloquedaGlobal() {
    const { activa, hora_inicio, hora_fin } = this.state.global;
    if (!activa) return false;
    const { h, m } = this.horaActualColombia();
    const ahora = h + m / 60;
    return ahora < hora_inicio || ahora >= hora_fin;
  }

  renderPanel({ id, titulo, icono, descripcion, cfg, onGuardar, idPrefix }) {
    const { activa, hora_inicio, hora_fin } = cfg;
    const horas = Array.from({ length: 25 }, (_, i) => i);
    const { str: horaStr } = this.horaActualColombia();

    return `
      <div class="restriccion-card ${activa ? "card-warning" : "card-ok"}">
        <!-- Header -->
        <div class="rcard-header">
          <div class="rcard-icon ${activa ? "ricon-warning" : "ricon-ok"}">${icono}</div>
          <div class="rcard-title-wrap">
            <h3>${titulo}</h3>
            <p>${descripcion}</p>
          </div>
          <div class="rcard-estado ${activa ? "estado-restringido" : "estado-libre"}">
            ${activa ? "🔒 Activa" : "🔓 Libre"}
          </div>
        </div>

        <!-- Hora actual -->
        <div class="rcard-hora-actual">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Hora actual en Colombia: <strong>${horaStr}</strong>
          ${activa ? `— ${this._estadoTexto(cfg)}` : ""}
        </div>

        <!-- Controles -->
        <div class="rcard-body">

          <!-- Toggle activar/desactivar -->
          <div class="rcard-row">
            <div>
              <label class="field-label" style="margin:0">Estado de la restricción</label>
              <p class="field-hint">Al activar, solo se permiten cambios en el horario configurado abajo.</p>
            </div>
            <label class="big-toggle">
              <input type="checkbox" id="${idPrefix}-activa" ${activa ? "checked" : ""}>
              <span class="big-toggle-track">
                <span class="big-toggle-thumb"></span>
              </span>
              <span class="big-toggle-text" id="${idPrefix}-toggle-label">
                ${activa ? "Activa" : "Inactiva"}
              </span>
            </label>
          </div>

          <!-- Horario -->
          <div class="rcard-horario ${!activa ? "horario-disabled" : ""}">
            <div class="field-group">
              <label class="field-label">Permitir ediciones desde</label>
              <select id="${idPrefix}-inicio" class="form-select" ${!activa ? "disabled" : ""}>
                ${horas.map(h => `<option value="${h}" ${hora_inicio === h ? "selected" : ""}>${String(h).padStart(2,"0")}:00</option>`).join("")}
              </select>
            </div>
            <div class="rcard-horario-sep">hasta</div>
            <div class="field-group">
              <label class="field-label">Hasta las</label>
              <select id="${idPrefix}-fin" class="form-select" ${!activa ? "disabled" : ""}>
                ${horas.map(h => `<option value="${h}" ${hora_fin === h ? "selected" : ""}>${String(h).padStart(2,"0")}:00</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Info -->
          <div class="rcard-info ${activa ? "info-warning" : "info-ok"}">
            ${activa
              ? `⚠️ Solo se pueden hacer cambios entre las <strong>${String(hora_inicio).padStart(2,"0")}:00</strong> y las <strong>${String(hora_fin).padStart(2,"0")}:00</strong> (hora Colombia). Fuera de ese horario el botón de guardar queda bloqueado.`
              : `✅ Sin restricción horaria activa. Los cambios se pueden hacer en <strong>cualquier momento</strong>.`}
          </div>

          <button class="btn btn-primary" id="${idPrefix}-guardar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            Guardar configuración
          </button>
        </div>
      </div>
    `;
  }

  _estadoTexto({ activa, hora_inicio, hora_fin }) {
    if (!activa) return "";
    const { h, m } = this.horaActualColombia();
    const ahora = h + m / 60;
    const dentro = ahora >= hora_inicio && ahora < hora_fin;
    return dentro
      ? `<span style="color:#16a34a">✅ Dentro del horario permitido</span>`
      : `<span style="color:#dc2626">🚫 Fuera del horario — edición bloqueada</span>`;
  }

  render() {
    const { loading, guardando, global, preguntas } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    const bloqueada = this.estaBloquedaGlobal();

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Restricción Horaria</h1>
            <p class="page-subtitle">Controla en qué horario se pueden hacer cambios en el dashboard</p>
          </div>
        </div>

        <!-- Alerta si está activa y bloqueada ahora mismo -->
        ${bloqueada ? `
          <div class="alert alert-danger" style="margin-bottom:1.5rem">
            🚫 <strong>En este momento la edición está bloqueada</strong> por la restricción horaria global.
            Como superadministrador puedes desactivarla abajo para hacer cambios de inmediato.
          </div>
        ` : ""}

        <div class="restriccion-grid">

          ${this.renderPanel({
            id: "global",
            idPrefix: "g",
            titulo: "Restricción Global",
            icono: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
            descripcion: "Aplica a precios, productos, sedes, teléfonos y ajustes generales.",
            cfg: global,
            idPrefix: "g",
          })}

          ${this.renderPanel({
            id: "preguntas",
            idPrefix: "p",
            titulo: "Restricción — Banco de Preguntas",
            icono: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            descripcion: "Aplica solo al banco de preguntas para exámenes.",
            cfg: preguntas,
            idPrefix: "p",
          })}

        </div>

        <!-- Tabla informativa -->
        <div class="form-card" style="margin-top:1.5rem">
          <div class="form-card-header">
            <div class="form-card-icon icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div><h3>¿Cómo funciona?</h3></div>
          </div>
          <div class="info-table-wrap">
            <table class="data-table">
              <thead><tr><th>Escenario</th><th>Resultado</th></tr></thead>
              <tbody>
                <tr><td>Restricción <strong>inactiva</strong></td><td>✅ Se puede editar en cualquier momento</td></tr>
                <tr><td>Restricción <strong>activa</strong>, dentro del horario</td><td>✅ Edición permitida normalmente</td></tr>
                <tr><td>Restricción <strong>activa</strong>, fuera del horario</td><td>🚫 Botón bloqueado — aparece mensaje de error</td></tr>
                <tr><td>Superadmin fuera del horario</td><td>⚠️ Bloqueado igual, pero puede desactivar la restricción desde esta página</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }
    this._bindEvents();
  }

  _bindEvents() {
    // Toggle activa → habilita/deshabilita los selects
    ["g", "p"].forEach(pfx => {
      const chk = document.getElementById(`${pfx}-activa`);
      chk?.addEventListener("change", e => {
        const on = e.target.checked;
        document.getElementById(`${pfx}-inicio`).disabled = !on;
        document.getElementById(`${pfx}-fin`).disabled    = !on;
        const lbl = document.getElementById(`${pfx}-toggle-label`);
        if (lbl) lbl.textContent = on ? "Activa" : "Inactiva";
        // Actualiza la clase del horario para el estilo visual
        const horario = document.getElementById(`${pfx}-inicio`)?.closest(".rcard-horario");
        if (horario) horario.classList.toggle("horario-disabled", !on);
      });
    });

    document.getElementById("g-guardar")?.addEventListener("click", () => this.guardarGlobal());
    document.getElementById("p-guardar")?.addEventListener("click", () => this.guardarPreguntas());
  }
}
