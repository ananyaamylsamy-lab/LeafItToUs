// Authentication utility functions
import { api } from "./api.js";

// Check if user is authenticated
export const auth = {
  async checkAuth() {
    try {
      const user = await api.auth.getCurrentUser();
      return user;
    } catch (error) {
      return null;
    }
  },

  // Redirect to login if not authenticated
  async requireAuth() {
    const user = await this.checkAuth();
    if (!user) {
      window.location.href = "/login.html";
      return null;
    }
    return user;
  },

  // Log out and redirect to home
  async logout() {
    try {
      await api.auth.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};