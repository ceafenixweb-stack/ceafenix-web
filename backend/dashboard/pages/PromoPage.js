// ═══════════════════════════════════════════════════════════════
// PAGE: PROMO — Modal de promoción (base reutilizable)
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

export class PromoPage extends Component {
  constructor(props) {
    super(props);
    this._prefijo = "promo";
    this._titulo  = "Modal de Promoción — CEA Fénix";
    this._sub     = "Configura el popup que aparece al entrar al sitio web";
    this.state = { loading: true, guardando: false, form: this._formVacio() };
  }

  p(c) { return `${this._prefijo}_${c}`; }

  _formVacio() {
    const p = k => `${this._prefijo}_${k}`;
    return {
      [p("activo")]:      "0",
      [p("titulo")]:      "",
      [p("descripcion")]: "",
      [p("badge")]:       "🔥 OFERTA ESPECIAL",
      [p("badge_bg")]:    "#ef4444",
      [p("badge_color")]: "#ffffff",
      [p("badge_size")]:  "14",
      [p("badge_bold")]:  "1",
      [p("badge_align")]: "left",
      [p("media_tipo")]:  "imagen",
      [p("media_src")]:   "",
      [p("wa_link")]:     "",
      [p("wa_texto")]:    "¡Me interesa!",
    };
  }

  async cargarDatos() {
    try {
      const cfg = await Api.getSettings();
      const f   = this._formVacio();
      Object.keys(f).forEach(k => { if (cfg[k] !== undefined) f[k] = cfg[k]; });
      this.setState({ loading: false, form: f });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  leerFormulario() {
    const g   = id => document.getElementById(id)?.value ?? "";
    const gc  = id => document.getElementById(id)?.checked;
    const gsel= id => document.getElementById(id)?.value ?? "";
    const tipo = document.querySelector(".promo-tipo-tab.active")?.dataset.tipo ?? "imagen";
    return {
      [this.p("activo")]:      gc("f-promo-activo") ? "1" : "0",
      [this.p("titulo")]:      g("f-titulo"),
      [this.p("descripcion")]: g("f-descripcion"),
      [this.p("badge")]:       g("f-badge"),
      [this.p("badge_bg")]:    g("f-badge-bg"),
      [this.p("badge_color")]: g("f-badge-color"),
      [this.p("badge_size")]:  g("f-badge-size"),
      [this.p("badge_bold")]:  gc("f-badge-bold") ? "1" : "0",
      [this.p("badge_align")]: gsel("f-badge-align"),
      [this.p("media_tipo")]:  tipo,
      [this.p("media_src")]:   g("f-media-src"),
      [this.p("wa_link")]:     g("f-wa-link"),
      [this.p("wa_texto")]:    g("f-wa-texto"),
    };
  }

  async guardar() {
    const updates = this.leerFormulario();
    this.setState({ guardando: true });
    try {
      await Api.updateSettings(updates);
      this.setState({ form: updates, guardando: false });
      showToast("¡Modal actualizado correctamente!", "success");
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ guardando: false });
    }
  }

  async toggleActivo(activo) {
    try {
      await Api.updateSettings({ [this.p("activo")]: activo ? "1" : "0" });
      this.setState({ form: { ...this.state.form, [this.p("activo")]: activo ? "1" : "0" } });
      showToast(activo ? "✅ Modal activado — visible en el sitio" : "🚫 Modal desactivado", activo ? "success" : "info");
    } catch (e) { showToast(e.message, "error"); }
  }

