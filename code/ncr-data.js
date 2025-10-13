// dummy NCR data

let ncrData = [
    {
      id: 1,
      ncrNumber: "2025-611",
      dateCreated: "2025-10-01",
      lastModified: "2025-10-05",
      supplier: "BlueHaven Distributors"
    },
    {
      id: 2,
      ncrNumber: "2025-325",
      dateCreated: "2025-10-02",
      lastModified: "2025-10-06",
      supplier: "Apex Global Trading"
    },
    {
      id: 3,
      ncrNumber: "2025-424",
      dateCreated: "2025-10-03",
      lastModified: "2025-10-07",
      supplier: "BlueHaven Distributors"
    },
    {
      id: 4,
      ncrNumber: "2025-777",
      dateCreated: "2025-10-04",
      lastModified: "2025-10-04",
      supplier: "SilverOak Importers"
    }, 
    {
      id: 5,
      ncrNumber: "2025-438",
      dateCreated: "2025-10-04",
      lastModified: "2025-10-06",
      supplier: "BlueHaven Distributors"
    },
    {
      id: 8,
      ncrNumber: "2025-242",
      dateCreated: "2025-10-01",
      lastModified: "2025-10-11",
      supplier: "SilverOak Importers"
    },
];

// dummy archived NCR data
let ncrArchivedData = [
    {
      id: 6,
      ncrNumber: "2025-623",
      dateCreated: "2025-10-05",
      lastModified: "2025-10-13",
      supplier: "SilverOak Importers"
    },
    {
      id: 7,
      ncrNumber: "2025-845",
      dateCreated: "2025-10-02",
      lastModified: "2025-10-07",
      supplier: "BlueHaven Distributors"
    }
];

// Variable to hold filtered data, default to active NCRs
let ncrFilteredData = ncrData;

// Initialize the table when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set up modal event listeners
  setupModalEventListeners();
  // Set up filter button event listener
  setupFilterEventListener();
  // Ensure correct records and buttons are shown on page load
  setTimeout(() => filterNCRData(1), 0);
});

