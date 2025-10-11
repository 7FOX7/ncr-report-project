document.addEventListener("DOMContentLoaded", () => {
    // Extract URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ncrNumber = urlParams.get('ncr');
    const dateCreated = urlParams.get('dateCreated'); 
    const supplier = urlParams.get('supplier');
    
    console.log('NCR Number from URL:', ncrNumber);
    console.log('Date Created from URL:', dateCreated);
    console.log('Supplier from URL:', supplier);
    
    // If we have URL parameters, populate the form
    if (ncrNumber) {
        populateFormFromParams(ncrNumber, dateCreated, supplier);
    }
});

// Function to populate form fields based on URL parameters
function populateFormFromParams(ncrNumber, dateCreated, supplier) {
    // Update NCR Number field
    const ncrNumberField = document.getElementById('ncr-number');
    if (ncrNumberField && ncrNumber) {
        ncrNumberField.value = ncrNumber;
    }
    const dateCreatedField = document.getElementById('create-date'); 
    if (dateCreatedField && dateCreated) {
        dateCreatedField.value = dateCreated
    }
    // Update supplier dropdown if supplier is provided
    const supplierField = document.getElementById('supplier-id');
    // will be storing if the option is present
    let isPresent = false
    if (supplierField && supplier) {
        // Find the option that matches the supplier name
        const options = supplierField.querySelectorAll('option');
        for (let option of options) {
            if (option.textContent.trim() === supplier) {
                // change the value
                isPresent = true
                option.selected = true
                break
            }
        }
        // if there is an existing option, then select it
        if (!isPresent) {
            // create a new option with the current supplier name
            const option = new Option(supplier, "3")
            // add an option to the select
            supplierField.appendChild(option)
            // select an option
            option.selected = true
        }
    }
}