// ═══════════════════════════════════════════════════════════════
// CORE COMPONENT SYSTEM
// Framework mínimo inspirado en React para componentes reutilizables
// ═══════════════════════════════════════════════════════════════

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
  }

  setState(newState) {
    const prev = { ...this.state };
    this.state = { ...this.state, ...newState };
    if (this._mounted && this._el) {
      this._update(prev);
    }
  }

  _update(prevState) {
    const newHtml = this.render();
    const tmp = document.createElement("div");
    tmp.innerHTML = newHtml;
    const newEl = tmp.firstElementChild;

    if (newEl && this._el.parentNode) {
      this._el.parentNode.replaceChild(newEl, this._el);
      this._el = newEl;
      this.afterRender();
    }
  }

  mount(container) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }
    const html = this.render();
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    this._el = tmp.firstElementChild;
    container.appendChild(this._el);
    this._mounted = true;
    this.afterRender();
    return this;
  }

  // Override en subclases
  render() { return "<div></div>"; }
  afterRender() {}
  destroy() {
    if (this._el) this._el.remove();
    this._mounted = false;
  }
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
export class Router {
  constructor(routes) {
    this.routes = routes;
    this._current = null;
  }

  navigate(path) {
    const route = this.routes[path] || this.routes["*"];
    if (!route) return;

    const container = document.getElementById("router-view");
    if (!container) return;

    container.innerHTML = "";
    if (this._current && this._current.destroy) this._current.destroy();

    this._current = new route();
    this._current.mount(container);

    window.history.pushState({}, "", path);
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.dataset.path === path);
    });
  }
}

// ─── EVENT BUS ────────────────────────────────────────────────────────────────
export const EventBus = {
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }
};