// Function to render NCR table with pagination
function renderNCRTable(page = 1) {
  const tableBody = document.querySelector('.ncr-table tbody');
  if (!tableBody) return;

  // Pagination logic
  const recordsCount = parseInt(document.getElementById('search-amount')?.value || '5', 10);
  const startIdx = (page - 1) * recordsCount;
  const endIdx = startIdx + recordsCount;
  const pageData = ncrFilteredData.slice(startIdx, endIdx);

  // Clear existing content
  tableBody.innerHTML = '';

  // Determine if we are showing archived or active records
  const activeStatus = document.querySelector('input[name="ncr-active"]:checked')?.value;
  pageData.forEach(ncr => {
    const row = document.createElement('tr');
    row.dataset.ncrId = ncr.id;
    let actionsHtml = `
      <button type="button" class="btn btn-secondary" aria-label="Edit ${ncr.ncrNumber}" onclick="editNCR('${ncr.ncrNumber}', '${ncr.dateCreated}', '${ncr.supplier}')">Edit</button>
    `;
    if (activeStatus === 'active') {
      actionsHtml += `<button type="button" class="btn btn-danger" aria-label="Archive ${ncr.ncrNumber}" onclick="showArchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">Archive</button>`;
    }
    actionsHtml += `<button type="button" class="btn btn-outline" aria-label="Download ${ncr.ncrNumber} as PDF" onclick="downloadPDF('${ncr.ncrNumber}')">PDF</button>`;
    row.innerHTML = `
      <td data-label="NCR Number">${ncr.ncrNumber}</td>
      <td data-label="Date Created">${ncr.dateCreated}</td>
      <td data-label="Last Modified">${ncr.lastModified}</td>
      <td data-label="Supplier">${ncr.supplier}</td>
      <td data-label="Actions">${actionsHtml}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Function to filter NCR data
function filterNCRData(page = 1) {
  const supplierInput = document.getElementById('ncr-search').value.trim().toLowerCase();
  const activeStatus = document.querySelector('input[name="ncr-active"]:checked').value;
  const recordsCount = parseInt(document.getElementById('search-amount').value, 10);
  let dataSet = [];
  let filteredDataSet = [];

  if (activeStatus == 'active') dataSet = ncrData;
  if (activeStatus == 'archived') dataSet = ncrArchivedData;

  filteredDataSet = dataSet.filter(ncr =>
    supplierInput === "" || ncr.supplier.toLowerCase().includes(supplierInput)
  );

  ncrFilteredData = filteredDataSet;

  // Render table for the current page
  renderNCRTable(page);
  // Render pagination controls dynamically
  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls(ncrFilteredData.length, recordsCount, page);
  }
  // Update pagination info
  if (typeof updatePaginationInfo === 'function') {
    updatePaginationInfo(page, ncrFilteredData);
  }
  // Re-attach event listeners
  if (typeof setupPaginationControls === 'function') {
    setupPaginationControls();
  }
}

// Function to show archive confirmation modal
function showArchiveConfirmation(ncrId, ncrNumber) {
  const modal = document.getElementById('archive-modal');
  const ncrNumberSpan = document.getElementById('archive-ncr-number');
  const confirmButton = document.getElementById('confirm-archive');
  
  ncrNumberSpan.textContent = ncrNumber;
  
  // Set up confirmation handler
  confirmButton.onclick = () => archiveNCR(ncrId);
  
  // Show modal
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus on the cancel button for accessibility
  document.getElementById('cancel-archive').focus();
}

// Function to archive (remove) an NCR
function archiveNCR(ncrId) {
  // Find and remove the NCR from the array
  const index = ncrData.findIndex(ncr => ncr.id === ncrId);
  if (index !== -1) {
    // Move to archived data
    const archivedNCR = ncrData.splice(index, 1)[0];
    ncrArchivedData.push(archivedNCR);
    
    // Re-render the table
  filterNCRData(1);
    
    // Close the modal
    closeArchiveModal();
    
    // Show success message
    setTimeout(() => alert(`NCR ${archivedNCR.ncrNumber} has been archived successfully.`), 300);
  }
}

// Function to close archive modal
function closeArchiveModal() {
  const modal = document.getElementById('archive-modal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Function to show PDF download confirmation
function downloadPDF(ncrNumber) {
  const modal = document.getElementById('pdf-modal');
  const ncrNumberSpan = document.getElementById('pdf-ncr-number');
  
  ncrNumberSpan.textContent = ncrNumber;
  
  // Show modal
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  
  // focus on close button
  document.getElementById('close-pdf-modal').focus();
}

// Function to close PDF modal
function closePDFModal() {
  const modal = document.getElementById('pdf-modal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Function to handle edit
function editNCR(ncrNumber, dateCreated, supplier) {
  window.location.href = `edit.html?ncr=${ncrNumber}&dateCreated=${dateCreated}&supplier=${supplier}`;
}

// Set up filter event listener
function setupFilterEventListener() {
  const filterButton = document.getElementById('btnFilter');

    if (filterButton) 
    {
      filterButton.addEventListener('click', () =>
        {
          filterNCRData(); 
        });
    }
}

// Set up modal event listeners
function setupModalEventListeners() {
  // Archive modal event listeners
  const archiveModal = document.getElementById('archive-modal');
  const cancelArchive = document.getElementById('cancel-archive');
  
  if (cancelArchive) {
    cancelArchive.addEventListener('click', closeArchiveModal);
  }
  
  // PDF modal event listeners
  const pdfModal = document.getElementById('pdf-modal');
  const closePDFButton = document.getElementById('close-pdf-modal');
  
  if (closePDFButton) {
    closePDFButton.addEventListener('click', closePDFModal);
  }
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === archiveModal) {
      closeArchiveModal();
    }
    if (event.target === pdfModal) {
      closePDFModal();
    }
  });
}