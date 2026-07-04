// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════

const API = "/api";

export const AuthService = {
  async login(username, password) {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    localStorage.setItem("cea_token", data.token);
    localStorage.setItem("cea_role", data.role);
    localStorage.setItem("cea_username", data.username);
    localStorage.setItem("cea_fullname", data.full_name);
    return data;
  },

  async logout() {
    try {
      await fetch(`${API}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.getToken()}` },
      });
    } catch (_) {}
    localStorage.removeItem("cea_token");
    localStorage.removeItem("cea_role");
    localStorage.removeItem("cea_username");
    localStorage.removeItem("cea_fullname");
  },

  getToken() { return localStorage.getItem("cea_token"); },
  getRole() { return localStorage.getItem("cea_role"); },
  getUsername() { return localStorage.getItem("cea_username"); },
  getFullName() { return localStorage.getItem("cea_fullname"); },
  isAdmin() { return this.getRole() === "superadmin"; },
  isAuthenticated() { return !!this.getToken(); },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "/dashboard/login.html";
      return false;
    }
    return true;
  },
};
