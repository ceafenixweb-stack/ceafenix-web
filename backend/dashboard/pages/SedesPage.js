// ═══════════════════════════════════════════════════════════════
// PAGE: GESTIÓN DE SEDES Y LA NACIONAL MOCOA
// ═══════════════════════════════════════════════════════════════
import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

const SEDES = [
  { key:"sede1", nombre:"Sede N°1 — Florencia", keys:["sede1_nombre","sede1_direccion","sede1_telefono","sede1_whatsapp","sede1_horario","sede1_descripcion"] },
  { key:"sede2", nombre:"Sede N°2 — Florencia", keys:["sede2_nombre","sede2_direccion","sede2_telefono","sede2_whatsapp","sede2_horario","sede2_descripcion"] },
  { key:"sede3", nombre:"Sede N°3 — Florencia", keys:["sede3_nombre","sede3_direccion","sede3_telefono","sede3_whatsapp","sede3_horario","sede3_descripcion"] },
  { key:"mocoa", nombre:"La Nacional Mocoa",     keys:["mocoa_nombre","mocoa_direccion","mocoa_telefono","mocoa_whatsapp","mocoa_horario","mocoa_descripcion"] },
];

const FIELD_LABELS = {
  nombre:"Nombre de la sede", direccion:"Dirección", telefono:"Teléfono",
  whatsapp:"WhatsApp (ej: 573001234567)", horario:"Horario de atención", descripcion:"Descripción breve"
};

export class SedesPage extends Component {
  constructor(props) {
    super(props);
    this.state = { settings:{}, loading:true, saving:false, active:"sede1" };
  }

  fieldKey(sedeKey, field) { return `${sedeKey}_${field}`; }

  renderSedeForm(sede, settings) {
    const fields = ["nombre","direccion","telefono","whatsapp","horario","descripcion"];
    return `
      <div class="form-grid">
        ${fields.map(f => {
          const key = this.fieldKey(sede.key, f);
          const val = settings[key] || "";
          const isTextarea = f === "descripcion";
          return `
            <div class="form-card">
              <div class="form-group">
                <label>${FIELD_LABELS[f]}</label>
                ${isTextarea
                  ? `<textarea class="input" id="${key}" rows="3" placeholder="${FIELD_LABELS[f]}">${val}</textarea>`
                  : `<input class="input" type="text" id="${key}" value="${val}" placeholder="${FIELD_LABELS[f]}">`
                }
              </div>
            </div>`;
        }).join("")}
      </div>
      ${sede.key === "mocoa" ? `
        <div class="preview-card" style="margin-top:1rem">
          <p style="font-size:.85rem;color:var(--text-sub)">
            📄 Los cambios se reflejan en la página <a href="/pages/lanacionalmocoa.html" target="_blank" style="color:var(--primary)">lanacionalmocoa.html</a> al guardar.
          </p>
        </div>` : ""}`;
  }

  render() {
    const { settings, loading, saving, active } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;
    const sede = SEDES.find(s => s.key === active);

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Gestión de Sedes</h1>
            <p class="page-subtitle">Información de contacto y detalles de cada sede</p>
          </div>
        </div>

        <div class="tabs-row">
          ${SEDES.map(s => `
            <button class="tab-btn ${s.key===active?"tab-active":""}" data-sede="${s.key}">
              ${s.key==="mocoa" ? "🏢" : "📍"} ${s.nombre}
            </button>`).join("")}
        </div>

        <div class="tab-content">
          <h2 class="section-label" style="margin-bottom:1rem">${sede.nombre}</h2>
          ${this.renderSedeForm(sede, settings)}
        </div>

        <div class="form-actions">
          <button class="btn btn-ghost" id="resetBtn">Descartar cambios</button>
          <button class="btn btn-primary ${saving?"btn-loading":""}" id="saveSedeBtn" ${saving?"disabled":""}>
            ${saving ? '<span class="btn-spinner"></span> Guardando...' : "💾 Guardar sede"}
          </button>
        </div>
      </div>`;
  }

  afterRender() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.setState({ active: btn.dataset.sede });
      });
    });

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      this.setState({ active: this.state.active });
      showToast("Cambios descartados", "info");
    });

    document.getElementById("saveSedeBtn")?.addEventListener("click", async () => {
      const { active, settings } = this.state;
      const sede = SEDES.find(s => s.key === active);
      const fields = ["nombre","direccion","telefono","whatsapp","horario","descripcion"];
      const updates = {};
      fields.forEach(f => {
        const key = this.fieldKey(sede.key, f);
        const el = document.getElementById(key);
        if (el) updates[key] = el.value;
      });
      this.setState({ saving: true });
      try {
        await Api.updateSettings(updates);
        showToast(`✅ ${sede.nombre} actualizada`, "success");
        this.state.settings = { ...this.state.settings, ...updates };
        this.setState({ saving: false });
      } catch(e) {
        showToast(e.message || "Error al guardar", "error");
        this.setState({ saving: false });
      }
    });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container==="string"?document.querySelector(container):container).appendChild(this._el);
    this._mounted = true;
    const settings = await Api.getSettings();
    this.setState({ settings, loading:false });
    return this;
  }
}
