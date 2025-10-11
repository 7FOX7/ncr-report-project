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
        <button type="button" class="btn btn-secondary" aria-label="Edit ${ncr.ncrNumber}" onclick="editNCR('${ncr.ncrNumber}')">Edit</button>
        <button type="button" class="btn btn-danger" aria-label="Archive ${ncr.ncrNumber}" onclick="showArchiveConfirmation(${ncr.id}, '${ncr.ncrNumber}')">Archive</button>
        <button type="button" class="btn btn-outline" aria-label="Download ${ncr.ncrNumber} as PDF" onclick="downloadPDF('${ncr.ncrNumber}')">PDF</button>
        </td>
    `;

    tableBody.appendChild(row);
    });
}