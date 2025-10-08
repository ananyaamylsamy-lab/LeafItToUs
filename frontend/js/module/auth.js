// Authentication utility module
import { api } from "../api.js";

export const auth = {
  async checkAuth() {
    try {
      const user = await api.auth.getCurrentUser();
      return user;
    } catch (error) {
      return null;
    }
  },

  async requireAuth() {
    const user = await this.checkAuth();
    if (!user) {
      window.location.href = "/login.html";
      return null;
    }
    return user;
  },

  async logout() {
    try {
      await api.auth.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};