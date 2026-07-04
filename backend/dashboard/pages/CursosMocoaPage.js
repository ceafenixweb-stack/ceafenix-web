// ═══════════════════════════════════════════════════════════════
// PAGE: CURSOS MOCOA — CRUD completo de cursos-mocoa.html
// Modal como portal al body
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const CATEGORIAS = [
  { val:"licencia",      label:"🪪 Licencias" },
  { val:"especializado", label:"🛡️ Especializados" },
  { val:"diplomado",     label:"🏛️ Diplomados" },
  { val:"virtual",       label:"💻 Virtual" },
];
const COLORES = [
  { val:"ch-lic",   label:"Azul (Licencias)"   },
  { val:"ch-moto",  label:"Verde azulado (Moto)"},
  { val:"ch-pub",   label:"Morado (Público)"    },
  { val:"ch-def",   label:"Celeste (Defensivo)" },
  { val:"ch-dip",   label:"Amarillo (Diplomado)"},
  { val:"ch-aux",   label:"Rojo (Auxilios)"     },
  { val:"ch-cargo", label:"Verde (Cargo)"       },
  { val:"ch-virt",  label:"Índigo (Virtual)"    },
];

export class CursosMocoaPage extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, cursos: [], filtro: "all" };
    this._overlay = null;
  }

  async cargarDatos() {
    try {
      const cursos = await Api.getCursosMocoa();
      this.setState({ cursos, loading: false });
    } catch(e) { showToast(e.message,"error"); this.setState({ loading:false }); }
  }

  _cursosFiltrados() {
    const { cursos, filtro } = this.state;
    return filtro === "all" ? cursos : cursos.filter(c => c.categoria === filtro);
  }

  // ── Modal portal ─────────────────────────────────────────────
  _abrirModal(curso = null) {
    this._cerrarModal();
    const esNuevo = !curso;
    const d = curso ?? { titulo:"", categoria:"licencia", emoji:"🎓", badge:"", descripcion:"", horas:"", meta2:"", meta3:"Certificado", precio:"Consultar", wa_texto:"Inscribirme", color:"ch-lic", activo:true, orden:this.state.cursos.length };

    const overlay = document.createElement("div");
    overlay.id = "cm-modal-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)";

    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:640px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:1.1rem;font-weight:700;margin:0">${esNuevo ? "➕ Nuevo curso" : "✏️ Editar curso"}</h2>
          <button id="cm-close" style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:var(--text-sub)">✕</button>
        </div>

        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:.9rem;overflow-y:auto;flex:1">

          <!-- Fila emoji + título -->
          <div style="display:grid;grid-template-columns:90px 1fr;gap:10px">
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Emoji</label>
              <input id="cm-emoji" class="input" type="text" value="${d.emoji||'🎓'}" style="font-size:1.4rem;text-align:center;width:100%">
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Título *</label>
              <input id="cm-titulo" class="input" type="text" placeholder="Ej: A2 — Moto +125cc" value="${d.titulo||''}">
            </div>
          </div>

          <!-- Fila categoría + color -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Categoría</label>
              <select id="cm-categoria" class="input" style="cursor:pointer">
                ${CATEGORIAS.map(c=>`<option value="${c.val}" ${d.categoria===c.val?"selected":""}>${c.label}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Color de la card</label>
              <select id="cm-color" class="input" style="cursor:pointer">
                ${COLORES.map(c=>`<option value="${c.val}" ${d.color===c.val?"selected":""}>${c.label}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Badge -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Badge / Etiqueta <span style="font-size:11px;color:var(--text-sub)">(aparece en el encabezado de la card)</span></label>
            <input id="cm-badge" class="input" type="text" placeholder="Ej: Licencia A2" value="${d.badge||''}">
          </div>

          <!-- Descripción -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Descripción *</label>
            <textarea id="cm-desc" class="input" rows="3" placeholder="Describe el contenido del curso...">${d.descripcion||''}</textarea>
          </div>

          <!-- Horas + Meta 2 + Meta 3 -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Etiquetas de información <span style="font-size:11px;color:var(--text-sub)">(horas, modalidad, certificado)</span></label>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              <input id="cm-horas"  class="input" type="text" placeholder="20 horas"         value="${d.horas||''}">
              <input id="cm-meta2"  class="input" type="text" placeholder="Teoría + práctica" value="${d.meta2||''}">
              <input id="cm-meta3"  class="input" type="text" placeholder="Certificado"       value="${d.meta3||''}">
            </div>
          </div>

          <!-- Precio -->
          <div>
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Precio</label>
            <input id="cm-precio" class="input" type="text" placeholder="$1.200.000 o Consultar" value="${d.precio||'Consultar'}">
            <p style="font-size:11px;color:var(--text-sub);margin-top:3px">Escribe el precio con $ o déjalo como "Consultar"</p>
          </div>

          <!-- Texto botón WA + orden + activo -->
          <div style="display:grid;grid-template-columns:1fr 80px;gap:10px">
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Texto del botón WhatsApp</label>
              <input id="cm-wa" class="input" type="text" placeholder="Inscribirme" value="${d.wa_texto||'Inscribirme'}">
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">Orden</label>
              <input id="cm-orden" class="input" type="number" min="0" value="${d.orden||0}">
            </div>
          </div>

          <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="cm-activo" ${d.activo!==false&&d.activo!==0?"checked":""} style="width:16px;height:16px">
            <span style="font-size:13px;font-weight:500">Visible en la página de cursos</span>
          </label>

          <!-- Mini preview -->
          <div>
            <p style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Vista previa</p>
            <div id="cm-preview" style="border-radius:14px;overflow:hidden;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,.08);max-width:280px">
              <div id="cm-prev-header" class="card-header ${d.color||'ch-lic'}" style="padding:1.25rem">
                <span id="cm-prev-emoji" class="emoji">${d.emoji||'🎓'}</span>
                <h3 id="cm-prev-titulo" style="color:#fff;font-size:1rem;margin:.25rem 0">${d.titulo||'Título del curso'}</h3>
                <span id="cm-prev-badge" class="cat-badge">${d.badge||''}</span>
              </div>
              <div style="padding:12px 14px;background:var(--surface)">
                <p id="cm-prev-desc" style="font-size:12px;color:var(--text-sub);line-height:1.5;margin:0 0 8px">${d.descripcion||'Descripción del curso...'}</p>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
                  <span id="cm-prev-horas"  class="meta-tag">${d.horas||''}</span>
                  <span id="cm-prev-meta2"  class="meta-tag">${d.meta2||''}</span>
                  <span id="cm-prev-meta3"  class="meta-tag">${d.meta3||''}</span>
                </div>
                <div id="cm-prev-precio" style="font-size:1.1rem;font-weight:800;color:var(--title)">${d.precio||'Consultar'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;flex-shrink:0">
          <button id="cm-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="cm-save"   class="btn btn-primary">💾 ${esNuevo?"Crear curso":"Guardar cambios"}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._overlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity="0"; overlay.style.transition="opacity .2s"; requestAnimationFrame(() => overlay.style.opacity="1"); });

    // Cerrar
    overlay.querySelector("#cm-close").onclick  = () => this._cerrarModal();
    overlay.querySelector("#cm-cancel").onclick = () => this._cerrarModal();
    overlay.addEventListener("click", e => { if(e.target===overlay) this._cerrarModal(); });

    // Preview en tiempo real
    const prev = sel => overlay.querySelector(sel);
    const live = (id, sel, fn) => overlay.querySelector(id)?.addEventListener("input", e => {
      const el = prev(sel); if(el) el.textContent = fn ? fn(e.target.value) : e.target.value;
    });
    live("#cm-emoji",  "#cm-prev-emoji", null);
    live("#cm-titulo", "#cm-prev-titulo", null);
    live("#cm-badge",  "#cm-prev-badge", null);
    live("#cm-desc",   "#cm-prev-desc", null);
    live("#cm-horas",  "#cm-prev-horas", null);
    live("#cm-meta2",  "#cm-prev-meta2", null);
    live("#cm-meta3",  "#cm-prev-meta3", null);
    live("#cm-precio", "#cm-prev-precio", null);

    // Cambio de color → actualiza header del preview
    overlay.querySelector("#cm-color")?.addEventListener("change", e => {
      const h = prev("#cm-prev-header");
      if (h) { h.className = `card-header ${e.target.value}`; h.style.padding="1.25rem"; }
    });

    // Guardar
    overlay.querySelector("#cm-save").addEventListener("click", async () => {
      const get = id => overlay.querySelector(id)?.value?.trim() ?? "";
      const titulo    = get("#cm-titulo");
      const descripcion = get("#cm-desc");
      if (!titulo)      return showToast("El título es obligatorio","error");
      if (!descripcion) return showToast("La descripción es obligatoria","error");

      const data = {
        titulo, descripcion,
        categoria: get("#cm-categoria"),
        emoji:     get("#cm-emoji"),
        badge:     get("#cm-badge"),
        horas:     get("#cm-horas"),
        meta2:     get("#cm-meta2"),
        meta3:     get("#cm-meta3"),
        precio:    get("#cm-precio"),
        wa_texto:  get("#cm-wa"),
        color:     get("#cm-color"),
        orden:     parseInt(get("#cm-orden"))||0,
        activo:    overlay.querySelector("#cm-activo")?.checked ?? true,
      };

      const btn = overlay.querySelector("#cm-save");
      btn.disabled=true; btn.textContent="Guardando...";
      try {
        if (esNuevo) {
          await Api.createCursoMocoa(data);
          showToast("✅ Curso creado","success");
        } else {
          await Api.updateCursoMocoa(d.id, data);
          showToast("✅ Curso actualizado","success");
        }
        this._cerrarModal();
        const cursos = await Api.getCursosMocoa();
        this.setState({ cursos });
      } catch(e) {
        showToast(e.message||"Error al guardar","error");
        btn.disabled=false; btn.textContent = esNuevo?"💾 Crear curso":"💾 Guardar cambios";
      }
    });

    setTimeout(() => overlay.querySelector("#cm-titulo")?.focus(), 60);
  }

  _cerrarModal() {
    if (this._overlay) { this._overlay.remove(); this._overlay=null; }
  }
  destroy() { this._cerrarModal(); if(this._el) this._el.remove(); this._mounted=false; }

  render() {
    const { loading, cursos, filtro } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando cursos...</p></div>`;

    const lista      = this._cursosFiltrados();
    const activos    = cursos.filter(c=>c.activo).length;
    const categorias = [...new Set(cursos.map(c=>c.categoria))];

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Cursos — La Nacional Mocoa</h1>
            <p class="page-subtitle">Gestiona todos los cursos de la página cursos-mocoa</p>
          </div>
          <button class="btn btn-primary" id="btn-nuevo-curso">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo curso
          </button>
        </div>

        <div class="stats-grid" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <div class="stat-info"><span class="stat-label">Total cursos</span><span class="stat-value">${cursos.length}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="stat-info"><span class="stat-label">Visibles</span><span class="stat-value">${activos}</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-yellow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/></svg></div>
            <div class="stat-info"><span class="stat-label">Categorías</span><span class="stat-value">${categorias.length}</span></div>
          </div>
        </div>

        <!-- Filtros -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.25rem">
          <button class="filter-tab ${filtro==='all'?'filter-tab-active':''}" data-filtro="all">Todos (${cursos.length})</button>
          ${CATEGORIAS.filter(c=>categorias.includes(c.val)).map(c=>`
            <button class="filter-tab ${filtro===c.val?'filter-tab-active':''}" data-filtro="${c.val}">
              ${c.label} (${cursos.filter(x=>x.categoria===c.val).length})
            </button>`).join("")}
        </div>

        <!-- Tabla -->
        ${lista.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🎓</div>
            <h3>No hay cursos${filtro!=='all'?' en esta categoría':''}</h3>
            <button class="btn btn-primary" id="btn-nuevo-curso-empty">+ Nuevo curso</button>
          </div>
        ` : `
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr>
                <th style="width:50px">Emoji</th>
                <th>Título</th>
                <th style="width:130px">Categoría</th>
                <th style="width:120px">Precio</th>
                <th style="width:90px">Estado</th>
                <th style="width:110px">Acciones</th>
              </tr></thead>
              <tbody>
                ${lista.map(c=>`
                  <tr>
                    <td style="text-align:center;font-size:1.4rem">${c.emoji||'🎓'}</td>
                    <td>
                      <div style="font-size:14px;font-weight:600">${c.titulo}</div>
                      <div style="font-size:12px;color:var(--text-sub)">${c.descripcion?.substring(0,60)||''}${(c.descripcion?.length||0)>60?'…':''}</div>
                    </td>
                    <td><span class="tag tag-cat">${CATEGORIAS.find(x=>x.val===c.categoria)?.label||c.categoria}</span></td>
                    <td style="font-weight:700;color:var(--primary)">${c.precio||'Consultar'}</td>
                    <td><span class="badge ${c.activo?'badge-success':'badge-default'}">${c.activo?'Visible':'Oculto'}</span></td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-icon btn-edit"   data-id="${c.id}" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn-icon btn-delete" data-id="${c.id}" title="Eliminar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>`;
  }

  afterRender() {
    if (this.state.loading) { this.cargarDatos(); return; }

    document.getElementById("btn-nuevo-curso")?.addEventListener("click",       () => this._abrirModal());
    document.getElementById("btn-nuevo-curso-empty")?.addEventListener("click", () => this._abrirModal());

    document.querySelectorAll(".filter-tab").forEach(btn =>
      btn.addEventListener("click", () => this.setState({ filtro: btn.dataset.filtro }))
    );
    document.querySelectorAll(".btn-edit").forEach(btn =>
      btn.addEventListener("click", () => {
        const c = this.state.cursos.find(x=>x.id===parseInt(btn.dataset.id));
        if(c) this._abrirModal(c);
      })
    );
    document.querySelectorAll(".btn-delete").forEach(btn =>
      btn.addEventListener("click", async () => {
        const c = this.state.cursos.find(x=>x.id===parseInt(btn.dataset.id));
        if(!c||!confirm(`¿Eliminar "${c.titulo}"?`)) return;
        try {
          await Api.deleteCursoMocoa(c.id);
          showToast("Curso eliminado","success");
          const cursos = await Api.getCursosMocoa();
          this.setState({ cursos });
        } catch(e) { showToast(e.message,"error"); }
      })
    );
  }
}
