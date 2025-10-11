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
    
    // Update pagination info text
    updatePaginationInfo(pageNumber);
    
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

function updatePaginationInfo(currentPage) {
    const paginationText = document.querySelector('.pagination-text');
    if (paginationText) {
        // Calculate items shown based on page (4 items per page)
        const itemsPerPage = 4;
        const totalItems = 7; // Based on the 7 NCRs in the data
        
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        paginationText.innerHTML = `Showing <strong>${startItem}-${endItem}</strong> of <strong>${totalItems}</strong> NCRs`;
    }
}