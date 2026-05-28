// ═══════════════════════════════════════════════════════════════
// PAGE: CURSOS MOCOA — Editar las 4 cards de categorías
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const CARDS = [1, 2, 3, 4];
const EMOJIS = ["🏍️","🚗","🚕","🛡️","🚌","🚛","🏎️","🚑","🚒","🚐","🚜","⛟","🛻","🏍","🚲","🛵","✅","⭐","🎯","📋","🎓","💡","🔑","🛣️","🗺️"];

export class MocoaCursosPage extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, guardando: false, form: this._formVacio() };
  }

  _formVacio() {
    const f = {};
    CARDS.forEach(n => {
      f[`mocoa_curso_${n}_emoji`]  = "";
      f[`mocoa_curso_${n}_titulo`] = "";
      f[`mocoa_curso_${n}_precio`] = "";
      f[`mocoa_curso_${n}_desc`]   = "";
      f[`mocoa_curso_${n}_badge`]  = "";
    });
    return f;
  }

  async cargarDatos() {
    try {
      const cfg = await Api.getSettings();
      const form = this._formVacio();
      Object.keys(form).forEach(k => { if (cfg[k] !== undefined) form[k] = cfg[k]; });
      this.setState({ loading: false, form });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  leerFormulario() {
    const g = id => document.getElementById(id)?.value ?? "";
    const f = {};
    CARDS.forEach(n => {
      f[`mocoa_curso_${n}_emoji`]  = g(`f-mc${n}-emoji`);
      f[`mocoa_curso_${n}_titulo`] = g(`f-mc${n}-titulo`);
      f[`mocoa_curso_${n}_precio`] = g(`f-mc${n}-precio`);
      f[`mocoa_curso_${n}_desc`]   = g(`f-mc${n}-desc`);
      f[`mocoa_curso_${n}_badge`]  = g(`f-mc${n}-badge`);
    });
    return f;
  }

  async guardar() {
    const updates = this.leerFormulario();
    for (const n of CARDS) {
      if (!updates[`mocoa_curso_${n}_titulo`].trim()) return showToast(`El título del curso ${n} es obligatorio`, "error");
    }
    this.setState({ guardando: true });
    try {
      await Api.updateSettings(updates);
      this.setState({ form: updates, guardando: false });
      showToast("✅ Cursos actualizados correctamente", "success");
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ guardando: false });
    }
  }

  // Preview en tiempo real de una card
  _previewCard(n) {
    const emoji  = document.getElementById(`f-mc${n}-emoji`)?.value  || "";
    const titulo = document.getElementById(`f-mc${n}-titulo`)?.value || "Título del curso";
    const precio = document.getElementById(`f-mc${n}-precio`)?.value || "";
    const desc   = document.getElementById(`f-mc${n}-desc`)?.value   || "Descripción...";
    const badge  = document.getElementById(`f-mc${n}-badge`)?.value  || "";
    const pE = document.getElementById(`prev-mc${n}-emoji`);
    const pT = document.getElementById(`prev-mc${n}-titulo`);
    const pP = document.getElementById(`prev-mc${n}-precio`);
    const pD = document.getElementById(`prev-mc${n}-desc`);
    const pB = document.getElementById(`prev-mc${n}-badge`);
    if (pE) pE.textContent = emoji;
    if (pT) pT.textContent = titulo;
    if (pP) pP.textContent = precio ? `Precio: ${precio}` : "";
    if (pD) pD.textContent = desc;
    if (pB) pB.textContent = badge;
  }

  renderCard(n) {
    const f = this.state.form;
    const emoji  = f[`mocoa_curso_${n}_emoji`]  || "";
    const titulo = f[`mocoa_curso_${n}_titulo`] || "";
    const precio = f[`mocoa_curso_${n}_precio`] || "";
    const desc   = f[`mocoa_curso_${n}_desc`]   || "";
    const badge  = f[`mocoa_curso_${n}_badge`]  || "";

    return `
      <div class="tcard-wrap">

        <!-- Formulario -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-card-icon icon-blue" style="font-size:1.4rem;width:40px;height:40px">${emoji || "📋"}</div>
            <div><h3>Curso ${n}</h3><p>Edita el contenido de esta card</p></div>
          </div>

          <div class="mcursos-grid">

            <div class="field-group">
              <label class="field-label">Emoji / Icono</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input id="f-mc${n}-emoji" class="form-input" type="text"
                  placeholder="🏍️" value="${emoji}" style="width:80px;font-size:1.4rem;text-align:center">
                <div class="emoji-picker-wrap">
                  ${EMOJIS.map(e => `<button type="button" class="emoji-opt" data-card="${n}" data-emoji="${e}" title="${e}">${e}</button>`).join("")}
                </div>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Título <span class="required">*</span></label>
              <input id="f-mc${n}-titulo" class="form-input" type="text"
                placeholder="Ej: A2 — Moto +125cc" value="${titulo}" data-card="${n}">
            </div>

            <div class="field-group">
              <label class="field-label">Precio</label>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:13px;color:var(--text-sub);white-space:nowrap">Precio:</span>
                <input id="f-mc${n}-precio" class="form-input" type="text"
                  placeholder="1.200.000" value="${precio}" data-card="${n}">
              </div>
            </div>

            <div class="field-group" style="grid-column:span 2">
              <label class="field-label">Descripción</label>
              <textarea id="f-mc${n}-desc" class="form-input form-textarea" rows="2"
                placeholder="Descripción del curso..." data-card="${n}">${desc}</textarea>
            </div>

            <div class="field-group">
              <label class="field-label">Badge / Etiqueta</label>
              <input id="f-mc${n}-badge" class="form-input" type="text"
                placeholder="Ej: Categoría A2" value="${badge}" data-card="${n}">
            </div>

          </div>
        </div>

        <!-- Vista previa -->
        <div class="tcard-preview">
          <p class="tcard-preview-label">Vista previa</p>
          <div class="curso-card-preview">
            <span class="cc-prev-emoji" id="prev-mc${n}-emoji">${emoji || "📋"}</span>
            <h3 id="prev-mc${n}-titulo">${titulo || "Título del curso"}</h3>
            <h4 id="prev-mc${n}-precio" style="color:var(--primary);font-size:13px;margin:4px 0">${precio ? `Precio: ${precio}` : ""}</h4>
            <p id="prev-mc${n}-desc">${desc || "Descripción del curso..."}</p>
            <span class="cc-prev-badge" id="prev-mc${n}-badge">${badge || ""}</span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const { loading, guardando } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando cursos...</p></div>`;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Cursos — La Nacional Mocoa</h1>
            <p class="page-subtitle">Edita el título, precio, descripción y badge de cada categoría</p>
          </div>
          <button class="btn btn-primary" id="btn-guardar-mocoa" ${guardando ? "disabled" : ""}>
            ${guardando
              ? `<span class="spinner-sm"></span> Guardando...`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Guardar cambios`}
          </button>
        </div>

        <div class="alert alert-info" style="margin-bottom:1.5rem">
          💡 Los cambios se reflejan automáticamente en <strong>lanacionalmocoa</strong> al guardar. Solo puedes editar el contenido de las 4 cards existentes.
        </div>

        <div class="testimonios-editor">
          ${CARDS.map(n => this.renderCard(n)).join("")}
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem">
          <button class="btn btn-primary" id="btn-guardar-mocoa-2" ${guardando ? "disabled" : ""}>
            ${guardando ? `<span class="spinner-sm"></span> Guardando...` : `💾 Guardar todos los cambios`}
          </button>
        </div>
      </div>
    `;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }
    this._bindEvents();
  }

  _bindEvents() {
    ["btn-guardar-mocoa","btn-guardar-mocoa-2"].forEach(id =>
      document.getElementById(id)?.addEventListener("click", () => this.guardar())
    );

    // Preview en tiempo real
    CARDS.forEach(n => {
      ["emoji","titulo","precio","desc","badge"].forEach(campo => {
        document.getElementById(`f-mc${n}-${campo}`)?.addEventListener("input", () => this._previewCard(n));
      });
    });

    // Selector rápido de emojis
    document.querySelectorAll(".emoji-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        const n     = btn.dataset.card;
        const emoji = btn.dataset.emoji;
        const inp = document.getElementById(`f-mc${n}-emoji`);
        if (inp) { inp.value = emoji; this._previewCard(n); }
      });
    });
  }
}
