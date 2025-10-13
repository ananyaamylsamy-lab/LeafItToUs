import { api } from "./modules/api.js";
import { utils } from "./modules/utils.js";
 
let currentUser = null;
let treatments = [];
 
export function init(user) {
  currentUser = user;
}
 
// For loading treatments with search filter
export async function loadTreatments(filters = {}) {
  try {
    treatments = await api.treatments.getAll(filters);
    treatments.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    renderTreatments();
    return treatments;
  } catch (error) {
    console.error("Error loading treatments:", error);
    utils.showAlert("Failed to load treatments", "error");
    return [];
  }
}
 
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
  
  // Event listeners for action buttons
  container.querySelectorAll('.treatment-card').forEach(card => {
    card.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleTreatmentAction);
    });
  });
}
 
// Handling edit/delete actions for treatments
async function handleTreatmentAction(e) {
  const action = e.target.dataset.action;
  const card = e.target.closest('.treatment-card');
  const treatmentId = card.dataset.id;
  
  switch(action) {
    case 'delete':
      utils.showConfirm('Delete this treatment?', async () => {
        try {
          await api.treatments.delete(treatmentId);
          utils.showAlert('Treatment deleted successfully', 'success');
          await loadTreatments();
        } catch (error) {
          utils.showAlert('Failed to delete treatment', 'error');
        }
      });
      break;
    case 'edit':
      alert('Edit functionality would open a modal here');
      break;
  }
}
 
// Setup modal
export function setupTreatmentModal() {
  const modal = document.getElementById('treatmentModal');
  const trigger = document.getElementById('addTreatmentBtn');
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('treatmentForm');
  
  trigger.addEventListener('click', () => {
    modal.classList.add('active');
  });
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    form.reset();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (data.ingredients) {
      data.ingredients = data.ingredients.split(',').map(i => i.trim());
    }
    
    try {
      await api.treatments.create(data);
      utils.showAlert('Treatment added successfully!', 'success');
      modal.classList.remove('active');
      form.reset();
      await loadTreatments();
    } catch (error) {
      utils.showAlert('Failed to add treatment', 'error');
    }
  });
 
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
    }
  });
}
 
// Success rate update
export async function updateTreatmentSuccess(treatmentId, worked) {
  try {
    await api.treatments.rate(treatmentId, worked);
    await loadTreatments();
    return true;
  } catch (error) {
    console.error('Error updating treatment success:', error);
    return false;
  }
}
 
export function getTreatmentCount() {
  return treatments.length;
}
 
export function getAverageSuccessRate() {
  if (treatments.length === 0) return 0;
  return Math.round(treatments.reduce((sum, t) => sum + t.successRate, 0) / treatments.length);
}