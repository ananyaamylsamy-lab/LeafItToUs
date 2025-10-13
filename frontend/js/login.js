import { api } from "./modules/api.js";
import { utils } from "./modules/utils.js";

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const credentials = {
    username: formData.get("username"),
    password: formData.get("password"),
  };
  
  try {
    // Authenticate user
    const response = await api.auth.login(credentials);
    utils.showAlert("Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1000);
  } catch (error) {
    utils.showAlert(error.message || "Login failed", "error");
  }
});