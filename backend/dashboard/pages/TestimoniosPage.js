// ═══════════════════════════════════════════════════════════════
// PAGE: TESTIMONIOS — Editar las 3 cards de la sección inicio
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const CARDS = [1, 2, 3];

export class TestimoniosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      guardando: false,
      form: {
        testimonio_1_texto: "", testimonio_1_nombre: "", testimonio_1_curso: "",
        testimonio_2_texto: "", testimonio_2_nombre: "", testimonio_2_curso: "",
        testimonio_3_texto: "", testimonio_3_nombre: "", testimonio_3_curso: "",
      },
    };
  }

  async cargarDatos() {
    try {
      const cfg = await Api.getSettings();
      const form = { ...this.state.form };
      Object.keys(form).forEach(k => { if (cfg[k] !== undefined) form[k] = cfg[k]; });
      this.setState({ loading: false, form });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  leerFormulario() {
    const f = {};
    CARDS.forEach(n => {
      f[`testimonio_${n}_texto`]  = document.getElementById(`f-t${n}-texto`)?.value  ?? "";
      f[`testimonio_${n}_nombre`] = document.getElementById(`f-t${n}-nombre`)?.value ?? "";
      f[`testimonio_${n}_curso`]  = document.getElementById(`f-t${n}-curso`)?.value  ?? "";
    });
    return f;
  }

  async guardar() {
    const updates = this.leerFormulario();
    // Validar que ningún campo requerido esté vacío
    for (const n of CARDS) {
      if (!updates[`testimonio_${n}_texto`].trim())  return showToast(`El comentario del testimonio ${n} no puede estar vacío`, "error");
      if (!updates[`testimonio_${n}_nombre`].trim()) return showToast(`El nombre del testimonio ${n} no puede estar vacío`, "error");
    }
    this.setState({ guardando: true });
    try {
      await Api.updateSettings(updates);
      this.setState({ form: updates, guardando: false });
      showToast("✅ Testimonios actualizados correctamente", "success");
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ guardando: false });
    }
  }

  // Preview en tiempo real de una card
  _previewCard(n) {
    const texto  = document.getElementById(`f-t${n}-texto`)?.value  || "Comentario del estudiante...";
    const nombre = document.getElementById(`f-t${n}-nombre`)?.value || "Nombre";
    const curso  = document.getElementById(`f-t${n}-curso`)?.value  || "Curso";
    const pT  = document.getElementById(`prev-t${n}-texto`);
    const pN  = document.getElementById(`prev-t${n}-nombre`);
    const pC  = document.getElementById(`prev-t${n}-curso`);
    if (pT) pT.textContent = texto;
    if (pN) pN.textContent = "— " + nombre;
    if (pC) pC.textContent = curso;
  }

  renderCard(n) {
    const f     = this.state.form;
    const texto  = f[`testimonio_${n}_texto`]  || "";
    const nombre = f[`testimonio_${n}_nombre`] || "";
    const curso  = f[`testimonio_${n}_curso`]  || "";

    return `
      <div class="tcard-wrap">
        <!-- Formulario -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-card-icon icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3>Testimonio ${n}</h3>
              <p>Reemplaza el comentario de esta card</p>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Comentario <span class="required">*</span></label>
            <textarea id="f-t${n}-texto" class="form-input form-textarea" rows="3"
              placeholder='"Escribe aquí el comentario del estudiante..."'
              data-card="${n}">${texto}</textarea>
            <p class="field-hint">Incluye las comillas si quieres que se vean en el sitio.</p>
          </div>

          <div class="tcard-row">
            <div class="field-group">
              <label class="field-label">Nombre <span class="required">*</span></label>
              <input id="f-t${n}-nombre" class="form-input" type="text"
                placeholder="Laura Martínez" value="${nombre}" data-card="${n}">
            </div>
            <div class="field-group">
              <label class="field-label">Curso o categoría</label>
              <input id="f-t${n}-curso" class="form-input" type="text"
                placeholder="Curso Automóvil" value="${curso}" data-card="${n}">
            </div>
          </div>
        </div>

        <!-- Vista previa -->
        <div class="tcard-preview">
          <p class="tcard-preview-label">Vista previa</p>
          <article class="testimonio-preview">
            <p id="prev-t${n}-texto">${texto || "Comentario del estudiante..."}</p>
            <strong id="prev-t${n}-nombre">— ${nombre || "Nombre"}</strong>
            <span id="prev-t${n}-curso">${curso || "Curso"}</span>
          </article>
        </div>
      </div>
    `;
  }

  render() {
    const { loading, guardando } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando testimonios...</p></div>`;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Testimonios</h1>
            <p class="page-subtitle">Edita los comentarios que aparecen en la sección de inicio</p>
          </div>
          <button class="btn btn-primary" id="btn-guardar-testimonios" ${guardando ? "disabled" : ""}>
            ${guardando
              ? `<span class="spinner-sm"></span> Guardando...`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Guardar cambios`}
          </button>
        </div>

        <div class="alert alert-info" style="margin-bottom:1.5rem">
          💡 Los cambios se reflejan automáticamente en la página de inicio al guardar. No puedes agregar ni eliminar cards, solo editar el contenido de las 3 existentes.
        </div>

        <div class="testimonios-editor">
          ${CARDS.map(n => this.renderCard(n)).join("")}
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:1rem">
          <button class="btn btn-primary" id="btn-guardar-testimonios-2" ${guardando ? "disabled" : ""}>
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
    // Preview en tiempo real para todos los campos
    CARDS.forEach(n => {
      ["texto","nombre","curso"].forEach(campo => {
        document.getElementById(`f-t${n}-${campo}`)?.addEventListener("input", () => this._previewCard(n));
      });
    });

    ["btn-guardar-testimonios","btn-guardar-testimonios-2"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", () => this.guardar());
    });
  }
}
