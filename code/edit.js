// ---------------- Helpers & constants ----------------
const STORAGE_KEY = "ncrData";
const DETAILS_KEY = "ncrDetails";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Global workflow + role
// Stages: "quality-initial" | "engineering" | "purchasing" | "quality-final" | "completed"
let currentStage = "quality-initial";
let completingFromButton = false;  // used to detect Mark as Completed
let currentRole = null;            // normalized further below

// --- Role helpers (IMPORTANT: makes "Purchasing / Operations" behave correctly) ---
function isQualityRole() {
  const r = (currentRole || "").toLowerCase();
  return r.includes("quality");
}

function isEngineerRole() {
  const r = (currentRole || "").toLowerCase();
  return r.includes("engineer");
}

function isPurchasingRole() {
  const r = (currentRole || "").toLowerCase();
  // covers "Purchasing", "Purchasing Inspector", "Purchasing / Operations", "Ops"
  return r.includes("purchas") || r.includes("operations") || r.includes("ops");
}

// Get text from select element
function getSelectText(selectId) {
  const select = document.getElementById(selectId);
  if (!select || !select.value) return "Not specified";
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption ? selectedOption.text : "Not specified";
}

// Format checkbox values for preview
function formatCheckboxValues(values) {
  if (!values || values.length === 0) return "None selected";
  if (Array.isArray(values)) {
    return values
      .map((v) => {
        if (v === "yes") return "Yes";
        if (v === "no") return "No";
        if (v === "supplier-rec-insp") return "Supplier or Rec-Insp";
        if (v === "wip-production") return "WIP (Production Order)";
        return v;
      })
      .join(", ");
  }
  if (values === "yes") return "Yes";
  if (values === "no") return "No";
  return values;
}

// Helpers to know if sections have real data (for preview)
function hasEngineeringData(eng) {
  if (!eng) return false;
  return !!(
    eng.useAsIs ||
    eng.repair ||
    eng.rework ||
    eng.scrap ||
    eng.custNotifNCR ||
    eng.drawingReqUpd ||
    (eng.disposition && eng.disposition.trim() !== "") ||
    (eng.nameOfEng && eng.nameOfEng.trim() !== "") ||
    (eng.origRevNum && Number(eng.origRevNum) !== 0) ||
    (eng.UpdatedRev && eng.UpdatedRev.trim() !== "") ||
    (eng.RevisionDate && eng.RevisionDate.trim() !== "") ||
    (eng.submittedDate && eng.submittedDate.trim() !== "")
  );
}

function hasPurchasingData(purch) {
  if (!purch) return false;
  return !!(
    purch.reworkInHouse ||
    purch.scrapInHouse ||
    purch.deferForHbcReview ||
    (purch.carRaised && purch.carRaised.trim() !== "") ||
    (purch.carNumber && purch.carNumber.trim() !== "") ||
    (purch.followUpRequired && purch.followUpRequired.trim() !== "") ||
    (purch.followUpType && purch.followUpType.trim() !== "") ||
    (purch.followUpDate && purch.followUpDate.trim() !== "") ||
    (purch.opsManagerName && purch.opsManagerName.trim() !== "") ||
    (purch.opsManagerDate && purch.opsManagerDate.trim() !== "")
  );
}

function hasFinalInspectionData(fin) {
  if (!fin) return false;
  return !!(
    (fin.reinspectedAcceptable && fin.reinspectedAcceptable.trim() !== "") ||
    (fin.newNcrNumber && fin.newNcrNumber.trim() !== "") ||
    (fin.inspectorName && fin.inspectorName.trim() !== "") ||
    (fin.inspectorDate && fin.inspectorDate.trim() !== "") ||
    (fin.ncrClosed && fin.ncrClosed.trim() !== "") ||
    (fin.qualityDeptName && fin.qualityDeptName.trim() !== "") ||
    (fin.closeDate && fin.closeDate.trim() !== "")
  );
}

