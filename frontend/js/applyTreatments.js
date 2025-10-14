import { api } from "./modules/api.js";
import { utils } from "./modules/utils.js";
import * as treatmentsModule from "./treatments.js";

// Open modal to apply treatment to a diagnosis
export async function openApplyTreatmentModal(diagnosisId, reloadCallback) {
  try {
    const availableTreatments = await api.treatments.getAll();

    if (availableTreatments.length === 0) {
      utils.showAlert(
        "No treatments available yet. Add a treatment first!",
        "error",
      );
      return;
    }

    // Create treatment list items
    const treatmentListHtml = availableTreatments
      .map(
        (t) => `
      <div class="treatment-option" data-id="${t._id}">
        <div class="treatment-option-name">${utils.escapeHtml(t.name)} (${t.type}) - ${t.successRate}%</div>
        <div class="treatment-option-keywords">${utils.escapeHtml(t.problemsSolved)}</div>
      </div>
    `,
      )
      .join("");

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Apply Treatment</h2>
          <button class="modal-close">&times;</button>
        </div>
        <form id="applyTreatmentForm">
          <div class="form-group">
            <label class="form-label">Search Treatment</label>
            <input type="text" id="treatmentSearch" class="form-input" 
                   placeholder="Type to search treatments..." 
                   autocomplete="off">
            <div id="treatmentResults" class="treatment-results">
              ${treatmentListHtml}
            </div>
            <input type="hidden" name="treatmentId" id="selectedTreatmentId">
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

    const form = modal.querySelector("#applyTreatmentForm");
    const closeBtn = modal.querySelector(".modal-close");
    const searchInput = document.getElementById("treatmentSearch");
    const resultsDiv = document.getElementById("treatmentResults");
    const hiddenInput = document.getElementById("selectedTreatmentId");

    searchInput.addEventListener("focus", () => {
      resultsDiv.style.display = "block";
    });

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase().trim();
      const options = resultsDiv.querySelectorAll(".treatment-option");

      resultsDiv.style.display = "block";

      if (query.length === 0) {
        options.forEach((opt) => (opt.style.display = "block"));
        return;
      }

      options.forEach((option) => {
        const name = option
          .querySelector(".treatment-option-name")
          .textContent.toLowerCase();
        const keywords = option
          .querySelector(".treatment-option-keywords")
          .textContent.toLowerCase();

        if (name.includes(query) || keywords.includes(query)) {
          option.style.display = "block";
        } else {
          option.style.display = "none";
        }
      });
    });

    // Handle treatment selection
    resultsDiv.addEventListener("click", (e) => {
      const option = e.target.closest(".treatment-option");
      if (option) {
        resultsDiv
          .querySelectorAll(".treatment-option")
          .forEach((o) => o.classList.remove("selected"));
        option.classList.add("selected");

        const treatmentId = option.dataset.id;
        const treatmentName = option.querySelector(
          ".treatment-option-name",
        ).textContent;

        hiddenInput.value = treatmentId;
        searchInput.value = treatmentName.split(" (")[0];
        resultsDiv.style.display = "none";
      }
    });

    const hideResultsHandler = (e) => {
      if (!modal.contains(e.target)) return;
      if (searchInput.contains(e.target) || resultsDiv.contains(e.target))
        return;
      resultsDiv.style.display = "none";
    };

    document.addEventListener("mousedown", hideResultsHandler);

    const originalRemove = modal.remove.bind(modal);
    modal.remove = () => {
      document.removeEventListener("mousedown", hideResultsHandler);
      originalRemove();
    };

    closeBtn.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const result = formData.get("result");
      const treatmentId = hiddenInput.value;

      if (!treatmentId) {
        utils.showAlert("Please select a treatment from the list", "error");
        return;
      }

      try {
        await api.diagnoses.applyTreatment(diagnosisId, {
          treatmentId: treatmentId,
          result: result,
        });

        if (result === "worked" || result === "didn't work") {
          await treatmentsModule.updateTreatmentSuccess(
            treatmentId,
            result === "worked",
          );
        }

        utils.showAlert("Treatment applied successfully!", "success");
        modal.remove();

        if (reloadCallback) {
          await reloadCallback();
        }
      } catch (error) {
        utils.showAlert("Failed to apply treatment", error);
      }
    });
  } catch (error) {
    console.error("Error opening apply treatment modal:", error);
    utils.showAlert("Failed to load treatments", "error");
  }
}
