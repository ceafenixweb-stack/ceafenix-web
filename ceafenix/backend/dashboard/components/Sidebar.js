// ═══════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════

import { Component } from "../utils/core.js";
import { AuthService } from "../services/auth.js";

export class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = { collapsed: false, activeItem: props.active || "dashboard" };
  }

  getNavItems() {
    const items = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
        path: "/dashboard",
        roles: ["superadmin", "manager"],
      },
      {
        id: "precios",
        label: "Precios",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        path: "/precios",
        roles: ["superadmin", "manager"],
      },
      {
        id: "productos",
        label: "Productos Tienda",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
        path: "/productos",
        roles: ["superadmin", "manager"],
      },
      {
        id: "telefonos",
        label: "Teléfonos",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.29 6.29l1.87-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        path: "/telefonos",
        roles: ["superadmin", "manager"],
      },
      {
        id: "sedes",
        label: "Sedes",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        path: "/sedes",
        roles: ["superadmin", "manager"],
      },
      {
        id: "media",
        label: "Contenido",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        path: "/media",
        roles: ["superadmin", "manager"],
      },
      {
        id: "usuarios",
        label: "Usuarios",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        path: "/usuarios",
        roles: ["superadmin"],
      },
      {
        id: "blog",
        label: "Blog",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        path: "/blog",
        roles: ["superadmin", "manager"],
      },
      {
        id: "tips",
        label: "Tips de Conducción",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        path: "/tips",
        roles: ["superadmin", "manager"],
      },
      {
        id: "testimonios",
        label: "Testimonios",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        path: "/testimonios",
        roles: ["superadmin", "manager"],
      },
      {
        id: "promo",
        label: "Modal Promo — Fénix",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
        path: "/promo",
        roles: ["superadmin", "manager"],
      },
      {
        id: "cursos-mocoa",
        label: "Cursos Mocoa (completo)",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
        path: "/cursos-mocoa",
        roles: ["superadmin", "manager"],
      },
      {
        id: "mocoa-cursos",
        label: "Cursos — Mocoa",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
        path: "/mocoa-cursos",
        roles: ["superadmin", "manager"],
      },
      {
        id: "promo-mocoa",
        label: "Modal Promo — Mocoa",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
        path: "/promo-mocoa",
        roles: ["superadmin", "manager"],
      },
      {
        id: "preguntas",
        label: "Banco de Preguntas",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        path: "/preguntas",
        roles: ["superadmin", "manager"],
      },
      {
        id: "restriccion",
        label: "Restricción Horaria",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        path: "/restriccion",
        roles: ["superadmin"],
      },
      {
        id: "auditoria",
        label: "Auditoría",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        path: "/auditoria",
        roles: ["superadmin"],
      },
    ];
    const role = AuthService.getRole();
    return items.filter(i => i.roles.includes(role));
  }

  render() {
    const items = this.getNavItems();
    const active = this.state.activeItem;
    const collapsed = this.state.collapsed;

    return `
      <aside class="sidebar ${collapsed ? "collapsed" : ""}">
        <div class="sidebar-header">
          <div class="logo-area">
            <div class="logo-icon"><img src="/imgs/logo-removebg-preview.png" alt="CEA" style="width:100%;height:100%;object-fit:contain;padding:3px"></div>
            <span class="logo-text">CEA Fenix</span>
          </div>
          <button class="collapse-btn" id="collapseBtn" title="Colapsar menú">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="${collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}"/>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          ${items.map(item => `
            <a class="nav-link ${active === item.id ? "active" : ""}"
               data-path="${item.path}"
               data-id="${item.id}"
               title="${item.label}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
            </a>
          `).join("")}
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${AuthService.getFullName()?.charAt(0) || "U"}</div>
            <div class="user-details">
              <span class="user-name">${AuthService.getFullName()}</span>
              <span class="user-role">${AuthService.isAdmin() ? "Administrador" : "Gerente"}</span>
            </div>
          </div>
          <button class="logout-btn" id="logoutBtn" title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
    `;
  }

  afterRender() {
    document.getElementById("collapseBtn")?.addEventListener("click", () => {
      const next = !this.state.collapsed;
      this.setState({ collapsed: next });
      if (this.props.onCollapse) this.props.onCollapse(next);
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      await import("../services/auth.js").then(m => m.AuthService.logout());
      window.location.href = "/dashboard/login.html";
    });

    document.querySelectorAll(".nav-link[data-id]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = link.dataset.id;
        const path = link.dataset.path;
        this.setState({ activeItem: id });
        if (this.props.onNavigate) this.props.onNavigate(path, id);
      });
    });
  }
}
