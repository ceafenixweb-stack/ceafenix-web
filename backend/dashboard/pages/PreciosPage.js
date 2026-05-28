// ═══════════════════════════════════════════════════════════════
// PAGE: PRECIOS + TÍTULOS — Cursos y Tienda
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { AuthService } from "../services/auth.js";
import { showToast } from "../components/Toast.js";

export class PreciosPage extends Component {
  constructor(props) {
    super(props);
    this.isAdmin = AuthService.isAdmin();
    this.state = { settings: null, loading: true, saving: false };
  }

  fmt(val) { return Number(val || 0).toLocaleString("es-CO"); }

  COURSE_FIELDS = [
    { id:"precio_moto",     titleId:"titulo_moto",     descId:"desc_moto",     label:"A2 — Moto +125cc",        sub:"Categoría A2 · Motocicletas",         emoji:"🏍️", color:"icon-green" },
    { id:"precio_c1",       titleId:"titulo_c1",       descId:"desc_c1",       label:"C1 — Servicio público",    sub:"Categoría C1 · Taxis y servicio",     emoji:"🚕", color:"icon-blue" },
    { id:"precio_b1",       titleId:"titulo_b1",       descId:"desc_b1",       label:"B1 — Vehículo particular", sub:"Categoría B1 · Automóvil",            emoji:"🚗", color:"icon-orange" },
    { id:"precio_basico",   titleId:"titulo_basico",   descId:"desc_basico",   label:"Curso Básico",             sub:"Teoría + prácticas supervisadas",     emoji:"📘", color:"icon-blue" },
    { id:"precio_completo", titleId:"titulo_completo", descId:"desc_completo", label:"Curso Completo",           sub:"Intensivo + preparación examen",      emoji:"🚗", color:"icon-green" },
    { id:"precio_refuerzo", titleId:"titulo_refuerzo", descId:"desc_refuerzo", label:"Curso de Refuerzo",        sub:"Manejo defensivo y perfeccionamiento", emoji:"🛣️", color:"icon-orange" },
  ];

  STORE_FIELDS = [
    { id:"precio_casco",        label:"Casco certificado",      sub:"Equipo seguridad moto",      emoji:"⛑️" },
    { id:"precio_guantes",      label:"Guantes de protección",  sub:"Protección para manos",      emoji:"🧤" },
    { id:"precio_chaleco",      label:"Chaleco reflectivo",     sub:"Visibilidad en la vía",      emoji:"🦺" },
    { id:"precio_rodilleras",   label:"Rodilleras",             sub:"Protección para rodillas",   emoji:"🛡️" },
    { id:"precio_chaqueta",     label:"Chaqueta de moto",       sub:"Protección completa",        emoji:"🧥" },
    { id:"precio_kit_carretera",label:"Kit de carretera",       sub:"Herramientas de emergencia", emoji:"🛠️" },
    { id:"precio_carpa",        label:"Carpa impermeable",      sub:"Protección lluvia",          emoji:"⛺" },
    { id:"precio_extintor",     label:"Extintor vehicular",     sub:"Seguridad en emergencias",   emoji:"🧯" },
  ];

  fieldCard(f, type = "course") {
    const s = this.state.settings || {};
    const val   = s[f.id] || "";
    const title = f.titleId ? (s[f.titleId] || "") : "";
    return `
      <div class="form-card">
        <div class="form-card-header">
          <div class="form-card-icon ${f.color || "icon-blue"}">
            <span style="font-size:1.4rem">${f.emoji || "💰"}</span>
          </div>
          <div>
            <h3>${f.label}</h3>
            <p>${f.sub}</p>
          </div>
        </div>
        ${f.titleId ? `
        <div class="form-group">
          <label>Título del curso</label>
          <input type="text" id="${f.titleId}" class="input"
            value="${title}" placeholder="Ej: A2 Moto +125cc" maxlength="60">
        </div>
        ` : ""}
        ${f.descId ? `
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="${f.descId}" class="input" rows="2" placeholder="Breve descripción del curso">${s[f.descId]||""}</textarea>
        </div>
        ` : ""}
        <div class="form-group">
          <label>${type === "course" ? "Valor del curso (COP)" : "Precio (COP)"}</label>
          <div class="input-prefix">
            <span class="prefix">$</span>
            <input type="number" id="${f.id}" class="input price-input"
              value="${val}" placeholder="0" min="0" step="1000">
          </div>
          <small>Actual: $${this.fmt(val)}</small>
        </div>
      </div>`;
  }