// ---------------- Preview modal (re-written simpler & clean) ----------------
function showPreviewModal(formData) {
  const modal = document.getElementById("previewModal");
  const content = document.getElementById("previewContent");
  if (!modal || !content) return;

  const parts = [];

  // Header + Line Items (Quality Inspector)
  parts.push(`
    <section class="preview-section">
      <h3 class="preview-section-title">Quality Inspector - Header &amp; Line Items</h3>
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
          <div class="preview-value ${!formData.purchaseOrder ? "empty" : ""}">
            ${formData.purchaseOrder || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Sales Order #</div>
          <div class="preview-value ${!formData.salesOrder ? "empty" : ""}">
            ${formData.salesOrder || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Item Marked Nonconforming</div>
          <div class="preview-value ${!formData.itemNonconforming ? "empty" : ""}">
            ${formatCheckboxValues(formData.itemNonconforming)}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Supplier</div>
          <div class="preview-value ${!formData.supplier ? "empty" : ""}">
            ${formData.supplier || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Type</div>
          <div class="preview-value ${!formData.processType ? "empty" : ""}">
            ${formData.processType || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Process Applicable</div>
          <div class="preview-value ${
            !formData.processApplicable || formData.processApplicable.length === 0 ? "empty" : ""
          }">
            ${formatCheckboxValues(formData.processApplicable)}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Product</div>
          <div class="preview-value ${!formData.product ? "empty" : ""}">
            ${formData.product || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Received Qty</div>
          <div class="preview-value ${!formData.recvQty ? "empty" : ""}">
            ${formData.recvQty || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Defective Qty</div>
          <div class="preview-value ${!formData.defectQty ? "empty" : ""}">
            ${formData.defectQty || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Issue Category</div>
          <div class="preview-value ${!formData.issueCategory ? "empty" : ""}">
            ${formData.issueCategory || "Not selected"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected By</div>
          <div class="preview-value ${!formData.inspectedBy ? "empty" : ""}">
            ${formData.inspectedBy || "Not provided"}
          </div>
        </div>
        <div class="preview-item">
          <div class="preview-label">Inspected On</div>
          <div class="preview-value ${!formData.inspectedOn ? "empty" : ""}">
            ${formData.inspectedOn || "Not provided"}
          </div>
        </div>
      </div>
      <div class="preview-item" style="margin-top: 1rem;">
        <div class="preview-label">Defect Description</div>
        <div class="preview-value multiline ${!formData.defectDescription ? "empty" : ""}">
          ${formData.defectDescription || "No description provided"}
        </div>
      </div>
    </section>
  `);

  // Engineering preview (shown whenever there is real data, for any stage)
  const eng = formData.engineering || {};
  if (hasEngineeringData(eng)) {
    const engActions = [];
    if (eng.useAsIs) engActions.push("Use as-is");
    if (eng.repair) engActions.push("Repair");
    if (eng.rework) engActions.push("Rework");
    if (eng.scrap) engActions.push("Scrap");
    if (eng.custNotifNCR) engActions.push("Customer Notified");

    const engExtraFlags = [];
    if (eng.drawingReqUpd) engExtraFlags.push("Drawing Update Required");

    parts.push(`
      <section class="preview-section">
        <h3 class="preview-section-title">Engineering Disposition &amp; Actions</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <div class="preview-label">Disposition Choices</div>
            <div class="preview-value ${engActions.length === 0 ? "empty" : ""}">
              ${engActions.length ? engActions.join(", ") : "No disposition selected"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Disposition Notes</div>
            <div class="preview-value multiline ${!eng.disposition ? "empty" : ""}">
              ${eng.disposition || "No notes provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Engineer Name</div>
            <div class="preview-value ${!eng.nameOfEng ? "empty" : ""}">
              ${eng.nameOfEng || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Original Rev #</div>
            <div class="preview-value ${!eng.origRevNum ? "empty" : ""}">
              ${eng.origRevNum || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Updated Revision (Date/Time)</div>
            <div class="preview-value ${!eng.UpdatedRev ? "empty" : ""}">
              ${eng.UpdatedRev || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Revision Date</div>
            <div class="preview-value ${!eng.RevisionDate ? "empty" : ""}">
              ${eng.RevisionDate || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Submitted Date</div>
            <div class="preview-value ${!eng.submittedDate ? "empty" : ""}">
              ${eng.submittedDate || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Drawing / Extra Actions</div>
            <div class="preview-value ${engExtraFlags.length === 0 ? "empty" : ""}">
              ${engExtraFlags.length ? engExtraFlags.join(", ") : "No additional actions"}
            </div>
          </div>
        </div>
      </section>
    `);
  }

  // Purchasing preview (shown whenever there is real data, for any stage)
  const purch = formData.purchasing || {};
  if (hasPurchasingData(purch)) {
    const purchDecisions = [];
    if (purch.reworkInHouse) purchDecisions.push("Rework In-House");
    if (purch.scrapInHouse) purchDecisions.push("Scrap In-House");
    if (purch.deferForHbcReview) purchDecisions.push("Defer for HBC Engineering Review");

    parts.push(`
      <section class="preview-section">
        <h3 class="preview-section-title">Purchasing / Operations</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <div class="preview-label">Preliminary Decisions</div>
            <div class="preview-value ${purchDecisions.length === 0 ? "empty" : ""}">
              ${purchDecisions.length ? purchDecisions.join(", ") : "No decisions selected"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">CAR Raised?</div>
            <div class="preview-value ${!purch.carRaised ? "empty" : ""}">
              ${
                purch.carRaised
                  ? purch.carRaised === "yes"
                    ? "Yes"
                    : "No"
                  : "Not specified"
              }
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">CAR #</div>
            <div class="preview-value ${!purch.carNumber ? "empty" : ""}">
              ${purch.carNumber || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Follow-Up Required?</div>
            <div class="preview-value ${!purch.followUpRequired ? "empty" : ""}">
              ${
                purch.followUpRequired
                  ? purch.followUpRequired === "yes"
                    ? "Yes"
                    : "No"
                  : "Not specified"
              }
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Follow-Up Type</div>
            <div class="preview-value ${!purch.followUpType ? "empty" : ""}">
              ${purch.followUpType || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Expected Follow-Up Date</div>
            <div class="preview-value ${!purch.followUpDate ? "empty" : ""}">
              ${purch.followUpDate || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Operations Manager</div>
            <div class="preview-value ${!purch.opsManagerName ? "empty" : ""}">
              ${purch.opsManagerName || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Operations Approval Date</div>
            <div class="preview-value ${!purch.opsManagerDate ? "empty" : ""}">
              ${purch.opsManagerDate || "Not provided"}
            </div>
          </div>
        </div>
      </section>
    `);
  }

  // Final quality preview (shown whenever there is real data, for any stage)
  const fin = formData.finalInspection || {};
  if (hasFinalInspectionData(fin)) {
    parts.push(`
      <section class="preview-section">
        <h3 class="preview-section-title">Final Quality Re-Inspection &amp; Closure</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <div class="preview-label">Re-Inspected Acceptable?</div>
            <div class="preview-value ${!fin.reinspectedAcceptable ? "empty" : ""}">
              ${
                fin.reinspectedAcceptable
                  ? fin.reinspectedAcceptable === "yes"
                    ? "Yes"
                    : "No"
                  : "Not specified"
              }
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">New NCR # (if not acceptable)</div>
            <div class="preview-value ${!fin.newNcrNumber ? "empty" : ""}">
              ${fin.newNcrNumber || "Not generated"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Re-Inspecting Inspector</div>
            <div class="preview-value ${!fin.inspectorName ? "empty" : ""}">
              ${fin.inspectorName || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Re-Inspection Date</div>
            <div class="preview-value ${!fin.inspectorDate ? "empty" : ""}">
              ${fin.inspectorDate || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">NCR Closed?</div>
            <div class="preview-value ${!fin.ncrClosed ? "empty" : ""}">
              ${
                fin.ncrClosed
                  ? fin.ncrClosed === "yes"
                    ? "Yes"
                    : "No"
                  : "Not specified"
              }
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Quality Dept. Representative</div>
            <div class="preview-value ${!fin.qualityDeptName ? "empty" : ""}">
              ${fin.qualityDeptName || "Not provided"}
            </div>
          </div>
          <div class="preview-item">
            <div class="preview-label">Closure Date</div>
            <div class="preview-value ${!fin.closeDate ? "empty" : ""}">
              ${fin.closeDate || "Not provided"}
            </div>
          </div>
        </div>
      </section>
    `);
  }

  content.innerHTML = parts.join("");
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

/* ---------------- Basic storage helpers ---------------- */
function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function notChosen(v) {
  return v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select");
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ---------------- Checkbox helpers ---------------- */
function getCheckboxValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map((cb) => cb.value);
}
function getSingleCheckboxValue(name) {
  const values = getCheckboxValues(name);
  return values.length > 0 ? values[0] : "";
}
function setCheckboxValues(name, values) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach((cb) => {
    cb.checked = Array.isArray(values) ? values.includes(cb.value) : values === cb.value;
  });
}

/* ---------------------- ENGINEERING HELPERS ---------------------- */
function readEngineeringFromForm() {
  const get = (id) => document.getElementById(id);
  const isChecked = (id) => !!get(id)?.checked;

  return {
    useAsAs: undefined, // legacy safety; not used
    useAsIs: isChecked("eng-useAsIs"),
    repair: isChecked("eng-repair"),
    rework: isChecked("eng-rework"),
    scrap: isChecked("eng-scrap"),
    custNotifNCR: isChecked("eng-custNotif"),
    drawingReqUpd: isChecked("eng-drawingReqUpd"),
    disposition: (get("eng-disposition")?.value || "").trim(),
    origRevNum: Number(get("eng-origRevNum")?.value || 0) || 0,
    nameOfEng: (get("eng-nameOfEng")?.value || "").trim(),
    UpdatedRev: get("eng-UpdatedRev")?.value || "",
    RevisionDate: get("eng-RevisionDate")?.value || "",
    submittedDate: get("eng-submittedDate")?.value || "",
  };
}

function writeEngineeringToForm(eng) {
  if (!eng) eng = {};
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el != null) el.value = v ?? "";
  };
  const setCk = (id, v) => {
    const el = document.getElementById(id);
    if (el != null) el.checked = !!v;
  };

  setCk("eng-useAsIs", eng.useAsIs);
  setCk("eng-repair", eng.repair);
  setCk("eng-rework", eng.rework);
  setCk("eng-scrap", eng.scrap);
  setCk("eng-custNotif", eng.custNotifNCR);
  set("eng-disposition", eng.disposition ?? "");
  setCk("eng-drawingReqUpd", eng.drawingReqUpd);
  set("eng-origRevNum", eng.origRevNum ?? "");
  set("eng-nameOfEng", eng.nameOfEng ?? "");
  set("eng-UpdatedRev", eng.UpdatedRev ?? "");
  set("eng-RevisionDate", eng.RevisionDate ?? "");
  set("eng-submittedDate", eng.submittedDate ?? "");
}

/* ---------------------- PURCHASING / OPERATIONS HELPERS ---------------------- */
function readPurchasingFromForm() {
  const get = (id) => document.getElementById(id);
  const isChecked = (id) => !!get(id)?.checked;
  const getVal = (id) => (get(id)?.value || "").trim();

  return {
    reworkInHouse: isChecked("purch-rework-inhouse"),
    scrapInHouse: isChecked("purch-scrap-inhouse"),
    deferForHbcReview: isChecked("purch-defer-hbc-review"),
    carRaised: getVal("purch-car-raised"),
    carNumber: getVal("purch-car-number"),
    followUpRequired: getVal("purch-followup-required"),
    followUpType: getVal("purch-followup-type"),
    followUpDate: getVal("purch-followup-date"),
    opsManagerName: getVal("purch-ops-manager-name"),
    opsManagerDate: getVal("purch-ops-manager-date"),
  };
}

function writePurchasingToForm(purch) {
  if (!purch) purch = {};
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  const setCk = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!v;
  };

  setCk("purch-rework-inhouse", purch.reworkInHouse);
  setCk("purch-scrap-inhouse", purch.scrapInHouse);
  setCk("purch-defer-hbc-review", purch.deferForHbcReview);
  set("purch-car-raised", purch.carRaised || "");
  set("purch-car-number", purch.carNumber || "");
  set("purch-followup-required", purch.followUpRequired || "");
  set("purch-followup-type", purch.followUpType || "");
  set("purch-followup-date", purch.followUpDate || "");
  set("purch-ops-manager-name", purch.opsManagerName || "");
  set("purch-ops-manager-date", purch.opsManagerDate || "");
}

