// ========================
// Seed data (fallback only)
// ========================
let ncrData = (window.ncrData && Array.isArray(window.ncrData)) ? window.ncrData : [
  { id: 1, ncrNumber: "2025-611", dateCreated: "2025-10-01", lastModified: "2025-10-05", supplier: "BlueHaven Distributors" },
  { id: 2, ncrNumber: "2025-325", dateCreated: "2025-10-02", lastModified: "2025-10-06", supplier: "Apex Global Trading" },
  { id: 3, ncrNumber: "2025-242", dateCreated: "2025-10-01", lastModified: "2025-10-11", supplier: "SilverOak Importers" }
];

let ncrArchivedData = (window.ncrArchivedData && Array.isArray(window.ncrArchivedData)) ? window.ncrArchivedData : [
  { id: 6, ncrNumber: "2025-623", dateCreated: "2025-10-05", lastModified: "2025-10-13", supplier: "SilverOak Importers" },
  { id: 7, ncrNumber: "2025-845", dateCreated: "2025-10-02", lastModified: "2025-10-07", supplier: "BlueHaven Distributors" }
];

let ncrFilteredData = ncrData.slice();

// ========================
// LocalStorage helpers
// ========================
function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

// Details map: { [ncrNumber]: detailsObject }
function getDetailsMap() {
  return loadJSON("ncrDetails", {});
}

// ========================
// New + edited rows
// ========================
function mergeIncomingRecords() {
  const incoming = loadJSON("ncrNewRecords", []);
  if (!Array.isArray(incoming) || incoming.length === 0) return;

  const detailsMap = getDetailsMap();
  const seen = new Set(ncrData.map(r => r.ncrNumber));
  let maxId = ncrData.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);

  incoming.forEach(r => {
    if (seen.has(r.ncrNumber)) return;

    if (typeof r.id !== "number" || !Number.isFinite(r.id)) {
      maxId += 1;
      r.id = maxId;
    }

    const d = detailsMap[r.ncrNumber] || {};
    if (!r.dateCreated) {
      r.dateCreated = d.dateCreated || d.lastModified || "";
    }
    if (!r.lastModified) {
      r.lastModified = d.lastModified || d.dateCreated || r.dateCreated || "";
    }
    if (!r.supplier && d.supplierName) {
      r.supplier = d.supplierName;
    }

    ncrData.push(r);
    seen.add(r.ncrNumber);
  });

  // optional: clear temp storage
  // localStorage.removeItem("ncrNewRecords");
}

function applyEdits() {
  const edits = loadJSON("ncrEdits", []);
  if (!Array.isArray(edits) || edits.length === 0) return;

  const byNum = new Map(ncrData.map(r => [r.ncrNumber, r]));
  edits.forEach(e => {
    const row = byNum.get(e.ncrNumber);
    if (row) Object.assign(row, e);
  });

  // optional: clear temp storage
  // localStorage.removeItem("ncrEdits");
}

// ========================
// WORKFLOW LOGIC
// ========================

/**
 * Figure out which stage is NEXT / active based on flags.
 *
 * Expected flags on details:
 *   details.qualityCompleted          (first quality section done)
 *   details.engineeringCompleted      (engineering done)
 *   details.purchasingCompleted       (purchasing/operations done)
 *   details.finalQualityCompleted     (final quality close-out done)
 *   details.isCompleted               (final closed flag)
 *
 * Returns:
 *   { stage: 'quality-initial' | 'engineering' | 'purchasing' | 'quality-final' | 'completed',
 *     label: '...' }
 */
function getWorkflowInfo(details) {
  if (!details) {
    // Brand new NCR – quality starts it
    return {
      stage: "quality-initial",
      label: "Quality Inspector"
    };
  }

  const qualityInitialDone =
    !!details.qualityInitialCompleted || !!details.qualityCompleted; // support both names

  const engineeringDone   = !!details.engineeringCompleted;
  const purchasingDone    = !!details.purchasingCompleted;
  const finalQualityDone  = !!details.finalQualityCompleted;
  const fullyCompleted    = !!details.isCompleted;

  // FINAL COMPLETED
  if (fullyCompleted || (qualityInitialDone && engineeringDone && purchasingDone && finalQualityDone)) {
    return {
      stage: "completed",
      label: "Completed"
    };
  }

  // 1. First quality still needs to do their part
  if (!qualityInitialDone) {
    return {
      stage: "quality-initial",
      label: "Quality Inspector"
    };
  }

  // 2. Engineering is next
  if (!engineeringDone) {
    return {
      stage: "engineering",
      label: "Engineering"
    };
  }

  // 3. Purchasing / Operations is next
  if (!purchasingDone) {
    return {
      stage: "purchasing",
      label: "Purchasing / Operations"
    };
  }

  // 4. Final quality close-out is last before Completed
  return {
    stage: "quality-final",
    label: "Quality Inspector (Close-out)"
  };
}

