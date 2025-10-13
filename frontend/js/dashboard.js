import { api } from "./modules/api.js";
import { auth } from "./modules/auth.js";
import { utils } from "./modules/utils.js";
import * as diagnoses from "./diagnoses.js";
import * as treatments from "./treatments.js";

let currentUser = null;

async function init() {
  currentUser = await auth.requireAuth();
  if (!currentUser) return;

  document.getElementById("username").textContent = currentUser.username;
  
  // Initialize and load health and treatment modules
  diagnoses.init(currentUser);
  treatments.init(currentUser);
  
  await Promise.all([
    diagnoses.loadDiagnoses(),
    treatments.loadTreatments()
  ]);
  
  updateStats();
  setupEventListeners();
}

// Update dashboard statistics
function updateStats() {
  document.getElementById('diagnosisCount').textContent = diagnoses.getDiagnosisCount();
  document.getElementById('treatmentCount').textContent = treatments.getTreatmentCount();
  document.getElementById('successRate').textContent = `${treatments.getAverageSuccessRate()}%`;
}

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
  });
  
  // Search and filters
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const typeFilter = document.getElementById('typeFilter');
  
  const debouncedSearch = utils.debounce(async () => {
    const search = searchInput.value;
    const status = statusFilter.value;
    const type = typeFilter.value;
    
    await Promise.all([
      diagnoses.loadDiagnoses({ search, status }),
      treatments.loadTreatments({ search, type })
    ]);
    
    updateStats();
  }, 500);
  
  searchInput.addEventListener('input', debouncedSearch);
  statusFilter.addEventListener('change', debouncedSearch);
  typeFilter.addEventListener('change', debouncedSearch);
  
  // Setup modals from each module
  diagnoses.setupDiagnosisModal();
  treatments.setupTreatmentModal();
}

init();