/* ---------------------- FINAL QA / CLOSURE HELPERS ---------------------- */
function readFinalInspectionFromForm() {
  const get = (id) => document.getElementById(id);
  const getVal = (id) => (get(id)?.value || "").trim();

  return {
    reinspectedAcceptable: getVal("reinspect-acceptable"),
    newNcrNumber: getVal("reinspect-new-ncr-number"),
    inspectorName: getVal("reinspect-inspector-name"),
    inspectorDate: getVal("reinspect-date"),
    ncrClosed: getVal("close-ncr"),
    qualityDeptName: getVal("close-quality-name"),
    closeDate: getVal("close-quality-date"),
  };
}

function writeFinalInspectionToForm(fin) {
  if (!fin) fin = {};
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };

  set("reinspect-acceptable", fin.reinspectedAcceptable || "");
  set("reinspect-new-ncr-number", fin.newNcrNumber || "");
  set("reinspect-inspector-name", fin.inspectorName || "");
  set("reinspect-date", fin.inspectorDate || "");
  set("close-ncr", fin.ncrClosed || "");
  set("close-quality-name", fin.qualityDeptName || "");
  set("close-quality-date", fin.closeDate || "");
}

/* ---------------------- Document Summary Helper ---------------------- */
function updateDocumentSummary() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return (el?.value || "").trim();
  };

  const author = getVal("inspected-by") || "Not specified";
  const created = getVal("created-on") || "Not specified";
  const opsName = getVal("purch-ops-manager-name") || "Not specified";
  const revDate = getVal("eng-RevisionDate") || "Not specified";
  const origRev = getVal("eng-origRevNum") || "Not specified";

  const a = document.getElementById("doc-summary-author");
  const c = document.getElementById("doc-summary-created");
  const o = document.getElementById("doc-summary-approved-by");
  const r = document.getElementById("doc-summary-revision-date");
  const n = document.getElementById("doc-summary-orig-rev");

  if (a) a.textContent = author;
  if (c) c.textContent = created;
  if (o) o.textContent = opsName;
  if (r) r.textContent = revDate;
  if (n) n.textContent = origRev;
}

/* ---------------------- Small UI helpers ---------------------- */
function handleCarRaisedChange() {
  const select = document.getElementById("purch-car-raised");
  const carInput = document.getElementById("purch-car-number");
  if (!select || !carInput) return;

  if (select.value === "yes") {
    carInput.disabled = false;
    carInput.readOnly = false;
  } else {
    carInput.value = "";
    carInput.disabled = true;
  }
}

function handleFollowUpRequiredChange() {
  const select = document.getElementById("purch-followup-required");
  const typeInput = document.getElementById("purch-followup-type");
  const dateInput = document.getElementById("purch-followup-date");
  if (!select || !typeInput || !dateInput) return;

  if (select.value === "yes") {
    typeInput.disabled = false;
    dateInput.disabled = false;
  } else {
    typeInput.value = "";
    dateInput.value = "";
    typeInput.disabled = true;
    dateInput.disabled = true;
  }
}

function generateNewNcrNumber(original) {
  if (!original) return "";
  const match = original.match(/^(.+?)(?:-R(\d+))?$/);
  if (!match) return original + "-R1";
  const base = match[1];
  const existing = match[2] ? parseInt(match[2], 10) : 0;
  return `${base}-R${existing + 1}`;
}

function handleReinspectAcceptableChange() {
  const select = document.getElementById("reinspect-acceptable");
  const newNcrInput = document.getElementById("reinspect-new-ncr-number");
  if (!select || !newNcrInput) return;

  if (select.value === "no") {
    newNcrInput.readOnly = false;
    if (!newNcrInput.value) {
      const original = document.getElementById("ncr-number")?.value || "";
      newNcrInput.value = generateNewNcrNumber(original);
    }
  } else {
    newNcrInput.value = "";
    newNcrInput.readOnly = true;
  }
}

function handleNcrClosedChange() {
  const select = document.getElementById("close-ncr");
  const nameInput = document.getElementById("close-quality-name");
  const dateInput = document.getElementById("close-quality-date");
  if (!select || !nameInput || !dateInput) return;

  if (select.value === "yes") {
    nameInput.disabled = false;
    dateInput.disabled = false;
    if (!dateInput.value) {
      dateInput.value = todayISO();
    }
  } else {
    nameInput.value = "";
    dateInput.value = "";
    nameInput.disabled = true;
    dateInput.disabled = true;
  }
}

/* ---------------------- WORKFLOW HELPERS ---------------------- */

// 4-stage workflow, aligned with stored details
// Stages: quality-initial -> engineering -> purchasing -> quality-final -> completed
function getWorkflowInfo(details) {
  if (!details) {
    return {
      label: "Quality Inspector",
      stage: "quality-initial",
    };
  }

  const qualityInitialDone = !!details.qualityInitialCompleted || !!details.qualityCompleted;
  const engineeringDone = !!details.engineeringCompleted;
  const purchasingDone = !!details.purchasingCompleted;
  const finalQualityDone = !!details.finalQualityCompleted;
  const fullyCompleted = !!details.isCompleted;
  const ncrClosed = details.finalInspection?.ncrClosed;

  if (fullyCompleted || (qualityInitialDone && engineeringDone && purchasingDone && finalQualityDone)) {
    // If NCR Closed is explicitly set to "no", mark as "closed" instead of "completed"
    if (ncrClosed === "no") {
      return {
        label: "Closed",
        stage: "closed",
      };
    }
    return {
      label: "Completed",
      stage: "completed",
    };
  }

  if (!qualityInitialDone) {
    return {
      label: "Quality Inspector",
      stage: "quality-initial",
    };
  }

  if (!engineeringDone) {
    return {
      label: "Engineering",
      stage: "engineering",
    };
  }

  if (!purchasingDone) {
    return {
      label: "Purchasing / Operations",
      stage: "purchasing",
    };
  }

  return {
    label: "Quality Inspector (Close-out)",
    stage: "quality-final",
  };
}

/* ---------------------- (OLD) merge / visibility helpers ---------------------- */

// Function to automatically open the accordion for the current workflow stage
function openAccordionForWorkflowStage(stage) {
  let toggleId = null;

  switch (stage) {
    case "quality-initial":
      // Initial quality stage uses the merged header accordion
      toggleId = "header-toggle";
      break;
    case "quality-final":
      // Final quality stage opens the final inspection accordion
      toggleId = "final-inspection-toggle";
      break;
    case "engineering":
      toggleId = "engineering-toggle";
      break;
    case "purchasing":
      toggleId = "purchasing-toggle";
      break;
    case "completed":
    case "closed":
      // For completed or closed, open the final inspection accordion
      toggleId = "final-inspection-toggle";
      break;
    default:
      // Default to header if stage is unknown
      toggleId = "header-toggle";
  }

  if (toggleId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.checked = true;
    }
  }
}

