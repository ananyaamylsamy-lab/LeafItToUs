import { api } from "./modules/api.js";
import { auth } from "./modules/auth.js";
import { utils } from "./modules/utils.js";

// State
let currentUser = null;
let diagnoses = [];
let treatments = [];

// Initialize dashboard
async function init() {
  currentUser = await auth.requireAuth();
  if (!currentUser) return;

  document.getElementById("username").textContent = currentUser.username;
  
  // Load data
  await Promise.all([loadDiagnoses(), loadTreatments()]);
  updateStats();
  
  // Setup event listeners
  setupEventListeners();
}

// Load diagnoses
async function loadDiagnoses(filters = {}) {
  try {
    diagnoses = await api.diagnoses.getAll(filters);
    renderDiagnoses();
  } catch (error) {
    console.error("Error loading diagnoses:", error);
    utils.showAlert("Failed to load diagnoses", "error");
  }
}

// Load treatments
async function loadTreatments(filters = {}) {
  try {
    treatments = await api.treatments.getAll(filters);
    renderTreatments();
  } catch (error) {
    console.error("Error loading treatments:", error);
    utils.showAlert("Failed to load treatments", "error");
  }
}

// Render diagnoses
function renderDiagnoses() {
  const container = document.getElementById("diagnosesContainer");
  
  if (diagnoses.length === 0) {
    container.innerHTML = '<p class="empty-state">No diagnoses yet. Add your first plant problem!</p>';
    return;
  }
  
  container.innerHTML = diagnoses.map(diagnosis => `
    <div class="diagnosis-card" data-id="${diagnosis._id}">
      <div class="diagnosis-header">
        <h3 class="plant-name">${utils.escapeHtml(diagnosis.plantName)}</h3>
        <span class="diagnosis-status status-${diagnosis.status}">${diagnosis.status}</span>
      </div>
      ${diagnosis.photoUrl ? `<img src="${diagnosis.photoUrl}" alt="${diagnosis.plantName}" class="diagnosis-image">` : ''}
      <p class="diagnosis-symptoms">Symptoms: ${utils.escapeHtml(diagnosis.symptoms)}</p>
      ${diagnosis.description ? `<p>${utils.escapeHtml(diagnosis.description)}</p>` : ''}
      <div class="diagnosis-meta">
        <span>By ${diagnosis.username} • ${utils.formatDate(diagnosis.createdAt)}</span>
        <div class="diagnosis-actions">
          ${diagnosis.userId === currentUser.userId ? `
            <button class="action-btn edit-btn" data-action="edit">Edit</button>
            <button class="action-btn delete-btn" data-action="delete">Delete</button>
          ` : ''}
          <button class="action-btn apply-treatment-btn" data-action="apply">Apply Treatment</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners to cards
  container.querySelectorAll('.diagnosis-card').forEach(card => {
    card.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleDiagnosisAction);
    });
  });
}

// Render treatments
function renderTreatments() {
  const container = document.getElementById("treatmentsContainer");
  
  if (treatments.length === 0) {
    container.innerHTML = '<p class="empty-state">No treatments yet. Share your knowledge!</p>';
    return;
  }
  
  container.innerHTML = treatments.map(treatment => `
    <div class="treatment-card" data-id="${treatment._id}">
      <div class="treatment-header">
        <h3 class="treatment-name">${utils.escapeHtml(treatment.name)}</h3>
        <span class="treatment-type type-${treatment.type}">${treatment.type}</span>
      </div>
      <div class="treatment-problems">
        ${treatment.problemsSolved.split(',').map(p => 
          `<span class="problem-tag">${utils.escapeHtml(p.trim())}</span>`
        ).join('')}
      </div>
      ${treatment.ingredients && treatment.ingredients.length ? `
        <ul class="ingredients-list">
          ${treatment.ingredients.map(i => `<li>${utils.escapeHtml(i)}</li>`).join('')}
        </ul>
      ` : ''}
      <div class="treatment-instructions">${utils.escapeHtml(treatment.instructions)}</div>
      <div class="treatment-success">
        <span class="success-rate">${treatment.successRate}%</span>
        <span class="success-label">Success Rate (${treatment.applications} uses)</span>
      </div>
      <div class="treatment-meta">
        <span>By ${treatment.username} • ${utils.formatDate(treatment.createdAt)}</span>
        <div class="treatment-actions">
          ${treatment.userId === currentUser.userId ? `
            <button class="action-btn edit-btn" data-action="edit">Edit</button>
            <button class="action-btn delete-btn" data-action="delete">Delete</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.treatment-card').forEach(card => {
    card.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleTreatmentAction);
    });
  });
}

// Handle diagnosis actions
async function handleDiagnosisAction(e) {
  const action = e.target.dataset.action;
  const card = e.target.closest('.diagnosis-card');
  const diagnosisId = card.dataset.id;
  
  switch(action) {
    case 'delete':
      if (confirm('Are you sure you want to delete this diagnosis?')) {
        try {
          await api.diagnoses.delete(diagnosisId);
          utils.showAlert('Diagnosis deleted successfully', 'success');
          await loadDiagnoses();
        } catch (error) {
          utils.showAlert('Failed to delete diagnosis', 'error');
        }
      }
      break;
    case 'edit':
      // In a real app, you'd open an edit modal
      const newStatus = prompt('Enter new status (ongoing/resolved/testing):');
      if (newStatus) {
        try {
          await api.diagnoses.update(diagnosisId, { status: newStatus });
          utils.showAlert('Diagnosis updated successfully', 'success');
          await loadDiagnoses();
        } catch (error) {
          utils.showAlert('Failed to update diagnosis', 'error');
        }
      }
      break;
    case 'apply':
      // In a real app, you'd open a treatment selection modal
      const treatmentId = prompt('Enter treatment ID to apply:');
      if (treatmentId) {
        try {
          await api.diagnoses.applyTreatment(diagnosisId, { treatmentId });
          utils.showAlert('Treatment applied successfully', 'success');
        } catch (error) {
          utils.showAlert('Failed to apply treatment', 'error');
        }
      }
      break;
  }
}

// Handle treatment actions
async function handleTreatmentAction(e) {
  const action = e.target.dataset.action;
  const card = e.target.closest('.treatment-card');
  const treatmentId = card.dataset.id;
  
  switch(action) {
    case 'delete':
      if (confirm('Are you sure you want to delete this treatment?')) {
        try {
          await api.treatments.delete(treatmentId);
          utils.showAlert('Treatment deleted successfully', 'success');
          await loadTreatments();
        } catch (error) {
          utils.showAlert('Failed to delete treatment', 'error');
        }
      }
      break;
    case 'edit':
      // In a real app, you'd open an edit modal
      alert('Edit functionality would open a modal here');
      break;
  }
}

// Update statistics
function updateStats() {
  const ongoingCount = diagnoses.filter(d => d.status === 'ongoing').length;
  document.getElementById('diagnosisCount').textContent = ongoingCount;
  document.getElementById('treatmentCount').textContent = treatments.length;
  
  // Calculate average success rate
  const avgSuccess = treatments.length > 0 
    ? Math.round(treatments.reduce((sum, t) => sum + t.successRate, 0) / treatments.length)
    : 0;
  document.getElementById('successRate').textContent = `${avgSuccess}%`;
}

// Setup event listeners
function setupEventListeners() {
  // Logout
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
      loadDiagnoses({ search, status }),
      loadTreatments({ search, type })
    ]);
  }, 500);
  
  searchInput.addEventListener('input', debouncedSearch);
  statusFilter.addEventListener('change', debouncedSearch);
  typeFilter.addEventListener('change', debouncedSearch);
  
  // Modals
  setupModal('diagnosisModal', 'addDiagnosisBtn', 'diagnosisForm', handleDiagnosisSubmit);
  setupModal('treatmentModal', 'addTreatmentBtn', 'treatmentForm', handleTreatmentSubmit);
}

// Setup modal
function setupModal(modalId, triggerBtnId, formId, submitHandler) {
  const modal = document.getElementById(modalId);
  const trigger = document.getElementById(triggerBtnId);
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById(formId);
  
  trigger.addEventListener('click', () => {
    modal.classList.add('active');
  });
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    form.reset();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitHandler(e.target);
    modal.classList.remove('active');
    form.reset();
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
    }
  });
}

// Handle diagnosis form submission
async function handleDiagnosisSubmit(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    await api.diagnoses.create(data);
    utils.showAlert('Diagnosis added successfully!', 'success');
    await loadDiagnoses();
    updateStats();
  } catch (error) {
    utils.showAlert('Failed to add diagnosis', 'error');
  }
}

// Handle treatment form submission
async function handleTreatmentSubmit(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Convert ingredients to array
  if (data.ingredients) {
    data.ingredients = data.ingredients.split(',').map(i => i.trim());
  }
  
  try {
    await api.treatments.create(data);
    utils.showAlert('Treatment added successfully!', 'success');
    await loadTreatments();
    updateStats();
  } catch (error) {
    utils.showAlert('Failed to add treatment', 'error');
  }
}

// Initialize on load
init();