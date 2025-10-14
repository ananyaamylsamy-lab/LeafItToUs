import { api } from "./modules/api.js";
import { auth } from "./modules/auth.js";
import { utils } from "./modules/utils.js";

let currentUser = null;

// Initialize profile page
async function init() {
  currentUser = await auth.requireAuth();
  if (!currentUser) return;

  document.getElementById("username").value = currentUser.username;
  document.getElementById("email").value = currentUser.email || "";
  document.getElementById("bio").value = currentUser.bio || "";
  console.log(currentUser);
  await loadUserStats();

  document
    .getElementById("profileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const profileData = {
        email: formData.get("email"),
        bio: formData.get("bio"),
      };

      try {
        await api.auth.updateProfile(profileData);
        utils.showAlert("Profile updated successfully!", "success");
      } catch (error) {
        utils.showAlert("Failed to update profile", error);
      }
    });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.logout();
  });
}

// Load and display user statistics
async function loadUserStats() {
  try {
    const [diagnoses, treatments] = await Promise.all([
      api.diagnoses.getAll(),
      api.treatments.getAll(),
    ]);

    const userDiagnoses = diagnoses.filter(
      (d) => d.userId === currentUser.userId,
    );
    const userTreatments = treatments.filter(
      (t) => t.userId === currentUser.userId,
    );

    document.getElementById("diagnosisCount").textContent =
      userDiagnoses.length;
    document.getElementById("treatmentCount").textContent =
      userTreatments.length;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

init();