// Simplified version: ALWAYS merge Quality inspector sections into one accordion
function mergeQualityInspectorAccordions() {
  const headerToggle = document.getElementById("header-toggle");
  const lineitemToggle = document.getElementById("lineitem-toggle");
  const attachmentToggle = document.getElementById("attachment-toggle");

  if (!headerToggle || !lineitemToggle || !attachmentToggle) return;

  const headerFieldset = headerToggle.closest(".collapsible-fieldset");
  const lineitemFieldset = lineitemToggle.closest(".collapsible-fieldset");
  const attachmentFieldset = attachmentToggle.closest(".collapsible-fieldset");

  if (!headerFieldset || !lineitemFieldset || !attachmentFieldset) return;
  if (headerFieldset.classList.contains("merged-quality-accordion")) return;

  const headerLabel = headerFieldset.querySelector(".fieldset-toggle-label legend");
  if (headerLabel) {
    headerLabel.textContent = "Quality Inspector (Header, Line Items & Attachments)";
  }

  const headerContent = headerFieldset.querySelector(".fieldset-content");
  const lineitemContent = lineitemFieldset.querySelector(".fieldset-content");
  const attachmentContent = attachmentFieldset.querySelector(".fieldset-content");

  if (!headerContent || !lineitemContent || !attachmentContent) return;

  const lineitemDivider = document.createElement("div");
  lineitemDivider.className = "merged-section-divider";
  lineitemDivider.innerHTML = '<h4 class="merged-section-title">NCR Line Item Details</h4>';

  const attachmentDivider = document.createElement("div");
  attachmentDivider.className = "merged-section-divider";
  attachmentDivider.innerHTML = '<h4 class="merged-section-title">Attachments</h4>';

  // Move line item contents under header
  headerContent.appendChild(lineitemDivider);
  lineitemContent.querySelectorAll(".form-columns").forEach((cols) => {
    headerContent.appendChild(cols);
  });

  // Move attachment contents under header
  headerContent.appendChild(attachmentDivider);
  attachmentContent.querySelectorAll(".form-columns").forEach((cols) => {
    headerContent.appendChild(cols);
  });

  // Hide original line & attachment fieldsets
  lineitemFieldset.style.display = "none";
  lineitemFieldset.setAttribute("aria-hidden", "true");
  attachmentFieldset.style.display = "none";
  attachmentFieldset.setAttribute("aria-hidden", "true");

  headerFieldset.classList.add("merged-quality-accordion");
}

function getFieldsetWrappers() {
  const headerFieldset =
    document.getElementById("header-toggle")?.closest(".collapsible-fieldset") || null;
  const lineFieldset =
    document.getElementById("lineitem-toggle")?.closest(".collapsible-fieldset") || null;
  const attachmentFieldset =
    document.getElementById("attachment-toggle")?.closest(".collapsible-fieldset") || null;

  const engSection = document.getElementById("engineering-section");
  const engFieldset = engSection ? engSection.closest(".collapsible-fieldset") : null;

  const purchSection = document.getElementById("purchasing-section");
  const purchFieldset = purchSection ? purchSection.closest(".collapsible-fieldset") : null;

  const finalSection = document.getElementById("final-inspection-section");
  const finalFieldset = finalSection ? finalSection.closest(".collapsible-fieldset") : null;

  return {
    headerFieldset,
    lineFieldset,
    attachmentFieldset,
    engFieldset,
    purchFieldset,
    finalFieldset,
  };
}

function setFieldsetVisible(wrapper, visible) {
  if (!wrapper) return;
  wrapper.style.display = visible ? "" : "none";
  if (visible) {
    wrapper.removeAttribute("aria-hidden");
  } else {
    wrapper.setAttribute("aria-hidden", "true");
  }
}

function setFieldsetReadOnly(wrapper, readOnly) {
  if (!wrapper) return;
  const elements = wrapper.querySelectorAll("input, select, textarea");
  elements.forEach((el) => {
    // keep accordion toggles clickable
    if (el.classList.contains("fieldset-toggle") || el.name === "fieldset-toggle") {
      return;
    }
    if (readOnly) {
      if (el.type === "checkbox" || el.type === "radio") {
        el.disabled = true;
      } else {
        el.readOnly = true;
        el.disabled = true;
      }
    }
  });
}

function isPurchasingStepCompleted(details) {
  if (!details) return false;
  return !!details.purchasingCompleted;
}

function applyRoleVisibility(details) {
  const {
    headerFieldset,
    lineFieldset,
    attachmentFieldset,
    engFieldset,
    purchFieldset,
    finalFieldset,
  } = getFieldsetWrappers();

  // Completed NCR → lock for everyone
  if (details && details.isCompleted) {
    disableFormForCompletedNCR();
    return;
  }

  // No logged-in role → show everything (used when not logged in)
  if (!currentRole) {
    setFieldsetVisible(headerFieldset, true);
    setFieldsetVisible(lineFieldset, true);
    setFieldsetVisible(attachmentFieldset, true);
    setFieldsetVisible(engFieldset, true);
    setFieldsetVisible(purchFieldset, true);
    setFieldsetVisible(finalFieldset, true);
    return;
  }

  const isQ = isQualityRole();
  const isE = isEngineerRole();
  const isP = isPurchasingRole();

  // Check which sections are completed
  const qualityInitialCompleted = details?.qualityInitialCompleted || details?.qualityCompleted || false;
  const engineeringCompleted = details?.engineeringCompleted || false;
  const purchasingCompleted = details?.purchasingCompleted || false;
  const finalQualityCompleted = details?.finalQualityCompleted || false;

  if (isQ) {
    const canSeeFinal = isPurchasingStepCompleted(details);

    if (currentStage === "quality-final") {
      // Close-out stage: Show completed sections as read-only, final section editable
      setFieldsetVisible(headerFieldset, true);
      setFieldsetVisible(lineFieldset, false);
      setFieldsetVisible(attachmentFieldset, false);
      setFieldsetReadOnly(headerFieldset, true);

      // Show engineering and purchasing only if completed
      setFieldsetVisible(engFieldset, engineeringCompleted);
      if (engineeringCompleted) setFieldsetReadOnly(engFieldset, true);

      setFieldsetVisible(purchFieldset, purchasingCompleted);
      if (purchasingCompleted) setFieldsetReadOnly(purchFieldset, true);

      setFieldsetVisible(finalFieldset, canSeeFinal);
    } else {
      // Initial Quality stage: only the Quality accordion is editable
      setFieldsetVisible(headerFieldset, true);
      setFieldsetVisible(lineFieldset, false);
      setFieldsetVisible(attachmentFieldset, false);

      // Hide other sections since they're not completed yet
      setFieldsetVisible(engFieldset, false);
      setFieldsetVisible(purchFieldset, false);
      setFieldsetVisible(finalFieldset, false);
    }
    return;
  }

  if (isE) {
    // Engineering: show their section editable, show completed previous sections as read-only
    setFieldsetVisible(headerFieldset, qualityInitialCompleted);
    if (qualityInitialCompleted) setFieldsetReadOnly(headerFieldset, true);
    
    setFieldsetVisible(lineFieldset, false);
    setFieldsetVisible(attachmentFieldset, false);

    // Their section is editable
    setFieldsetVisible(engFieldset, true);

    // Hide future sections
    setFieldsetVisible(purchFieldset, false);
    setFieldsetVisible(finalFieldset, false);
    return;
  }

  if (isP) {
    // Purchasing: show completed previous sections as read-only, their section editable
    setFieldsetVisible(headerFieldset, qualityInitialCompleted);
    if (qualityInitialCompleted) setFieldsetReadOnly(headerFieldset, true);

    setFieldsetVisible(lineFieldset, false);
    setFieldsetVisible(attachmentFieldset, false);

    setFieldsetVisible(engFieldset, engineeringCompleted);
    if (engineeringCompleted) setFieldsetReadOnly(engFieldset, true);

    // Their section is editable
    setFieldsetVisible(purchFieldset, true);

    // Hide final section
    setFieldsetVisible(finalFieldset, false);
    return;
  }

  // Unknown role → show everything (fallback)
  setFieldsetVisible(headerFieldset, true);
  setFieldsetVisible(lineFieldset, true);
  setFieldsetVisible(attachmentFieldset, true);
  setFieldsetVisible(engFieldset, true);
  setFieldsetVisible(purchFieldset, true);
  setFieldsetVisible(finalFieldset, true);
}

/* ---------------- Validation helpers ---------------- */
function clearValidation(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const formGroup = element.closest(".form-group");
    if (formGroup) {
      formGroup.classList.remove("invalid");
      const errorMessage = formGroup.querySelector(".error-message");
      if (errorMessage) {
        errorMessage.remove();
      }
    }

    const fieldset = element.closest(".collapsible-fieldset");
    if (fieldset) {
      const hasRemainingErrors = fieldset.querySelectorAll(".form-group.invalid").length > 0;
      if (!hasRemainingErrors) {
        fieldset.classList.remove("has-errors");
      }
    }
  }
}