  extraFields(settings) {
    const known = new Set([
      ...this.COURSE_FIELDS.map(f => f.id),
      ...this.STORE_FIELDS.map(f => f.id),
    ]);
    return Object.keys(settings)
      .filter(k => k.startsWith("precio_") && !known.has(k))
      .map(k => ({
        id: k,
        label: k.replace("precio_", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        sub: "Producto personalizado",
        emoji: "🏷️",
        color: "icon-blue",
      }));
  }

  render() {
    const { settings, loading, saving } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    const extras = this.extraFields(settings);
    const hora = new Date();
    const hCOL = (hora.getUTCHours() - 5 + 24) % 24;
    const restricted = hCOL >= 2 && hCOL < 4;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Gestión de Precios y Títulos</h1>
            <p class="page-subtitle">Cursos y productos de la tienda</p>
          </div>
        </div>

        ${restricted ? `<div class="alert alert-warning" style="margin-bottom:1.25rem;padding:.75rem 1rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;color:#92400e;font-size:.9rem">
          ⏰ <strong>Horario restringido (12AM – 5AM).</strong> Los cambios están bloqueados en este momento.
        </div>` : ""}

        <h2 class="section-label">🎓 Cursos de licencia</h2>
        <div class="form-grid">
          ${this.COURSE_FIELDS.slice(0,3).map(f => this.fieldCard(f, "course")).join("")}
        </div>

        <h2 class="section-label" style="margin-top:1.5rem">📚 Cursos complementarios</h2>
        <div class="form-grid">
          ${this.COURSE_FIELDS.slice(3).map(f => this.fieldCard(f, "course")).join("")}
        </div>

        <h2 class="section-label" style="margin-top:1.5rem">🛒 Tienda — productos fijos</h2>
        <div class="form-grid">
          ${this.STORE_FIELDS.map(f => this.fieldCard(f, "store")).join("")}
        </div>

        ${extras.length > 0 ? `
        <h2 class="section-label" style="margin-top:1.5rem">🏷️ Productos adicionales</h2>
        <div class="form-grid">
          ${extras.map(f => this.fieldCard(f, "store")).join("")}
        </div>` : ""}

        <div class="form-actions">
          <button class="btn btn-ghost" id="resetBtn">Cancelar cambios</button>
          <button class="btn btn-primary ${saving ? "btn-loading" : ""}"
            id="saveBtn" ${saving || restricted ? "disabled" : ""}>
            ${saving
              ? '<span class="btn-spinner"></span> Guardando...'
              : "💾 Guardar cambios"}
          </button>
        </div>

        <div class="preview-card" style="margin-top:1rem">
          <h3 class="card-title">ℹ️ Permisos</h3>
          <p style="font-size:13px;color:var(--text-sub);line-height:1.7">
            <strong>Gerente:</strong> puede cambiar títulos de cursos, precios de cursos y tienda, y teléfonos.<br>
            <strong>Administrador:</strong> tiene acceso completo a todas las configuraciones.<br>
            ⏰ Los cambios de precios están bloqueados entre las <strong>12:00 AM y 5:00 AM</strong> (hora Colombia).
          </p>
        </div>
      </div>`;
  }

  afterRender() {
    const { settings } = this.state;
    const allPriceFields = [
      ...this.COURSE_FIELDS,
      ...this.STORE_FIELDS,
      ...this.extraFields(settings || {}),
    ];
    const allTitleFields = this.COURSE_FIELDS.filter(f => f.titleId).map(f => ({ id: f.titleId }));
    const allFields = [...allPriceFields, ...allTitleFields];

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      allPriceFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.value = settings?.[f.id] || "";
        if (f.titleId) {
          const tel = document.getElementById(f.titleId);
          if (tel) tel.value = settings?.[f.titleId] || "";
        }
      });
      showToast("Cambios descartados", "info");
    });

    document.getElementById("saveBtn")?.addEventListener("click", async () => {
      const updates = {};
      allPriceFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el && el.value !== "") updates[f.id] = el.value;
        if (f.titleId) {
          const tel = document.getElementById(f.titleId);
          if (tel && tel.value !== "") updates[f.titleId] = tel.value;
        }
        if (f.descId) {
          const del = document.getElementById(f.descId);
          if (del && del.value !== "") updates[f.descId] = del.value;
        }
      });

      if (Object.keys(updates).length === 0) {
        showToast("No hay cambios para guardar", "warning");
        return;
      }

      this.setState({ saving: true });
      try {
        await Api.updateSettings(updates);
        showToast("✅ Cambios guardados correctamente", "success");
        this.state.settings = { ...this.state.settings, ...updates };
        this.setState({ saving: false });
      } catch (err) {
        // Superadmin can force override time restriction
        if (err.message?.includes("bloqueados") && AuthService.isAdmin()) {
          const force = confirm("⏰ Horario restringido.\n¿Forzar cambio como superadministrador?");
          if (force) {
            try {
              await Api.updateSettings(updates, true);
              showToast("✅ Cambios forzados por superadmin", "success");
              this.state.settings = { ...this.state.settings, ...updates };
            } catch(e2) { showToast(e2.message || "Error", "error"); }
          }
        } else {
          showToast(err.message || "Error al guardar", "error");
        }
        this.setState({ saving: false });
      }
    });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container === "string" ? document.querySelector(container) : container)
      .appendChild(this._el);
    this._mounted = true;
    const settings = await Api.getSettings();
    this.setState({ settings, loading: false });
    return this;
  }
}