// ========================
// Credentials & permissions
// ========================
function getUserCredentials() {
  try {
    const data = localStorage.getItem("userCredentials");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Who can edit which stage
function canUserEdit(workflowStage) {
  const credentials = getUserCredentials();
  if (!credentials || !credentials.type || credentials.type === "loggedOut") {
    return false;
  }

  const userType = credentials.type;

  // Quality initial + final close-out
  if (
    (workflowStage === "quality-initial" || workflowStage === "quality-final") &&
    userType === "Quality Inspector"
  ) {
    return true;
  }

  // Engineering
  if (workflowStage === "engineering" && userType === "Engineer") {
    return true;
  }

  // Purchasing / Operations – treat any role that contains "purchasing" as valid
  if (workflowStage === "purchasing") {
    const normalized = String(userType).toLowerCase();
    if (
      normalized.includes("purchasing")
    ) {
      return true;
    }
  }

  return false;
}

// ========================
// TABLE RENDER
// ========================
function renderNCRTable(page = 1) {
  const tableBody = document.querySelector(".ncr-table tbody");
  if (!tableBody) return;

  const perSel = document.getElementById("search-amount");
  const per = parseInt(perSel?.value || "5", 10);
  const itemsPerPage = Number.isFinite(per) && per > 0 ? per : 5;

  const detailsMap = getDetailsMap();

  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageData = ncrFilteredData.slice(startIdx, endIdx);

  tableBody.innerHTML = "";

  pageData.forEach(ncr => {
    const d = detailsMap[ncr.ncrNumber];
    const dateCreated  = d?.dateCreated  || ncr.dateCreated || "";
    const lastModified = d?.lastModified || ncr.lastModified || "";
    const supplier     = d?.supplierName || ncr.supplier || "";

    const workflowInfo = getWorkflowInfo(d);
    const completedFlag = d?.isCompleted || ncr.isCompleted || false;
    const isCompleted = completedFlag || workflowInfo.stage === "completed";

    const row = document.createElement("tr");
    row.dataset.ncrId = ncr.id;

    if (isCompleted) {
      row.classList.add("ncr-completed");
    }

    // --------- Actions column ----------
    let actionsHtml = "";
    const isArchived =
      (ncr.archived === true) ||
      ncrArchivedData.some(a => a.id === ncr.id);

    const userCredentials = getUserCredentials();
    const isUserLoggedIn =
      userCredentials && userCredentials.type && userCredentials.type !== "loggedOut";

    if (isUserLoggedIn) {
      const userCanEdit = canUserEdit(workflowInfo.stage);

      if (!isCompleted && !isArchived) {
        if (userCanEdit) {
          // Current stage owner gets Edit
          actionsHtml = `
          <button type="button" class="btn btn-secondary"
            aria-label="Edit ${ncr.ncrNumber}"
            onclick="openEdit('${ncr.ncrNumber}', '${dateCreated}', '${(supplier || "").toString().replace(/'/g, "\\'")}')">
            Edit
          </button>
        `;
        } else {
          // Other roles get View (read-only)
          actionsHtml = `
          <button type="button" class="btn btn-outline"
            aria-label="View ${ncr.ncrNumber}"
            onclick="openView('${ncr.ncrNumber}', '${dateCreated}', '${(supplier || "").toString().replace(/'/g, "\\'")}')">
            View
          </button>
        `;
        }

        // Archive is allowed for any logged-in user while active
        actionsHtml += `
          <button type="button" class="btn btn-outline"
            aria-label="Archive ${ncr.ncrNumber}"
            onclick="showArchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">
            Archive
          </button>
        `;
      }

      if (isArchived) {
        actionsHtml += `
        <button type="button" class="btn btn-secondary"
          aria-label="Un-archive ${ncr.ncrNumber}"
          onclick="showUnarchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">
          Un-archive
        </button>
      `;
      }

      if (isCompleted) {
        // Logged-in users still only get PDF on completed rows
        actionsHtml += `
        <button type="button" class="btn btn-outline"
          aria-label="Download ${ncr.ncrNumber} as PDF"
          onclick="downloadPDF('${ncr.ncrNumber}')">
          PDF
        </button>
      `;
      }
    } else {
      // Not logged in:
      // - In-progress NCRs → no actions
      // - Completed NCRs → PDF only
      if (isCompleted) {
        actionsHtml = `
        <button type="button" class="btn btn-outline"
          aria-label="Download ${ncr.ncrNumber} as PDF"
          onclick="downloadPDF('${ncr.ncrNumber}')">
          PDF
        </button>
      `;
      } else {
        actionsHtml = '<span class="no-actions">—</span>';
      }
    }

    row.innerHTML = `
      <td data-label="NCR Number">
        ${ncr.ncrNumber}
        ${isCompleted ? '<span class="completion-badge">COMPLETED</span>' : ""}
      </td>
      <td data-label="Date Created">${dateCreated}</td>
      <td data-label="Last Modified">${lastModified}</td>
      <td data-label="Supplier">${supplier}</td>
      <td data-label="Workflow Stage">${workflowInfo.label}</td>
      <td data-label="Actions">${actionsHtml}</td>
    `;
    tableBody.appendChild(row);
  });

  if (typeof renderPaginationControls === "function") {
    renderPaginationControls(ncrFilteredData.length, itemsPerPage, page);
  }
  if (typeof updatePaginationInfo === "function") {
    updatePaginationInfo(page, ncrFilteredData);
  }
  if (typeof setupPaginationControls === "function") {
    setupPaginationControls();
  }
}

// ========================
// Archive / Unarchive
// ========================
function showArchiveConfirmation(ncrId, ncrNumber) {
  const modal = document.getElementById("archive-modal");
  const ncrNumberSpan = document.getElementById("archive-ncr-number");
  const confirmButton = document.getElementById("confirm-archive");
  if (ncrNumberSpan) ncrNumberSpan.textContent = ncrNumber;
  if (confirmButton) confirmButton.onclick = () => archiveNCR(ncrId);
  if (modal) {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
  }
  const cancelBtn = document.getElementById("cancel-archive");
  if (cancelBtn) cancelBtn.focus();
}

function closeArchiveModal() {
  const modal = document.getElementById("archive-modal");
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
}

function archiveNCR(ncrId) {
  const idx = ncrData.findIndex(r => r.id === ncrId);
  if (idx >= 0) {
    const rec = ncrData.splice(idx, 1)[0];
    ncrArchivedData.push(rec);
  }
  closeArchiveModal();
  filterNCRData(1);
}

function unarchiveNCR(ncrId) {
  const idx = ncrArchivedData.findIndex(r => r.id === ncrId);
  if (idx >= 0) {
    const rec = ncrArchivedData.splice(idx, 1)[0];
    ncrData.push(rec);
  }
  closeUnarchiveModal();

  let currentPage = 1;
  if (typeof getCurrentPage === "function") {
    try {
      currentPage = getCurrentPage();
    } catch {
      currentPage = 1;
    }
  }
  filterNCRData(currentPage);
}

function showUnarchiveConfirmation(ncrId, ncrNumber) {
  const modal = document.getElementById("unarchive-modal");
  const span = document.getElementById("unarchive-ncr-number");
  const confirmButton = document.getElementById("confirm-unarchive");
  if (span) span.textContent = ncrNumber;
  if (confirmButton) confirmButton.onclick = () => unarchiveNCR(ncrId);
  if (modal) {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
  }
  const cancelBtn = document.getElementById("cancel-unarchive");
  if (cancelBtn) cancelBtn.focus();
}

function closeUnarchiveModal() {
  const modal = document.getElementById("unarchive-modal");
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
}

// ========================
// PDF helpers
// ========================
function getSupplierText(value) {
  const suppliers = {
    "1": "ABC Supplier",
    "2": "XYZ Corp"
  };
  return suppliers[value] || value || "N/A";
}

function getProcessTypeText(value) {
  const processTypes = {
    "1": "Inspection",
    "2": "Packaging"
  };
  return processTypes[value] || value || "N/A";
}

function getProductText(value) {
  const products = {
    "1": "Product A",
    "2": "Product B"
  };
  return products[value] || value || "N/A";
}

function getIssueCategoryText(value) {
  const categories = {
    "1": "Quality Issue",
    "2": "Packaging Issue",
    "3": "Documentation Issue"
  };
  return categories[value] || value || "N/A";
}

function formatProcessApplicable(values) {
  if (!values || !Array.isArray(values) || values.length === 0) return "N/A";

  const labels = {
    "supplier-rec-insp": "Supplier or Rec-Insp",
    "wip-production": "WIP Production"
  };

  return values.map(v => labels[v] || v).join(", ");
}

function formatEngineeringActions(eng) {
  if (!eng) return "None selected";

  const actions = [];
  if (eng.useAsIs)       actions.push("Use As-Is");
  if (eng.repair)        actions.push("Repair");
  if (eng.rework)        actions.push("Rework");
  if (eng.scrap)         actions.push("Scrap");
  if (eng.custNotifNCR)  actions.push("Customer Notification / NCR");
  if (eng.drawingReqUpd) actions.push("Drawing / Spec Requires Update");

  return actions.length ? actions.join(", ") : "None selected";
}

// ===== New richer PDF HTML builder (Quality + Engineering + Purchasing + Final) =====
function pdfSafe(v, fallback = "Not provided") {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v);
}

function pdfYesNo(v) {
  if (v === "yes" || v === true) return "Yes";
  if (v === "no" || v === false) return "No";
  if (v === undefined || v === null || v === "") return "Not specified";
  return String(v);
}

function pdfDate(v) {
  return v ? String(v) : "Not provided";
}

function buildPdfPreviewHtml(details, summaryRow) {
  if (!details) {
    return "<p>No detailed data was found for this NCR.</p>";
  }

  const headerHtml = `
    <section class="pdf-section">
      <h3 class="pdf-section-title">Quality Inspector – Header &amp; Line Items</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">NCR Number</div>
          <div class="pdf-field-value">${pdfSafe(details.ncrNumber)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Date Created</div>
          <div class="pdf-field-value">${pdfDate(details.dateCreated)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Last Modified</div>
          <div class="pdf-field-value">${pdfDate(details.lastModified)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Status</div>
          <div class="pdf-field-value">${pdfSafe(details.status || "Open")}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Purchase Order #</div>
          <div class="pdf-field-value ${!details.purchaseOrder ? "empty" : ""}">
            ${pdfSafe(details.purchaseOrder)}
          </div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Sales Order #</div>
          <div class="pdf-field-value ${!details.salesOrder ? "empty" : ""}">
            ${pdfSafe(details.salesOrder)}
          </div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Item Marked Nonconforming</div>
          <div class="pdf-field-value">
            ${pdfYesNo(details.itemNonconforming)}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Supplier</div>
          <div class="pdf-field-value">
            ${pdfSafe(details.supplierName || (summaryRow && summaryRow.supplier) || getSupplierText(details.supplierValue))}
          </div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Process Type</div>
          <div class="pdf-field-value">
            ${getProcessTypeText(details.processTypeValue)}
          </div>
        </div>
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Process Applicable</div>
          <div class="pdf-field-value">
            ${formatProcessApplicable(details.processApplicable)}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Product</div>
          <div class="pdf-field-value">
            ${getProductText(details.productValue)}
          </div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Received Quantity</div>
          <div class="pdf-field-value">${details.recvQty ?? "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Defective Quantity</div>
          <div class="pdf-field-value">${details.defectQty ?? "N/A"}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Issue Category</div>
          <div class="pdf-field-value">
            ${getIssueCategoryText(details.issueCategoryValue)}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Inspected By</div>
          <div class="pdf-field-value">${pdfSafe(details.inspectedBy, "N/A")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Inspection Date</div>
          <div class="pdf-field-value">${pdfDate(details.inspectedOn)}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Defect Description</div>
          <div class="pdf-field-value multiline ${!details.defectDescription ? "empty" : ""}">
            ${pdfSafe(details.defectDescription, "No description provided")}
          </div>
        </div>
      </div>
    </section>
  `;

  const eng = details.engineering || {};
  const engActions = [];
  if (eng.useAsIs) engActions.push("Use As-Is");
  if (eng.repair) engActions.push("Repair");
  if (eng.rework) engActions.push("Rework");
  if (eng.scrap) engActions.push("Scrap");
  if (eng.custNotifNCR) engActions.push("Customer Notification / NCR");
  if (eng.drawingReqUpd) engActions.push("Drawing / Spec Requires Update");

  const engineeringHtml = `
    <section class="pdf-section">
      <h3 class="pdf-section-title">Engineering Disposition &amp; Actions</h3>

      <div class="pdf-field-group">
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Disposition Choices</div>
          <div class="pdf-field-value ${engActions.length === 0 ? "empty" : ""}">
            ${engActions.length ? engActions.join(", ") : "No disposition selected"}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Disposition Notes</div>
          <div class="pdf-field-value multiline ${!eng.disposition ? "empty" : ""}">
            ${pdfSafe(eng.disposition, "No notes provided")}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Engineer Name</div>
          <div class="pdf-field-value">${pdfSafe(eng.nameOfEng, "Not provided")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Original Rev #</div>
          <div class="pdf-field-value">${pdfSafe(eng.origRevNum, "Not provided")}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Updated Revision (Date/Time)</div>
          <div class="pdf-field-value">${pdfDate(eng.UpdatedRev)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Revision Date</div>
          <div class="pdf-field-value">${pdfDate(eng.RevisionDate)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Submitted Date</div>
          <div class="pdf-field-value">${pdfDate(eng.submittedDate)}</div>
        </div>
      </div>
    </section>
  `;

  const purch = details.purchasing || {};
  const purchDecisions = [];
  if (purch.reworkInHouse) purchDecisions.push("Rework In-House");
  if (purch.scrapInHouse) purchDecisions.push("Scrap In-House");
  if (purch.deferForHbcReview) purchDecisions.push("Defer for HBC Engineering Review");

  const purchasingHtml = `
    <section class="pdf-section">
      <h3 class="pdf-section-title">Purchasing / Operations</h3>

      <div class="pdf-field-group">
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Preliminary Decisions</div>
          <div class="pdf-field-value ${purchDecisions.length === 0 ? "empty" : ""}">
            ${purchDecisions.length ? purchDecisions.join(", ") : "No decisions selected"}
          </div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">CAR Raised?</div>
          <div class="pdf-field-value">${pdfYesNo(purch.carRaised)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">CAR #</div>
          <div class="pdf-field-value">${pdfSafe(purch.carNumber, "Not provided")}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Follow-Up Required?</div>
          <div class="pdf-field-value">${pdfYesNo(purch.followUpRequired)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Follow-Up Type</div>
          <div class="pdf-field-value">${pdfSafe(purch.followUpType, "Not provided")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Expected Follow-Up Date</div>
          <div class="pdf-field-value">${pdfDate(purch.followUpDate)}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Operations Manager</div>
          <div class="pdf-field-value">${pdfSafe(purch.opsManagerName, "Not provided")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Operations Approval Date</div>
          <div class="pdf-field-value">${pdfDate(purch.opsManagerDate)}</div>
        </div>
      </div>
    </section>
  `;

  const fin = details.finalInspection || {};
  const finalHtml = `
    <section class="pdf-section">
      <h3 class="pdf-section-title">Final Quality Re-Inspection &amp; Closure</h3>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Re-Inspected Acceptable?</div>
          <div class="pdf-field-value">${pdfYesNo(fin.reinspectedAcceptable)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">New NCR # (if not acceptable)</div>
          <div class="pdf-field-value">${pdfSafe(fin.newNcrNumber, "Not generated")}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Re-Inspecting Inspector</div>
          <div class="pdf-field-value">${pdfSafe(fin.inspectorName, "Not provided")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Re-Inspection Date</div>
          <div class="pdf-field-value">${pdfDate(fin.inspectorDate)}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">NCR Closed?</div>
          <div class="pdf-field-value">${pdfYesNo(fin.ncrClosed)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Quality Dept. Representative</div>
          <div class="pdf-field-value">${pdfSafe(fin.qualityDeptName, "Not provided")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Closure Date</div>
          <div class="pdf-field-value">${pdfDate(fin.closeDate)}</div>
        </div>
      </div>
    </section>
  `;

  const summaryHtml = `
    <section class="pdf-section pdf-summary">
      <h3 class="pdf-section-title">Document Summary</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Document Author (Initial Inspector)</div>
          <div class="pdf-field-value">${pdfSafe(details.inspectedBy, "Not specified")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Date Created</div>
          <div class="pdf-field-value">${pdfDate(details.dateCreated)}</div>
        </div>
      </div>

      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Approved By (Operations Manager)</div>
          <div class="pdf-field-value">${pdfSafe((details.purchasing || {}).opsManagerName, "Not specified")}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Engineering Revision Date</div>
          <div class="pdf-field-value">${pdfDate((details.engineering || {}).RevisionDate)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Original Rev #</div>
          <div class="pdf-field-value">${pdfSafe((details.engineering || {}).origRevNum, "Not specified")}</div>
        </div>
      </div>
    </section>
  `;

  return `
    <div class="pdf-document">
      ${headerHtml}
      ${engineeringHtml}
      ${purchasingHtml}
      ${finalHtml}
      ${summaryHtml}
    </div>
  `;
}

// ========================
// PDF view modal
// ========================
function downloadPDF(ncrNumber) {
  const detailsMap = getDetailsMap();
  const details = detailsMap[ncrNumber];

  if (!details) {
    alert("NCR details not found.");
    return;
  }

  const overlay = document.getElementById("pdf-view-overlay");
  const content = document.getElementById("pdf-view-content");
  if (!overlay || !content) return;

  const allRows = [...ncrData, ...ncrArchivedData];
  const summaryRow = allRows.find(r => r.ncrNumber === ncrNumber) || null;

  content.innerHTML = buildPdfPreviewHtml(details, summaryRow);
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
}

function closePDFView() {
  const overlay = document.getElementById("pdf-view-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }
}

// ========================
// Filters
// ========================
function getSupplierFilterText() {
  const el =
    document.querySelector("#ncr-search") ||
    document.querySelector('select[name="ncr-search"]') ||
    document.querySelector("#search-supplier") ||
    document.querySelector('input[name="search-supplier"]') ||
    document.querySelector('input[data-filter="supplier"]') ||
    document.querySelector('input[placeholder*="supplier" i]');

  return (el?.value || "").trim().toLowerCase();
}

function getWorkflowFilterValue() {
  const sel = document.getElementById("workflow-filter");
  return (sel && sel.value) || "";
}

function getActiveDataset() {
  const status = document.querySelector('input[name="ncr-active"]:checked')?.value;
  if (status === "archived") {
    return ncrArchivedData.map(r => Object.assign({}, r, { archived: true }));
  }
  if (status === "all") {
    return ncrData.map(r => Object.assign({}, r, { archived: false }))
      .concat(ncrArchivedData.map(r => Object.assign({}, r, { archived: true })));
  }
  return ncrData.map(r => Object.assign({}, r, { archived: false }));
}

function filterNCRData(page = 1) {
  const supplierTerm = getSupplierFilterText();
  const workflowFilter = getWorkflowFilterValue(); // "", "completed", "quality", "engineering", "purchasing"
  const activeSet = getActiveDataset();
  const detailsMap = getDetailsMap();

  ncrFilteredData = activeSet.filter(r => {
    const details = detailsMap[r.ncrNumber];
    const wfInfo = getWorkflowInfo(details);

    const baseName = (r.supplier || "").toLowerCase();
    const detailsName = (details?.supplierName || "").toLowerCase();
    const matchesSupplier =
      !supplierTerm ||
      baseName === supplierTerm ||
      detailsName === supplierTerm;

    if (!matchesSupplier) return false;

    if (!workflowFilter) return true; // all stages

    if (workflowFilter === "quality") {
      // both quality stages
      return wfInfo.stage === "quality-initial" || wfInfo.stage === "quality-final";
    }

    // engineering, purchasing, completed, etc.
    return wfInfo.stage === workflowFilter;
  });

  // Sort newest first
  const getDatesFor = (record) => {
    const d = detailsMap[record.ncrNumber] || {};
    const dateCreated = d.dateCreated || record.dateCreated || "";
    const lastModified = d.lastModified || record.lastModified || dateCreated;
    return { dateCreated, lastModified };
  };

  ncrFilteredData.sort((a, b) => {
    const da = getDatesFor(a);
    const db = getDatesFor(b);

    const tCreatedA = da.dateCreated ? Date.parse(da.dateCreated) : 0;
    const tCreatedB = db.dateCreated ? Date.parse(db.dateCreated) : 0;

    if (tCreatedB !== tCreatedA) return tCreatedB - tCreatedA;

    const tModA = da.lastModified ? Date.parse(da.lastModified) : 0;
    const tModB = db.lastModified ? Date.parse(db.lastModified) : 0;

    if (tModB !== tModA) return tModB - tModA;

    const idA = typeof a.id === "number" ? a.id : 0;
    const idB = typeof b.id === "number" ? b.id : 0;
    return idB - idA;
  });

  renderNCRTable(page);
}

// ========================
// Dropdown + events
// ========================
function populateSupplierDropdown() {
  const dropdown = document.querySelector("#ncr-search");
  if (!dropdown) return;

  const allData = [...ncrData, ...ncrArchivedData];
  const detailsMap = getDetailsMap();
  const suppliersSet = new Set();

  allData.forEach(r => {
    const baseName = (r.supplier || "").trim();
    const detailsName = (detailsMap[r.ncrNumber]?.supplierName || "").trim();
    if (baseName) suppliersSet.add(baseName);
    if (detailsName && detailsName !== baseName) suppliersSet.add(detailsName);
  });

  const suppliers = Array.from(suppliersSet).sort();
  dropdown.innerHTML = '<option value="">All Suppliers</option>';
  suppliers.forEach(supplier => {
    const option = document.createElement("option");
    option.value = supplier.toLowerCase();
    option.textContent = supplier;
    dropdown.appendChild(option);
  });
}

function setupFilterEventListener() {
  const searchEl = document.querySelector("#ncr-search");
  if (searchEl) {
    searchEl.addEventListener("change", () => filterNCRData(1));
  }

  const workflowSel = document.getElementById("workflow-filter");
  if (workflowSel) {
    workflowSel.addEventListener("change", () => filterNCRData(1));
  }

  document.querySelectorAll('input[name="ncr-active"]').forEach(r => {
    r.addEventListener("change", () => filterNCRData(1));
  });

  const amountSel = document.getElementById("search-amount");
  if (amountSel) {
    amountSel.addEventListener("change", () => filterNCRData(1));
  }
}

function setupModalEventListeners() {
  const cancelArchive = document.getElementById("cancel-archive");
  if (cancelArchive) cancelArchive.addEventListener("click", closeArchiveModal);

  const cancelUnarchive = document.getElementById("cancel-unarchive");
  if (cancelUnarchive) cancelUnarchive.addEventListener("click", closeUnarchiveModal);

  const closePDFButton = document.getElementById("close-pdf-view");
  if (closePDFButton) closePDFButton.addEventListener("click", closePDFView);

  window.addEventListener("click", (e) => {
    const archiveModal = document.getElementById("archive-modal");
    const unarchiveModal = document.getElementById("unarchive-modal");
    const pdfViewOverlay = document.getElementById("pdf-view-overlay");
    if (e.target === archiveModal) closeArchiveModal();
    if (e.target === unarchiveModal) closeUnarchiveModal();
    if (e.target === pdfViewOverlay) closePDFView();
  });
}

// ========================
// Init
// ========================
document.addEventListener("DOMContentLoaded", function () {
  const checked = document.querySelector('input[name="ncr-active"]:checked');
  if (!checked) {
    const r = document.querySelector('input[name="ncr-active"][value="active"]');
    if (r) r.checked = true;
  }

  mergeIncomingRecords();
  applyEdits();

  populateSupplierDropdown();
  ncrFilteredData = getActiveDataset();

  setupModalEventListeners();
  setupFilterEventListener();

  filterNCRData(1);
});

// ========================
// Navigation helpers
// ========================
function openEdit(ncrNumber, dateCreated, supplier) {
  const params = new URLSearchParams({ ncr: ncrNumber, dateCreated, supplier });
  window.location.href = `edit.html?${params.toString()}`;
}

function openView(ncrNumber, dateCreated, supplier) {
  const params = new URLSearchParams({ ncr: ncrNumber, dateCreated, supplier, readonly: "true" });
  window.location.href = `edit.html?${params.toString()}`;
}
