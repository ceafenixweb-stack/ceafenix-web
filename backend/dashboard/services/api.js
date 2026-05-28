// ═══════════════════════════════════════════════════════════════
// API SERVICE — Wrapper centralizado para el backend
// ═══════════════════════════════════════════════════════════════

import { AuthService } from "./auth.js";

const BASE = "/api";

async function request(method, endpoint, body = null, forceUpdate = false) {
  const token = AuthService.getToken();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(forceUpdate ? { "X-Force-Update": "1" } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${endpoint}`, opts);

  if (res.status === 401) {
    AuthService.logout();
    window.location.href = "/dashboard/login.html";
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Sesión expirada");
  }
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || "Sin permiso");
    err.restricted = data.restricted;
    err.allowForce = data.allowForce;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Error del servidor");
  return data;
}

export const Api = {
  // ── Settings
  getSettings:    ()       => request("GET",  "/settings"),
  updateSettings: (updates, force=false) => request("PUT", "/settings", { updates }, force),

  // ── Productos
  getProductos:   ()       => request("GET",  "/productos"),
  createProducto: (data)   => request("POST", "/productos", data),
  updateProducto: (id, d)  => request("PUT",  `/productos/${id}`, d),
  deleteProducto: (id)     => request("DELETE",`/productos/${id}`),

  // ── Cursos Mocoa
  getCursosMocoa:    ()        => request("GET",    "/cursos-mocoa"),
  createCursoMocoa:  (data)    => request("POST",   "/cursos-mocoa", data),
  updateCursoMocoa:  (id, d)   => request("PUT",    `/cursos-mocoa/${id}`, d),
  deleteCursoMocoa:  (id)      => request("DELETE", `/cursos-mocoa/${id}`),

  // ── Blog
  getBlog:      ()        => request("GET",    "/blog"),
  createPost:   (data)    => request("POST",   "/blog", data),
  updatePost:   (id, d)   => request("PUT",    `/blog/${id}`, d),
  deletePost:   (id)      => request("DELETE", `/blog/${id}`),

  // ── Tips
  getTips:    ()        => request("GET",    "/tips"),
  createTip:  (data)    => request("POST",   "/tips", data),
  updateTip:  (id, d)   => request("PUT",    `/tips/${id}`, d),
  deleteTip:  (id)      => request("DELETE", `/tips/${id}`),

  // ── Upload
  uploadImagen: (base64, filename) => request("POST", "/upload-image", { base64, filename }),

  // ── Restricción horaria global
  getRestriccion:    ()     => request("GET", "/restriccion"),
  updateRestriccion: (data) => request("PUT", "/restriccion", data),

  // ── Preguntas
  getPreguntas:               ()            => request("GET",    "/preguntas"),
  createPregunta:             (data, force) => request("POST",   "/preguntas", data, force),
  updatePregunta:             (id, d, force)=> request("PUT",    `/preguntas/${id}`, d, force),
  deletePregunta:             (id, force)   => request("DELETE", `/preguntas/${id}`, null, force),
  getRestriccionPreguntas:    ()            => request("GET",    "/preguntas/restriccion"),
  updateRestriccionPreguntas: (data)        => request("PUT",    "/preguntas/restriccion", data),

  // ── Users
  getUsers:   ()           => request("GET",  "/users"),
  createUser: (data)       => request("POST", "/users", data),
  updateUser: (id, data)   => request("PUT",  `/users/${id}`, data),
  deleteUser: (id)         => request("DELETE",`/users/${id}`),

  // ── Audit, Stats & Undo
  getAudit:   ()           => request("GET",  "/audit"),
  undoAudit:  (id)         => request("POST", `/audit/${id}/undo`),
  getStats:   ()           => request("GET",  "/stats"),
};
