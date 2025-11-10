// helpers 
function generateNcrNumber() {
  const year = new Date().getFullYear();
  const three = Math.floor(Math.random() * 900) + 100; 
  return `${year}-${three}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10); 
}
// Parse  input type="date" value as a *local* date 
function parseLocalDate(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); 
}
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Helper function to get checkbox values
function getCheckboxValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

// Helper function to get single checkbox value (for yes/no type fields)
function getSingleCheckboxValue(name) {
  const values = getCheckboxValues(name);
  return values.length > 0 ? values[0] : "";
}

// Validation helper functions
function clearValidation(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const formGroup = element.closest('.form-group');
    if (formGroup) {
      formGroup.classList.remove('invalid');
      const errorMessage = formGroup.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.remove();
      }
    }
  }
}

function showValidationError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    // Check if the field is in a collapsed accordion section
    const fieldsetContent = element.closest('.fieldset-content');
    const isFieldVisible = fieldsetContent && window.getComputedStyle(fieldsetContent).maxHeight !== '0px';
    
    if (!isFieldVisible) {
      // Field is in a collapsed accordion - show alert and open the accordion
      alert("Please check all form sections. There are required fields in other sections that need to be completed.");
      
      // Find and open the accordion containing this field
      const fieldset = element.closest('.collapsible-fieldset');
      if (fieldset) {
        const toggleInput = fieldset.querySelector('.fieldset-toggle');
        if (toggleInput) {
          toggleInput.checked = true;
        }
      }
    }
    
    const formGroup = element.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('invalid');
      
      // Remove existing error message
      const existingError = formGroup.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Add new error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      formGroup.appendChild(errorDiv);
      
      // Clear validation when user interacts with the field
      const clearValidationHandler = () => {
        clearValidation(elementId);
        element.removeEventListener('input', clearValidationHandler);
        element.removeEventListener('change', clearValidationHandler);
      };
      
      element.addEventListener('input', clearValidationHandler);
      element.addEventListener('change', clearValidationHandler);
    }
    element.focus();
  }
}

function clearAllValidation() {
  const invalidGroups = document.querySelectorAll('.form-group.invalid');
  invalidGroups.forEach(group => {
    group.classList.remove('invalid');
    const errorMessage = group.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  });
}

// Function to mark required fields
function markRequiredFields() {
  const requiredFieldIds = [
    'po-number',
    'inspected-by',
    'defect-desc',
    'supplier-id',
    'product-id',
    'issue-cat-id',
    'recv-qty',
    'defect-qty',
    'inspected-on'
  ];
  
  // Add process-type-id if it exists
  if (document.getElementById('process-type-id')) {
    requiredFieldIds.push('process-type-id');
  }
  
  // Mark each required field
  requiredFieldIds.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const formGroup = element.closest('.form-group');
      if (formGroup) {
        formGroup.classList.add('required');
        
        // Add required attribute for accessibility
        element.setAttribute('required', 'true');
        element.setAttribute('aria-required', 'true');
      }
    }
  });
  
  // Add required fields legend to the form
  const form = document.getElementById('ncr-form');
  if (form && !form.querySelector('.required-fields-legend')) {
    const legend = document.createElement('div');
    legend.className = 'required-fields-legend';
    legend.innerHTML = '<span class="required-asterisk">*</span> indicates required fields';
    form.insertBefore(legend, form.firstChild);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Mark required fields with asterisks
  markRequiredFields();
  
  // Add mutual exclusivity for Item Marked Nonconforming checkboxes
  const nonconformingYes = document.getElementById("item-nonconforming-yes");
  const nonconformingNo = document.getElementById("item-nonconforming-no");
  
  if (nonconformingYes && nonconformingNo) {
    nonconformingYes.addEventListener("change", function() {
      if (this.checked) {
        nonconformingNo.checked = false;
      }
    });
    
    nonconformingNo.addEventListener("change", function() {
      if (this.checked) {
        nonconformingYes.checked = false;
      }
    });
  }
  
  // Add mutual exclusivity logic for item-nonconforming checkboxes
  const itemNonconformingCheckboxes = document.querySelectorAll('input[name="item-nonconforming"]');
  itemNonconformingCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        // Uncheck other checkboxes in the same group
        itemNonconformingCheckboxes.forEach(other => {
          if (other !== this) {
            other.checked = false;
          }
        });
      }
    });
  });
  
  // fill NCR number and lock it
  const ncrInput = document.getElementById("ncr-number");
  if (ncrInput) {
    ncrInput.value = generateNcrNumber();
    ncrInput.readOnly = true;
    ncrInput.setAttribute("tabindex", "-1"); 
  }

  // Created On shows today date 
  const createdOn = document.getElementById("created-on") || document.getElementById("create-date");
  if (createdOn) createdOn.value = todayISO();

  // submit validations + persist for Home + full details
  const submitBtn = document.getElementById("btnSubmit");
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault(); // stop real submit while we validate
      submitForm(false); // false = not completed
    });
  }

  // Add Mark as Completed functionality
  const btnComplete = document.getElementById("btnComplete");
  if (btnComplete) {
    btnComplete.setAttribute("type", "button");
    btnComplete.addEventListener("click", (e) => {
      e.preventDefault();
      const confirmed = confirm("Are you sure you want to mark this NCR as completed?\n\nOnce completed, this form cannot be edited anymore.");
      if (confirmed) {
        submitForm(true); // true = completed
      }
    });
  }

  function submitForm(isCompleted) {

      // read values at click time 
      const purchaseOrder     = (document.getElementById("po-number")?.value || "").trim();
      const salesOrder        = (document.getElementById("so-number")?.value || "").trim();
      const supplierSelect    = document.getElementById("supplier-id");
      const supplierChoice    = supplierSelect?.value || "";
      const supplierText      = supplierSelect ? (supplierSelect.options[supplierSelect.selectedIndex]?.text?.trim() || supplierChoice) : supplierChoice;
      const processType       = document.getElementById("process-type-id")?.value || ""; 
      const product           = document.getElementById("product-id")?.value || "";
      const recvdQtyStr       = (document.getElementById("recv-qty")?.value || "").trim();
      const defectQtyStr      = (document.getElementById("defect-qty")?.value || "").trim();
      const issueCategory     = document.getElementById("issue-cat-id")?.value || "";
      const defectDescription = (document.getElementById("defect-desc")?.value || "").trim();
      const inspectorID       = (document.getElementById("inspected-by")?.value || "").trim();
      const dateInspectedVal  = document.getElementById("inspected-on")?.value || "";
      
      // Read checkbox values
      const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
      const processApplicable = getCheckboxValues("process-applicable");
      const statusVal         = document.getElementById("ncr-status")?.value || "Open";

      //created date shown on page
      const createdOnVal = createdOn?.value || todayISO();

      // Clear any previous validation errors
      clearAllValidation();

      // validations with visual feedback
      if (purchaseOrder === "") { 
        showValidationError("po-number", "Purchase Order number is required."); 
        return; 
      }
      if (inspectorID === "") { 
        showValidationError("inspected-by", "Inspector ID/Name is required."); 
        return; 
      }
      if (defectDescription === "") { 
        showValidationError("defect-desc", "Defect description is required."); 
        return; 
      }

      const notChosen = (v) => v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select");
      if (notChosen(supplierChoice)) { 
        showValidationError("supplier-id", "Please choose a supplier."); 
        return; 
      }
      if (notChosen(product)) { 
        showValidationError("product-id", "Please choose a product."); 
        return; 
      }
      if (notChosen(issueCategory)) { 
        showValidationError("issue-cat-id", "Please choose an issue category."); 
        return; 
      }
      
      if (document.getElementById("process-type-id") && notChosen(processType)) {
        showValidationError("process-type-id", "Please choose a process type."); 
        return;
      }

      const recvdQty  = Number(recvdQtyStr);
      const defectQty = Number(defectQtyStr);
      if (!Number.isFinite(recvdQty) || recvdQty <= 0) { 
        showValidationError("recv-qty", "Enter a valid received quantity (number > 0)."); 
        return; 
      }
      if (!Number.isFinite(defectQty) || defectQty < 0) { 
        showValidationError("defect-qty", "Enter a valid defective quantity (number ≥ 0)."); 
        return; 
      }
      //defective cannot exceed received
      if (defectQty > recvdQty) {
        showValidationError("defect-qty", "Defective quantity cannot be greater than received quantity.");
        return;
      }

      if (!dateInspectedVal) { 
        showValidationError("inspected-on", "Please select the inspection date."); 
        return; 
      }
      //parse as local date
      const picked = parseLocalDate(dateInspectedVal);
      const today  = new Date(); today.setHours(0,0,0,0);
      if (picked < today) {
        showValidationError("inspected-on", "Inspection date cannot be earlier than today.");
        return;
      }

      //persist BOTH the table row  and the full details 
      const ncrNumber = ncrInput ? ncrInput.value : generateNcrNumber();
      const lastModified = todayISO();

      
      const newRow = {
        id: Date.now(),
        ncrNumber,
        dateCreated: createdOnVal,
        lastModified,
        supplier: supplierText || supplierChoice,
        status: isCompleted ? "Completed" : "Open"
      };
      const staged = loadJSON("ncrNewRecords", []);
      if (!staged.some(r => r.ncrNumber === newRow.ncrNumber)) {
        staged.push(newRow);
        saveJSON("ncrNewRecords", staged);
      }

      //details for Edit prefill 
      const detailsMap = loadJSON("ncrDetails", {});
      detailsMap[ncrNumber] = {
        ncrNumber,
        dateCreated: createdOnVal,
        lastModified,
        purchaseOrder,
        salesOrder,                    
        supplierValue: supplierChoice,
        supplierName:  supplierText || supplierChoice,
        processTypeValue: processType, 
        productValue:  product,
        recvQty:       recvdQty,       
        defectQty:     defectQty,      
        issueCategoryValue: issueCategory,
        defectDescription,
        inspectedBy:   inspectorID,
        inspectedOn:   dateInspectedVal,
        status:        statusVal,
        isCompleted:   isCompleted,
        itemNonconforming: itemNonconforming,
        processApplicable: processApplicable
      };
      saveJSON("ncrDetails", detailsMap);

      
      window.location.href = "index.html"; 
  } // End submitForm function

  // regenerates NCR number and resets today date
  const resetBtn = document.getElementById("btnReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const form = document.getElementById("ncr-form");
      if (form) form.reset();
      if (ncrInput) {
        ncrInput.value = generateNcrNumber();
        ncrInput.readOnly = true;
      }
      if (createdOn) createdOn.value = todayISO();
    });
  }
});
