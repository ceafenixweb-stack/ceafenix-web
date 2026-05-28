// ═══════════════════════════════════════════════════════════════
// PAGE: TELÉFONOS
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast } from "../components/Toast.js";

export class TelefonosPage extends Component {
  constructor(props) {
    super(props);
    this.state = { settings: null, loading: true, saving: false };
  }

  render() {
    const { settings, loading, saving } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;

    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Gestión de Teléfonos</h1>
            <p class="page-subtitle">Actualiza los números de contacto</p>
          </div>
        </div>

        <div class="form-grid form-grid-3">
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.29 6.29l1.87-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3>Teléfono Principal</h3>
                <p>Número de atención primaria</p>
              </div>
            </div>
            <div class="form-group">
              <label>Número</label>
              <input type="tel" id="telefono_principal" class="input"
                value="${settings?.telefono_principal || ""}"
                placeholder="3001234567" maxlength="15">
            </div>
          </div>

          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.29 6.29l1.87-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3>Teléfono Secundario</h3>
                <p>Número de respaldo</p>
              </div>
            </div>
            <div class="form-group">
              <label>Número</label>
              <input type="tel" id="telefono_secundario" class="input"
                value="${settings?.telefono_secundario || ""}"
                placeholder="3007654321" maxlength="15">
            </div>
          </div>

          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-icon icon-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <div>
                <h3>WhatsApp</h3>
                <p>Número con código de país</p>
              </div>
            </div>
            <div class="form-group">
              <label>Número (ej: 573001234567)</label>
              <input type="tel" id="whatsapp" class="input"
                value="${settings?.whatsapp || ""}"
                placeholder="573001234567" maxlength="15">
              <small>Incluye el código de país: 57 para Colombia</small>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-ghost" id="resetBtn">Cancelar cambios</button>
          <button class="btn btn-primary ${saving ? "btn-loading" : ""}" id="saveBtn" ${saving ? "disabled" : ""}>
            ${saving ? '<span class="btn-spinner"></span> Guardando...' : "Guardar Teléfonos"}
          </button>
        </div>

        <div class="preview-card">
          <h3 class="card-title">Vista previa — Botones de contacto</h3>
          <div class="contact-preview">
            <a class="contact-btn-preview phone" href="tel:${settings?.telefono_principal}">
              📞 ${settings?.telefono_principal || "Sin número"}
            </a>
            <a class="contact-btn-preview whatsapp" href="https://wa.me/${settings?.whatsapp}" target="_blank">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    const { settings } = this.state;

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      document.getElementById("telefono_principal").value = settings?.telefono_principal || "";
      document.getElementById("telefono_secundario").value = settings?.telefono_secundario || "";
      document.getElementById("whatsapp").value = settings?.whatsapp || "";
      showToast("Cambios descartados", "info");
    });

    document.getElementById("saveBtn")?.addEventListener("click", async () => {
      const telefono_principal = document.getElementById("telefono_principal").value.trim();
      const telefono_secundario = document.getElementById("telefono_secundario").value.trim();
      const whatsapp = document.getElementById("whatsapp").value.trim();

      if (!telefono_principal) {
        showToast("El teléfono principal es requerido", "warning");
        return;
      }

      this.setState({ saving: true });
      try {
        await Api.updateSettings({ telefono_principal, telefono_secundario, whatsapp });
        showToast("Teléfonos actualizados correctamente", "success");
        this.state.settings = { ...this.state.settings, telefono_principal, telefono_secundario, whatsapp };
        this.setState({ saving: false });
      } catch (err) {
        showToast(err.message || "Error al guardar", "error");
        this.setState({ saving: false });
      }
    });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container === "string" ? document.querySelector(container) : container).appendChild(this._el);
    this._mounted = true;

    const settings = await Api.getSettings();
    this.setState({ settings, loading: false });
    return this;
  }
}