function showValidationError(elementId, message, shouldFocus = false) {
  const element = document.getElementById(elementId);
  if (element) {
    const fieldset = element.closest(".collapsible-fieldset");
    if (fieldset) {
      const toggleInput = fieldset.querySelector(".fieldset-toggle");
      if (toggleInput) {
        toggleInput.checked = true;
      }
      fieldset.classList.add("has-errors");
    }

    const formGroup = element.closest(".form-group");
    if (formGroup) {
      formGroup.classList.add("invalid");

      const existingError = formGroup.querySelector(".error-message");
      if (existingError) {
        existingError.remove();
      }

      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = message;
      formGroup.appendChild(errorDiv);

      const clearValidationHandler = () => {
        clearValidation(elementId);
        element.removeEventListener("input", clearValidationHandler);
        element.removeEventListener("change", clearValidationHandler);
      };

      element.addEventListener("input", clearValidationHandler);
      element.addEventListener("change", clearValidationHandler);
    }

    if (shouldFocus) {
      element.focus();
    }
  }
}

function clearAllValidation() {
  const invalidGroups = document.querySelectorAll(".form-group.invalid");
  invalidGroups.forEach((group) => {
    group.classList.remove("invalid");
    const errorMessage = group.querySelector(".error-message");
    if (errorMessage) {
      errorMessage.remove();
    }
  });

  const fieldsets = document.querySelectorAll(".collapsible-fieldset.has-errors");
  fieldsets.forEach((fieldset) => {
    fieldset.classList.remove("has-errors");
  });
}

function markRequiredFields() {
  const requiredFieldIds = [
    // Inspector
    "po-number",
    "inspected-by",
    "defect-desc",
    "supplier-id",
    "product-id",
    "issue-cat-id",
    "recv-qty",
    "defect-qty",
    "inspected-on",
    "process-type-id",
    // Engineering
    "eng-disposition",
    "eng-nameOfEng",
    "eng-origRevNum",
    "eng-UpdatedRev",
    "eng-RevisionDate",
    "eng-submittedDate",
    // Purchasing / Operations
    "purch-car-raised",
    "purch-followup-required",
    "purch-ops-manager-name",
    "purch-ops-manager-date",
    // Final QA / Closure
    "reinspect-acceptable",
    "reinspect-inspector-name",
    "reinspect-date",
    "close-ncr",
    "close-quality-name",
    "close-quality-date",
  ];

  requiredFieldIds.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const formGroup = element.closest(".form-group");
      if (formGroup) {
        formGroup.classList.add("required");
        element.setAttribute("required", "true");
        element.setAttribute("aria-required", "true");
      }
    }
  });

  const engAction = document.getElementById("eng-useAsIs");
  if (engAction) {
    const formGroup = engAction.closest(".form-group");
    if (formGroup) {
      formGroup.classList.add("required");
      engAction.setAttribute("aria-required", "true");
    }
  }

  const form = document.getElementById("ncr-edit-form") || document.querySelector("form");
  if (form && !form.querySelector(".required-fields-legend")) {
    const legend = document.createElement("div");
    legend.className = "required-fields-legend";
    legend.innerHTML = '<span class="required-asterisk">*</span> indicates required fields';
    form.insertBefore(legend, form.firstChild);
  }
}

// ---------------- URL state & DOM refs ----------------
const params = new URLSearchParams(window.location.search);
const ncrNumberParam = params.get("ncr") || "";
const urlCreated = params.get("dateCreated") || "";
const urlSupplier = params.get("supplier") || "";
const isReadOnly = params.get("readonly") === "true";

const form = document.getElementById("ncr-edit-form") || document.querySelector("form");
const inpNcr = document.getElementById("ncr-number");
const inpCreated = document.getElementById("created-on");
const selSupplier = document.getElementById("supplier-id");
const selProduct = document.getElementById("product-id");
const inpRecvQty = document.getElementById("recv-qty");
const inpDefectQty = document.getElementById("defect-qty");
const selIssue = document.getElementById("issue-cat-id");
const inpDefectDesc = document.getElementById("defect-desc");
const inpInspector = document.getElementById("inspected-by");
const inpInspectedOn = document.getElementById("inspected-on");
const selStatus = document.getElementById("ncr-status");
const inpPONum = document.getElementById("po-number");
const inpSONum = document.getElementById("so-number");
const selProcessType = document.getElementById("process-type-id");

let baselineDetails = null;
let baselineRow = null;

function setSelectByText(selectEl, text) {
  if (!selectEl || !text) return;
  let matched = false;
  for (const opt of selectEl.options) {
    if (opt.text.trim() === text) {
      opt.selected = true;
      matched = true;
      break;
    }
  }
  if (!matched) {
    const opt = new Option(text, text);
    selectEl.appendChild(opt);
    opt.selected = true;
  }
}

function fillFormFrom(details, row) {
  if (inpCreated) {
    inpCreated.value = details?.dateCreated || row?.dateCreated || urlCreated || todayISO();
  }

  // Clear and reset engineering section
  if (details && details.engineering) {
    writeEngineeringToForm(details.engineering);
  } else {
    writeEngineeringToForm({});
  }

  // Clear and reset purchasing section
  if (details && details.purchasing) {
    writePurchasingToForm(details.purchasing);
  } else {
    writePurchasingToForm({});
  }

  // Clear and reset final inspection section
  if (details && details.finalInspection) {
    writeFinalInspectionToForm(details.finalInspection);
  } else {
    writeFinalInspectionToForm({});
  }

  if (selSupplier) {
    const supplierText = details?.supplierName || row?.supplier || urlSupplier || "";
    setSelectByText(selSupplier, supplierText);
  }

  const setVal = (el, v) => {
    if (el) {
      el.value = (v != null && v !== "") ? v : "";
    }
  };

  if (details) {
    setVal(inpPONum, details.purchaseOrder);
    setVal(inpSONum, details.salesOrder);
    setVal(selProcessType, details.processTypeValue);
    setVal(selProduct, details.productValue);
    setVal(inpRecvQty, details.recvQty);
    setVal(inpDefectQty, details.defectQty);
    setVal(selIssue, details.issueCategoryValue);
    setVal(inpDefectDesc, details.defectDescription);
    setVal(inpInspector, details.inspectedBy);
    setVal(inpInspectedOn, details.inspectedOn);
    setVal(selStatus, details.status);

    if (details.itemNonconforming) {
      setCheckboxValues("item-nonconforming", details.itemNonconforming);
    } else {
      setCheckboxValues("item-nonconforming", []);
    }
    if (details.processApplicable) {
      setCheckboxValues("process-applicable", details.processApplicable);
    } else {
      setCheckboxValues("process-applicable", []);
    }
  } else {
    // Clear all quality initial fields if no details
    setVal(inpPONum, "");
    setVal(inpSONum, "");
    setVal(selProcessType, "");
    setVal(selProduct, "");
    setVal(inpRecvQty, "");
    setVal(inpDefectQty, "");
    setVal(selIssue, "");
    setVal(inpDefectDesc, "");
    setVal(inpInspector, "");
    setVal(inpInspectedOn, "");
    setVal(selStatus, "");
    setCheckboxValues("item-nonconforming", []);
    setCheckboxValues("process-applicable", []);
  }

  updateDocumentSummary();
}

