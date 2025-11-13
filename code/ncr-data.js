

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

//LocalStorage helpers 
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

//  Merge NEW rows from Create 
function mergeIncomingRecords() {
  const incoming = loadJSON("ncrNewRecords", []);
  if (!Array.isArray(incoming) || incoming.length === 0) return;

  const seen = new Set(ncrData.map(r => r.ncrNumber));
  let maxId = ncrData.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);

  incoming.forEach(r => {
    if (!seen.has(r.ncrNumber)) {
      if (typeof r.id !== "number" || !Number.isFinite(r.id)) { maxId += 1; r.id = maxId; }
      ncrData.push(r);
      seen.add(r.ncrNumber);
    }
  });

  
  // localStorage.removeItem("ncrNewRecords");
}

//  Apply EDITS from Edit page 
function applyEdits() {
  const edits = loadJSON("ncrEdits", []);
  if (!Array.isArray(edits) || edits.length === 0) return;

  const byNum = new Map(ncrData.map(r => [r.ncrNumber, r]));
  edits.forEach(e => {
    const row = byNum.get(e.ncrNumber);
    if (row) Object.assign(row, e);
  });

 
  // localStorage.removeItem("ncrEdits");
}

//  Details map 
function getDetailsMap() {
  return loadJSON("ncrDetails", {});   // { [ncrNumber]: { ... } }
}

