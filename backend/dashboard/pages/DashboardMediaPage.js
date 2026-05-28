// ═══════════════════════════════════════════════════════════════
// PAGE: CONTENIDO DEL SITIO — Imágenes, videos y textos
// Todos los modales como portales al body (sin re-render bug)
// ═══════════════════════════════════════════════════════════════

import { Component }   from "../utils/core.js";
import { Api }         from "../services/api.js";
import { AuthService } from "../services/auth.js";
import { showToast }   from "../components/Toast.js";

// ─── Secciones de media ────────────────────────────────────────
// recomendedSize: dimensiones reales del contenedor en el sitio
const MEDIA_SECTIONS = [
  {
    id: "hero_img",
    icon: "🖼️", iconClass: "icon-blue",
    title: "Imagen de fondo — Hero",
    desc: "Se muestra como fondo del hero principal (sección superior de inicio)",
    type: "imagen",
    settingKey: "hero_src",
    recomendedSize: { w: 1200, h: 600, label: "1200 × 600 px", formato: "JPG · PNG · WEBP", fit: "cover (ocupa todo el ancho, se recorta verticalmente)" },
  },
  {
    id: "servicios_video",
    icon: "▶️", iconClass: "icon-purple",
    title: "Video — Sección Servicios",
    desc: "Video de fondo (loop, sin audio) que se ve en la sección de Servicios",
    type: "video",
    settingKey: "servicios_video_url",
    recomendedSize: { w: 1280, h: 720, label: "16:9 (1280 × 720 o mayor)", formato: "URL de YouTube embed", fit: "cover (ocupa todo el ancho del contenedor)" },
  },
];

// ─── Secciones de texto ────────────────────────────────────────
const TEXT_SECTIONS = [
  {
    id: "hero_textos",
    icon: "✏️", iconClass: "icon-blue",
    title: "Textos del Hero",
    desc: "Título y subtítulo del hero principal",
    fields: [
      { key: "hero_titulo",    label: "Título principal", type: "text",     ph: "Aprende a Conducir con Seguridad y Confianza" },
      { key: "hero_subtitulo", label: "Subtítulo / párrafo", type: "textarea", ph: "CEA FÉNIX ZOMAC S.A.S. es un Centro de Enseñanza Automovilística..." },
    ],
  },
];

// ─── Subir imagen ──────────────────────────────────────────────
async function uploadImg(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error("La imagen supera 8 MB");
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = async () => {
      try {
        const token = AuthService.getToken();
        const resp  = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ base64: r.result, filename: file.name }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || "Error al subir");
        res(data.url);
      } catch(e) { rej(e); }
    };
    r.onerror = () => rej(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

// ─── Detectar dimensiones reales de una imagen ────────────────
function getImageDimensions(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload  = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => res(null);
    img.src = src;
  });
}

// ═══════════════════════════════════════════════════════════════
export class DashboardMediaPage extends Component {
  constructor(props) {
    super(props);
    this.state   = { settings: {}, loading: true };
    this._overlay = null;
  }

  async cargarDatos() {
    try {
      const settings = await Api.getSettings();
      this.setState({ settings, loading: false });
    } catch(e) {
      showToast("Error al cargar configuración", "error");
      this.setState({ loading: false });
    }
  }