// ---------------- DOMContentLoaded ----------------
document.addEventListener("DOMContentLoaded", () => {
  markRequiredFields();

  // enforce Yes/No exclusivity for nonconforming item
  const nonconformingYes = document.getElementById("item-nonconforming-yes");
  const nonconformingNo = document.getElementById("item-nonconforming-no");
  if (nonconformingYes && nonconformingNo) {
    nonconformingYes.addEventListener("change", function () {
      if (this.checked) nonconformingNo.checked = false;
    });
    nonconformingNo.addEventListener("change", function () {
      if (this.checked) nonconformingYes.checked = false;
    });
  }

  if (inpNcr) {
    inpNcr.value = ncrNumberParam;
    inpNcr.readOnly = true;
    inpNcr.setAttribute("tabindex", "-1");
  }

  const list = loadJSON(STORAGE_KEY, []);
  const row = list.find((r) => String(r.ncrNumber) === String(ncrNumberParam)) || null;

  const detailsMap = loadJSON(DETAILS_KEY, {});
  const details = detailsMap[ncrNumberParam] || null;

  baselineRow = deepClone(row);
  baselineDetails = deepClone(details);

  fillFormFrom(details, row);

  const wfInfo = getWorkflowInfo(details);
  currentStage = wfInfo.stage || "quality-initial";

  // Get role from credentials.js (if available)
  if (typeof getCredentials === "function") {
    const creds = getCredentials();
    currentRole = creds && creds.type ? creds.type : null;
  }

  // Merge Quality Inspector sections into one accordion (Header + Line + Attachments)
  mergeQualityInspectorAccordions();

  applyRoleVisibility(details);

  // Automatically open the accordion for the current workflow stage
  openAccordionForWorkflowStage(currentStage);

  if (form) form.addEventListener("submit", (e) => onUpdateSubmit(e, false));

  const btnComplete = document.getElementById("btnComleted");
  if (btnComplete) {
    btnComplete.setAttribute("type", "button");
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

  const btnResetChanges =
    document.getElementById("btnResetChanges") || document.getElementById("btnReset");
  if (btnResetChanges) {
    btnResetChanges.addEventListener("click", onResetClick);
  }
  if (form) {
    form.addEventListener("reset", (e) => {
      e.preventDefault();
      onResetClick(e);
    });
  }

  // Demo auto-fill button
  const demoAutofillBtn = document.getElementById("demo-autofill-btn");
  if (demoAutofillBtn) {
    demoAutofillBtn.addEventListener("click", () => {
      if (!currentRole || (isQualityRole() && currentStage === "quality-initial")) {
        // Quality Inspector section (initial)
        document.getElementById("po-number").value = "PO-2025-9876";
        document.getElementById("so-number").value = "SO-2025-4321";

        const supplierSelect = document.getElementById("supplier-id");
        if (supplierSelect) supplierSelect.value = "2";

        const processTypeSelect = document.getElementById("process-type-id");
        if (processTypeSelect) processTypeSelect.value = "2";

        const wipProduction = document.getElementById("process-applicable-wip");
        if (wipProduction) wipProduction.checked = true;

        const productSelect = document.getElementById("product-id");
        if (productSelect) productSelect.value = "2";

        document.getElementById("recv-qty").value = "250";
        document.getElementById("defect-qty").value = "12";

        const issueCategorySelect = document.getElementById("issue-cat-id");
        if (issueCategorySelect) issueCategorySelect.value = "2";

        document.getElementById("defect-desc").value =
          "Demo auto-filled: Packaging issues found during quality inspection. Multiple units had damaged outer boxes.";

        const nonconformingNo2 = document.getElementById("item-nonconforming-no");
        if (nonconformingNo2) nonconformingNo2.checked = true;

        document.getElementById("inspected-by").value = "QI-Demo-123";
        document.getElementById("inspected-on").value = todayISO();

        updateDocumentSummary();
        alert("Quality Inspector section auto-filled with demo data!");
      } else if (currentStage === "engineering" && isEngineerRole()) {
        // Engineering section
        const useAsIsCheckbox = document.getElementById("eng-useAsIs");
        if (useAsIsCheckbox) useAsIsCheckbox.checked = true;

        const repairCheckbox = document.getElementById("eng-repair");
        if (repairCheckbox) repairCheckbox.checked = true;

        const custNotifCheckbox = document.getElementById("eng-custNotif");
        if (custNotifCheckbox) custNotifCheckbox.checked = true;

        document.getElementById("eng-disposition").value =
          "Demo auto-filled: Items can be used as-is after minor repairs. Customer notification sent. No drawing updates required.";

        document.getElementById("eng-nameOfEng").value = "Engineer-Demo-456";

        document.getElementById("eng-origRevNum").value = "1";
        document.getElementById("eng-RevisionDate").value = todayISO();
        document.getElementById("eng-submittedDate").value = todayISO();

        const now = new Date();
        const datetimeLocal =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0") +
          "T" +
          String(now.getHours()).padStart(2, "0") +
          ":" +
          String(now.getMinutes()).padStart(2, "0");
        document.getElementById("eng-UpdatedRev").value = datetimeLocal;

        updateDocumentSummary();
        alert("Engineering section auto-filled with demo data!");
      } else if (currentStage === "purchasing" && isPurchasingRole()) {
        // Purchasing / Operations section
        const rework = document.getElementById("purch-rework-inhouse");
        const scrap = document.getElementById("purch-scrap-inhouse");
        if (rework) rework.checked = true;
        if (scrap) scrap.checked = false;

        document.getElementById("purch-car-raised").value = "yes";
        document.getElementById("purch-car-number").value = "CAR-2025-001";

        document.getElementById("purch-followup-required").value = "yes";
        document.getElementById("purch-followup-type").value = "Supplier audit";
        document.getElementById("purch-followup-date").value = todayISO();

        document.getElementById("purch-ops-manager-name").value = "Ops-Manager Demo";
        document.getElementById("purch-ops-manager-date").value = todayISO();

        handleCarRaisedChange();
        handleFollowUpRequiredChange();
        updateDocumentSummary();

        alert("Purchasing / Operations section auto-filled with demo data!");
      } else if (currentStage === "quality-final" && isQualityRole()) {
        // Final Quality / Closure section
        document.getElementById("reinspect-acceptable").value = "yes";
        handleReinspectAcceptableChange();

        document.getElementById("reinspect-inspector-name").value = "Final-QI Demo";
        document.getElementById("reinspect-date").value = todayISO();

        document.getElementById("close-ncr").value = "yes";
        handleNcrClosedChange();

        document.getElementById("close-quality-name").value = "Quality-Manager Demo";
        document.getElementById("close-quality-date").value = todayISO();

        updateDocumentSummary();
        alert("Final Quality Re-Inspection section auto-filled with demo data!");
      }
    });
  }

  if (isReadOnly) {
    applyReadOnlyMode();
  }

  const carRaisedSelect = document.getElementById("purch-car-raised");
  if (carRaisedSelect) {
    carRaisedSelect.addEventListener("change", handleCarRaisedChange);
    handleCarRaisedChange();
  }

  const followupSelect = document.getElementById("purch-followup-required");
  if (followupSelect) {
    followupSelect.addEventListener("change", handleFollowUpRequiredChange);
    handleFollowUpRequiredChange();
  }

  const reinspectSelect = document.getElementById("reinspect-acceptable");
  if (reinspectSelect) {
    reinspectSelect.addEventListener("change", () => {
      handleReinspectAcceptableChange();
      updateDocumentSummary();
    });
    handleReinspectAcceptableChange();
  }

  const closeSelect = document.getElementById("close-ncr");
  if (closeSelect) {
    closeSelect.addEventListener("change", handleNcrClosedChange);
    handleNcrClosedChange();
  }

  ["inspected-by", "created-on", "purch-ops-manager-name", "eng-RevisionDate", "eng-origRevNum"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateDocumentSummary);
        el.addEventListener("change", updateDocumentSummary);
      }
    }
  );

  updateDocumentSummary();
});

// ---------------- READ-ONLY MODE ----------------
function applyReadOnlyMode() {
  const pageTitle = document.querySelector("h1");
  if (pageTitle) {
    pageTitle.textContent = "View Non-Conformance Report (Read-Only)";
  }

  if (!form) return;

  const allInputs = form.querySelectorAll("input, select, textarea");
  allInputs.forEach((input) => {
    // keep accordion toggles working
    if (input.classList.contains("fieldset-toggle") || input.name === "fieldset-toggle") {
      return;
    }

    if (input.type === "checkbox" || input.type === "radio") {
      input.disabled = true;
    } else {
      input.readOnly = true;
      input.disabled = true;
    }
  });

  const btnComplete = document.getElementById("btnComleted");
  const btnResetChanges =
    document.getElementById("btnResetChanges") || document.getElementById("btnReset");
  const demoAutofillBtn = document.getElementById("demo-autofill-btn");

  // Hide Mark-as-completed / Reset / Demo autofill in read-only
  if (btnComplete) btnComplete.style.display = "none";
  if (btnResetChanges) btnResetChanges.style.display = "none";
  if (demoAutofillBtn) demoAutofillBtn.style.display = "none";

  // Also hide the primary Update button and Cancel link in read-only view
  const updateBtn = form.querySelector('button[type="submit"]');
  if (updateBtn) {
    updateBtn.style.display = "none";
  }

  const cancelLink = form.querySelector(".form-actions a.btn.btn-outline");
  if (cancelLink) {
    cancelLink.style.display = "none";
  }

  // Add a simple “Back to Home” button underneath the form for navigation
  const buttonContainer = document.querySelector(".ncr-form");
  if (buttonContainer && !buttonContainer.querySelector(".readonly-back-button")) {
    const backButton = document.createElement("a");
    backButton.href = "index.html";
    backButton.className = "btn btn-secondary readonly-back-button";
    backButton.textContent = "Back to Home";
    backButton.style.marginTop = "2rem";
    buttonContainer.appendChild(backButton);
  }
}

