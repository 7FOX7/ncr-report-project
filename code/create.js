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
    
    // Check if accordion still has errors, if not remove has-errors class
    const fieldset = element.closest('.collapsible-fieldset');
    if (fieldset) {
      const hasRemainingErrors = fieldset.querySelectorAll('.form-group.invalid').length > 0;
      if (!hasRemainingErrors) {
        fieldset.classList.remove('has-errors');
      }
    }
  }
}

function showValidationError(elementId, message, shouldFocus = false) {
  const element = document.getElementById(elementId);
  if (element) {
    // Find and open the accordion containing this field
    const fieldset = element.closest('.collapsible-fieldset');
    if (fieldset) {
      const toggleInput = fieldset.querySelector('.fieldset-toggle');
      if (toggleInput) {
        toggleInput.checked = true;
      }
      // Add error class to highlight the accordion header
      fieldset.classList.add('has-errors');
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
    
    // Only focus on the first invalid field
    if (shouldFocus) {
      element.focus();
    }
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
  
  // Remove has-errors class from all accordions
  const fieldsets = document.querySelectorAll('.collapsible-fieldset.has-errors');
  fieldsets.forEach(fieldset => {
    fieldset.classList.remove('has-errors');
  });
}

// Function to get text from select element
function getSelectText(selectId) {
  const select = document.getElementById(selectId);
  if (!select || !select.value) return "Not specified";
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption ? selectedOption.text : "Not specified";
}

// Function to format checkbox values
function formatCheckboxValues(values) {
  if (!values || values.length === 0) return "None selected";
  if (Array.isArray(values)) {
    return values.map(v => {
      if (v === "yes") return "Yes";
      if (v === "no") return "No";
      if (v === "supplier-rec-insp") return "Supplier or Rec-Insp";
      if (v === "wip-production") return "WIP (Production Order)";
      return v;
    }).join(", ");
  }
  if (values === "yes") return "Yes";
  if (values === "no") return "No";
  return values;
}

// Function to show preview modal
function showPreviewModal(formData) {
  const modal = document.getElementById("previewModal");
  const content = document.getElementById("previewContent");
  
  const html = `
    <div class="preview-section">
      <h3 class="preview-section-title">NCR Header Information</h3>
      <div class="preview-grid">
        <div class="preview-item">
          <div class="preview-label">NCR Number</div>
          <div class="preview-value">${formData.ncrNumber || "Auto-generated"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Created On</div>
          <div class="preview-value">${formData.createdOn || "Not specified"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Purchase Order #</div>
          <div class="preview-value ${!formData.purchaseOrder ? 'empty' : ''}">${formData.purchaseOrder || "Not provided"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Sales Order #</div>
          <div class="preview-value ${!formData.salesOrder ? 'empty' : ''}">${formData.salesOrder || "Not provided"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Item Marked Nonconforming</div>
          <div class="preview-value ${!formData.itemNonconforming ? 'empty' : ''}">${formatCheckboxValues(formData.itemNonconforming)}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Supplier</div>
          <div class="preview-value ${!formData.supplier ? 'empty' : ''}">${formData.supplier || "Not selected"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Type</div>
          <div class="preview-value ${!formData.processType ? 'empty' : ''}">${formData.processType || "Not selected"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Applicable</div>
          <div class="preview-value ${!formData.processApplicable || formData.processApplicable.length === 0 ? 'empty' : ''}">${formatCheckboxValues(formData.processApplicable)}</div>
        </div>
      </div>
    </div>
    
    <div class="preview-section">
      <h3 class="preview-section-title">NCR Line Item Details</h3>
      <div class="preview-grid">
        <div class="preview-item">
          <div class="preview-label">Product</div>
          <div class="preview-value ${!formData.product ? 'empty' : ''}">${formData.product || "Not selected"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Received Quantity</div>
          <div class="preview-value ${!formData.recvQty ? 'empty' : ''}">${formData.recvQty || "Not provided"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Defective Quantity</div>
          <div class="preview-value ${!formData.defectQty ? 'empty' : ''}">${formData.defectQty || "Not provided"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Issue Category</div>
          <div class="preview-value ${!formData.issueCategory ? 'empty' : ''}">${formData.issueCategory || "Not selected"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected By</div>
          <div class="preview-value ${!formData.inspectedBy ? 'empty' : ''}">${formData.inspectedBy || "Not provided"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected On</div>
          <div class="preview-value ${!formData.inspectedOn ? 'empty' : ''}">${formData.inspectedOn || "Not provided"}</div>
        </div>
      </div>
      <div class="preview-item" style="margin-top: 1rem;">
        <div class="preview-label">Defect Description</div>
        <div class="preview-value multiline ${!formData.defectDescription ? 'empty' : ''}">${formData.defectDescription || "No description provided"}</div>
      </div>
    </div>
  `;
  
  content.innerHTML = html;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Function to hide preview modal
function hidePreviewModal() {
  const modal = document.getElementById("previewModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
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
      // Validate and show preview instead of immediate completion
      validateAndShowPreview();
    });
  }
  
  // Handle Keep Editing button in preview modal
  const btnKeepEditing = document.getElementById("btnKeepEditing");
  if (btnKeepEditing) {
    btnKeepEditing.addEventListener("click", () => {
      hidePreviewModal();
    });
  }
  
  // Handle Confirm Completion button in preview modal
  const btnConfirmCompletion = document.getElementById("btnConfirmCompletion");
  if (btnConfirmCompletion) {
    btnConfirmCompletion.addEventListener("click", () => {
      hidePreviewModal();
      submitForm(true); // true = completed
    });
  }
  
  // Function to validate form and show preview modal
  function validateAndShowPreview() {
    // Collect all form data first
    const purchaseOrder     = (document.getElementById("po-number")?.value || "").trim();
    const salesOrder        = (document.getElementById("so-number")?.value || "").trim();
    const supplierSelect    = document.getElementById("supplier-id");
    const supplierChoice    = supplierSelect?.value || "";
    const supplierText      = supplierSelect ? (supplierSelect.options[supplierSelect.selectedIndex]?.text?.trim() || supplierChoice) : supplierChoice;
    const processType       = document.getElementById("process-type-id")?.value || "";
    const processTypeText   = getSelectText("process-type-id");
    const product           = document.getElementById("product-id")?.value || "";
    const productText       = getSelectText("product-id");
    const recvdQtyStr       = (document.getElementById("recv-qty")?.value || "").trim();
    const defectQtyStr      = (document.getElementById("defect-qty")?.value || "").trim();
    const issueCategory     = document.getElementById("issue-cat-id")?.value || "";
    const issueCategoryText = getSelectText("issue-cat-id");
    const defectDescription = (document.getElementById("defect-desc")?.value || "").trim();
    const inspectorID       = (document.getElementById("inspected-by")?.value || "").trim();
    const dateInspectedVal  = document.getElementById("inspected-on")?.value || "";
    const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
    const processApplicable = getCheckboxValues("process-applicable");
    const createdOnVal      = document.getElementById("created-on")?.value || todayISO();
    const ncrNumber         = document.getElementById("ncr-number")?.value || "";
    
    // Clear any previous validation errors
    clearAllValidation();
    
    // Collect all validation errors
    const validationErrors = [];
    const notChosen = (v) => v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select");
    
    if (purchaseOrder === "") { 
      validationErrors.push({id: "po-number", message: "Purchase Order number is required."});
    }
    if (inspectorID === "") { 
      validationErrors.push({id: "inspected-by", message: "Inspector ID/Name is required."});
    }
    if (defectDescription === "") { 
      validationErrors.push({id: "defect-desc", message: "Defect description is required."});
    }
    if (notChosen(supplierChoice)) { 
      validationErrors.push({id: "supplier-id", message: "Please choose a supplier."});
    }
    if (notChosen(product)) { 
      validationErrors.push({id: "product-id", message: "Please choose a product."});
    }
    if (notChosen(issueCategory)) { 
      validationErrors.push({id: "issue-cat-id", message: "Please choose an issue category."});
    }
    if (document.getElementById("process-type-id") && notChosen(processType)) {
      validationErrors.push({id: "process-type-id", message: "Please choose a process type."});
    }
    
    const recvdQty  = Number(recvdQtyStr);
    const defectQty = Number(defectQtyStr);
    if (!Number.isFinite(recvdQty) || recvdQty <= 0) { 
      validationErrors.push({id: "recv-qty", message: "Enter a valid received quantity (number > 0)."});
    }
    if (!Number.isFinite(defectQty) || defectQty < 0) { 
      validationErrors.push({id: "defect-qty", message: "Enter a valid defective quantity (number ≥ 0)."});
    }
    else if (defectQty > recvdQty) {
      validationErrors.push({id: "defect-qty", message: "Defective quantity cannot be greater than received quantity."});
    }
    if (!dateInspectedVal) { 
      validationErrors.push({id: "inspected-on", message: "Please select the inspection date."});
    }
    else {
      const picked = parseLocalDate(dateInspectedVal);
      const today  = new Date(); today.setHours(0,0,0,0);
      if (picked < today) {
        validationErrors.push({id: "inspected-on", message: "Inspection date cannot be earlier than today."});
      }
    }
    
    // If there are any validation errors, show them all and return
    if (validationErrors.length > 0) {
      validationErrors.forEach((error, index) => {
        showValidationError(error.id, error.message, index === 0);
      });
      alert("Please make sure all required fields are completed.");
      return;
    }
    
    // If validation passes, show preview modal
    const formData = {
      ncrNumber,
      createdOn: createdOnVal,
      purchaseOrder,
      salesOrder,
      itemNonconforming,
      supplier: supplierText,
      processType: processTypeText,
      processApplicable,
      product: productText,
      recvQty: recvdQtyStr,
      defectQty: defectQtyStr,
      issueCategory: issueCategoryText,
      defectDescription,
      inspectedBy: inspectorID,
      inspectedOn: dateInspectedVal
    };
    
    showPreviewModal(formData);
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

      // Only validate when marking as completed
      if (isCompleted) {
        // Collect all validation errors
        const validationErrors = [];
        
        // validations with visual feedback
        if (purchaseOrder === "") { 
          validationErrors.push({id: "po-number", message: "Purchase Order number is required."});
        }
        if (inspectorID === "") { 
          validationErrors.push({id: "inspected-by", message: "Inspector ID/Name is required."});
        }
        if (defectDescription === "") { 
          validationErrors.push({id: "defect-desc", message: "Defect description is required."});
        }

        const notChosen = (v) => v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select");
        if (notChosen(supplierChoice)) { 
          validationErrors.push({id: "supplier-id", message: "Please choose a supplier."});
        }
        if (notChosen(product)) { 
          validationErrors.push({id: "product-id", message: "Please choose a product."});
        }
        if (notChosen(issueCategory)) { 
          validationErrors.push({id: "issue-cat-id", message: "Please choose an issue category."});
        }
        
        if (document.getElementById("process-type-id") && notChosen(processType)) {
          validationErrors.push({id: "process-type-id", message: "Please choose a process type."});
        }

        const recvdQty  = Number(recvdQtyStr);
        const defectQty = Number(defectQtyStr);
        if (!Number.isFinite(recvdQty) || recvdQty <= 0) { 
          validationErrors.push({id: "recv-qty", message: "Enter a valid received quantity (number > 0)."});
        }
        if (!Number.isFinite(defectQty) || defectQty < 0) { 
          validationErrors.push({id: "defect-qty", message: "Enter a valid defective quantity (number ≥ 0)."});
        }
        //defective cannot exceed received
        else if (defectQty > recvdQty) {
          validationErrors.push({id: "defect-qty", message: "Defective quantity cannot be greater than received quantity."});
        }

        if (!dateInspectedVal) { 
          validationErrors.push({id: "inspected-on", message: "Please select the inspection date."});
        }
        else {
          //parse as local date
          const picked = parseLocalDate(dateInspectedVal);
          const today  = new Date(); today.setHours(0,0,0,0);
          if (picked < today) {
            validationErrors.push({id: "inspected-on", message: "Inspection date cannot be earlier than today."});
          }
        }
        
        // If there are any validation errors, show them all and return
        if (validationErrors.length > 0) {
          validationErrors.forEach((error, index) => {
            showValidationError(error.id, error.message, index === 0);
          });
          alert("Please make sure all required fields are completed.");
          return;
        }
      }
      
      // Convert string values to numbers for storage (even if not validating)
      const recvdQty  = Number(recvdQtyStr);
      const defectQty = Number(defectQtyStr);

      //persist BOTH the table row  and the full details 
      const ncrNumber = ncrInput ? ncrInput.value : generateNcrNumber();
      const lastModified = todayISO();

      
      const newRow = {
        id: Date.now(),
        ncrNumber,
        dateCreated: createdOnVal,
        lastModified,
        supplier: supplierText || supplierChoice,
        status: "Open"
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
        qualityCompleted: isCompleted,
        isCompleted:   false,
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

  // Demo auto-fill button for Quality Inspector section
  const demoAutofillBtn = document.getElementById("demo-autofill-btn");
  if (demoAutofillBtn) {
    demoAutofillBtn.addEventListener("click", () => {
      // Fill NCR Header Information
      document.getElementById("po-number").value = "PO-2025-1234";
      document.getElementById("so-number").value = "SO-2025-5678";
      
      // Fill Supplier/Process section - use correct IDs
      const supplierSelect = document.getElementById("supplier-id");
      if (supplierSelect) supplierSelect.value = "1";
      
      const processTypeSelect = document.getElementById("process-type-id");
      if (processTypeSelect) processTypeSelect.value = "1";
      
      // Check process applicable checkboxes
      const supplierRecInsp = document.getElementById("supplier-rec-insp");
      if (supplierRecInsp) supplierRecInsp.checked = true;
      
      // Fill Product Information - use correct IDs
      const productSelect = document.getElementById("product-id");
      if (productSelect) productSelect.value = "1";
      
      document.getElementById("recv-qty").value = "100";
      document.getElementById("defect-qty").value = "5";
      
      // Fill Issue Details - use correct IDs
      const issueCategorySelect = document.getElementById("issue-cat-id");
      if (issueCategorySelect) issueCategorySelect.value = "1";
      
      document.getElementById("defect-desc").value = "Sample defect description for demo purposes. The items received showed signs of damage during inspection.";
      
      // Fill Item Marked Nonconforming
      const nonconformingYes = document.getElementById("item-nonconforming-yes");
      if (nonconformingYes) nonconformingYes.checked = true;
      
      // Fill Inspector Information - use correct IDs
      document.getElementById("inspected-by").value = "Inspector-001";
      document.getElementById("inspected-on").value = todayISO();
      
      alert("Quality Inspector section auto-filled with demo data!");
    });
  }
});