  async handleArchivo(file) {
    if (!file || !file.type.startsWith("image/")) return showToast("Solo imágenes (JPG, PNG, WEBP)", "error");
    if (file.size > 5 * 1024 * 1024) return showToast("Máximo 5 MB", "error");
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        showToast("Subiendo imagen...", "info");
        const resp = await Api.uploadImagen(e.target.result, file.name);
        const inp = document.getElementById("f-media-src");
        if (inp) inp.value = resp.url;
        this._actualizarPreviewMedia(resp.url, "imagen");
        this._mostrarBorrar(resp.url);
        showToast("Imagen subida", "success");
      } catch (err) { showToast(err.message, "error"); }
    };
    reader.readAsDataURL(file);
  }

  _cambiarTipo(tipo) {
    document.querySelectorAll(".promo-tipo-tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tipo === tipo));
    const inp = document.getElementById("f-media-src");
    if (inp) {
      inp.value = "";
      inp.placeholder = tipo === "video"
        ? "https://www.youtube.com/watch?v=..."
        : "https://... o /uploads/imagen.jpg";
    }
    document.getElementById("zona-drag").style.display = tipo === "imagen" ? "" : "none";
    this._actualizarPreviewMedia("", tipo);
    this._mostrarBorrar("");
  }

  _mostrarBorrar(src) {
    const btn = document.getElementById("btn-borrar-media");
    if (btn) btn.style.display = src ? "inline-flex" : "none";
  }

  _actualizarPreviewMedia(src, tipo) {
    const box = document.getElementById("preview-media-box");
    if (!box) return;
    if (!src) {
      box.innerHTML = `<div class="promo-preview-empty"><span>🖼️</span><p>Sin imagen / video</p></div>`;
      return;
    }
    if (tipo === "video") {
      const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
      const embed = yt ? `https://www.youtube.com/embed/${yt[1]}` : src;
      box.innerHTML = `<iframe src="${embed}" frameborder="0" allowfullscreen style="width:100%;height:100%;display:block"></iframe>`;
    } else {
      box.innerHTML = `<img src="${src}" alt="preview" style="width:100%;height:auto;display:block">`;
    }
  }

  _badgeStyle(f) {
    const bg    = f[this.p("badge_bg")]    || "#ef4444";
    const color = f[this.p("badge_color")] || "#ffffff";
    const size  = f[this.p("badge_size")]  || "14";
    const bold  = f[this.p("badge_bold")]  === "1" ? "800" : "500";
    const align = f[this.p("badge_align")] || "left";
    return `background:${bg};color:${color};font-size:${size}px;font-weight:${bold};text-align:${align}`;
  }

  // ── Render de la vista previa ──────────────────────────────
  renderVistaPrevia() {
    const f      = this.state.form;
    const activo = f[this.p("activo")] === "1";
    const src    = f[this.p("media_src")]  || "";
    const tipo   = f[this.p("media_tipo")] || "imagen";
    const badge  = f[this.p("badge")]      || "🔥 OFERTA ESPECIAL";

    let mediaHtml = `<div class="promo-preview-empty"><span>🖼️</span><p>Sin imagen / video</p></div>`;
    if (src) {
      if (tipo === "video") {
        const yt    = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
        const embed = yt ? `https://www.youtube.com/embed/${yt[1]}` : src;
        mediaHtml   = `<iframe src="${embed}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;display:block"></iframe>`;
      } else {
        mediaHtml = `<img src="${src}" alt="promo" style="width:100%;height:auto;display:block">`;
      }
    }

    return `
      <div class="promo-preview-badge-header">
        <span class="badge ${activo ? "badge-success" : "badge-default"}" style="font-size:13px;padding:5px 14px">
          ${activo ? "✅ Visible en el sitio" : "🚫 Oculto en el sitio"}
        </span>
        <span style="font-size:12px;color:var(--text-sub)">Vista previa en tiempo real</span>
      </div>
      <div class="promo-preview-wrap">
        <div class="promo-preview-box">
          <div class="promo-preview-media" id="preview-media-box">${mediaHtml}</div>
          <span class="promo-preview-badge-tag" id="prev-badge" style="${this._badgeStyle(f)}">${badge}</span>
          <div class="promo-preview-body">
            <h3 id="prev-titulo">${f[this.p("titulo")] || "Título de la promoción"}</h3>
            <p id="prev-desc">${f[this.p("descripcion")] || "Descripción de la promoción..."}</p>
            <div class="promo-preview-actions">
              <span class="btn-promo-wa">📱 <span id="prev-wa">${f[this.p("wa_texto")] || "¡Me interesa!"}</span></span>
              <span class="btn-promo-skip">Ver después</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const { loading, guardando, form } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    const activo  = form[this.p("activo")]     === "1";
    const esVideo = form[this.p("media_tipo")] === "video";
    const src     = form[this.p("media_src")]  || "";

    return `
    <div class="page fade-in">

      <!-- ENCABEZADO -->
      <div class="page-header">
        <div>
          <h1 class="page-title">${this._titulo}</h1>
          <p class="page-subtitle">${this._sub}</p>
        </div>
        <button class="promo-switch ${activo ? "promo-switch-on" : "promo-switch-off"}" id="btn-toggle-promo">
          ${activo ? "✅ ACTIVO — clic para desactivar" : "🚫 INACTIVO — clic para activar"}
        </button>
      </div>

      <!-- ALERTA -->
      <div class="alert ${activo ? "alert-success" : "alert-warning"}" style="margin-bottom:1.5rem">
        ${activo
          ? "✅ <strong>Modal activo.</strong> Los visitantes lo verán al entrar al sitio."
          : "🚫 <strong>Modal inactivo.</strong> No aparecerá hasta que lo actives desde aquí."}
      </div>

      <div class="promo-layout">
        <!-- ── COLUMNA IZQUIERDA ── -->
        <div class="promo-form-col">

          <!-- MEDIA -->
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div><h3>Imagen o Video</h3><p>Elige <strong>uno solo</strong></p></div>
            </div>
            <div class="promo-tipo-tabs">
              <button class="promo-tipo-tab ${!esVideo ? "active" : ""}" data-tipo="imagen">🖼️ Imagen</button>
              <button class="promo-tipo-tab ${esVideo  ? "active" : ""}" data-tipo="video">▶️ Video YouTube</button>
            </div>
            <div id="zona-drag" style="${esVideo ? "display:none" : ""}">
              <div class="dropzone" id="dropzone">
                <input type="file" id="file-input" accept="image/*" style="display:none">
                <div class="dropzone-content">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p><strong>Arrastra una imagen aquí</strong></p>
                  <p>o <button class="btn-link" id="btn-seleccionar-archivo">selecciona un archivo</button></p>
                  <p class="dropzone-hint">JPG, PNG, WEBP — máx. 5 MB</p>
                </div>
              </div>
            </div>
            <div class="field-group" style="margin-top:10px">
              <label class="field-label">${esVideo ? "URL del video de YouTube" : "O pega la URL de la imagen"}</label>
              <div class="media-input-row">
                <input id="f-media-src" class="form-input" type="text"
                  placeholder="${esVideo ? "https://www.youtube.com/watch?v=..." : "https://... o /uploads/imagen.jpg"}"
                  value="${src}">
                <button class="btn-borrar-media" id="btn-borrar-media" title="Quitar" style="${src ? "" : "display:none"}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  Quitar
                </button>
              </div>
              ${esVideo ? `<p class="field-hint">Acepta links normales de YouTube.</p>` : ""}
            </div>
          </div>

          <!-- BADGE -->
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-yellow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div><h3>Badge — etiqueta de llamada</h3><p>Texto que aparece sobre la imagen para llamar la atención</p></div>
            </div>

            <!-- Texto del badge -->
            <div class="field-group">
              <label class="field-label">Texto del badge</label>
              <input id="f-badge" class="form-input" type="text"
                placeholder="🔥 OFERTA ESPECIAL"
                value="${form[this.p("badge")] || ""}">
            </div>

            <!-- Controles de estilo en grid -->
            <div class="badge-controls-grid">

              <!-- Color de fondo -->
              <div class="field-group">
                <label class="field-label">Color de fondo</label>
                <div class="color-input-wrap">
                  <input id="f-badge-bg" type="color" class="color-picker" value="${form[this.p("badge_bg")] || "#ef4444"}">
                  <input id="f-badge-bg-hex" type="text" class="form-input color-hex" value="${form[this.p("badge_bg")] || "#ef4444"}" maxlength="7">
                </div>
              </div>

              <!-- Color de texto -->
              <div class="field-group">
                <label class="field-label">Color del texto</label>
                <div class="color-input-wrap">
                  <input id="f-badge-color" type="color" class="color-picker" value="${form[this.p("badge_color")] || "#ffffff"}">
                  <input id="f-badge-color-hex" type="text" class="form-input color-hex" value="${form[this.p("badge_color")] || "#ffffff"}" maxlength="7">
                </div>
              </div>

              <!-- Tamaño de fuente -->
              <div class="field-group">
                <label class="field-label">Tamaño de letra <span class="badge-size-val">${form[this.p("badge_size")] || "14"}px</span></label>
                <input id="f-badge-size" type="range" class="range-input" min="10" max="28" step="1" value="${form[this.p("badge_size")] || "14"}">
              </div>

              <!-- Alineación -->
              <div class="field-group">
                <label class="field-label">Alineación del texto</label>
                <div class="align-tabs">
                  <button class="align-btn ${(form[this.p("badge_align")]||"left")==="left"  ? "active":""}" data-align="left"  title="Izquierda">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                  </button>
                  <button class="align-btn ${(form[this.p("badge_align")]||"left")==="center"? "active":""}" data-align="center" title="Centro">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                  </button>
                  <button class="align-btn ${(form[this.p("badge_align")]||"left")==="right" ? "active":""}" data-align="right"  title="Derecha">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                  </button>
                </div>
                <input type="hidden" id="f-badge-align" value="${form[this.p("badge_align")] || "left"}">
              </div>

              <!-- Negrita -->
              <div class="field-group" style="grid-column:span 2">
                <label class="toggle-label">
                  <input type="checkbox" id="f-badge-bold" ${form[this.p("badge_bold")] === "1" ? "checked" : ""}>
                  <span class="toggle-track"></span>
                  <span class="toggle-text">Texto en <strong>negrita</strong></span>
                </label>
              </div>

            </div>

            <!-- Mini preview del badge -->
            <div class="badge-live-preview" id="badge-live-preview">
              <span id="badge-live" style="${this._badgeStyle(form)}">${form[this.p("badge")] || "🔥 OFERTA ESPECIAL"}</span>
            </div>

          </div>

          <!-- TEXTOS -->
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div><h3>Textos del modal</h3><p>Título y descripción</p></div>
            </div>
            <div class="field-group">
              <label class="field-label">Título</label>
              <input id="f-titulo" class="form-input" type="text" placeholder="¡Promoción del mes! 🎉" value="${form[this.p("titulo")] || ""}">
            </div>
            <div class="field-group">
              <label class="field-label">Descripción</label>
              <textarea id="f-descripcion" class="form-input form-textarea" rows="3" placeholder="Describe la promoción...">${form[this.p("descripcion")] || ""}</textarea>
            </div>
          </div>

          <!-- WHATSAPP -->
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.29 6.29l1.87-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div><h3>Botón de WhatsApp</h3></div>
            </div>
            <div class="field-group">
              <label class="field-label">Link de WhatsApp</label>
              <input id="f-wa-link" class="form-input" type="text" placeholder="https://wa.me/573001234567?text=Hola" value="${form[this.p("wa_link")] || ""}">
            </div>
            <div class="field-group">
              <label class="field-label">Texto del botón</label>
              <input id="f-wa-texto" class="form-input" type="text" placeholder="¡Me interesa!" value="${form[this.p("wa_texto")] || ""}">
            </div>
          </div>

          <!-- Estado -->
          <div class="form-card" style="padding:16px 20px">
            <label class="toggle-label" style="gap:14px">
              <input type="checkbox" id="f-promo-activo" ${activo ? "checked" : ""}>
              <span class="toggle-track"></span>
              <div>
                <span class="field-label" style="margin:0">Mostrar modal al entrar al sitio</span>
                <p class="field-hint" style="margin:2px 0 0">El modal está <strong>inactivo por defecto</strong>. Actívalo solo cuando tengas una promoción real.</p>
              </div>
            </label>
          </div>

          <button class="btn btn-primary btn-block" id="btn-guardar-promo" ${guardando ? "disabled" : ""}>
            ${guardando ? `<span class="spinner-sm"></span> Guardando...` : `💾 Guardar todos los cambios`}
          </button>

        </div>

        <!-- ── COLUMNA DERECHA: vista previa ── -->
        <div class="promo-preview-col">
          <div class="form-card" style="position:sticky;top:20px">
            <div class="form-card-header">
              <div class="form-card-icon icon-yellow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div><h3>Vista previa</h3><p>Se actualiza mientras editas</p></div>
            </div>
            ${this.renderVistaPrevia()}
          </div>
        </div>

      </div>
    </div>`;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }
    this._bindEvents();
  }

  _bindEvents() {
    // Toggle ON/OFF rápido
    document.getElementById("btn-toggle-promo")?.addEventListener("click", () => {
      this.toggleActivo(this.state.form[this.p("activo")] !== "1");
    });

    // Tipo imagen / video
    document.querySelectorAll(".promo-tipo-tab").forEach(btn =>
      btn.addEventListener("click", () => this._cambiarTipo(btn.dataset.tipo)));

    // URL media
    document.getElementById("f-media-src")?.addEventListener("input", e => {
      const tipo = document.querySelector(".promo-tipo-tab.active")?.dataset.tipo ?? "imagen";
      this._actualizarPreviewMedia(e.target.value, tipo);
      this._mostrarBorrar(e.target.value);
    });

    // Borrar media
    document.getElementById("btn-borrar-media")?.addEventListener("click", () => {
      const inp = document.getElementById("f-media-src");
      if (inp) inp.value = "";
      this._actualizarPreviewMedia("", "imagen");
      this._mostrarBorrar("");
    });

    // ── Badge: texto ─────────────────────────────────────────
    document.getElementById("f-badge")?.addEventListener("input", e => {
      const txt = e.target.value || "🔥 OFERTA ESPECIAL";
      this._setBadgePreview({ text: txt });
    });

    // ── Badge: color fondo (picker ↔ hex sincronizados) ──────
    this._syncColor("f-badge-bg", "f-badge-bg-hex", css => this._setBadgePreview({ bg: css }));
    this._syncColor("f-badge-color", "f-badge-color-hex", css => this._setBadgePreview({ color: css }));

    // ── Badge: tamaño ────────────────────────────────────────
    document.getElementById("f-badge-size")?.addEventListener("input", e => {
      const v = e.target.value;
      document.querySelector(".badge-size-val").textContent = v + "px";
      this._setBadgePreview({ size: v });
    });

    // ── Badge: negrita ───────────────────────────────────────
    document.getElementById("f-badge-bold")?.addEventListener("change", e => {
      this._setBadgePreview({ bold: e.target.checked ? "1" : "0" });
    });

    // ── Badge: alineación ────────────────────────────────────
    document.querySelectorAll(".align-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".align-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("f-badge-align").value = btn.dataset.align;
        this._setBadgePreview({ align: btn.dataset.align });
      });
    });

    // ── Textos → vista previa ────────────────────────────────
    [["f-titulo","prev-titulo"],["f-descripcion","prev-desc"],["f-wa-texto","prev-wa"]].forEach(([id, pid]) => {
      document.getElementById(id)?.addEventListener("input", e => {
        const el = document.getElementById(pid);
        if (el) el.textContent = e.target.value;
      });
    });

    // ── Drag & drop ──────────────────────────────────────────
    const dz = document.getElementById("dropzone");
    if (dz) {
      dz.addEventListener("dragover",  e => { e.preventDefault(); dz.classList.add("dropzone-over"); });
      dz.addEventListener("dragleave", () => dz.classList.remove("dropzone-over"));
      dz.addEventListener("drop", e => {
        e.preventDefault(); dz.classList.remove("dropzone-over");
        const f = e.dataTransfer.files[0]; if (f) this.handleArchivo(f);
      });
      dz.addEventListener("click", () => document.getElementById("file-input")?.click());
    }
    document.getElementById("btn-seleccionar-archivo")?.addEventListener("click", e => {
      e.stopPropagation(); document.getElementById("file-input")?.click();
    });
    document.getElementById("file-input")?.addEventListener("change", e => {
      const f = e.target.files[0]; if (f) this.handleArchivo(f);
    });

    // ── Guardar ──────────────────────────────────────────────
    document.getElementById("btn-guardar-promo")?.addEventListener("click", () => this.guardar());
  }

  // Sincroniza color-picker ↔ input hex y actualiza preview
  _syncColor(pickerId, hexId, onUpdate) {
    const picker = document.getElementById(pickerId);
    const hex    = document.getElementById(hexId);
    if (!picker || !hex) return;
    picker.addEventListener("input", e => { hex.value = e.target.value; onUpdate(e.target.value); });
    hex.addEventListener("input", e => {
      const v = e.target.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { picker.value = v; onUpdate(v); }
    });
  }

  // Actualiza el badge en la vista previa lateral + mini preview del badge
  _setBadgePreview(changes = {}) {
    const badge    = document.getElementById("f-badge")?.value         || "🔥 OFERTA ESPECIAL";
    const bg       = changes.bg    ?? document.getElementById("f-badge-bg")?.value    ?? "#ef4444";
    const color    = changes.color ?? document.getElementById("f-badge-color")?.value ?? "#ffffff";
    const size     = changes.size  ?? document.getElementById("f-badge-size")?.value  ?? "14";
    const bold     = changes.bold  ?? (document.getElementById("f-badge-bold")?.checked ? "1" : "0");
    const align    = changes.align ?? document.getElementById("f-badge-align")?.value ?? "left";
    const style    = `background:${bg};color:${color};font-size:${size}px;font-weight:${bold==="1"?"800":"500"};text-align:${align}`;
    const txt      = changes.text  ?? badge;
    [document.getElementById("prev-badge"), document.getElementById("badge-live")].forEach(el => {
      if (!el) return;
      el.style.cssText = style + (el.id === "prev-badge"
        ? ";position:absolute;top:10px;left:10px;padding:5px 12px;border-radius:20px;white-space:nowrap;pointer-events:none"
        : "");
      el.textContent = txt;
    });
  }
}