// ---------------- RESET ----------------
function onResetClick(e) {
  if (e) e.preventDefault();

  const latestDetailsMap = loadJSON(DETAILS_KEY, {});
  const latestDetails = latestDetailsMap[ncrNumberParam] || baselineDetails;

  const latestList = loadJSON(STORAGE_KEY, []);
  const latestRow =
    latestList.find((r) => String(r.ncrNumber) === String(ncrNumberParam)) || baselineRow;

  fillFormFrom(latestDetails, latestRow);
  applyRoleVisibility(latestDetails);
}

// ---------------- COMPLETED NCR LOCK ----------------
function disableFormForCompletedNCR() {
  const formEl = document.getElementById("ncr-edit-form") || document.querySelector("form");
  if (!formEl) return;

  const formElements = formEl.querySelectorAll("input, select, textarea, button");
  formElements.forEach((element) => {
    if (element.type !== "radio") {
      element.disabled = true;
    }
  });

  if (!formEl.querySelector(".completion-status")) {
    const statusDiv = document.createElement("div");
    statusDiv.className = "completion-status alert alert-success";
    statusDiv.innerHTML = "✓ This NCR has been marked as completed and cannot be edited.";
    formEl.insertBefore(statusDiv, formEl.firstChild);
  }

  const h1 = document.querySelector("h1");
  if (h1) {
    h1.textContent = "View Non-Conformance Report (Completed)";
  }
}

// ---------------- SUBMIT & COMPLETE ----------------
function onUpdateSubmit(e, stayHere = false) {
  e.preventDefault();
  completingFromButton = false;
  performUpdate(false, stayHere);
}

function markAsCompleted() {
  completingFromButton = true;

  let isFinalCompletion = false;
  try {
    const detailsMap = loadJSON(DETAILS_KEY, {});
    const existing = detailsMap[ncrNumberParam] || {};

    // Final completion: Quality Inspector in final stage and all previous steps done
    if (
      isQualityRole() &&
      currentStage === "quality-final" &&
      existing.qualityCompleted &&
      existing.engineeringCompleted &&
      existing.purchasingCompleted &&
      !existing.isCompleted
    ) {
      isFinalCompletion = true;
    }
  } catch (err) {
    console.error("Could not determine if this is final completion:", err);
  }

  performUpdate(isFinalCompletion, false);
  completingFromButton = false;
}

// ---------------- VALIDATE + PREVIEW ----------------
function validateAndShowPreview() {
  const ncrNumber = (inpNcr?.value || "").trim();
  const dateCreated = inpCreated?.value || todayISO();
  const supplierVal = selSupplier?.value || "";
  const supplierText =
    selSupplier?.options[selSupplier.selectedIndex]?.text?.trim() || supplierVal;
  const productVal = selProduct?.value || "";
  const productText = getSelectText("product-id");
  const recvQtyStr = (inpRecvQty?.value || "").trim();
  const defectQtyStr = (inpDefectQty?.value || "").trim();
  const issueCatVal = selIssue?.value || "";
  const issueCategoryText = getSelectText("issue-cat-id");
  const defectDesc = (inpDefectDesc?.value || "").trim();
  const inspectedBy = (inpInspector?.value || "").trim();
  const inspectedOn = inpInspectedOn?.value || "";
  const poNumber = (inpPONum?.value || "").trim();
  const soNumber = (inpSONum?.value || "").trim();
  const processType = selProcessType?.value || "";
  const processTypeText = getSelectText("process-type-id");
  const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
  const processApplicable = getCheckboxValues("process-applicable");

  const engineering = readEngineeringFromForm();
  const purchasing = readPurchasingFromForm();
  const finalInspection = readFinalInspectionFromForm();

  clearAllValidation();

  const validationErrors = [];

  // Core Quality inspector validations
  if (poNumber === "") {
    validationErrors.push({
      id: "po-number",
      message: "Purchase Order number is required.",
    });
  }
  if (inspectedBy === "") {
    validationErrors.push({
      id: "inspected-by",
      message: "Inspector ID/Name is required.",
    });
  }
  if (defectDesc === "") {
    validationErrors.push({
      id: "defect-desc",
      message: "Defect description is required.",
    });
  }
  if (notChosen(supplierVal)) {
    validationErrors.push({
      id: "supplier-id",
      message: "Please choose a supplier.",
    });
  }
  if (notChosen(productVal)) {
    validationErrors.push({
      id: "product-id",
      message: "Please choose a product.",
    });
  }
  if (notChosen(issueCatVal)) {
    validationErrors.push({
      id: "issue-cat-id",
      message: "Please choose an issue category.",
    });
  }
  if (notChosen(processType)) {
    validationErrors.push({
      id: "process-type-id",
      message: "Please choose a process type.",
    });
  }

  const recvQty = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);
  if (!Number.isFinite(recvQty) || recvQty <= 0) {
    validationErrors.push({
      id: "recv-qty",
      message: "Enter a valid received quantity (number > 0).",
    });
  }
  if (!Number.isFinite(defectQty) || defectQty < 0) {
    validationErrors.push({
      id: "defect-qty",
      message: "Enter a valid defective quantity (number ≥ 0).",
    });
  } else if (defectQty > recvQty) {
    validationErrors.push({
      id: "defect-qty",
      message: "Defective quantity cannot be greater than received quantity.",
    });
  }
  if (!inspectedOn) {
    validationErrors.push({
      id: "inspected-on",
      message: "Please select the inspection date.",
    });
  } else {
    const picked = new Date(inspectedOn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked > today) {
      validationErrors.push({
        id: "inspected-on",
        message: "Inspection date cannot be in the future.",
      });
    }
  }

  // Role & stage specific validations for preview (only if user in those stages)
  if (currentStage === "engineering" && isEngineerRole()) {
    const hasDisposition =
      engineering.useAsIs ||
      engineering.repair ||
      engineering.rework ||
      engineering.scrap ||
      engineering.custNotifNCR;

    if (!hasDisposition) {
      validationErrors.push({
        id: "eng-useAsIs",
        message: "Please select at least one engineering disposition.",
      });
    }
    if (!engineering.disposition || engineering.disposition.trim() === "") {
      validationErrors.push({
        id: "eng-disposition",
        message: "Disposition notes are required.",
      });
    }
    if (!engineering.nameOfEng || engineering.nameOfEng.trim() === "") {
      validationErrors.push({
        id: "eng-nameOfEng",
        message: "Engineer name is required.",
      });
    }
    if (!engineering.origRevNum || engineering.origRevNum === 0) {
      validationErrors.push({
        id: "eng-origRevNum",
        message: "Original Rev # is required.",
      });
    }
    if (!engineering.UpdatedRev || engineering.UpdatedRev.trim() === "") {
      validationErrors.push({
        id: "eng-UpdatedRev",
        message: "Updated Rev Date/Time is required.",
      });
    }
    if (!engineering.RevisionDate || engineering.RevisionDate.trim() === "") {
      validationErrors.push({
        id: "eng-RevisionDate",
        message: "Revision Date is required.",
      });
    }
    if (!engineering.submittedDate || engineering.submittedDate.trim() === "") {
      validationErrors.push({
        id: "eng-submittedDate",
        message: "Submitted Date is required.",
      });
    }
  } else if (currentStage === "purchasing" && isPurchasingRole()) {
    if (!purchasing.carRaised) {
      validationErrors.push({
        id: "purch-car-raised",
        message: "Please indicate if a CAR was raised.",
      });
    }
    if (purchasing.carRaised === "yes" && !purchasing.carNumber) {
      validationErrors.push({
        id: "purch-car-number",
        message: "Please enter the CAR number.",
      });
    }
    if (!purchasing.followUpRequired) {
      validationErrors.push({
        id: "purch-followup-required",
        message: "Please indicate if follow-up is required.",
      });
    }
    if (purchasing.followUpRequired === "yes") {
      if (!purchasing.followUpType) {
        validationErrors.push({
          id: "purch-followup-type",
          message: "Please enter the follow-up type.",
        });
      }
      if (!purchasing.followUpDate) {
        validationErrors.push({
          id: "purch-followup-date",
          message: "Please enter the expected follow-up date.",
        });
      }
    }
    if (!purchasing.opsManagerName) {
      validationErrors.push({
        id: "purch-ops-manager-name",
        message: "Operations Manager name is required.",
      });
    }
    if (!purchasing.opsManagerDate) {
      validationErrors.push({
        id: "purch-ops-manager-date",
        message: "Operations Manager approval date is required.",
      });
    }
  } else if (currentStage === "quality-final" && isQualityRole()) {
    // FINAL STAGE STRICT VALIDATION
    if (!finalInspection.reinspectedAcceptable) {
      validationErrors.push({
        id: "reinspect-acceptable",
        message: "Please indicate if the product is acceptable after re-inspection.",
      });
    }
    if (
      finalInspection.reinspectedAcceptable === "no" &&
      !finalInspection.newNcrNumber
    ) {
      validationErrors.push({
        id: "reinspect-new-ncr-number",
        message: "A new NCR # must be generated if re-inspection is not acceptable.",
      });
    }
    if (!finalInspection.inspectorName) {
      validationErrors.push({
        id: "reinspect-inspector-name",
        message: "Re-Inspecting inspector name is required.",
      });
    }
    if (!finalInspection.inspectorDate) {
      validationErrors.push({
        id: "reinspect-date",
        message: "Re-Inspection date is required.",
      });
    }
    if (!finalInspection.ncrClosed) {
      validationErrors.push({
        id: "close-ncr",
        message: "Please indicate if the NCR is being closed.",
      });
    }
    if (finalInspection.ncrClosed === "yes") {
      if (!finalInspection.qualityDeptName) {
        validationErrors.push({
          id: "close-quality-name",
          message: "Quality department representative name is required when closing the NCR.",
        });
      }
      if (!finalInspection.closeDate) {
        validationErrors.push({
          id: "close-quality-date",
          message: "Closure date is required when closing the NCR.",
        });
      }
    }
  }

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
    engineering,
    purchasing,
    finalInspection,
  };

  showPreviewModal(formData);
}

