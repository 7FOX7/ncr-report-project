//helpers 
const STORAGE_KEY = "ncrData";      
const DETAILS_KEY = "ncrDetails";   
function todayISO() { return new Date().toISOString().slice(0, 10); }
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function notChosen(v) { return v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select"); }
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

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
    'purchase-order',
    'inspected-by',
    'defect-desc',
    'supplier-id',
    'product-id',
    'issue-cat-id',
    'recv-qty',
    'defect-qty',
    'inspected-on'
  ];
  
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
  const form = document.getElementById('ncr-edit-form') || document.querySelector('form');
  if (form && !form.querySelector('.required-fields-legend')) {
    const legend = document.createElement('div');
    legend.className = 'required-fields-legend';
    legend.innerHTML = '<span class="required-asterisk">*</span> indicates required fields';
    form.insertBefore(legend, form.firstChild);
  }
}

//state from URL 
const params = new URLSearchParams(window.location.search);
const ncrNumberParam = params.get("ncr") || "";
const urlCreated     = params.get("dateCreated") || "";
const urlSupplier    = params.get("supplier") || "";

//DOM refs 
const form           = document.getElementById("ncr-edit-form") || document.querySelector("form");
const inpNcr         = document.getElementById("ncr-number");
const inpCreated     = document.getElementById("create-date");      
const selSupplier    = document.getElementById("supplier-id");
const selProduct     = document.getElementById("product-id");
const inpRecvQty     = document.getElementById("recv-qty");
const inpDefectQty   = document.getElementById("defect-qty");
const selIssue       = document.getElementById("issue-cat-id");
const inpDefectDesc  = document.getElementById("defect-desc");
const inpInspector   = document.getElementById("inspected-by");
const inpInspectedOn = document.getElementById("inspected-on");
const selStatus      = document.getElementById("ncr-status");
const inpPONum       = document.getElementById("purchase-order");

//baseline snapshot for Reset 
let baselineDetails = null;  
let baselineRow     = null;  

//set select by visible text or create a temp option
function setSelectByText(selectEl, text) {
  if (!selectEl || !text) return;
  let matched = false;
  for (const opt of selectEl.options) {
    if (opt.text.trim() === text) { opt.selected = true; matched = true; break; }
  }
  if (!matched) {
    const opt = new Option(text, text);
    selectEl.appendChild(opt);
    opt.selected = true;
  }
}

//fill all fields from details row
function fillFormFrom(details, row) {
  if (inpCreated) {
    inpCreated.value = (details?.dateCreated || row?.dateCreated || urlCreated || todayISO());
  }
  if (selSupplier) {
    const supplierText = (details?.supplierName || row?.supplier || urlSupplier || "");
    setSelectByText(selSupplier, supplierText);
  }
  const setVal = (el, v) => { if (el && v != null && v !== "") el.value = v; };
  if (details) {
    setVal(inpPONum,       details.purchaseOrder);
    setVal(selProduct,     details.productValue);
    setVal(inpRecvQty,     details.recvQty);
    setVal(inpDefectQty,   details.defectQty);
    setVal(selIssue,       details.issueCategoryValue);
    setVal(inpDefectDesc,  details.defectDescription);
    setVal(inpInspector,   details.inspectedBy);
    setVal(inpInspectedOn, details.inspectedOn);
    setVal(selStatus,      details.status);
  }
}

//prefill on load
document.addEventListener("DOMContentLoaded", () => {
  // Mark required fields with asterisks
  markRequiredFields();
  
  // 1) show NCR number (read-only)
  if (inpNcr) {
    inpNcr.value = ncrNumberParam;
    inpNcr.readOnly = true;
    inpNcr.setAttribute("tabindex", "-1");
  }

  // load existing list row + details 
  const list = loadJSON(STORAGE_KEY, []);
  const row  = list.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || null;

  const detailsMap = loadJSON(DETAILS_KEY, {});
  const details    = detailsMap[ncrNumberParam] || null;

  //keep a baseline snapshot for Reset
  baselineRow     = deepClone(row);
  baselineDetails = deepClone(details);

  // fill the form from storage 
  fillFormFrom(details, row);

  // Check if NCR is completed and disable editing if so
  if (details && details.isCompleted) {
    disableFormForCompletedNCR();
  }

  // update 
  if (form) form.addEventListener("submit", onUpdateSubmit);

  // wire up Mark as Completed 
  const btnComplete = document.getElementById("btnComleted");
  if (btnComplete) {
    btnComplete.setAttribute("type","button");
    btnComplete.addEventListener("click", (e) => {
      e.preventDefault();
      const confirmed = confirm("Are you sure you want to mark this NCR as completed?\n\nOnce completed, this form cannot be edited anymore.");
      if (confirmed) {
        markAsCompleted();
      }
    });
  }

  // wire up Reset Changes and also intercept native form reset
  const btnResetChanges = document.getElementById("btnResetChanges") || document.getElementById("btnReset");
  if (btnResetChanges) {
    btnResetChanges.addEventListener("click", onResetClick);
  }
  if (form) {
    form.addEventListener("reset", (e) => {
      //Prevent browser native reset 
      e.preventDefault();
      onResetClick(e);
    });
  }
});

//  restore last saved state from storage 
function onResetClick(e) {
  if (e) e.preventDefault();

  // reload freshest saved state from storage 
  const latestDetailsMap = loadJSON(DETAILS_KEY, {});
  const latestDetails = latestDetailsMap[ncrNumberParam] || baselineDetails;

  const latestList = loadJSON(STORAGE_KEY, []);
  const latestRow  = latestList.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || baselineRow;

  fillFormFrom(latestDetails, latestRow);
  
}

