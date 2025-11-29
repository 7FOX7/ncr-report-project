// ---------------- Helpers & constants ----------------
const STORAGE_KEY = "ncrData";
const DETAILS_KEY = "ncrDetails";
function todayISO() { return new Date().toISOString().slice(0, 10); }

// Global workflow state + flag to know we're completing via the button
let currentStage = "quality";      // "quality" | "engineering" | "completed"
let completingFromButton = false;  // used to set qualityCompleted flag

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

// ---------------- Preview modal ----------------
function showPreviewModal(formData, includeEngineering) {
  const modal = document.getElementById("previewModal");
  const content = document.getElementById("previewContent");

  const eng = formData.engineering || {};
  const engActions = [];
  if (eng.useAsIs)  engActions.push("Use as-is");
  if (eng.repair)   engActions.push("Repair");
  if (eng.rework)   engActions.push("Rework");
  if (eng.scrap)    engActions.push("Scrap");
  if (eng.custNotifNCR) engActions.push("Customer Notified");
  const engExtraFlags = [];
  if (eng.drawingReqUpd) engExtraFlags.push("Drawing Update Required");

  let engineeringHtml = "";
  if (includeEngineering) {
    engineeringHtml = `
      <div class="preview-section">
        <h3 class="preview-section-title">Engineering Disposition &amp; Actions</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <div class="preview-label">Disposition Choices</div>
            <div class="preview-value ${engActions.length === 0 ? 'empty' : ''}">
              ${engActions.length ? engActions.join(", ") : "No disposition selected"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Disposition Notes</div>
            <div class="preview-value multiline ${!eng.disposition ? 'empty' : ''}">
              ${eng.disposition || "No notes provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Engineer Name</div>
            <div class="preview-value ${!eng.nameOfEng ? 'empty' : ''}">
              ${eng.nameOfEng || "Not provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Original Rev #</div>
            <div class="preview-value ${!eng.origRevNum ? 'empty' : ''}">
              ${eng.origRevNum || "Not provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Updated Revision (Date/Time)</div>
            <div class="preview-value ${!eng.UpdatedRev ? 'empty' : ''}">
              ${eng.UpdatedRev || "Not provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Revision Date</div>
            <div class="preview-value ${!eng.RevisionDate ? 'empty' : ''}">
              ${eng.RevisionDate || "Not provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Submitted Date</div>
            <div class="preview-value ${!eng.submittedDate ? 'empty' : ''}">
              ${eng.submittedDate || "Not provided"}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">Drawing / Extra Actions</div>
            <div class="preview-value ${(engExtraFlags.length === 0) ? 'empty' : ''}">
              ${engExtraFlags.length ? engExtraFlags.join(", ") : "No additional actions"}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const html = `
    <div class="preview-section">
      <h3 class="preview-section-title">NCR Header Information</h3>
      <div class="preview-grid">
        <div class="preview-item">
          <div class="preview-label">NCR Number</div>
          <div class="preview-value">${formData.ncrNumber || "Not specified"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Created On</div>
          <div class="preview-value">${formData.createdOn || "Not specified"}</div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Purchase Order #</div>
          <div class="preview-value ${!formData.purchaseOrder ? 'empty' : ''}">
            ${formData.purchaseOrder || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Sales Order #</div>
          <div class="preview-value ${!formData.salesOrder ? 'empty' : ''}">
            ${formData.salesOrder || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Item Marked Nonconforming</div>
          <div class="preview-value ${!formData.itemNonconforming ? 'empty' : ''}">
            ${formatCheckboxValues(formData.itemNonconforming)}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Supplier</div>
          <div class="preview-value ${!formData.supplier ? 'empty' : ''}">
            ${formData.supplier || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Type</div>
          <div class="preview-value ${!formData.processType ? 'empty' : ''}">
            ${formData.processType || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Applicable</div>
          <div class="preview-value ${!formData.processApplicable || formData.processApplicable.length === 0 ? 'empty' : ''}">
            ${formatCheckboxValues(formData.processApplicable)}
          </div>
        </div>
      </div>
    </div>
    
    <div class="preview-section">
      <h3 class="preview-section-title">NCR Line Item Details</h3>
      <div class="preview-grid">
        <div class="preview-item">
          <div class="preview-label">Product</div>
          <div class="preview-value ${!formData.product ? 'empty' : ''}">
            ${formData.product || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Received Quantity</div>
          <div class="preview-value ${!formData.recvQty ? 'empty' : ''}">
            ${formData.recvQty || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Defective Quantity</div>
          <div class="preview-value ${!formData.defectQty ? 'empty' : ''}">
            ${formData.defectQty || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Issue Category</div>
          <div class="preview-value ${!formData.issueCategory ? 'empty' : ''}">
            ${formData.issueCategory || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected By</div>
          <div class="preview-value ${!formData.inspectedBy ? 'empty' : ''}">
            ${formData.inspectedBy || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected On</div>
          <div class="preview-value ${!formData.inspectedOn ? 'empty' : ''}">
            ${formData.inspectedOn || "Not provided"}
          </div>
        </div>
      </div>
      <div class="preview-item" style="margin-top: 1rem;">
        <div class="preview-label">Defect Description</div>
        <div class="preview-value multiline ${!formData.defectDescription ? 'empty' : ''}">
          ${formData.defectDescription || "No description provided"}
        </div>
      </div>
    </div>

    ${engineeringHtml}
  `;
  
  content.innerHTML = html;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function hidePreviewModal() {
  const modal = document.getElementById("previewModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

/* ---------------- Basic storage helpers (this file) ---------------- */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function notChosen(v) { return v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select"); }
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

/* ---------------- Checkbox helpers ---------------- */
function getCheckboxValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}
function getSingleCheckboxValue(name) {
  const values = getCheckboxValues(name);
  return values.length > 0 ? values[0] : "";
}
function setCheckboxValues(name, values) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(cb => {
    cb.checked = Array.isArray(values) ? values.includes(cb.value) : values === cb.value;
  });
}

/* ---------------------- ENGINEERING HELPERS ---------------------- */
function readEngineeringFromForm() {
  const get = (id) => document.getElementById(id);
  const isChecked = (id) => !!get(id)?.checked;

  return {
    useAsIs:       isChecked("eng-useAsIs"),
    repair:        isChecked("eng-repair"),
    rework:        isChecked("eng-rework"),
    scrap:         isChecked("eng-scrap"),
    custNotifNCR:  isChecked("eng-custNotif"),
    drawingReqUpd: isChecked("eng-drawingReqUpd"),
    disposition:   (get("eng-disposition")?.value || "").trim(),
    origRevNum:    Number(get("eng-origRevNum")?.value || 0) || 0,
    nameOfEng:     (get("eng-nameOfEng")?.value || "").trim(),
    UpdatedRev:    get("eng-UpdatedRev")?.value || "",
    RevisionDate:  get("eng-RevisionDate")?.value || "",
    submittedDate: get("eng-submittedDate")?.value || ""
  };
}

function writeEngineeringToForm(eng) {
  if (!eng) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el!=null) el.value = v ?? el.value; };
  const setCk = (id, v) => { const el = document.getElementById(id); if (el!=null) el.checked = !!v; };

  setCk("eng-useAsIs",       eng.useAsIs);
  setCk("eng-repair",        eng.repair);
  setCk("eng-rework",        eng.rework);
  setCk("eng-scrap",         eng.scrap);
  setCk("eng-custNotif",     eng.custNotifNCR);
  set("eng-disposition",     eng.disposition);
  setCk("eng-drawingReqUpd", eng.drawingReqUpd);
  set("eng-origRevNum",      eng.origRevNum ?? "");
  set("eng-nameOfEng",       eng.nameOfEng ?? "");
  set("eng-UpdatedRev",      eng.UpdatedRev ?? "");
  set("eng-RevisionDate",    eng.RevisionDate ?? "");
  set("eng-submittedDate",   eng.submittedDate ?? "");
}

/* ---------------------- WORKFLOW HELPERS ---------------------- */

function isQualitySectionComplete(details) {
  if (!details) return false;

  const headerComplete =
    !!details.purchaseOrder &&
    (!!details.supplierName || !!details.supplierValue) &&
    !!details.processTypeValue;

  const inspectionComplete =
    !!details.productValue &&
    details.recvQty !== undefined &&
    details.recvQty !== null &&
    details.recvQty !== "" &&
    !!details.issueCategoryValue &&
    !!details.defectDescription &&
    !!details.inspectedBy &&
    !!details.inspectedOn;

  return headerComplete && inspectionComplete;
}

function getWorkflowInfo(details) {
  if (!details) {
    return {
      label: "Quality Inspector",
      stage: "quality"
    };
  }

  const qualityCompleted = !!details.qualityCompleted;

  const eng = details.engineering || {};
  const engActionsSelected =
    !!eng.useAsIs ||
    !!eng.repair ||
    !!eng.rework ||
    !!eng.scrap ||
    !!eng.custNotifNCR ||
    !!eng.drawingReqUpd;

  const engineeringComplete =
    engActionsSelected &&
    !!eng.disposition &&
    !!eng.nameOfEng;

  if (details.isCompleted) {
    return {
      label: "Completed",
      stage: "completed"
    };
  }

  if (!qualityCompleted) {
    return {
      label: "Quality Inspector",
      stage: "quality"
    };
  }

  if (!engineeringComplete) {
    return {
      label: "Engineering",
      stage: "engineering"
    };
  }

  return {
    label: "Engineering",
    stage: "engineering"
  };
}

/* ---- UI helpers to hide/show sections based on stage ---- */

function hideEngineeringSectionForQuality() {
  const engSection = document.getElementById("engineering-section");
  if (!engSection) return;

  const wrapper = engSection.closest(".collapsible-fieldset") || engSection;
  wrapper.style.display = "none";
  wrapper.setAttribute("aria-hidden", "true");
}

function enableEngineeringOnly() {
  const engSection = document.getElementById("engineering-section");
  const form = document.getElementById("ncr-edit-form") || document.querySelector("form");
  if (!engSection || !form) return;

  const wrapper = engSection.closest(".collapsible-fieldset") || engSection;
  wrapper.style.display = "";
  wrapper.removeAttribute("aria-hidden");

  const isAccordionToggle = (el) =>
    el.classList && el.classList.contains("fieldset-toggle");

  form.querySelectorAll("input, select, textarea").forEach(el => {
    const inEngineering = engSection.contains(el);
    const toggle = isAccordionToggle(el);

    if (toggle) {
      el.disabled = false;
      return;
    }

    if (inEngineering) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.readOnly = false;
      }
      if (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "radio") {
        el.disabled = false;
      }
    } else {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.readOnly = true;
      }
      if (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "radio") {
        el.disabled = true;
      }
    }
  });
}

// ---------------- Validation helpers ----------------
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
      
      const existingError = formGroup.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      formGroup.appendChild(errorDiv);
      
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

// Mark inspector + engineering required fields
function markRequiredFields() {
  const requiredFieldIds = [
    // Inspector
    'po-number',
    'inspected-by',
    'defect-desc',
    'supplier-id',
    'product-id',
    'issue-cat-id',
    'recv-qty',
    'defect-qty',
    'inspected-on',
    'process-type-id',
    // Engineering
    'eng-disposition',
    'eng-nameOfEng',
    'eng-origRevNum',
    'eng-UpdatedRev',
    'eng-RevisionDate',
    'eng-submittedDate'
  ];
  
  requiredFieldIds.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const formGroup = element.closest('.form-group');
      if (formGroup) {
        formGroup.classList.add('required');
        element.setAttribute('required', 'true');
        element.setAttribute('aria-required', 'true');
      }
    }
  });

  const engAction = document.getElementById('eng-useAsIs');
  if (engAction) {
    const formGroup = engAction.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('required');
      engAction.setAttribute('aria-required', 'true');
    }
  }
  
  const form = document.getElementById('ncr-edit-form') || document.querySelector('form');
  if (form && !form.querySelector('.required-fields-legend')) {
    const legend = document.createElement('div');
    legend.className = 'required-fields-legend';
    legend.innerHTML = '<span class="required-asterisk">*</span> indicates required fields';
    form.insertBefore(legend, form.firstChild);
  }
}

// ---------------- URL state & DOM refs ----------------
const params = new URLSearchParams(window.location.search);
const ncrNumberParam = params.get("ncr") || "";
const urlCreated     = params.get("dateCreated") || "";
const urlSupplier    = params.get("supplier") || "";

const form           = document.getElementById("ncr-edit-form") || document.querySelector("form");
const inpNcr         = document.getElementById("ncr-number");
const inpCreated     = document.getElementById("created-on");
const selSupplier    = document.getElementById("supplier-id");
const selProduct     = document.getElementById("product-id");
const inpRecvQty     = document.getElementById("recv-qty");
const inpDefectQty   = document.getElementById("defect-qty");
const selIssue       = document.getElementById("issue-cat-id");
const inpDefectDesc  = document.getElementById("defect-desc");
const inpInspector   = document.getElementById("inspected-by");
const inpInspectedOn = document.getElementById("inspected-on");
const selStatus      = document.getElementById("ncr-status");
const inpPONum       = document.getElementById("po-number");
const inpSONum       = document.getElementById("so-number");
const selProcessType = document.getElementById("process-type-id");

// baseline snapshot for Reset 
let baselineDetails = null;  
let baselineRow     = null;  

// set select by visible text or create a temp option
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

// fill all fields from details row
function fillFormFrom(details, row) {
  if (inpCreated) {
    inpCreated.value = (details?.dateCreated || row?.dateCreated || urlCreated || todayISO());
  }

  if (details && details.engineering) {
    writeEngineeringToForm(details.engineering);
  }

  if (selSupplier) {
    const supplierText = (details?.supplierName || row?.supplier || urlSupplier || "");
    setSelectByText(selSupplier, supplierText);
  }
  const setVal = (el, v) => { if (el && v != null && v !== "") el.value = v; };
  if (details) {
    setVal(inpPONum,       details.purchaseOrder);
    setVal(inpSONum,       details.salesOrder);
    setVal(selProcessType, details.processTypeValue);
    setVal(selProduct,     details.productValue);
    setVal(inpRecvQty,     details.recvQty);
    setVal(inpDefectQty,   details.defectQty);
    setVal(selIssue,       details.issueCategoryValue);
    setVal(inpDefectDesc,  details.defectDescription);
    setVal(inpInspector,   details.inspectedBy);
    setVal(inpInspectedOn, details.inspectedOn);
    setVal(selStatus,      details.status);
    
    if (details.itemNonconforming) {
      setCheckboxValues("item-nonconforming", details.itemNonconforming);
    }
    if (details.processApplicable) {
      setCheckboxValues("process-applicable", details.processApplicable);
    }
  }
}

// prefill on load
document.addEventListener("DOMContentLoaded", () => {
  markRequiredFields();
  
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
  
  if (inpNcr) {
    inpNcr.value = ncrNumberParam;
    inpNcr.readOnly = true;
    inpNcr.setAttribute("tabindex", "-1");
  }

  const list = loadJSON(STORAGE_KEY, []);
  const row  = list.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || null;

  const detailsMap = loadJSON(DETAILS_KEY, {});
  const details    = detailsMap[ncrNumberParam] || null;

  baselineRow     = deepClone(row);
  baselineDetails = deepClone(details);

  fillFormFrom(details, row);

  const wfInfo = getWorkflowInfo(details);
  currentStage = wfInfo.stage || "quality";

  if (currentStage === "completed") {
    disableFormForCompletedNCR();
  } else if (currentStage === "quality") {
    hideEngineeringSectionForQuality();
  } else if (currentStage === "engineering") {
    enableEngineeringOnly();
  }

  if (form) form.addEventListener("submit", onUpdateSubmit);

  const btnComplete = document.getElementById("btnComleted");
  if (btnComplete) {
    btnComplete.setAttribute("type","button");
    btnComplete.addEventListener("click", (e) => {
      e.preventDefault();
      validateAndShowPreview();
    });
  }
  
  const btnKeepEditing = document.getElementById("btnKeepEditing");
  if (btnKeepEditing) {
    btnKeepEditing.addEventListener("click", () => {
      hidePreviewModal();
    });
  }
  
  const btnConfirmCompletion = document.getElementById("btnConfirmCompletion");
  if (btnConfirmCompletion) {
    btnConfirmCompletion.addEventListener("click", () => {
      hidePreviewModal();
      markAsCompleted();
    });
  }

  const btnResetChanges = document.getElementById("btnResetChanges") || document.getElementById("btnReset");
  if (btnResetChanges) {
    btnResetChanges.addEventListener("click", onResetClick);
  }
  if (form) {
    form.addEventListener("reset", (e) => {
      e.preventDefault();
      onResetClick(e);
    });
  }
});

// restore last saved state from storage 
function onResetClick(e) {
  if (e) e.preventDefault();

  const latestDetailsMap = loadJSON(DETAILS_KEY, {});
  const latestDetails = latestDetailsMap[ncrNumberParam] || baselineDetails;

  const latestList = loadJSON(STORAGE_KEY, []);
  const latestRow  = latestList.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || baselineRow;

  fillFormFrom(latestDetails, latestRow);

  if (currentStage === "quality") {
    hideEngineeringSectionForQuality();
  } else if (currentStage === "engineering") {
    enableEngineeringOnly();
  }
}

// Function to disable form editing for completed NCRs
function disableFormForCompletedNCR() {
  const form = document.getElementById("ncr-edit-form") || document.querySelector("form");
  if (!form) return;

  const formElements = form.querySelectorAll('input, select, textarea, button');
  formElements.forEach(element => {
    if (element.type !== 'radio') {
      element.disabled = true;
    }
  });
  
  if (!form.querySelector('.completion-status')) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'completion-status alert alert-success';
    statusDiv.innerHTML = '✓ This NCR has been marked as completed and cannot be edited.';
    form.insertBefore(statusDiv, form.firstChild);
  }
  
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.textContent = 'View Non-Conformance Report (Completed)';
  }
}

// Validate + Save 
function onUpdateSubmit(e, stayHere = false) {
  e.preventDefault();
  completingFromButton = false;
  performUpdate(false, stayHere);
}

// When user confirms completion from the preview modal
// - In Quality stage  -> save inspector part, set qualityCompleted = true
// - In Engineering stage -> save engineering & mark full NCR completed
function markAsCompleted() {
  completingFromButton = true;
  if (currentStage === "engineering") {
    performUpdate(true, false);
  } else {
    performUpdate(false, false);
  }
  completingFromButton = false;
}

// Function to validate form and show preview modal
function validateAndShowPreview() {
  const ncrNumber   = (inpNcr?.value || "").trim();
  const dateCreated = (inpCreated?.value || todayISO());
  const supplierVal  = selSupplier?.value || "";
  const supplierText = selSupplier?.options[selSupplier.selectedIndex]?.text?.trim() || supplierVal;
  const productVal   = selProduct?.value || "";
  const productText  = getSelectText("product-id");
  const recvQtyStr   = (inpRecvQty?.value || "").trim();
  const defectQtyStr = (inpDefectQty?.value || "").trim();
  const issueCatVal  = selIssue?.value || "";
  const issueCategoryText = getSelectText("issue-cat-id");
  const defectDesc   = (inpDefectDesc?.value || "").trim();
  const inspectedBy  = (inpInspector?.value || "").trim();
  const inspectedOn  = (inpInspectedOn?.value || "");
  const poNumber     = (inpPONum?.value || "").trim();
  const soNumber     = (inpSONum?.value || "").trim();
  const processType  = selProcessType?.value || "";
  const processTypeText = getSelectText("process-type-id");
  const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
  const processApplicable = getCheckboxValues("process-applicable");

  const engineering = readEngineeringFromForm();
  
  clearAllValidation();
  
  // Collect all validation errors
  const validationErrors = [];
  
  if (poNumber === "") { 
    validationErrors.push({id: "po-number", message: "Purchase Order number is required."});
  }
  if (inspectedBy === "") { 
    validationErrors.push({id: "inspected-by", message: "Inspector ID/Name is required."});
  }
  if (defectDesc === "") { 
    validationErrors.push({id: "defect-desc", message: "Defect description is required."});
  }
  if (notChosen(supplierVal)) { 
    validationErrors.push({id: "supplier-id", message: "Please choose a supplier."});
  }
  if (notChosen(productVal)) { 
    validationErrors.push({id: "product-id", message: "Please choose a product."});
  }
  if (notChosen(issueCatVal)) { 
    validationErrors.push({id: "issue-cat-id", message: "Please choose an issue category."});
  }
  if (notChosen(processType)) {
    validationErrors.push({id: "process-type-id", message: "Please choose a process type."});
  }
  
  const recvQty   = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);
  if (!Number.isFinite(recvQty) || recvQty <= 0) { 
    validationErrors.push({id: "recv-qty", message: "Enter a valid received quantity (number > 0)."});
  }
  if (!Number.isFinite(defectQty) || defectQty < 0) { 
    validationErrors.push({id: "defect-qty", message: "Enter a valid defective quantity (number ≥ 0)."});
  }
  else if (defectQty > recvQty) { 
    validationErrors.push({id: "defect-qty", message: "Defective quantity cannot be greater than received quantity."});
  }
  if (!inspectedOn) { 
    validationErrors.push({id: "inspected-on", message: "Please select the inspection date."});
  }
  else {
    const picked = new Date(inspectedOn);
    const today  = new Date(); today.setHours(0,0,0,0);
    if (picked > today) { 
      validationErrors.push({id: "inspected-on", message: "Inspection date cannot be in the future."});
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
  
  const formData = {
    ncrNumber,
    createdOn: dateCreated,
    purchaseOrder: poNumber,
    salesOrder: soNumber,
    itemNonconforming,
    supplier: supplierText,
    processType: processTypeText,
    processApplicable,
    product: productText,
    recvQty: recvQtyStr,
    defectQty: defectQtyStr,
    issueCategory: issueCategoryText,
    defectDescription: defectDesc,
    inspectedBy,
    inspectedOn,
    engineering
  };
  
  const includeEngineering = (currentStage === "engineering");
  showPreviewModal(formData, includeEngineering);
}

// Main save/update function
function performUpdate(isCompleted = false, stayHere = false) {
  const ncrNumber = (inpNcr?.value || "").trim();
  if (!ncrNumber) {
    alert("NCR number is missing.");
    return;
  }

  // Load existing storage first so we can preserve original dateCreated
  const detailsMap = loadJSON(DETAILS_KEY, {});
  const existing   = detailsMap[ncrNumber] || {};

  const list   = loadJSON(STORAGE_KEY, []);
  const idx    = list.findIndex(r => String(r.ncrNumber) === String(ncrNumber));
  const row    = idx >= 0 ? list[idx] : null;

  const inputCreated = (inpCreated?.value || "").trim();

  // Preserve original creation date if it exists anywhere
  const dateCreated =
    existing.dateCreated ||
    (row && row.dateCreated) ||
    inputCreated ||
    urlCreated ||
    todayISO();

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
  const soNumber     = (inpSONum?.value || "").trim();
  const processType  = selProcessType?.value || "";
  
  const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
  const processApplicable = getCheckboxValues("process-applicable");

  clearAllValidation();

  // Full inspector validation only when finalizing NCR (engineering completion)
  if (isCompleted) {
    if (poNumber === "") { 
      showValidationError("po-number", "Purchase Order number is required.");
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
    
    if (notChosen(processType)) {
      showValidationError("process-type-id", "Please choose a process type."); 
      return;
    }

    const recvQtyChecked   = Number(recvQtyStr);
    const defectQtyChecked = Number(defectQtyStr);
    if (!Number.isFinite(recvQtyChecked) || recvQtyChecked <= 0) { 
      showValidationError("recv-qty", "Enter a valid received quantity (number > 0)."); 
      return; 
    }
    if (!Number.isFinite(defectQtyChecked) || defectQtyChecked < 0) { 
      showValidationError("defect-qty", "Enter a valid defective quantity (number ≥ 0)."); 
      return; 
    }
    if (defectQtyChecked > recvQtyChecked) { 
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
  }
  
  const recvQty   = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);

  const lastModified = todayISO();

  // -------- ENGINEERING SAVE BLOCK --------
  const engineering = readEngineeringFromForm();
  const anyEngChoice =
    engineering.useAsIs || engineering.repair || engineering.rework ||
    engineering.scrap || engineering.custNotifNCR || engineering.drawingReqUpd;

  // Final completion from engineering stage
  if (isCompleted && currentStage === "engineering") {
    if (!anyEngChoice) {
      showValidationError("eng-useAsIs", "Select at least one engineering action.");
      return;
    }
    if (!engineering.disposition) {
      showValidationError("eng-disposition", "Disposition notes are required.");
      return;
    }
    if (!engineering.nameOfEng) {
      showValidationError("eng-nameOfEng", "Engineer name is required.");
      return;
    }
    if (!engineering.origRevNum) {
      showValidationError("eng-origRevNum", "Original revision number is required.");
      return;
    }
    if (!engineering.UpdatedRev) {
      showValidationError("eng-UpdatedRev", "Updated revision is required.");
      return;
    }
    if (!engineering.RevisionDate) {
      showValidationError("eng-RevisionDate", "Revision date is required.");
      return;
    }
    if (!engineering.submittedDate) {
      showValidationError("eng-submittedDate", "Submitted date is required.");
      return;
    }
  } else if (anyEngChoice) {
    // For regular save (not final completion), still require basic info if actions selected
    if (!engineering.nameOfEng) {
      showValidationError("eng-nameOfEng", "Engineer name is required when a disposition is selected.");
      return;
    }
    if (!engineering.disposition) {
      showValidationError("eng-disposition", "Please provide disposition notes.");
      return;
    }
  }

  // Determine final completion flag:
  // - once completed, stays completed
  // - can only become completed from Engineering stage
  const finalIsCompleted =
    existing.isCompleted === true ||
    (currentStage === "engineering" && isCompleted === true);

  const updatedDetails = {
    ...existing,
    ncrNumber,
    dateCreated,
    lastModified,
    purchaseOrder: poNumber,
    salesOrder: soNumber,
    supplierValue: supplierVal,
    supplierName:  supplierText,
    processTypeValue: processType,
    productValue:  productVal,
    recvQty,
    defectQty,
    issueCategoryValue: issueCatVal,
    defectDescription:  defectDesc,
    inspectedBy,
    inspectedOn,
    status: statusVal,
    isCompleted: finalIsCompleted,
    itemNonconforming,
    processApplicable,
    engineering
  };

  // Only set qualityCompleted when inspector uses Mark as Completed in quality stage
  if (completingFromButton && currentStage === "quality") {
    updatedDetails.qualityCompleted = true;
  }

  detailsMap[ncrNumber] = updatedDetails;
  saveJSON(DETAILS_KEY, detailsMap);

  const updatedRow = {
    ...(row || {
      id: row?.id || Date.now(),
      ncrNumber
    }),
    dateCreated,
    lastModified,
    supplier: supplierText,
    status: statusVal,
    isCompleted: finalIsCompleted
  };

  if (idx >= 0) {
    list[idx] = updatedRow;
  } else {
    list.push(updatedRow);
  }
  saveJSON(STORAGE_KEY, list);

  baselineDetails = deepClone(updatedDetails);
  baselineRow     = deepClone(updatedRow);

  if (finalIsCompleted) {
    alert("NCR has been marked as completed. This form can no longer be edited.");
  } else if (completingFromButton && currentStage === "quality") {
    alert("Inspector section has been completed. Engineering can now work on this NCR.");
  } else {
    alert("NCR updated.");
  }
  
  if (!stayHere) {
    window.location.href = "index.html";
  }
}