// Render the table 
function renderNCRTable(page = 1) {
  const tableBody = document.querySelector(".ncr-table tbody");
  if (!tableBody) return;

  const perSel = document.getElementById("search-amount");
  const per = parseInt(perSel?.value || "5", 10);
  const itemsPerPage = Number.isFinite(per) && per > 0 ? per : 5;

  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageData = ncrFilteredData.slice(startIdx, endIdx);

  tableBody.innerHTML = "";

  const status = document.querySelector('input[name="ncr-active"]:checked')?.value;
  const detailsMap = getDetailsMap();

  pageData.forEach(ncr => {
    const d = detailsMap[ncr.ncrNumber];
    const dateCreated  = d?.dateCreated  || ncr.dateCreated || "";
    const lastModified = d?.lastModified || ncr.lastModified || "";
    const supplier     = d?.supplierName || ncr.supplier || "";
    const isCompleted  = d?.isCompleted || ncr.isCompleted || false;

    const row = document.createElement("tr");
    row.dataset.ncrId = ncr.id;
    
    // Add completed styling if NCR is completed
    if (isCompleted) {
      row.classList.add('ncr-completed');
    }

    let actionsHtml = "";
    // determine whether this row is archived; dataset may annotate records with an `archived` flag
    const isArchived = (ncr.archived === true) || ncrArchivedData.some(a => a.id === ncr.id);

    // Active (non-archived) rows: show Edit and Archive (unless completed)
    if (!isCompleted && !isArchived) {
      actionsHtml = `
        <button type="button" class="btn btn-secondary"
          aria-label="Edit ${ncr.ncrNumber}"
          onclick="openEdit('${ncr.ncrNumber}', '${dateCreated}', '${(supplier || "").toString().replace(/'/g, "\\'")}')">Edit</button>
      `;

      actionsHtml += `
        <button type="button" class="btn btn-outline"
          aria-label="Archive ${ncr.ncrNumber}"
          onclick="showArchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">Archive</button>
      `;
    }

    // Archived rows: show Un-archive
    if (isArchived) {
      actionsHtml += `
        <button type="button" class="btn btn-secondary"
          aria-label="Un-archive ${ncr.ncrNumber}"
          onclick="showUnarchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">Un-archive</button>
      `;
    }

    actionsHtml += `
      <button type="button" class="btn btn-outline"
        aria-label="Download ${ncr.ncrNumber} as PDF"
        onclick="downloadPDF('${ncr.ncrNumber}')">PDF</button>
    `;

    row.innerHTML = `
      <td data-label="NCR Number">
        ${ncr.ncrNumber}
        ${isCompleted ? '<span class="completion-badge">COMPLETED</span>' : ''}
      </td>
      <td data-label="Date Created">${dateCreated}</td>
      <td data-label="Last Modified">${lastModified}</td>
      <td data-label="Supplier">${supplier}</td>
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

// Archive flow 
function showArchiveConfirmation(ncrId, ncrNumber) {
  const modal = document.getElementById("archive-modal");
  const ncrNumberSpan = document.getElementById("archive-ncr-number");
  const confirmButton = document.getElementById("confirm-archive");
  if (ncrNumberSpan) ncrNumberSpan.textContent = ncrNumber;
  if (confirmButton) confirmButton.onclick = () => archiveNCR(ncrId);
  if (modal) { modal.style.display = "block"; modal.setAttribute("aria-hidden", "false"); }
  const cancelBtn = document.getElementById("cancel-archive"); if (cancelBtn) cancelBtn.focus();
}
function closeArchiveModal() {
  const modal = document.getElementById("archive-modal");
  if (modal) { modal.style.display = "none"; modal.setAttribute("aria-hidden", "true"); }
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

// Un-archive flow: move record from archived set back to active set
function unarchiveNCR(ncrId) {
  const idx = ncrArchivedData.findIndex(r => r.id === ncrId);
  if (idx >= 0) {
    const rec = ncrArchivedData.splice(idx, 1)[0];
    ncrData.push(rec);
  }
  // Close modal if open
  closeUnarchiveModal();

  // Preserve current pagination and filter when refreshing
  let currentPage = 1;
  if (typeof getCurrentPage === 'function') {
    try { currentPage = getCurrentPage(); } catch (_) { currentPage = 1; }
  }
  filterNCRData(currentPage);
}

function showUnarchiveConfirmation(ncrId, ncrNumber) {
  const modal = document.getElementById("unarchive-modal");
  const span = document.getElementById("unarchive-ncr-number");
  const confirmButton = document.getElementById("confirm-unarchive");
  if (span) span.textContent = ncrNumber;
  if (confirmButton) confirmButton.onclick = () => unarchiveNCR(ncrId);
  if (modal) { modal.style.display = "block"; modal.setAttribute("aria-hidden", "false"); }
  const cancelBtn = document.getElementById("cancel-unarchive"); if (cancelBtn) cancelBtn.focus();
}

function closeUnarchiveModal() {
  const modal = document.getElementById("unarchive-modal");
  if (modal) { modal.style.display = "none"; modal.setAttribute("aria-hidden", "true"); }
}

// PDF View - Helper functions to get display text for dropdown values
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

// PDF View Modal
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
  
  // Build the PDF-like content
  const html = `
    <div class="pdf-section">
      <h3 class="pdf-section-title">NCR Information</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">NCR Number</div>
          <div class="pdf-field-value">${details.ncrNumber || "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Date Created</div>
          <div class="pdf-field-value">${details.dateCreated || "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Last Modified</div>
          <div class="pdf-field-value">${details.lastModified || "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Status</div>
          <div class="pdf-field-value">${details.status || "Open"}</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h3 class="pdf-section-title">Order Information</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Purchase Order</div>
          <div class="pdf-field-value ${!details.purchaseOrder ? 'empty' : ''}">${details.purchaseOrder || "Not provided"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Sales Order</div>
          <div class="pdf-field-value ${!details.salesOrder ? 'empty' : ''}">${details.salesOrder || "Not provided"}</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h3 class="pdf-section-title">Supplier & Process</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Supplier</div>
          <div class="pdf-field-value">${details.supplierName || getSupplierText(details.supplierValue)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Process Type</div>
          <div class="pdf-field-value">${getProcessTypeText(details.processTypeValue)}</div>
        </div>
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Process Applicable</div>
          <div class="pdf-field-value">${formatProcessApplicable(details.processApplicable)}</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h3 class="pdf-section-title">Product Information</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Product</div>
          <div class="pdf-field-value">${getProductText(details.productValue)}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Received Quantity</div>
          <div class="pdf-field-value">${details.recvQty ?? "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Defective Quantity</div>
          <div class="pdf-field-value">${details.defectQty ?? "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Item Marked Nonconforming</div>
          <div class="pdf-field-value">${details.itemNonconforming || "N/A"}</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h3 class="pdf-section-title">Issue Details</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Issue Category</div>
          <div class="pdf-field-value">${getIssueCategoryText(details.issueCategoryValue)}</div>
        </div>
        <div class="pdf-field full-width">
          <div class="pdf-field-label">Defect Description</div>
          <div class="pdf-field-value multiline ${!details.defectDescription ? 'empty' : ''}">${details.defectDescription || "No description provided"}</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h3 class="pdf-section-title">Inspection Information</h3>
      <div class="pdf-field-group">
        <div class="pdf-field">
          <div class="pdf-field-label">Inspected By</div>
          <div class="pdf-field-value">${details.inspectedBy || "N/A"}</div>
        </div>
        <div class="pdf-field">
          <div class="pdf-field-label">Inspection Date</div>
          <div class="pdf-field-value">${details.inspectedOn || "N/A"}</div>
        </div>
      </div>
    </div>
  `;
  
  content.innerHTML = html;
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

// Filters 

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

function getActiveDataset() {
  const status = document.querySelector('input[name="ncr-active"]:checked')?.value;
  if (status === "archived") {
    // mark archived rows explicitly
    return ncrArchivedData.map(r => Object.assign({}, r, { archived: true }));
  }
  if (status === "all") {
    // return active then archived, annotate each with archived flag
    return ncrData.map(r => Object.assign({}, r, { archived: false }))
      .concat(ncrArchivedData.map(r => Object.assign({}, r, { archived: true })));
  }
  // default: active
  return ncrData.map(r => Object.assign({}, r, { archived: false }));
}

function filterNCRData(page = 1) {
  const supplierTerm = getSupplierFilterText(); 
  const activeSet = getActiveDataset();
  const detailsMap = getDetailsMap();

  if (supplierTerm === "") {
    ncrFilteredData = activeSet.slice();
  } else {
    ncrFilteredData = activeSet.filter(r => {
      const baseName = (r.supplier || "").toLowerCase();
      const detailsName = (detailsMap[r.ncrNumber]?.supplierName || "").toLowerCase();
      return baseName === supplierTerm || detailsName === supplierTerm;
    });
  }

  renderNCRTable(page);
}

// Populate supplier dropdown with unique suppliers
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
    const option = document.createElement('option');
    option.value = supplier.toLowerCase();
    option.textContent = supplier;
    dropdown.appendChild(option);
  });
}

// UI setup 
function setupFilterEventListener() {
  const filterButton = document.getElementById("btnFilter")
                    || document.querySelector('button[data-action="apply-filters"]');
  if (filterButton) filterButton.addEventListener("click", () => filterNCRData(1));

  // Apply filtering when dropdown changes
  const searchEl = document.querySelector("#ncr-search");
  if (searchEl) {
    searchEl.addEventListener('change', () => filterNCRData(1));
  }

  // Filter when the active/archived/all radios change
  document.querySelectorAll('input[name="ncr-active"]').forEach(r => {
    r.addEventListener("change", () => filterNCRData(1));
  });

  const amountSel = document.getElementById("search-amount");
  if (amountSel) {
    amountSel.addEventListener("change", () => filterNCRData(1));
  }
}

function setupModalEventListeners() {
  const cancelArchive = document.getElementById("cancel-archive"); if (cancelArchive) cancelArchive.addEventListener("click", closeArchiveModal);
  const cancelUnarchive = document.getElementById("cancel-unarchive"); if (cancelUnarchive) cancelUnarchive.addEventListener("click", closeUnarchiveModal);
  const closePDFButton = document.getElementById("close-pdf-view"); if (closePDFButton) closePDFButton.addEventListener("click", closePDFView);
  window.addEventListener("click", (e) => {
    const archiveModal = document.getElementById("archive-modal");
    const unarchiveModal = document.getElementById("unarchive-modal");
    const pdfViewOverlay = document.getElementById("pdf-view-overlay");
    if (e.target === archiveModal) closeArchiveModal();
    if (e.target === unarchiveModal) closeUnarchiveModal();
    if (e.target === pdfViewOverlay) closePDFView();
  });
}

// Initialize on load
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

// Edit navigation helper 
function openEdit(ncrNumber, dateCreated, supplier) {
  const params = new URLSearchParams({ ncr: ncrNumber, dateCreated, supplier });
  window.location.href = `edit.html?${params.toString()}`;
}