// ---------------- MAIN SAVE/UPDATE ----------------
function performUpdate(isCompleted = false, stayHere = false) {
  const ncrNumber = (inpNcr?.value || "").trim();
  if (!ncrNumber) {
    alert("NCR number is missing.");
    return;
  }

  const detailsMap = loadJSON(DETAILS_KEY, {});
  const existing = detailsMap[ncrNumber] || {};

  const list = loadJSON(STORAGE_KEY, []);
  const idx = list.findIndex((r) => String(r.ncrNumber) === String(ncrNumber));
  const row = idx >= 0 ? list[idx] : null;

  const inputCreated = (inpCreated?.value || "").trim();

  const dateCreated =
    existing.dateCreated ||
    (row && row.dateCreated) ||
    inputCreated ||
    urlCreated ||
    todayISO();

  const supplierVal = selSupplier?.value || "";
  const supplierText =
    selSupplier?.options[selSupplier.selectedIndex]?.text?.trim() || supplierVal;

  const productVal = selProduct?.value || "";
  const recvQtyStr = (inpRecvQty?.value || "").trim();
  const defectQtyStr = (inpDefectQty?.value || "").trim();
  const issueCatVal = selIssue?.value || "";
  const defectDesc = (inpDefectDesc?.value || "").trim();
  const inspectedBy = (inpInspector?.value || "").trim();
  const inspectedOn = inpInspectedOn?.value || "";
  const statusVal = selStatus?.value || "Open";
  const poNumber = (inpPONum?.value || "").trim();
  const soNumber = (inpSONum?.value || "").trim();
  const processType = selProcessType?.value || "";

  const itemNonconforming = getSingleCheckboxValue("item-nonconforming");
  const processApplicable = getCheckboxValues("process-applicable");

  clearAllValidation();

  if (isCompleted && currentStage === "quality-final" && isQualityRole()) {
    // re-check quality fields when fully completing
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

    const recvQtyChecked = Number(recvQtyStr);
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
      showValidationError(
        "defect-qty",
        "Defective quantity cannot be greater than received quantity."
      );
      return;
    }

    if (!inspectedOn) {
      showValidationError("inspected-on", "Please select the inspection date.");
      return;
    }
    const picked = new Date(inspectedOn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked > today) {
      showValidationError("inspected-on", "Inspection date cannot be in the future.");
      return;
    }
  }

  const recvQty = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);
  const lastModified = todayISO();

  const engineering = readEngineeringFromForm();
  const anyEngChoice =
    engineering.useAsIs ||
    engineering.repair ||
    engineering.rework ||
    engineering.scrap ||
    engineering.custNotifNCR ||
    engineering.drawingReqUpd;

  if (isCompleted && currentStage === "engineering" && isEngineerRole()) {
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
  } else if (anyEngChoice && isEngineerRole()) {
    if (!engineering.nameOfEng) {
      showValidationError(
        "eng-nameOfEng",
        "Engineer name is required when a disposition is selected."
      );
      return;
    }
    if (!engineering.disposition) {
      showValidationError("eng-disposition", "Please provide disposition notes.");
      return;
    }
  }

  const purchasing = readPurchasingFromForm();
  const finalInspection = readFinalInspectionFromForm();

  const finalIsCompleted = existing.isCompleted === true || isCompleted === true;

  const updatedDetails = {
    ...existing,
    ncrNumber,
    dateCreated,
    lastModified,
    purchaseOrder: poNumber,
    salesOrder: soNumber,
    supplierValue: supplierVal,
    supplierName: supplierText,
    processTypeValue: processType,
    productValue: productVal,
    recvQty,
    defectQty,
    issueCategoryValue: issueCatVal,
    defectDescription: defectDesc,
    inspectedBy,
    inspectedOn,
    status: statusVal,
    isCompleted: finalIsCompleted,
    itemNonconforming,
    processApplicable,
    engineering,
    purchasing,
    finalInspection,
  };

  // Update stage flags based on role when "Mark as completed" is used
  if (completingFromButton) {
    if (!finalIsCompleted) {
      if (isQualityRole() && !existing.qualityCompleted && currentStage === "quality-initial") {
        updatedDetails.qualityCompleted = true;
      } else if (isEngineerRole()) {
        updatedDetails.engineeringCompleted = true;
      } else if (isPurchasingRole()) {
        updatedDetails.purchasingCompleted = true;
      }
    }
    // Final Quality close-out
    if (isCompleted && isQualityRole()) {
      updatedDetails.finalQualityCompleted = true;
    }
  }

  detailsMap[ncrNumber] = updatedDetails;
  saveJSON(DETAILS_KEY, detailsMap);

  const updatedRow = {
    ...(row || {
      id: row?.id || Date.now(),
      ncrNumber,
    }),
    dateCreated,
    lastModified,
    supplier: supplierText,
    status: statusVal,
    isCompleted: finalIsCompleted,
  };

  if (idx >= 0) {
    list[idx] = updatedRow;
  } else {
    list.push(updatedRow);
  }
  saveJSON(STORAGE_KEY, list);

  baselineDetails = deepClone(updatedDetails);
  baselineRow = deepClone(updatedRow);

  if (finalIsCompleted) {
    alert("NCR has been marked as completed. This form can no longer be edited.");
  } else if (completingFromButton && isQualityRole() && !existing.qualityCompleted) {
    alert("Quality Inspector section has been completed. Engineering can now work on this NCR.");
  } else if (completingFromButton && isEngineerRole()) {
    alert("Engineering section has been completed. Purchasing / Operations can now work on this NCR.");
  } else if (completingFromButton && isPurchasingRole()) {
    alert(
      "Purchasing / Operations section has been completed. Quality can now perform final re-inspection and closure."
    );
  } else {
    alert("NCR updated.");
  }

  if (!stayHere) {
    window.location.href = "index.html";
  }
}
