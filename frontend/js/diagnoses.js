import { api } from "./modules/api.js";
import { utils } from "./modules/utils.js";
import * as treatmentsModule from "./treatments.js";

let currentUser = null;
let diagnoses = [];

// Initialize with current user
export function init(user) {
  currentUser = user;
}

// Load diagnoses and if error, return error status
export async function loadDiagnoses(filters = {}) {
  try {
    diagnoses = await api.diagnoses.getAll(filters);
    renderDiagnoses();
    return diagnoses;
  } catch (error) {
    console.error("Error loading diagnoses:", error);
    utils.showAlert("Failed to load diagnoses", "error");
    return [];
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
      
      ${diagnosis.treatments && diagnosis.treatments.length > 0 ? `
        <div class="applied-treatments">
          <h4>Applied Treatments:</h4>
          <ul>
            ${diagnosis.treatments.map(t => `
              <li>
                <span class="treatment-result result-${t.result.replace(/'/g, '').replace(/ /g, '-')}">${t.result}</span>
                Applied by ${t.appliedBy} on ${utils.formatDate(t.appliedAt)}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
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
  
  // Adding event listeners to action buttons
  container.querySelectorAll('.diagnosis-card').forEach(card => {
    card.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleDiagnosisAction);
    });
  });
}

// Actions: edit, delete, apply treatment - implementation.
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
      await openEditDiagnosisModal(diagnosisId);
      break;
      
    case 'apply':
      await openApplyTreatmentModal(diagnosisId);
      break;
  }
}

async function openEditDiagnosisModal(diagnosisId) {
  const diagnosis = diagnoses.find(d => d._id === diagnosisId);
  if (!diagnosis) {
    utils.showAlert('Diagnosis not found', 'error');
    return;
  }
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Diagnosis</h2>
        <button class="modal-close">&times;</button>
      </div>
      <form id="editDiagnosisForm">
        <div class="form-group">
          <label class="form-label">Plant Name</label>
          <input type="text" name="plantName" class="form-input" 
                 value="${utils.escapeHtml(diagnosis.plantName)}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Status</label>
          <select name="status" class="form-select" required>
            <option value="ongoing" ${diagnosis.status === 'ongoing' ? 'selected' : ''}>
            Ongoing
            </option>
            <option value="resolved" ${diagnosis.status === 'resolved' ? 'selected' : ''}>
              Resolved
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Symptoms</label>
          <input type="text" name="symptoms" class="form-input" 
                 value="${utils.escapeHtml(diagnosis.symptoms)}" required
                 placeholder="e.g., yellow leaves, wilting, brown spots">
        </div>
        
        <div class="form-group">
          <label class="form-label">Photo URL (optional)</label>
          <input type="url" name="photoUrl" class="form-input" 
                 value="${diagnosis.photoUrl || ''}"
                 placeholder="https://example.com/photo.jpg">
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="form-textarea" 
                    placeholder="Describe the problem in detail...">${utils.escapeHtml(diagnosis.description || '')}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#editDiagnosisForm');
  const closeBtn = modal.querySelector('.modal-close');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const updateData = {
      plantName: formData.get('plantName'),
      status: formData.get('status'),
      symptoms: formData.get('symptoms'),
      photoUrl: formData.get('photoUrl'),
      description: formData.get('description')
    };
    
    if (!updateData.photoUrl) delete updateData.photoUrl;
    if (!updateData.description) delete updateData.description;
    
    try {
      await api.diagnoses.update(diagnosisId, updateData);
      utils.showAlert(`Diagnosis updated successfully!`);
      
      closeModal();
      await loadDiagnoses();
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      utils.showAlert('Failed to update diagnosis. Please try again.', 'error');
    }
  });
}

async function openApplyTreatmentModal(diagnosisId) {
  try {
    const treatments = await api.treatments.getAll();
    
    if (treatments.length === 0) {
      utils.showAlert('No treatments available yet. Add a treatment first!', 'error');
      return;
    }

    const treatmentOptions = availableTreatments.map(t =>
  `<option value="${t._id}">${utils.escapeHtml(t.name)} (${t.type}) - ${t.successRate}% success</option>`
).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Apply Treatment</h2>
          <button class="modal-close">&times;</button>
        </div>
        <form id="applyTreatmentForm">
          <div class="form-group">
            <label class="form-label">Select Treatment</label>
            <select name="treatmentId" class="form-select" required>
              <option value="">Choose a treatment...</option>
              ${treatmentOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Result</label>
            <select name="result" class="form-select">
              <option value="testing">Testing</option>
              <option value="worked">Worked</option>
              <option value="didn't work">Didn't Work</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Apply Treatment</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const form = modal.querySelector('#applyTreatmentForm');
    const closeBtn = modal.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const result = formData.get('result');
      const treatmentId = formData.get('treatmentId');
      
      try {
        await api.diagnoses.applyTreatment(diagnosisId, {
          treatmentId: treatmentId,
          result: result
        });
        
        // Update treatment success rate if result is known
        if (result === 'worked' || result === "didn't work") {
          await treatmentsModule.updateTreatmentSuccess(treatmentId, result === 'worked');
        }
        
        utils.showAlert('Treatment applied successfully!', 'success');
        modal.remove();
        await loadDiagnoses();
      } catch (error) {
        utils.showAlert('Failed to apply treatment', 'error');
      }
    });
    
  } catch (error) {
    console.error('Error opening apply treatment modal:', error);
    utils.showAlert('Failed to load treatments', 'error');
  }
}

// Setup diagnosis modal
export function setupDiagnosisModal() {
  const modal = document.getElementById('diagnosisModal');
  const trigger = document.getElementById('addDiagnosisBtn');
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('diagnosisForm');
  
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
    
    try {
      await api.diagnoses.create(data);
      utils.showAlert('Diagnosis added successfully!', 'success');
      modal.classList.remove('active');
      form.reset();
      await loadDiagnoses();
    } catch (error) {
      utils.showAlert('Failed to add diagnosis', 'error');
    }
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
    }
  });
}

// Get count for stats
export function getDiagnosisCount() {
  return diagnoses.filter(d => d.status === 'ongoing').length;
}