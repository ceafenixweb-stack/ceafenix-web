// ═══════════════════════════════════════════════════════════════
// PAGE: PREGUNTAS — Gestión de banco de preguntas con restricción horaria
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { AuthService } from "../services/auth.js";
import { showToast } from "../components/Toast.js";

export class PreguntasPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      preguntas: [],
      loading: true,
      restriccion: { activa: false, hora_inicio: 8, hora_fin: 18 },
      modalAbierto: false,
      modoEdicion: false,
      preguntaActual: null,
      filtroCategoria: "",
      filtroTexto: "",
      guardando: false,
      // Formulario
      form: {
        enunciado: "",
        opciones: ["", "", "", ""],
        respuesta_correcta: 0,
        explicacion: "",
        categoria: "General",
        activo: true,
        orden: 0,
      },
    };
    this.isAdmin = AuthService.isAdmin();
    this._handlers = {};
  }

  async cargarDatos() {
    try {
      const [preguntas, restriccion] = await Promise.all([
        Api.getPreguntas(),
        Api.getRestriccionPreguntas(),
      ]);
      this.setState({ preguntas, restriccion, loading: false });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  getCategorias() {
    const cats = [...new Set(this.state.preguntas.map(p => p.categoria || "General"))];
    return ["General", "Señales", "Normas", "Mecánica", "Seguridad", ...cats.filter(c => !["General","Señales","Normas","Mecánica","Seguridad"].includes(c))];
  }

  preguntasFiltradas() {
    return this.state.preguntas.filter(p => {
      const cat = !this.state.filtroCategoria || p.categoria === this.state.filtroCategoria;
      const txt = !this.state.filtroTexto || p.enunciado.toLowerCase().includes(this.state.filtroTexto.toLowerCase());
      return cat && txt;
    });
  }

  abrirModalNueva() {
    this.setState({
      modalAbierto: true,
      modoEdicion: false,
      preguntaActual: null,
      form: {
        enunciado: "",
        opciones: ["", "", "", ""],
        respuesta_correcta: 0,
        explicacion: "",
        categoria: "General",
        activo: true,
        orden: this.state.preguntas.length,
      },
    });
  }

  abrirModalEdicion(pregunta) {
    const opciones = [...(pregunta.opciones || ["", "", ""])];
    while (opciones.length < 2) opciones.push("");
    this.setState({
      modalAbierto: true,
      modoEdicion: true,
      preguntaActual: pregunta,
      form: {
        enunciado: pregunta.enunciado || "",
        opciones,
        respuesta_correcta: pregunta.respuesta_correcta || 0,
        explicacion: pregunta.explicacion || "",
        categoria: pregunta.categoria || "General",
        activo: pregunta.activo !== 0,
        orden: pregunta.orden || 0,
      },
    });
  }

  cerrarModal() {
    this.setState({ modalAbierto: false, preguntaActual: null });
  }

  async guardar(force = false) {
    const { form, modoEdicion, preguntaActual } = this.state;
    if (!form.enunciado.trim()) return showToast("El enunciado es obligatorio", "error");
    const opcionesValidas = form.opciones.filter(o => o.trim());
    if (opcionesValidas.length < 2) return showToast("Se necesitan mínimo 2 opciones", "error");
    if (form.respuesta_correcta >= opcionesValidas.length)
      return showToast("Selecciona una opción correcta válida", "error");

    this.setState({ guardando: true });
    try {
      const payload = { ...form, opciones: opcionesValidas };
      if (modoEdicion) {
        await Api.updatePregunta(preguntaActual.id, payload, force);
        showToast("Pregunta actualizada correctamente", "success");
      } else {
        await Api.createPregunta(payload, force);
        showToast("Pregunta creada correctamente", "success");
      }
      const preguntas = await Api.getPreguntas();
      this.setState({ preguntas, modalAbierto: false, guardando: false });
    } catch (e) {
      if (e.restricted && e.allowForce && this.isAdmin) {
        if (confirm(`⏰ ${e.message}\n\n¿Forzar cambio como superadministrador?`)) {
          this.setState({ guardando: false });
          return this.guardar(true);
        }
      } else {
        showToast(e.message, "error");
      }
      this.setState({ guardando: false });
    }
  }

  async eliminar(pregunta, force = false) {
    if (!confirm(`¿Eliminar la pregunta?\n\n"${pregunta.enunciado.substring(0, 80)}..."`)) return;
    try {
      await Api.deletePregunta(pregunta.id, force);
      showToast("Pregunta eliminada", "success");
      const preguntas = await Api.getPreguntas();
      this.setState({ preguntas });
    } catch (e) {
      if (e.restricted && e.allowForce && this.isAdmin) {
        if (confirm(`⏰ ${e.message}\n\n¿Forzar eliminación como superadministrador?`)) {
          return this.eliminar(pregunta, true);
        }
      } else {
        showToast(e.message, "error");
      }
    }
  }

  async guardarRestriccion(activa, hora_inicio, hora_fin) {
    try {
      await Api.updateRestriccionPreguntas({ activa, hora_inicio, hora_fin });
      showToast("Restricción horaria actualizada", "success");
      const restriccion = await Api.getRestriccionPreguntas();
      this.setState({ restriccion });
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  renderRestriccionPanel() {
    const { restriccion } = this.state;
    const horas = Array.from({ length: 24 }, (_, i) => i);
    return `
      <div class="restriccion-panel">
        <div class="restriccion-header">
          <div class="restriccion-icon ${restriccion.activa ? "icon-warning" : "icon-green"}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h3>Restricción Horaria para Edición</h3>
            <p>Solo el superadministrador puede activar, desactivar o modificar este horario.</p>
          </div>
          <div class="restriccion-estado ${restriccion.activa ? "estado-activo" : "estado-inactivo"}">
            ${restriccion.activa ? "🔒 Activa" : "🔓 Inactiva"}
          </div>
        </div>
        <div class="restriccion-body">
          <div class="restriccion-row">
            <label>Estado de la restricción</label>
            <div class="toggle-group">
              <button class="btn-toggle ${restriccion.activa ? "toggle-on" : ""}" id="btn-restriccion-on">Activar</button>
              <button class="btn-toggle ${!restriccion.activa ? "toggle-off" : ""}" id="btn-restriccion-off">Desactivar</button>
            </div>
          </div>
          <div class="restriccion-row">
            <label>Hora de inicio (solo se permiten ediciones desde)</label>
            <select id="sel-hora-inicio" class="form-select" ${!restriccion.activa ? "disabled" : ""}>
              ${horas.map(h => `<option value="${h}" ${restriccion.hora_inicio === h ? "selected" : ""}>${String(h).padStart(2,"0")}:00</option>`).join("")}
            </select>
          </div>
          <div class="restriccion-row">
            <label>Hora de fin (hasta cuándo se permiten ediciones)</label>
            <select id="sel-hora-fin" class="form-select" ${!restriccion.activa ? "disabled" : ""}>
              ${horas.map(h => `<option value="${h}" ${restriccion.hora_fin === h ? "selected" : ""}>${String(h).padStart(2,"0")}:00</option>`).join("")}
            </select>
          </div>
          <div class="restriccion-info">
            ${restriccion.activa
              ? `ℹ️ Las ediciones solo están permitidas entre las <strong>${String(restriccion.hora_inicio).padStart(2,"0")}:00</strong> y las <strong>${String(restriccion.hora_fin).padStart(2,"0")}:00</strong> (hora Colombia).`
              : "ℹ️ No hay restricción horaria activa. Las preguntas pueden editarse en cualquier momento."}
          </div>
          <button class="btn btn-primary" id="btn-guardar-restriccion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar configuración
          </button>
        </div>
      </div>
    `;
  }

  renderModal() {
    const { form, modoEdicion, guardando } = this.state;
    const categorias = this.getCategorias();
    return `
      <div class="modal-overlay active" id="modal-pregunta">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">${modoEdicion ? "✏️ Editar Pregunta" : "➕ Nueva Pregunta"}</h2>
            <button class="modal-close" id="btn-cerrar-modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">

            <!-- Enunciado -->
            <div class="field-group">
              <label class="field-label">Enunciado de la pregunta <span class="required">*</span></label>
              <textarea id="f-enunciado" class="form-input form-textarea" rows="3" placeholder="Escribe aquí la pregunta completa...">${form.enunciado}</textarea>
            </div>

            <!-- Opciones -->
            <div class="field-group">
              <div class="field-label-row">
                <label class="field-label">Opciones de respuesta <span class="required">*</span></label>
                <button class="btn btn-sm btn-ghost" id="btn-add-opcion">+ Agregar opción</button>
              </div>
              <p class="field-hint">Selecciona el círculo verde de la opción correcta.</p>
              <div id="opciones-lista">
                ${form.opciones.map((op, i) => this.renderOpcion(op, i, form.respuesta_correcta)).join("")}
              </div>
            </div>

            <!-- Fila categoría + activo + orden -->
            <div class="form-row-3">
              <div class="field-group">
                <label class="field-label">Categoría</label>
                <select id="f-categoria" class="form-select">
                  ${categorias.map(c => `<option value="${c}" ${form.categoria === c ? "selected" : ""}>${c}</option>`).join("")}
                  <option value="__nueva">+ Nueva categoría...</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Orden</label>
                <input id="f-orden" type="number" class="form-input" value="${form.orden}" min="0">
              </div>
              <div class="field-group">
                <label class="field-label">Estado</label>
                <label class="toggle-label">
                  <input type="checkbox" id="f-activo" ${form.activo ? "checked" : ""}>
                  <span class="toggle-track"></span>
                  <span class="toggle-text">Activa</span>
                </label>
              </div>
            </div>

            <!-- Explicación -->
            <div class="field-group">
              <label class="field-label">Explicación (opcional)</label>
              <textarea id="f-explicacion" class="form-input form-textarea" rows="2" placeholder="Explicación de por qué es la respuesta correcta (opcional)...">${form.explicacion}</textarea>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btn-cancelar-modal">Cancelar</button>
            <button class="btn btn-primary" id="btn-guardar" ${guardando ? "disabled" : ""}>
              ${guardando ? `<span class="spinner-sm"></span> Guardando...` : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ${modoEdicion ? "Guardar cambios" : "Crear pregunta"}`}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderOpcion(texto, index, correcta) {
    return `
      <div class="opcion-row" data-index="${index}">
        <button class="opcion-radio ${correcta === index ? "opcion-correcta" : ""}" data-opcion="${index}" title="Marcar como correcta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${correcta === index ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/>${correcta === index ? '<circle cx="12" cy="12" r="5" fill="white"/>' : ""}</svg>
        </button>
        <input type="text" class="form-input opcion-input" placeholder="Opción ${index + 1}..." value="${texto}" data-opcion-idx="${index}">
        <button class="btn-remove-opcion" data-remove="${index}" title="Eliminar opción">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }

  renderTabla() {
    const lista = this.preguntasFiltradas();
    if (lista.length === 0) return `
      <div class="empty-state">
        <div class="empty-icon">❓</div>
        <h3>No hay preguntas</h3>
        <p>${this.state.filtroTexto || this.state.filtroCategoria ? "No se encontraron preguntas con ese filtro." : "Crea la primera pregunta del banco."}</p>
        <button class="btn btn-primary" id="btn-nueva-empty">+ Nueva pregunta</button>
      </div>
    `;
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Enunciado</th>
              <th style="width:120px">Categoría</th>
              <th style="width:90px">Opciones</th>
              <th style="width:80px">Estado</th>
              <th style="width:110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((p, i) => `
              <tr>
                <td class="td-num">${p.orden ?? i + 1}</td>
                <td>
                  <div class="pregunta-enunciado">${p.enunciado}</div>
                  ${p.explicacion ? `<div class="pregunta-hint">💡 ${p.explicacion.substring(0, 60)}${p.explicacion.length > 60 ? "..." : ""}</div>` : ""}
                </td>
                <td><span class="tag tag-cat">${p.categoria || "General"}</span></td>
                <td>
                  <div class="opciones-preview">
                    ${(p.opciones || []).map((op, oi) => `
                      <span class="opcion-chip ${oi === p.respuesta_correcta ? "opcion-chip-ok" : ""}">${oi === p.respuesta_correcta ? "✓" : ""} ${op.substring(0, 20)}${op.length > 20 ? "…" : ""}</span>
                    `).join("")}
                  </div>
                </td>
                <td>
                  <span class="badge ${p.activo ? "badge-success" : "badge-default"}">
                    ${p.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td>
                  <div class="table-actions">
                    <button class="btn-icon btn-edit" data-id="${p.id}" title="Editar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${p.id}" title="Eliminar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const { loading, preguntas, filtroCategoria, filtroTexto, modalAbierto, restriccion } = this.state;
    const categorias = this.getCategorias();
    const total = preguntas.length;
    const activas = preguntas.filter(p => p.activo).length;

    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando preguntas...</p></div>`;

    const horaActual = (() => {
      const now = new Date();
      const h = (now.getUTCHours() - 5 + 24) % 24;
      const m = now.getUTCMinutes();
      return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    })();

    const bloqueado = restriccion.activa && (() => {
      const now = new Date();
      const h = (now.getUTCHours() - 5 + 24) % 24 + now.getUTCMinutes() / 60;
      return h < restriccion.hora_inicio || h >= restriccion.hora_fin;
    })();

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Banco de Preguntas</h1>
            <p class="page-subtitle">Gestión de preguntas para exámenes y evaluaciones</p>
          </div>
          <button class="btn btn-primary" id="btn-nueva-pregunta" ${bloqueado && !this.isAdmin ? "disabled title='Edición bloqueada por restricción horaria'" : ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva pregunta
          </button>
        </div>

        <!-- Alerta de restricción horaria -->
        ${bloqueado ? `
          <div class="alert alert-warning" style="margin-bottom:1.25rem">
            ⏰ <strong>Edición bloqueada:</strong> Solo se permiten cambios entre las ${String(restriccion.hora_inicio).padStart(2,"0")}:00 y las ${String(restriccion.hora_fin).padStart(2,"0")}:00. Hora actual (Colombia): ${horaActual}.
            ${this.isAdmin ? " Como superadministrador puedes forzar cambios." : ""}
          </div>
        ` : ""}

        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total preguntas</span>
              <span class="stat-value">${total}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Activas</span>
              <span class="stat-value">${activas}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Categorías</span>
              <span class="stat-value">${[...new Set(preguntas.map(p => p.categoria || "General"))].length}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon ${restriccion.activa ? "stat-icon-red" : "stat-icon-green"}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Restricción horaria</span>
              <span class="stat-value" style="font-size:1rem">${restriccion.activa ? `${String(restriccion.hora_inicio).padStart(2,"0")}h–${String(restriccion.hora_fin).padStart(2,"0")}h` : "Libre"}</span>
            </div>
          </div>
        </div>

        <!-- Panel de restricción horaria (solo admin) -->
        ${this.isAdmin ? this.renderRestriccionPanel() : ""}

        <!-- Filtros -->
        <div class="filtros-bar">
          <div class="filtro-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="filtro-texto" class="filtro-input" placeholder="Buscar pregunta..." value="${filtroTexto}">
          </div>
          <select id="filtro-cat" class="form-select filtro-select">
            <option value="">Todas las categorías</option>
            ${categorias.map(c => `<option value="${c}" ${filtroCategoria === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
          ${filtroCategoria || filtroTexto ? `<button class="btn btn-ghost btn-sm" id="btn-limpiar">✕ Limpiar filtros</button>` : ""}
        </div>

        <!-- Tabla -->
        ${this.renderTabla()}

        <!-- Modal -->
        ${modalAbierto ? this.renderModal() : ""}
      </div>
    `;
  }

  afterRender() {
    this._bindEvents();
    if (this.state.loading) this.cargarDatos();
  }

  _bindEvents() {
    const on = (sel, ev, fn) => {
      const el = document.querySelector(sel);
      if (el) el.addEventListener(ev, fn);
    };
    const onAll = (sel, ev, fn) => {
      document.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));
    };

    on("#btn-nueva-pregunta", "click", () => this.abrirModalNueva());
    on("#btn-nueva-empty", "click", () => this.abrirModalNueva());

    // Filtros
    on("#filtro-texto", "input", e => {
      this.state.filtroTexto = e.target.value;
      const tabla = document.querySelector(".table-wrap, .empty-state");
      if (tabla) tabla.outerHTML = this.renderTabla();
      this._bindTablaEvents();
    });
    on("#filtro-cat", "change", e => {
      this.setState({ filtroCategoria: e.target.value });
    });
    on("#btn-limpiar", "click", () => {
      this.setState({ filtroCategoria: "", filtroTexto: "" });
    });

    // Tabla: editar y eliminar
    this._bindTablaEvents();

    // Restricción horaria
    if (this.isAdmin) {
      on("#btn-restriccion-on", "click", () => {
        const hi = parseInt(document.querySelector("#sel-hora-inicio")?.value ?? 8);
        const hf = parseInt(document.querySelector("#sel-hora-fin")?.value ?? 18);
        this.guardarRestriccion(true, hi, hf);
      });
      on("#btn-restriccion-off", "click", () => {
        const hi = parseInt(document.querySelector("#sel-hora-inicio")?.value ?? 8);
        const hf = parseInt(document.querySelector("#sel-hora-fin")?.value ?? 18);
        this.guardarRestriccion(false, hi, hf);
      });
      on("#btn-guardar-restriccion", "click", () => {
        const activa = document.querySelector("#btn-restriccion-on")?.classList.contains("toggle-on") ?? this.state.restriccion.activa;
        const hi = parseInt(document.querySelector("#sel-hora-inicio")?.value ?? 8);
        const hf = parseInt(document.querySelector("#sel-hora-fin")?.value ?? 18);
        this.guardarRestriccion(this.state.restriccion.activa, hi, hf);
      });
    }

    // Modal
    this._bindModalEvents();
  }

  _bindTablaEvents() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const p = this.state.preguntas.find(x => x.id === id);
        if (p) this.abrirModalEdicion(p);
      });
    });
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const p = this.state.preguntas.find(x => x.id === id);
        if (p) this.eliminar(p);
      });
    });
  }

  _leerFormulario() {
    const enunciado = document.querySelector("#f-enunciado")?.value ?? "";
    const explicacion = document.querySelector("#f-explicacion")?.value ?? "";
    const categoria = document.querySelector("#f-categoria")?.value ?? "General";
    const orden = parseInt(document.querySelector("#f-orden")?.value ?? "0");
    const activo = document.querySelector("#f-activo")?.checked ?? true;
    const opciones = [...document.querySelectorAll(".opcion-input")].map(i => i.value);
    const correcta = parseInt(document.querySelector(".opcion-radio.opcion-correcta")?.dataset.opcion ?? "0");
    this.state.form = { enunciado, opciones, respuesta_correcta: correcta, explicacion, categoria, orden, activo };
  }

  _bindModalEvents() {
    const modal = document.querySelector("#modal-pregunta");
    if (!modal) return;

    const cerrar = () => {
      this._leerFormulario();
      this.cerrarModal();
    };

    modal.querySelector("#btn-cerrar-modal")?.addEventListener("click", cerrar);
    modal.querySelector("#btn-cancelar-modal")?.addEventListener("click", cerrar);

    modal.querySelector("#btn-guardar")?.addEventListener("click", () => {
      this._leerFormulario();
      this.guardar();
    });

    // Seleccionar categoría nueva
    modal.querySelector("#f-categoria")?.addEventListener("change", e => {
      if (e.target.value === "__nueva") {
        const nueva = prompt("Nombre de la nueva categoría:");
        if (nueva && nueva.trim()) {
          const opt = document.createElement("option");
          opt.value = nueva.trim();
          opt.textContent = nueva.trim();
          opt.selected = true;
          e.target.insertBefore(opt, e.target.querySelector("[value='__nueva']"));
          e.target.value = nueva.trim();
        } else {
          e.target.value = this.state.form.categoria || "General";
        }
      }
    });

    // Agregar opción
    modal.querySelector("#btn-add-opcion")?.addEventListener("click", () => {
      this._leerFormulario();
      if (this.state.form.opciones.length >= 6) return showToast("Máximo 6 opciones", "warning");
      this.state.form.opciones.push("");
      this._reRenderOpciones();
    });

    // Marcar opción correcta y eliminar opción (delegación)
    modal.querySelector("#opciones-lista")?.addEventListener("click", e => {
      const btnRadio = e.target.closest(".opcion-radio");
      const btnRemove = e.target.closest(".btn-remove-opcion");
      if (btnRadio) {
        this._leerFormulario();
        this.state.form.respuesta_correcta = parseInt(btnRadio.dataset.opcion);
        this._reRenderOpciones();
      }
      if (btnRemove) {
        this._leerFormulario();
        const idx = parseInt(btnRemove.dataset.remove);
        if (this.state.form.opciones.length <= 2) return showToast("Mínimo 2 opciones requeridas", "warning");
        this.state.form.opciones.splice(idx, 1);
        if (this.state.form.respuesta_correcta >= this.state.form.opciones.length)
          this.state.form.respuesta_correcta = 0;
        this._reRenderOpciones();
      }
    });
  }

  _reRenderOpciones() {
    const lista = document.querySelector("#opciones-lista");
    if (!lista) return;
    lista.innerHTML = this.state.form.opciones
      .map((op, i) => this.renderOpcion(op, i, this.state.form.respuesta_correcta))
      .join("");
    // Re-bind remove/radio dentro del mismo lista
    lista.querySelectorAll(".opcion-input").forEach((inp, i) => {
      inp.addEventListener("input", e => {
        this.state.form.opciones[i] = e.target.value;
      });
    });
  }
}
