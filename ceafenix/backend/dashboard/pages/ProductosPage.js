// ═══════════════════════════════════════════════════════════════
// PAGE: PRODUCTOS DE LA TIENDA — CRUD completo
// ═══════════════════════════════════════════════════════════════
import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const API   = "/api/productos";
const token = () => localStorage.getItem("cea_token");
const h     = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fmt   = v => v ? "$" + Number(v).toLocaleString("es-CO") : "$0";

async function apiFetch(url, opts = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token()}` },
    ...opts,
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.message || "Error del servidor");
  return data;
}

export class ProductosPage extends Component {
  constructor(props) {
    super(props);
    this.state = { productos:[], loading:true };
    this._modal = null;
  }

  render() {
    const { productos, loading } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Productos de la Tienda</h1>
            <p class="page-subtitle">${productos.length} producto${productos.length!==1?"s":""} registrado${productos.length!==1?"s":""}</p>
          </div>
          <button class="btn btn-primary" id="btnNuevo">+ Nuevo producto</button>
        </div>

        ${productos.length === 0 ? `
          <div class="empty-state">
            <div style="font-size:3rem">🛒</div>
            <h3>No hay productos todavía</h3>
            <p>Crea tu primer producto para mostrarlo en la tienda.</p>
            <button class="btn btn-primary" id="btnNuevoEmpty">+ Agregar producto</button>
          </div>
        ` : `
          <div class="productos-grid">
            ${productos.map(p => `
              <div class="producto-card ${p.activo ? "" : "producto-inactivo"}">
                <div class="producto-img-wrap">
                  ${p.imagen
                    ? `<img src="${h(p.imagen)}" alt="${h(p.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ""}
                  <div class="producto-img-placeholder" style="${p.imagen?"display:none":"display:flex"}">🛒</div>
                  ${!p.activo ? `<span class="producto-badge-inactivo">Oculto</span>` : ""}
                </div>
                <div class="producto-info">
                  <h3>${h(p.nombre)}</h3>
                  <p class="producto-precio">${fmt(p.precio)}</p>
                  ${p.descripcion ? `<p class="producto-desc">${h(p.descripcion)}</p>` : ""}
                </div>
                <div class="producto-actions">
                  <button class="btn btn-sm btn-ghost btn-edit" data-id="${p.id}">✏️ Editar</button>
                  <button class="btn btn-sm btn-danger btn-delete" data-id="${p.id}">🗑️ Eliminar</button>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>`;
  }

  openModal(producto = {}) {
    // Remove existing modal if any
    document.getElementById("prod-modal-overlay")?.remove();

    const isNew = !producto.id;
    const overlay = document.createElement("div");
    overlay.id = "prod-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:540px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.5rem 1.75rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1.15rem;font-weight:700;margin:0;color:var(--title)">${isNew ? "➕ Nuevo producto" : "✏️ Editar producto"}</h2>
          <button id="modal-close-x" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-sub);padding:.25rem">✕</button>
        </div>
        <div style="padding:1.5rem 1.75rem;display:flex;flex-direction:column;gap:1rem;max-height:65vh;overflow-y:auto">
          <div class="form-group">
            <label>Nombre del producto *</label>
            <input class="input" id="m_nombre" value="${h(producto.nombre||"")}" placeholder="Ej: Casco certificado">
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea class="input" id="m_desc" rows="3" placeholder="Descripción del producto">${h(producto.descripcion||"")}</textarea>
          </div>
          <div class="form-group">
            <label>Precio (COP) *</label>
            <div class="input-prefix">
              <span class="prefix">$</span>
              <input class="input" type="number" id="m_precio" value="${producto.precio||""}" placeholder="0" min="0" step="1000">
            </div>
          </div>
          <div class="form-group">
            <label>Imagen del producto</label>
            <div id="img-dropzone" style="
              border:2px dashed var(--border);border-radius:12px;
              padding:0;cursor:pointer;overflow:hidden;
              background:var(--surface-2,#f8fafc);
              transition:border-color .2s;min-height:130px;
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              position:relative;
            ">
              <input type="file" id="m_imagen_file" accept="image/*" style="display:none">
              <!-- Preview (oculto hasta que haya imagen) -->
              <img id="img-preview" src="${h(producto.imagen||"")}"
                style="width:100%;max-height:220px;object-fit:cover;display:${producto.imagen?"block":"none"};border-radius:10px">
              <!-- Placeholder drag & drop -->
              <div id="img-placeholder" style="display:${producto.imagen?"none":"flex"};flex-direction:column;align-items:center;gap:8px;padding:24px 16px;color:var(--text-sub)">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style="font-size:13px;font-weight:600;margin:0;color:var(--text)">Arrastra una imagen aquí</p>
                <p style="font-size:12px;margin:0">o <span style="color:var(--primary);text-decoration:underline;cursor:pointer" id="img-browse-btn">selecciona un archivo</span></p>
                <p style="font-size:11px;color:#94a3b8;margin:0">JPG, PNG, WEBP — máx. 5 MB</p>
              </div>
              <!-- Botón quitar (solo cuando hay imagen) -->
              <button id="img-clear-btn" title="Quitar imagen" style="
                display:${producto.imagen?"flex":"none"};
                position:absolute;top:8px;right:8px;
                background:rgba(0,0,0,.55);color:white;border:none;
                border-radius:50%;width:28px;height:28px;cursor:pointer;
                align-items:center;justify-content:center;font-size:14px;
              ">✕</button>
            </div>
            <!-- Campo URL oculto — guarda la ruta final -->
            <input type="hidden" id="m_imagen" value="${h(producto.imagen||"")}">
          </div>
          <div class="form-group">
            <label>WhatsApp del producto (opcional)</label>
            <input class="input" id="m_wa" value="${h(producto.whatsapp||"")}" placeholder="573001234567">
          </div>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:.75rem">
            <input type="checkbox" id="m_activo" ${producto.activo!==false&&producto.activo!==0?"checked":""} style="width:auto;margin:0">
            <label for="m_activo" style="margin:0;cursor:pointer;font-weight:500">Visible en la tienda</label>
          </div>
        </div>
        <div style="padding:1.25rem 1.75rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end">
          <button class="btn btn-ghost" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="modal-save">${isNew ? "Crear producto" : "Guardar cambios"}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._modal = { overlay, producto };

    // Animate in
    requestAnimationFrame(() => { overlay.style.opacity = "0"; overlay.style.transition = "opacity .2s"; overlay.style.opacity = "1"; });

    // Events
    document.getElementById("modal-close-x").addEventListener("click", () => this.closeModal());
    document.getElementById("modal-cancel").addEventListener("click",  () => this.closeModal());
    overlay.addEventListener("click", e => { if (e.target === overlay) this.closeModal(); });
    document.getElementById("modal-save").addEventListener("click", () => this.saveModal(producto.id));

    // ── Drag & Drop imagen ─────────────────────────────────────
    const dz       = document.getElementById("img-dropzone");
    const fileInp  = document.getElementById("m_imagen_file");
    const preview  = document.getElementById("img-preview");
    const placeholder = document.getElementById("img-placeholder");
    const clearBtn = document.getElementById("img-clear-btn");
    const hiddenInp = document.getElementById("m_imagen");

    const setImagen = (url) => {
      hiddenInp.value   = url;
      preview.src       = url;
      preview.style.display    = url ? "block"  : "none";
      placeholder.style.display = url ? "none"   : "flex";
      clearBtn.style.display    = url ? "flex"   : "none";
    };

    const subirArchivo = async (file) => {
      if (!file.type.startsWith("image/")) return showToast("Solo se aceptan imágenes", "error");
      if (file.size > 5 * 1024 * 1024) return showToast("Máximo 5 MB", "error");
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          showToast("Subiendo imagen...", "info");
          const resp = await Api.uploadImagen(ev.target.result, file.name);
          setImagen(resp.url);
          showToast("Imagen subida correctamente", "success");
        } catch (err) { showToast(err.message, "error"); }
      };
      reader.readAsDataURL(file);
    };

    dz.addEventListener("dragover",  e => { e.preventDefault(); dz.style.borderColor = "var(--primary)"; dz.style.background = "#eff6ff"; });
    dz.addEventListener("dragleave", () => { dz.style.borderColor = "var(--border)"; dz.style.background = "var(--surface-2,#f8fafc)"; });
    dz.addEventListener("drop", e => {
      e.preventDefault(); dz.style.borderColor = "var(--border)"; dz.style.background = "var(--surface-2,#f8fafc)";
      const file = e.dataTransfer.files[0]; if (file) subirArchivo(file);
    });
    dz.addEventListener("click", (e) => {
      if (e.target.id === "img-clear-btn" || e.target.closest("#img-clear-btn")) return;
      fileInp.click();
    });
    document.getElementById("img-browse-btn")?.addEventListener("click", e => { e.stopPropagation(); fileInp.click(); });
    fileInp.addEventListener("change", e => { const f = e.target.files[0]; if (f) subirArchivo(f); });
    clearBtn.addEventListener("click", e => { e.stopPropagation(); setImagen(""); fileInp.value = ""; });

    // Focus first field
    setTimeout(() => document.getElementById("m_nombre")?.focus(), 50);
  }

  closeModal() {
    document.getElementById("prod-modal-overlay")?.remove();
    this._modal = null;
  }

  async saveModal(existingId) {
    const nombre = document.getElementById("m_nombre")?.value.trim();
    const desc   = document.getElementById("m_desc")?.value.trim();
    const precio = document.getElementById("m_precio")?.value;
    const imagen = document.getElementById("m_imagen")?.value.trim();
    const wa     = document.getElementById("m_wa")?.value.trim();
    const activo = document.getElementById("m_activo")?.checked;

    if (!nombre) { showToast("El nombre es requerido", "warning"); return; }
    if (precio === "" || precio === undefined) { showToast("Ingresa un precio (puede ser 0)", "warning"); return; }

    const saveBtn = document.getElementById("modal-save");
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Guardando..."; }

    const body = { nombre, descripcion:desc, precio:Number(precio), imagen, whatsapp:wa, activo, orden:0 };
    try {
      if (existingId) {
        await apiFetch(`${API}/${existingId}`, { method:"PUT", body:JSON.stringify(body) });
        showToast("✅ Producto actualizado", "success");
      } else {
        await apiFetch(API, { method:"POST", body:JSON.stringify(body) });
        showToast("✅ Producto creado", "success");
      }
      this.closeModal();
      await this.loadData();
    } catch(e) {
      showToast(e.message || "Error al guardar", "error");
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = existingId ? "Guardar cambios" : "Crear producto"; }
    }
  }

  afterRender() {
    document.getElementById("btnNuevo")?.addEventListener("click",      () => this.openModal());
    document.getElementById("btnNuevoEmpty")?.addEventListener("click", () => this.openModal());

    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = this.state.productos.find(x => x.id == btn.dataset.id);
        if (p) this.openModal(p);
      });
    });

    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => this.confirmDelete(btn.dataset.id));
    });
  }

  async confirmDelete(id) {
    const p = this.state.productos.find(x => x.id == id);
    if (!p || !confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`${API}/${id}`, { method:"DELETE" });
      showToast("Producto eliminado", "info");
      await this.loadData();
    } catch(e) { showToast(e.message, "error"); }
  }

  async loadData() {
    const productos = await apiFetch(API);
    this.setState({ productos, loading:false });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container==="string"?document.querySelector(container):container).appendChild(this._el);
    this._mounted = true;
    await this.loadData();
    return this;
  }
}
