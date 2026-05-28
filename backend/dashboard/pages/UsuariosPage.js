import { Component } from "../utils/core.js";
import { Api } from "../services/api.js";
import { showToast, showModal } from "../components/Toast.js";

const ROLES = [
  { value:"superadmin", label:"Superadministrador", desc:"Acceso total: precios, productos, usuarios, auditoría, deshacer" },
  { value:"manager",    label:"Gerente",             desc:"Precios, títulos de cursos, teléfonos, productos de tienda" },
  { value:"editor",     label:"Editor de contenido", desc:"Solo títulos y textos del sitio, sin acceso a precios" },
  { value:"viewer",     label:"Solo lectura",         desc:"Ver dashboard y estadísticas sin poder hacer cambios" },
];

const ROLE_BADGE = { superadmin:"badge-admin", manager:"badge-manager", editor:"badge-editor", viewer:"badge-viewer" };

export class UsuariosPage extends Component {
  constructor(props) { super(props); this.state = { users:[], loading:true }; }

  roleInfo(role) { return ROLES.find(r=>r.value===role) || { label:role, desc:"" }; }

  render() {
    const { users, loading } = this.state;
    if (loading) return `<div class="page-loading"><div class="spinner"></div><p>Cargando...</p></div>`;
    return `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Gestión de Usuarios</h1>
            <p class="page-subtitle">${users.length} usuario(s) registrado(s)</p>
          </div>
          <button class="btn btn-primary" id="newUserBtn">+ Nuevo usuario</button>
        </div>

        <!-- Tabla de roles -->
        <div class="preview-card" style="margin-bottom:1.25rem">
          <h3 class="card-title" style="margin-bottom:.75rem">🔐 Roles disponibles</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem">
            ${ROLES.map(r=>`
              <div style="background:var(--bg);border-radius:10px;padding:.75rem 1rem;border:1px solid var(--border)">
                <span class="badge ${ROLE_BADGE[r.value]||'badge-default'}" style="margin-bottom:.4rem;display:inline-block">${r.label}</span>
                <p style="font-size:.78rem;color:var(--text-sub);line-height:1.5;margin:0">${r.desc}</p>
              </div>`).join("")}
          </div>
        </div>

        <div class="table-card">
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${users.map((u,i)=>{
                  const ri = this.roleInfo(u.role);
                  return `<tr>
                    <td class="td-num">${i+1}</td>
                    <td><code class="username-code">${u.username}</code></td>
                    <td>${u.full_name}</td>
                    <td><span class="badge ${ROLE_BADGE[u.role]||'badge-default'}">${ri.label}</span></td>
                    <td class="td-date">${new Date(u.created_at).toLocaleDateString("es-CO")}</td>
                    <td class="td-actions">
                      <button class="icon-btn icon-btn-edit" data-edit="${u.id}" title="Editar">✏️</button>
                      <button class="icon-btn icon-btn-delete" data-delete="${u.id}" data-name="${u.full_name}" title="Eliminar">🗑️</button>
                    </td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  userFormHtml(user=null) {
    return `<div class="modal-form">
      <div class="form-group">
        <label>Nombre completo</label>
        <input type="text" id="mf_fullname" class="input" value="${user?.full_name||""}" placeholder="Ej: Juan Pérez">
      </div>
      <div class="form-group">
        <label>Usuario (login)</label>
        <input type="text" id="mf_username" class="input" value="${user?.username||""}" placeholder="Ej: juan123">
      </div>
      <div class="form-group">
        <label>${user?"Nueva contraseña (vacío = no cambiar)":"Contraseña *"}</label>
        <input type="password" id="mf_password" class="input" placeholder="${user?"Nueva contraseña...":"Contraseña..."}">
      </div>
      <div class="form-group">
        <label>Rol y permisos</label>
        <select id="mf_role" class="input">
          ${ROLES.map(r=>`<option value="${r.value}" ${user?.role===r.value?"selected":""}>${r.label} — ${r.desc}</option>`).join("")}
        </select>
      </div>
    </div>`;
  }

  afterRender() {
    document.getElementById("newUserBtn")?.addEventListener("click", ()=>{
      showModal({ title:"Crear nuevo usuario", content:this.userFormHtml(), confirmText:"Crear usuario",
        onConfirm: async ()=>{
          const data = {
            full_name: document.getElementById("mf_fullname").value,
            username:  document.getElementById("mf_username").value,
            password:  document.getElementById("mf_password").value,
            role:      document.getElementById("mf_role").value,
          };
          if (!data.username||!data.password) { showToast("Usuario y contraseña requeridos","warning"); return; }
          try { await Api.createUser(data); showToast("Usuario creado","success"); await this.load(); }
          catch(e) { showToast(e.message,"error"); }
        }
      });
    });

    document.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const u = this.state.users.find(x=>x.id==btn.dataset.edit);
        showModal({ title:`Editar — ${u.username}`, content:this.userFormHtml(u), confirmText:"Guardar",
          onConfirm: async ()=>{
            const data = {
              full_name: document.getElementById("mf_fullname").value,
              username:  document.getElementById("mf_username").value,
              password:  document.getElementById("mf_password").value||undefined,
              role:      document.getElementById("mf_role").value,
            };
            try { await Api.updateUser(u.id,data); showToast("Usuario actualizado","success"); await this.load(); }
            catch(e) { showToast(e.message,"error"); }
          }
        });
      });
    });

    document.querySelectorAll("[data-delete]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        showModal({ title:"Eliminar usuario", danger:true,
          content:`<p>¿Eliminar a <strong>${btn.dataset.name}</strong>? No se puede deshacer.</p>`,
          confirmText:"Sí, eliminar",
          onConfirm: async ()=>{
            try { await Api.deleteUser(btn.dataset.delete); showToast("Eliminado","info"); await this.load(); }
            catch(e) { showToast(e.message,"error"); }
          }
        });
      });
    });
  }

  async load() {
    const users = await Api.getUsers();
    this.setState({ users, loading:false });
  }

  async mount(container) {
    const tmp = document.createElement("div");
    tmp.innerHTML = this.render();
    this._el = tmp.firstElementChild;
    (typeof container==="string"?document.querySelector(container):container).appendChild(this._el);
    this._mounted = true;
    await this.load();
    return this;
  }
}
