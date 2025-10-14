import { api } from "./modules/api.js";
import { utils } from "./modules/utils.js";

// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const userData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    // Create new user account
    const response = await api.auth.signup(userData);
    utils.showAlert("Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1000);
  } catch (error) {
    utils.showAlert(error.message || "Signup failed", "error");
  }
});
