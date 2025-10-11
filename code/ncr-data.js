// dummy NCR data

const ncrData = [
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
        ncrNumber: "2025-919",
        dateCreated: "2025-10-05",
        lastModified: "2025-10-07",
        supplier: "Apex Global Trading"
    },
    {
        id: 6,
        ncrNumber: "2025-156",
        dateCreated: "2025-10-06",
        lastModified: "2025-10-08",
        supplier: "TechFlow Solutions"
    },
    {
        id: 7,
        ncrNumber: "2025-890",
        dateCreated: "2025-10-07",
        lastModified: "2025-10-09",
        supplier: "GreenField Supplies"
    }
];

// Initialize the table when the page loads
document.addEventListener('DOMContentLoaded', function() {
  renderNCRTable();
  
  // Set up modal event listeners
  setupModalEventListeners();
});

// Function to render NCR table
function renderNCRTable() {
    const tableBody = document.querySelector('.ncr-table tbody');
    if (!tableBody) return;

    // Clear existing content
    tableBody.innerHTML = '';

    // Generate table rows from data
    ncrData.forEach(ncr => {
        const row = document.createElement('tr');
        row.dataset.ncrId = ncr.id;

        row.innerHTML = `
            <td data-label="NCR Number">${ncr.ncrNumber}</td>
            <td data-label="Date Created">${ncr.dateCreated}</td>
            <td data-label="Last Modified">${ncr.lastModified}</td>
            <td data-label="Supplier">${ncr.supplier}</td>
            <td data-label="Actions">
            <button type="button" class="btn btn-secondary" aria-label="Edit ${ncr.ncrNumber}" onclick="editNCR('${ncr.ncrNumber}', '${ncr.dateCreated}', '${ncr.supplier}')">Edit</button>
            <button type="button" class="btn btn-danger" aria-label="Archive ${ncr.ncrNumber}" onclick="showArchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">Archive</button>
            <button type="button" class="btn btn-outline" aria-label="Download ${ncr.ncrNumber} as PDF" onclick="downloadPDF('${ncr.ncrNumber}')">PDF</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
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
    const archivedNCR = ncrData.splice(index, 1)[0];
    
    // Re-render the table
    renderNCRTable();
    
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