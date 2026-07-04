// ═══════════════════════════════════════════════════════════════
// PAGE: BLOG — CRUD de publicaciones + edición de videos
// Modal como portal al body (mismo patrón que TipsPage)
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const CATEGORIAS = ["General","Normatividad","Consejos","Licencias","Motociclistas","Seguridad Vial","Noticias"];

export class BlogPage extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, posts: [], videos: {} };
    this._overlay = null;
  }

  async cargarDatos() {
    try {
      const [posts, cfg] = await Promise.all([Api.getBlog(), Api.getSettings()]);
      const videos = {
        v1_url:    cfg.blog_video_1_url    || "",
        v1_titulo: cfg.blog_video_1_titulo || "",
        v1_desc:   cfg.blog_video_1_desc   || "",
        v2_url:    cfg.blog_video_2_url    || "",
        v2_titulo: cfg.blog_video_2_titulo || "",
        v2_desc:   cfg.blog_video_2_desc   || "",
      };
      this.setState({ posts, videos, loading: false });
    } catch (e) {
      showToast(e.message, "error");
      this.setState({ loading: false });
    }
  }

  // ── Modal portal ─────────────────────────────────────────────
  _abrirModal(post = null) {
    this._cerrarModal();
    const esNuevo = !post;
    const d = post ?? { titulo:"", categoria:"General", resumen:"", contenido:"", imagen:"", activo:true, orden:0 };

    const overlay = document.createElement("div");
    overlay.id = "blog-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:620px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0">${esNuevo ? "➕ Nueva publicación" : "✏️ Editar publicación"}</h2>
          <button id="bm-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub)">✕</button>
        </div>

        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1">

          <!-- Imagen drag & drop -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Imagen de portada</label>
            <div id="bm-dropzone" style="border:2px dashed var(--border);border-radius:12px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;background:var(--surface-2,#f8fafc);position:relative">
              <input type="file" id="bm-file" accept="image/*" style="display:none">
              <img id="bm-img-preview" src="${d.imagen||""}" style="width:100%;max-height:180px;object-fit:cover;display:${d.imagen?"block":"none"}">
              <div id="bm-img-placeholder" style="display:${d.imagen?"none":"flex"};flex-direction:column;align-items:center;gap:6px;padding:20px;color:var(--text-sub)">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style="margin:0;font-size:13px;font-weight:600;color:var(--text)">Arrastra una imagen</p>
                <p style="margin:0;font-size:12px">o <span id="bm-browse" style="color:var(--primary);cursor:pointer;text-decoration:underline">selecciona un archivo</span></p>
                <p style="margin:0;font-size:11px;color:#94a3b8">JPG, PNG, WEBP — máx. 5 MB</p>
              </div>
              <button id="bm-img-clear" style="display:${d.imagen?"flex":"none"};position:absolute;top:8px;right:8px;background:rgba(0,0,0,.55);color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;align-items:center;justify-content:center;font-size:14px">✕</button>
            </div>
            <input type="hidden" id="bm-imagen" value="${d.imagen||""}">
          </div>

          <!-- Título -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Título *</label>
            <input id="bm-titulo" class="input" type="text" placeholder="Título de la publicación" value="${d.titulo||""}">
          </div>

          <!-- Categoría -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Categoría</label>
            <select id="bm-categoria" class="input" style="cursor:pointer">
              ${CATEGORIAS.map(c => `<option value="${c}" ${d.categoria===c?"selected":""}>${c}</option>`).join("")}
            </select>
          </div>

          <!-- Resumen -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Resumen * <span style="font-size:11px;color:var(--text-sub);font-weight:400">(aparece en la card)</span></label>
            <textarea id="bm-resumen" class="input" rows="2" placeholder="Breve descripción del artículo...">${d.resumen||""}</textarea>
          </div>

          <!-- Contenido completo -->
          <div class="form-group">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Contenido completo <span style="font-size:11px;color:var(--text-sub);font-weight:400">(opcional — aparece en el modal "Leer más")</span></label>
            <textarea id="bm-contenido" class="input" rows="5" placeholder="Escribe el artículo completo aquí...">${d.contenido||""}</textarea>
          </div>

          <!-- Orden y activo -->
          <div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:end">
            <div class="form-group" style="margin:0">
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Orden</label>
              <input id="bm-orden" class="input" type="number" min="0" value="${d.orden||0}">
            </div>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding-bottom:8px">
              <input type="checkbox" id="bm-activo" ${d.activo!==false&&d.activo!==0?"checked":""} style="width:16px;height:16px;cursor:pointer">
              <span style="font-size:13px;font-weight:500">Publicado (visible en el blog)</span>
            </label>
          </div>
        </div>

        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="bm-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="bm-save"   class="btn btn-primary">💾 ${esNuevo?"Publicar":"Guardar cambios"}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity="0"; overlay.style.transition="opacity .2s"; requestAnimationFrame(() => overlay.style.opacity="1"); });

    // Cerrar
    overlay.querySelector("#bm-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#bm-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if (e.target===overlay) this._cerrarModal(); });

    // Imagen drag & drop
    const dz      = overlay.querySelector("#bm-dropzone");
    const fileInp = overlay.querySelector("#bm-file");
    const imgPrev = overlay.querySelector("#bm-img-preview");
    const imgPh   = overlay.querySelector("#bm-img-placeholder");
    const imgClr  = overlay.querySelector("#bm-img-clear");
    const imgHdn  = overlay.querySelector("#bm-imagen");

    const setImg = url => {
      imgHdn.value          = url;
      imgPrev.src           = url;
      imgPrev.style.display = url ? "block" : "none";
      imgPh.style.display   = url ? "none"  : "flex";
      imgClr.style.display  = url ? "flex"  : "none";
    };
    const subirImg = async file => {
      if (!file.type.startsWith("image/")) return showToast("Solo imágenes","error");
      if (file.size > 5*1024*1024) return showToast("Máximo 5 MB","error");
      const r = new FileReader();
      r.onload = async ev => {
        try {
          showToast("Subiendo imagen...","info");
          const res = await Api.uploadImagen(ev.target.result, file.name);
          setImg(res.url);
          showToast("Imagen subida","success");
        } catch(err){ showToast(err.message,"error"); }
      };
      r.readAsDataURL(file);
    };
    dz.addEventListener("dragover",  e => { e.preventDefault(); dz.style.borderColor="var(--primary)"; dz.style.background="#eff6ff"; });
    dz.addEventListener("dragleave", () => { dz.style.borderColor="var(--border)"; dz.style.background="var(--surface-2,#f8fafc)"; });
    dz.addEventListener("drop",      e => { e.preventDefault(); dz.style.borderColor="var(--border)"; dz.style.background="var(--surface-2,#f8fafc)"; const f=e.dataTransfer.files[0]; if(f) subirImg(f); });
    dz.addEventListener("click",     e => { if(e.target===imgClr||e.target.closest("#bm-img-clear")) return; fileInp.click(); });
    overlay.querySelector("#bm-browse").addEventListener("click", e => { e.stopPropagation(); fileInp.click(); });
    fileInp.addEventListener("change", e => { const f=e.target.files[0]; if(f) subirImg(f); });
    imgClr.addEventListener("click", e => { e.stopPropagation(); setImg(""); fileInp.value=""; });

    // Guardar
    overlay.querySelector("#bm-save").addEventListener("click", async () => {
      const titulo    = overlay.querySelector("#bm-titulo").value.trim();
      const categoria = overlay.querySelector("#bm-categoria").value;
      const resumen   = overlay.querySelector("#bm-resumen").value.trim();
      const contenido = overlay.querySelector("#bm-contenido").value.trim();
      const imagen    = overlay.querySelector("#bm-imagen").value.trim();
      const activo    = overlay.querySelector("#bm-activo").checked;
      const orden     = parseInt(overlay.querySelector("#bm-orden").value)||0;

      if (!titulo)  return showToast("El título es obligatorio","error");
      if (!resumen) return showToast("El resumen es obligatorio","error");

      const btn = overlay.querySelector("#bm-save");
      btn.disabled = true; btn.textContent = "Guardando...";
      try {
        if (esNuevo) {
          await Api.createPost({ titulo, categoria, resumen, contenido, imagen, activo, orden });
          showToast("✅ Publicación creada","success");
        } else {
          await Api.updatePost(d.id, { titulo, categoria, resumen, contenido, imagen, activo, orden });
          showToast("✅ Publicación actualizada","success");
        }
        this._cerrarModal();
        const posts = await Api.getBlog();
        this.setState({ posts });
      } catch(e) {
        showToast(e.message||"Error al guardar","error");
        btn.disabled=false; btn.textContent = esNuevo?"💾 Publicar":"💾 Guardar cambios";
      }
    });

    setTimeout(() => overlay.querySelector("#bm-titulo")?.focus(), 60);
  }

  _cerrarModal() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
  }

  destroy() {
    this._cerrarModal();
    if (this._el) this._el.remove();
    this._mounted = false;
  }

  async guardarVideos() {
    const updates = {
      blog_video_1_url:    document.getElementById("bv1-url")?.value.trim()    || "",
      blog_video_1_titulo: document.getElementById("bv1-titulo")?.value.trim() || "",
      blog_video_1_desc:   document.getElementById("bv1-desc")?.value.trim()   || "",
      blog_video_2_url:    document.getElementById("bv2-url")?.value.trim()    || "",
      blog_video_2_titulo: document.getElementById("bv2-titulo")?.value.trim() || "",
      blog_video_2_desc:   document.getElementById("bv2-desc")?.value.trim()   || "",
    };
    // Convertir URLs de YouTube a embed
    ["blog_video_1_url","blog_video_2_url"].forEach(k => {
      const url = updates[k];
      if (!url) return;
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
      if (yt) updates[k] = `https://www.youtube.com/embed/${yt[1]}`;
    });
    try {
      await Api.updateSettings(updates);
      this.setState({ videos: {
        v1_url: updates.blog_video_1_url, v1_titulo: updates.blog_video_1_titulo, v1_desc: updates.blog_video_1_desc,
        v2_url: updates.blog_video_2_url, v2_titulo: updates.blog_video_2_titulo, v2_desc: updates.blog_video_2_desc,
      }});
      showToast("✅ Videos actualizados","success");
    } catch(e) { showToast(e.message,"error"); }
  }

  renderVideo(n, prefijo) {
    const { videos } = this.state;
    const url    = videos[`v${n}_url`]    || "";
    const titulo = videos[`v${n}_titulo`] || "";
    const desc   = videos[`v${n}_desc`]   || "";
    return `
      <div class="form-card">
        <div class="form-card-header">
          <div class="form-card-icon icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div><h3>Video ${n}</h3><p>URL de YouTube (normal o embed)</p></div>
        </div>
        ${url ? `<div style="margin-bottom:12px;border-radius:10px;overflow:hidden"><iframe src="${url}" style="width:100%;aspect-ratio:16/9;border:none" allowfullscreen></iframe></div>` : ""}
        <div class="field-group">
          <label class="field-label">URL de YouTube</label>
          <input id="bv${n}-url" class="form-input" type="text" placeholder="https://www.youtube.com/watch?v=... o embed/..." value="${url}">
          <p class="field-hint">Acepta URLs normales y de embed. Se convierte automáticamente al guardar.</p>
        </div>
        <div class="field-group">
          <label class="field-label">Título del video</label>
          <input id="bv${n}-titulo" class="form-input" type="text" placeholder="Ej: Técnicas básicas de conducción" value="${titulo}">
        </div>
        <div class="field-group">
          <label class="field-label">Descripción</label>
          <input id="bv${n}-desc" class="form-input" type="text" placeholder="Breve descripción del video..." value="${desc}">
        </div>
      </div>`;
  }

  render() {
    const { loading, posts } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando blog...</p></div>`;

    const publicados = posts.filter(p => p.activo).length;

    return `
      <div class="page fade-in">

        <!-- ── SECCIÓN PUBLICACIONES ── -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Blog</h1>
            <p class="page-subtitle">Gestiona publicaciones y videos del blog</p>
          </div>
          <button class="btn btn-primary" id="btn-nuevo-post">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva publicación
          </button>
        </div>

        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div class="stat-info"><span class="stat-label">Total posts</span><span class="stat-value">${posts.length}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="stat-info"><span class="stat-label">Publicados</span><span class="stat-value">${publicados}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-yellow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg></div>
            <div class="stat-info"><span class="stat-label">Borradores</span><span class="stat-value">${posts.length - publicados}</span></div>
          </div>
        </div>

        <!-- Lista de posts -->
        ${posts.length === 0 ? `
          <div class="empty-state" style="margin-bottom:2rem">
            <div class="empty-icon">📝</div>
            <h3>No hay publicaciones</h3>
            <p>Crea la primera publicación del blog.</p>
            <button class="btn btn-primary" id="btn-nuevo-post-empty">+ Nueva publicación</button>
          </div>
        ` : `
          <div class="table-wrap" style="margin-bottom:2rem">
            <table class="data-table">
              <thead><tr><th style="width:60px"></th><th>Título</th><th style="width:130px">Categoría</th><th style="width:90px">Estado</th><th style="width:110px">Acciones</th></tr></thead>
              <tbody>
                ${posts.map(p => `
                  <tr>
                    <td style="padding:6px 8px">
                      ${p.imagen ? `<img src="${p.imagen}" style="width:52px;height:40px;object-fit:cover;border-radius:6px">` : `<div style="width:52px;height:40px;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:1.3rem">📰</div>`}
                    </td>
                    <td>
                      <div style="font-size:14px;font-weight:600;color:var(--text)">${p.titulo}</div>
                      <div style="font-size:12px;color:var(--text-sub);margin-top:2px">${p.resumen.substring(0,70)}${p.resumen.length>70?"…":""}</div>
                    </td>
                    <td><span class="tag tag-cat">${p.categoria}</span></td>
                    <td><span class="badge ${p.activo?"badge-success":"badge-default"}">${p.activo?"Publicado":"Borrador"}</span></td>
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
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        `}

        <!-- ── SECCIÓN VIDEOS ── -->
        <div style="border-top:2px solid var(--border);padding-top:1.5rem;margin-bottom:1rem">
          <h2 style="font-size:1.1rem;font-weight:700;color:var(--title);margin:0 0 4px">Videos de YouTube</h2>
          <p style="font-size:13px;color:var(--text-sub);margin:0 0 1.25rem">Cambia las URLs de los dos videos que aparecen en el blog</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:1.5rem">
          ${this.renderVideo(1)} ${this.renderVideo(2)}
        </div>

        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="btn-guardar-videos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            Guardar videos
          </button>
        </div>

      </div>`;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }

    document.getElementById("btn-nuevo-post")?.addEventListener("click",       () => this._abrirModal());
    document.getElementById("btn-nuevo-post-empty")?.addEventListener("click", () => this._abrirModal());
    document.getElementById("btn-guardar-videos")?.addEventListener("click",   () => this.guardarVideos());

    document.querySelectorAll(".btn-edit").forEach(btn =>
      btn.addEventListener("click", () => {
        const p = this.state.posts.find(x => x.id === parseInt(btn.dataset.id));
        if (p) this._abrirModal(p);
      })
    );
    document.querySelectorAll(".btn-delete").forEach(btn =>
      btn.addEventListener("click", async () => {
        const p = this.state.posts.find(x => x.id === parseInt(btn.dataset.id));
        if (!p || !confirm(`¿Eliminar "${p.titulo}"?`)) return;
        try {
          await Api.deletePost(p.id);
          showToast("Publicación eliminada","success");
          const posts = await Api.getBlog();
          this.setState({ posts });
        } catch(e) { showToast(e.message,"error"); }
      })
    );
  }
}