  // ── Abrir modal imagen ──────────────────────────────────────
  _abrirModalImagen(sec) {
    this._cerrarModal();
    const { settings } = this.state;
    const srcActual    = settings[sec.settingKey] || "";
    const sz           = sec.recomendedSize;
    let pendingFile    = null;

    const overlay = document.createElement("div");
    overlay.id    = "media-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0">${sec.icon} ${sec.title}</h2>
          <button id="mm-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub)">✕</button>
        </div>

        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1">

          <!-- Especificaciones técnicas -->
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 14px">
            <p style="font-size:12px;font-weight:700;color:#0369a1;margin:0 0 6px">📐 Especificaciones recomendadas</p>
            <table style="font-size:12px;color:#0c4a6e;width:100%;border-collapse:collapse">
              <tr><td style="padding:2px 0;width:110px;font-weight:600">Tamaño:</td><td>${sz.label}</td></tr>
              <tr><td style="padding:2px 0;font-weight:600">Formato:</td><td>${sz.formato}</td></tr>
              <tr><td style="padding:2px 0;font-weight:600">Ajuste:</td><td>${sz.fit}</td></tr>
              <tr><td style="padding:2px 0;font-weight:600">Tamaño máx:</td><td>8 MB</td></tr>
            </table>
            <p style="font-size:11px;color:#0369a1;margin:6px 0 0">💡 La imagen se ajusta automáticamente al contenedor. Usa imágenes más anchas que altas para mejor resultado.</p>
          </div>

          <!-- Imagen actual -->
          ${srcActual ? `
            <div>
              <p style="font-size:13px;font-weight:600;margin:0 0 6px">Imagen actual:</p>
              <div id="mm-current-wrap" style="position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--border)">
                <img id="mm-current-img" src="${srcActual}" style="width:100%;max-height:180px;object-fit:cover;display:block">
                <div id="mm-current-dims" style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 8px;border-radius:6px">cargando...</div>
              </div>
            </div>` : ""}

          <!-- Drag & drop -->
          <div>
            <p style="font-size:13px;font-weight:600;margin:0 0 6px">Nueva imagen:</p>
            <div id="mm-dropzone" style="border:2px dashed var(--border);border-radius:12px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--surface-2,#f8fafc);transition:all .2s;position:relative;overflow:hidden">
              <input type="file" id="mm-file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none">
              <img id="mm-new-preview" style="width:100%;max-height:180px;object-fit:cover;display:none">
              <div id="mm-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style="font-size:13px;font-weight:600;margin:0;color:var(--text)">Arrastra aquí o haz clic</p>
                <p style="font-size:12px;margin:0;color:var(--text-sub)">JPG · PNG · WEBP — máx. 8 MB</p>
                <p id="mm-new-dims" style="font-size:11px;color:var(--primary);margin:0;display:none"></p>
              </div>
            </div>
          </div>

          <!-- O URL -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">O pega una URL directa</label>
            <input id="mm-url" class="input" type="text" placeholder="https://..." value="${srcActual}">
          </div>
        </div>

        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="mm-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="mm-save"   class="btn btn-primary">💾 Guardar imagen</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity="0"; overlay.style.transition="opacity .2s"; requestAnimationFrame(() => overlay.style.opacity="1"); });

    // Mostrar dimensiones de la imagen actual
    if (srcActual) {
      getImageDimensions(srcActual).then(dims => {
        const el = overlay.querySelector("#mm-current-dims");
        if (el && dims) el.textContent = `${dims.w} × ${dims.h} px`;
        else if (el) el.textContent = "";
      });
    }

    // Drag & drop
    const dz   = overlay.querySelector("#mm-dropzone");
    const finp = overlay.querySelector("#mm-file");
    const prev = overlay.querySelector("#mm-new-preview");
    const ph   = overlay.querySelector("#mm-placeholder");
    const dims = overlay.querySelector("#mm-new-dims");

    const cargarArchivo = async file => {
      if (!file.type.startsWith("image/")) return showToast("Solo imágenes","error");
      if (file.size > 8*1024*1024) return showToast("Máximo 8 MB","error");
      const r = new FileReader();
      r.onload = async e => {
        pendingFile = file;
        prev.src           = e.target.result;
        prev.style.display = "block";
        ph.style.display   = "none";
        overlay.querySelector("#mm-url").value = "";
        // Mostrar dimensiones del archivo nuevo
        const d = await getImageDimensions(e.target.result);
        if (d) {
          dims.textContent  = `📐 ${d.w} × ${d.h} px`;
          dims.style.display = "block";
          if (d.w < sz.w * 0.8 || d.h < sz.h * 0.8) {
            dims.textContent += ` ⚠️ Menor al recomendado (${sz.label})`;
            dims.style.color = "#f59e0b";
          } else {
            dims.style.color = "var(--success)";
          }
        }
      };
      r.readAsDataURL(file);
    };

    dz.addEventListener("dragover",  e => { e.preventDefault(); dz.style.borderColor="var(--primary)"; dz.style.background="#eff6ff"; });
    dz.addEventListener("dragleave", () => { dz.style.borderColor="var(--border)"; dz.style.background="var(--surface-2,#f8fafc)"; });
    dz.addEventListener("drop",      e => { e.preventDefault(); dz.style.borderColor="var(--border)"; dz.style.background="var(--surface-2,#f8fafc)"; const f=e.dataTransfer.files[0]; if(f) cargarArchivo(f); });
    dz.addEventListener("click",     () => finp.click());
    finp.addEventListener("change",  e => { const f=e.target.files[0]; if(f) cargarArchivo(f); });

    // URL en vivo → preview
    overlay.querySelector("#mm-url")?.addEventListener("input", async e => {
      const url = e.target.value.trim();
      if (url) {
        prev.src           = url;
        prev.style.display = "block";
        ph.style.display   = "none";
        pendingFile = null;
        const d = await getImageDimensions(url);
        if (d) { dims.textContent = `📐 ${d.w} × ${d.h} px`; dims.style.display="block"; }
      }
    });

    // Cerrar
    overlay.querySelector("#mm-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#mm-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if(e.target===overlay) this._cerrarModal(); });

    // Guardar
    overlay.querySelector("#mm-save").addEventListener("click", async () => {
      const btn = overlay.querySelector("#mm-save");
      btn.disabled=true; btn.textContent="Guardando...";
      try {
        let src = overlay.querySelector("#mm-url")?.value.trim() || "";
        if (pendingFile) {
          showToast("Subiendo imagen...","info");
          src = await uploadImg(pendingFile);
        }
        if (!src) { showToast("Selecciona una imagen o pega una URL","warning"); btn.disabled=false; btn.textContent="💾 Guardar imagen"; return; }
        await Api.updateSettings({ [sec.settingKey]: src });
        const settings = { ...this.state.settings, [sec.settingKey]: src };
        this.setState({ settings });
        showToast(`✅ ${sec.title} actualizada`,"success");
        this._cerrarModal();
      } catch(e) {
        showToast(e.message||"Error al guardar","error");
        btn.disabled=false; btn.textContent="💾 Guardar imagen";
      }
    });
  }

  // ── Abrir modal video ───────────────────────────────────────
  _abrirModalVideo(sec) {
    this._cerrarModal();
    const { settings } = this.state;
    const urlActual    = settings[sec.settingKey] || "";
    const sz           = sec.recomendedSize;

    const overlay = document.createElement("div");
    overlay.id    = "media-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0">${sec.icon} ${sec.title}</h2>
          <button id="mv-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub)">✕</button>
        </div>

        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1">

          <!-- Specs -->
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:12px 14px">
            <p style="font-size:12px;font-weight:700;color:#5b21b6;margin:0 0 6px">📐 Especificaciones recomendadas</p>
            <table style="font-size:12px;color:#3b0764;width:100%;border-collapse:collapse">
              <tr><td style="padding:2px 0;width:110px;font-weight:600">Proporción:</td><td>${sz.label}</td></tr>
              <tr><td style="padding:2px 0;font-weight:600">Formato:</td><td>${sz.formato}</td></tr>
              <tr><td style="padding:2px 0;font-weight:600">Ajuste:</td><td>${sz.fit}</td></tr>
            </table>
            <p style="font-size:11px;color:#5b21b6;margin:6px 0 0">💡 El video se reproduce automáticamente en silencio y en loop. Usa un video de YouTube en formato embed.</p>
          </div>

          <!-- Preview actual -->
          ${urlActual ? `
            <div>
              <p style="font-size:13px;font-weight:600;margin:0 0 6px">Video actual:</p>
              <iframe src="${urlActual}" style="width:100%;aspect-ratio:16/9;border-radius:10px;border:1px solid var(--border)" allowfullscreen></iframe>
            </div>` : ""}

          <!-- Input URL -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">URL del video de YouTube</label>
            <input id="mv-url" class="input" type="text" placeholder="https://www.youtube.com/watch?v=... o /embed/..." value="${urlActual}">
            <p style="font-size:11px;color:var(--text-sub);margin-top:4px">Acepta links normales y de embed. Se convierte automáticamente al guardar.</p>
          </div>

          <!-- Preview nuevo -->
          <div id="mv-preview-wrap" style="display:none">
            <p style="font-size:13px;font-weight:600;margin:0 0 6px">Vista previa:</p>
            <iframe id="mv-preview-iframe" src="" style="width:100%;aspect-ratio:16/9;border-radius:10px;border:1px solid var(--border)" allowfullscreen></iframe>
          </div>
        </div>

        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="mv-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="mv-save"   class="btn btn-primary">💾 Guardar video</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity="0"; overlay.style.transition="opacity .2s"; requestAnimationFrame(() => overlay.style.opacity="1"); });

    overlay.querySelector("#mv-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#mv-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if(e.target===overlay) this._cerrarModal(); });

    // Preview en vivo
    overlay.querySelector("#mv-url")?.addEventListener("input", e => {
      const url = e.target.value.trim();
      const yt  = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
      const embedUrl = yt ? `https://www.youtube.com/embed/${yt[1]}` : url;
      const wrap = overlay.querySelector("#mv-preview-wrap");
      const ifr  = overlay.querySelector("#mv-preview-iframe");
      if (url && wrap && ifr) { ifr.src=embedUrl; wrap.style.display="block"; }
      else if (wrap) wrap.style.display="none";
    });

    overlay.querySelector("#mv-save").addEventListener("click", async () => {
      let url = overlay.querySelector("#mv-url")?.value.trim() || "";
      if (!url) return showToast("Pega la URL del video","warning");
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
      if (yt) url = `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}&controls=0&rel=0`;
      const btn = overlay.querySelector("#mv-save");
      btn.disabled=true; btn.textContent="Guardando...";
      try {
        await Api.updateSettings({ [sec.settingKey]: url });
        const settings = { ...this.state.settings, [sec.settingKey]: url };
        this.setState({ settings });
        showToast(`✅ ${sec.title} actualizado`,"success");
        this._cerrarModal();
      } catch(e) {
        showToast(e.message||"Error al guardar","error");
        btn.disabled=false; btn.textContent="💾 Guardar video";
      }
    });
  }

  // ── Abrir modal textos ──────────────────────────────────────
  _abrirModalTextos(sec) {
    this._cerrarModal();
    const { settings } = this.state;

    const overlay = document.createElement("div");
    overlay.id    = "media-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0">${sec.icon} ${sec.title}</h2>
          <button id="mt-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub)">✕</button>
        </div>
        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1">
          ${sec.fields.map(f => `
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">${f.label}</label>
              ${f.type === "textarea"
                ? `<textarea id="mt-${f.key}" class="input" rows="4" placeholder="${f.ph}" style="resize:vertical">${settings[f.key]||""}</textarea>`
                : `<input id="mt-${f.key}" class="input" type="text" placeholder="${f.ph}" value="${settings[f.key]||""}">`}
            </div>`).join("")}
        </div>
        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="mt-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="mt-save"   class="btn btn-primary">💾 Guardar textos</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity="0"; overlay.style.transition="opacity .2s"; requestAnimationFrame(() => overlay.style.opacity="1"); });

    overlay.querySelector("#mt-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#mt-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if(e.target===overlay) this._cerrarModal(); });

    overlay.querySelector("#mt-save").addEventListener("click", async () => {
      const updates = {};
      sec.fields.forEach(f => { updates[f.key] = overlay.querySelector(`#mt-${f.key}`)?.value || ""; });
      const btn = overlay.querySelector("#mt-save");
      btn.disabled=true; btn.textContent="Guardando...";
      try {
        await Api.updateSettings(updates);
        const settings = { ...this.state.settings, ...updates };
        this.setState({ settings });
        showToast(`✅ ${sec.title} guardados`,"success");
        this._cerrarModal();
      } catch(e) {
        showToast(e.message||"Error","error");
        btn.disabled=false; btn.textContent="💾 Guardar textos";
      }
    });
  }

  _cerrarModal() {
    if (this._overlay) { this._overlay.remove(); this._overlay=null; }
  }
  destroy() { this._cerrarModal(); if(this._el) this._el.remove(); this._mounted=false; }

  // ── Render ──────────────────────────────────────────────────
  render() {
    const { loading, settings } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">🎨 Contenido del Sitio</h1>
            <p class="page-subtitle">Cambia imágenes, videos y textos del sitio principal</p>
          </div>
        </div>

        <h2 class="section-label" style="margin-bottom:1rem">📸 Imágenes y Videos</h2>
        <div class="form-grid">
          ${MEDIA_SECTIONS.map(sec => {
            const val = settings[sec.settingKey] || "";
            const sz  = sec.recomendedSize;
            let previewHtml = val
              ? (sec.type === "video"
                  ? `<div style="border-radius:10px;overflow:hidden;margin-bottom:10px"><iframe src="${val}" style="width:100%;aspect-ratio:16/9;border:none;display:block" allowfullscreen></iframe></div>`
                  : `<div style="border-radius:10px;overflow:hidden;margin-bottom:10px;max-height:160px"><img src="${val}" style="width:100%;max-height:160px;object-fit:cover;display:block"></div>`)
              : `<div style="background:var(--surface-2,#f1f5f9);border-radius:10px;height:100px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:var(--text-sub);font-size:13px;border:1px dashed var(--border)">Sin media configurada</div>`;
            return `
              <div class="form-card media-section-card">
                <div class="form-card-header">
                  <div class="form-card-icon ${sec.iconClass}">${sec.icon}</div>
                  <div>
                    <h3>${sec.title}</h3>
                    <p>${sec.desc}</p>
                  </div>
                </div>
                ${previewHtml}
                <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:var(--text-sub)">
                  📐 Recomendado: <strong>${sz.label}</strong> · ${sz.formato}
                </div>
                <button class="btn btn-primary btn-sm media-btn" data-sec="${sec.id}">✏️ Cambiar</button>
              </div>`;
          }).join("")}
        </div>

        <h2 class="section-label" style="margin-top:1.75rem;margin-bottom:1rem">✏️ Textos</h2>
        <div class="form-grid">
          ${TEXT_SECTIONS.map(sec => {
            const val = settings[sec.fields[0].key] || "";
            return `
              <div class="form-card media-section-card">
                <div class="form-card-header">
                  <div class="form-card-icon ${sec.iconClass}">${sec.icon}</div>
                  <div><h3>${sec.title}</h3><p>${sec.desc}</p></div>
                </div>
                <p class="text-preview-snippet ${val?"":"empty"}">${val ? `"${val.substring(0,80)}${val.length>80?"…":""}"` : "Sin texto configurado"}</p>
                <button class="btn btn-primary btn-sm text-btn" data-sec="${sec.id}">✏️ Editar textos</button>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }

    document.querySelectorAll(".media-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const sec = MEDIA_SECTIONS.find(s => s.id === btn.dataset.sec);
        if (!sec) return;
        if (sec.type === "imagen") this._abrirModalImagen(sec);
        else this._abrirModalVideo(sec);
      });
    });
    document.querySelectorAll(".text-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const sec = TEXT_SECTIONS.find(s => s.id === btn.dataset.sec);
        if (sec) this._abrirModalTextos(sec);
      });
    });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container==="string" ? document.querySelector(container) : container).appendChild(this._el);
    this._mounted = true;
    await this.cargarDatos();
    return this;
  }
}
