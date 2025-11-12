// Render pagination controls dynamically based on total items and items per page
function renderPaginationControls(totalItems, itemsPerPage, currentPage = 1) {
    const paginationControls = document.querySelector('.pagination-controls');
    const paginationPagesContainer = document.querySelector('.pagination-pages');
    if (!paginationPagesContainer || !paginationControls) return;
    // Clear existing page buttons
    paginationPagesContainer.innerHTML = '';
    // Always show pagination controls (so the records-per-page select and prev/next
    // are visible). Page buttons will be generated based on totalPages; if there
    // are zero items we still render a single page (page 1) so the UI remains
    // consistent and Prev/Next can be enabled/disabled appropriately.
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    paginationControls.style.display = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pagination-btn pagination-btn-page' + (i === currentPage ? ' active' : '');
        btn.setAttribute('aria-label', `Page ${i}`);
        if (i === currentPage) btn.setAttribute('aria-current', 'page');
        btn.textContent = i;
        paginationPagesContainer.appendChild(btn);
    }
    // After rendering pages, update Prev/Next enabled state based on currentPage
    if (typeof updatePrevNextButtons === 'function') {
        // Use a microtask to ensure DOM insertion is complete before computing max page
        Promise.resolve().then(() => updatePrevNextButtons(currentPage));
    }
}
// Pagination functionality for NCR Management System
// This handles visual pagination state changes without actual data pagination logic

document.addEventListener("DOMContentLoaded", () => {
    setupPaginationControls();
});

function setupPaginationControls() {
    const paginationPages = document.querySelectorAll('.pagination-btn-page');
    const prevButton = document.querySelector('.pagination-btn-prev');
    const nextButton = document.querySelector('.pagination-btn-next');
    
    // Add click event listeners to page buttons
    paginationPages.forEach(button => {
        button.addEventListener('click', function() {
            const pageNumber = parseInt(this.textContent);
            selectPage(pageNumber);
        });
    });
    
    // Add click event listeners to prev/next buttons
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (!this.disabled) {
                const currentPage = getCurrentPage();
                const newPage = Math.max(1, currentPage - 1);
                selectPage(newPage);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (!this.disabled) {
                const currentPage = getCurrentPage();
                const maxPage = getMaxPage();
                const newPage = Math.min(maxPage, currentPage + 1);
                selectPage(newPage);
            }
        });
    }
}

function getCurrentPage() {
    const activeButton = document.querySelector('.pagination-btn-page.active');
    return activeButton ? parseInt(activeButton.textContent) : 1;
}

function getMaxPage() {
    const pageButtons = document.querySelectorAll('.pagination-btn-page');
    let maxPage = 1;
    pageButtons.forEach(button => {
        const pageNum = parseInt(button.textContent);
        if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum;
        }
    });
    return maxPage;
}

// Modified to call filterNCRData with the selected page
function selectPage(pageNumber) {
    // Remove active class from all page buttons
    const allPageButtons = document.querySelectorAll('.pagination-btn-page');
    allPageButtons.forEach(button => {
        button.classList.remove('active');
        button.removeAttribute('aria-current');
    });
    // Find and activate the selected page button
    const targetButton = Array.from(allPageButtons).find(button => 
        parseInt(button.textContent) === pageNumber
    );
    if (targetButton) {
        targetButton.classList.add('active');
        targetButton.setAttribute('aria-current', 'page');
    }
    // Update prev/next button states
    updatePrevNextButtons(pageNumber);
    // Update table and pagination info for the selected page
    if (typeof filterNCRData === 'function') {
        filterNCRData(pageNumber);
    }
    console.log(`Page ${pageNumber} selected`);
}

function updatePrevNextButtons(currentPage) {
    const prevButton = document.querySelector('.pagination-btn-prev');
    const nextButton = document.querySelector('.pagination-btn-next');
    const maxPage = getMaxPage();
    
    // Update previous button
    if (prevButton) {
        if (currentPage <= 1) {
            prevButton.disabled = true;
            prevButton.setAttribute('aria-disabled', 'true');
        } else {
            prevButton.disabled = false;
            prevButton.removeAttribute('aria-disabled');
        }
    }
    
    // Update next button
    if (nextButton) {
        if (currentPage >= maxPage) {
            nextButton.disabled = true;
            nextButton.setAttribute('aria-disabled', 'true');
        } else {
            nextButton.disabled = false;
            nextButton.removeAttribute('aria-disabled');
        }
    }
}

function updatePaginationInfo(currentPage, dataSet) {
    const paginationText = document.querySelector('.pagination-text');
    if (paginationText) {
        // Calculate items shown based on current records-per-page selection
        const perSelect = document.getElementById('search-amount');
        const itemsPerPage = perSelect ? parseInt(perSelect.value, 10) || 5 : 5;
        const totalItems = dataSet.length;
        
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        paginationText.innerHTML = `Showing <strong>${startItem}-${endItem}</strong> of <strong>${totalItems}</strong> NCRs`;
    }
}