// Function to disable form editing for completed NCRs
function disableFormForCompletedNCR() {
  // Disable all form inputs
  const formElements = form.querySelectorAll('input, select, textarea, button');
  formElements.forEach(element => {
    if (element.type !== 'radio') { // Don't disable accordion toggles
      element.disabled = true;
    }
  });
  
  // Add completed status message at the top of the form
  if (form && !form.querySelector('.completion-status')) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'completion-status alert alert-success';
    statusDiv.innerHTML = '✓ This NCR has been marked as completed and cannot be edited.';
    form.insertBefore(statusDiv, form.firstChild);
  }
  
  // Change page title
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.textContent = 'View Non-Conformance Report (Completed)';
  }
}

//Validate + Save 
function onUpdateSubmit(e, stayHere = false) {
  e.preventDefault();
  performUpdate(false, stayHere); // false = not completed
}

// Function to mark NCR as completed
function markAsCompleted() {
  performUpdate(true, false); // true = completed, false = don't stay
}

function performUpdate(isCompleted = false, stayHere = false) {

  const ncrNumber   = (inpNcr?.value || "").trim();
  const dateCreated = (inpCreated?.value || todayISO());

  const supplierVal  = selSupplier?.value || "";
  const supplierText = selSupplier?.options[selSupplier.selectedIndex]?.text?.trim() || supplierVal;

  const productVal   = selProduct?.value || "";
  const recvQtyStr   = (inpRecvQty?.value || "").trim();
  const defectQtyStr = (inpDefectQty?.value || "").trim();
  const issueCatVal  = selIssue?.value || "";
  const defectDesc   = (inpDefectDesc?.value || "").trim();
  const inspectedBy  = (inpInspector?.value || "").trim();
  const inspectedOn  = (inpInspectedOn?.value || "");
  const statusVal    = selStatus?.value || "Open";
  const poNumber     = (inpPONum?.value || "").trim();

  // Clear any previous validation errors
  clearAllValidation();

  //validations with visual feedback
  if (poNumber === "") { 
    showValidationError("purchase-order", "Purchase Order number is required."); 
    return; 
  }
  if (inspectedBy === "") { 
    showValidationError("inspected-by", "Inspector ID/Name is required."); 
    return; 
  }
  if (defectDesc === "") { 
    showValidationError("defect-desc", "Defect description is required."); 
    return; 
  }
  if (notChosen(supplierVal)) { 
    showValidationError("supplier-id", "Please choose a supplier."); 
    return; 
  }
  if (notChosen(productVal)) { 
    showValidationError("product-id", "Please choose a product."); 
    return; 
  }
  if (notChosen(issueCatVal)) { 
    showValidationError("issue-cat-id", "Please choose an issue category."); 
    return; 
  }

  const recvQty   = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);
  if (!Number.isFinite(recvQty) || recvQty <= 0) { 
    showValidationError("recv-qty", "Enter a valid received quantity (number > 0)."); 
    return; 
  }
  if (!Number.isFinite(defectQty) || defectQty < 0) { 
    showValidationError("defect-qty", "Enter a valid defective quantity (number ≥ 0)."); 
    return; 
  }
  //defective cannot exceed received
  if (defectQty > recvQty) { 
    showValidationError("defect-qty", "Defective quantity cannot be greater than received quantity."); 
    return; 
  }

  if (!inspectedOn) { 
    showValidationError("inspected-on", "Please select the inspection date."); 
    return; 
  }
  const picked = new Date(inspectedOn);
  const today  = new Date(); today.setHours(0,0,0,0);
  if (picked > today) { 
    showValidationError("inspected-on", "Inspection date cannot be in the future."); 
    return; 
  }

  const lastModified = todayISO();

  //save full details map 
  const detailsMap = loadJSON(DETAILS_KEY, {});
  detailsMap[ncrNumber] = {
    ncrNumber,
    dateCreated,
    lastModified,
    purchaseOrder: poNumber,
    supplierValue: supplierVal,
    supplierName:  supplierText,
    productValue:  productVal,
    recvQty,
    defectQty,
    issueCategoryValue: issueCatVal,
    defectDescription:  defectDesc,
    inspectedBy,
    inspectedOn,
    status: statusVal,
    isCompleted: isCompleted
  };
  saveJSON(DETAILS_KEY, detailsMap);

  //Patch the home table list 
  const list = loadJSON(STORAGE_KEY, []);
  const idx  = list.findIndex(r => String(r.ncrNumber) === String(ncrNumber));
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      dateCreated,     
      lastModified,
      supplier: supplierText,
      status: statusVal,
      isCompleted: isCompleted
    };
  } else {
    list.push({
      id: Date.now(),
      ncrNumber,
      dateCreated,
      lastModified,
      supplier: supplierText,
      status: statusVal,
      isCompleted: isCompleted
    });
  }
  saveJSON(STORAGE_KEY, list);

  // update baseline so future Reset returns to this saved state 
  baselineDetails = deepClone(detailsMap[ncrNumber]);
  baselineRow     = deepClone(list.find(r => String(r.ncrNumber) === String(ncrNumber)));

  if (isCompleted) {
    alert("NCR has been marked as completed. This form can no longer be edited.");
  } else {
    alert("NCR updated.");
  }
  
  if (!stayHere) window.location.href = "index.html";
}
