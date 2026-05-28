// ═══════════════════════════════════════════════════════════════
// DASHBOARD APP — Punto de entrada y enrutador
// ═══════════════════════════════════════════════════════════════

import { AuthService } from "./services/auth.js";
import { Sidebar } from "./components/Sidebar.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { PreciosPage } from "./pages/PreciosPage.js";
import { TelefonosPage } from "./pages/TelefonosPage.js";
import { UsuariosPage } from "./pages/UsuariosPage.js";
import { SedesPage } from "./pages/SedesPage.js";
import { AuditoriaPage } from "./pages/AuditoriaPage.js";
import { ProductosPage } from "./pages/ProductosPage.js";
import { DashboardMediaPage } from "./pages/DashboardMediaPage.js";
import { PreguntasPage } from "./pages/PreguntasPage.js";
import { PromoPage } from "./pages/PromoPage.js";
import { PromoMocoaPage } from "./pages/PromoMocoaPage.js";
import { RestriccionPage } from "./pages/RestriccionPage.js";
import { TestimoniosPage } from "./pages/TestimoniosPage.js";
import { TipsPage } from "./pages/TipsPage.js";
import { BlogPage } from "./pages/BlogPage.js";
import { MocoaCursosPage } from "./pages/MocoaCursosPage.js";
import { CursosMocoaPage } from "./pages/CursosMocoaPage.js";

// Guardia de autenticación
if (!AuthService.requireAuth()) throw new Error("No autenticado");

const ROUTES = {
  "/dashboard":  DashboardPage,
  "/precios":    PreciosPage,
  "/productos":  ProductosPage,
  "/telefonos":  TelefonosPage,
  "/usuarios":   UsuariosPage,
  "/auditoria":  AuditoriaPage,
  "/sedes":      SedesPage,
  "/media":      DashboardMediaPage,
  "/preguntas":  PreguntasPage,
  "/promo":      PromoPage,
  "/promo-mocoa":  PromoMocoaPage,
  "/restriccion":  RestriccionPage,
  "/testimonios":  TestimoniosPage,
  "/tips":         TipsPage,
  "/blog":          BlogPage,
  "/mocoa-cursos":   MocoaCursosPage,
  "/cursos-mocoa":   CursosMocoaPage,
};

const isAdmin = AuthService.isAdmin();

class App {
  constructor() {
    this.currentPage = null;
    this.currentPath = "/dashboard";
    this.sidebar = null;
  }

  navigate(path, id) {
    const soloAdmin = ["/usuarios", "/auditoria"];
    if (soloAdmin.includes(path) && !isAdmin) return;

    this.currentPath = path;
    const view = document.getElementById("router-view");
    if (!view) return;
    view.innerHTML = "";

    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    const PageClass = ROUTES[path] || DashboardPage;
    this.currentPage = new PageClass({ onNavigate: (p) => this.navigate(p) });
    this.currentPage.mount(view);

    if (this.sidebar) {
      const navId = id || path.replace("/", "");
      this.sidebar.setState({ activeItem: navId });
    }
  }

  init() {
    this.sidebar = new Sidebar({
      active: "dashboard",
      onNavigate: (path, id) => this.navigate(path, id),
      onCollapse: (collapsed) => {
        document.getElementById("main-wrapper")?.classList.toggle("sidebar-collapsed", collapsed);
      },
    });
    this.sidebar.mount("#sidebar-container");
    this.navigate("/dashboard", "dashboard");
  }
}

const app = new App();
app.init();
