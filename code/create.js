const ncr = Math.floor(1000000000 + Math.random() * 9000000000); 
document.getElementById("ncr-number").value = ncr;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnSubmit").addEventListener("click", (e) => {
      e.preventDefault(); // stop real submit while we validate

      // reading  values at click-time (not at file load)
      const purchaseOrder     = document.getElementById("po-number").value.trim();
      const salesOrder        = document.getElementById("so-number").value.trim();
      const supplierChoice    = document.getElementById("supplier-id").value;       // <select>
      const processType       = document.getElementById("process-type-id").value;   // <select>
      const product           = document.getElementById("product-id").value;        // <select>
      const recvdQtyStr       = document.getElementById("recv-qty").value.trim();
      const defectQtyStr      = document.getElementById("defect-qty").value.trim();
      const issueCategory     = document.getElementById("issue-cat-id").value;      // <select>
      const defectDescription = document.getElementById("defect-desc").value.trim();
      const inspectorID       = document.getElementById("inspected-by").value.trim();
      const dateInspected     = document.getElementById("inspected-on").value;
      const createdOn = document.getElementById("created-on")

      // set the date for today
      createdOn.value = new Date().getDate()

      // --- required text fields ---
      if (purchaseOrder === "") { alert("Enter Purchase Order number."); document.getElementById("po-number").focus(); return; }
      if (salesOrder === "")    { alert("Enter Sales Order number.");    document.getElementById("so-number").focus(); return; }
      if (inspectorID === "")   { alert("Enter Inspector ID/Name.");     document.getElementById("inspected-by").focus(); return; }
      if (defectDescription === "") { alert("Describe the defect.");     document.getElementById("defect-desc").focus(); return; }

      // --- required selects (treat '', '0', or 'select' as not chosen) ---
      const notChosen = (v) => v === "" || v === "0" || v.toLowerCase() === "select";
      if (notChosen(supplierChoice)) { alert("Choose a supplier.");      document.getElementById("supplier-id").focus(); return; }
      if (notChosen(processType))    { alert("Choose a process type.");  document.getElementById("process-type-id").focus(); return; }
      if (notChosen(product))        { alert("Choose a product.");       document.getElementById("product-id").focus(); return; }
      if (notChosen(issueCategory))  { alert("Choose an issue category.");document.getElementById("issue-cat-id").focus(); return; }

      // --- simple numbers ---
      const recvdQty  = Number(recvdQtyStr);
      const defectQty = Number(defectQtyStr);
      if (!Number.isFinite(recvdQty) || recvdQty <= 0) { alert("Enter received quantity (number > 0)."); document.getElementById("recv-qty").focus(); return; }
      if (!Number.isFinite(defectQty) || defectQty < 0){ alert("Enter defective quantity (number ≥ 0)."); document.getElementById("defect-qty").focus(); return; }

      // --- special rule: date cannot be in the past ---
      if (!dateInspected) { alert("Pick the inspection date."); document.getElementById("inspected-on").focus(); return; }
      const picked = new Date(dateInspected);
      const today  = new Date(); today.setHours(0,0,0,0); // start of today
      if (picked < today) { alert("Inspection date cannot be earlier than today."); document.getElementById("inspected-on").focus(); return; }

      // If we got here, all checks passed
      alert("All good! Submitting…");
    });
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    document.getElementById("ncr-form").reset();
});



// // declaring user inputs 
// // NCR HEADER INFO 
// let purchaseOrder = document.getElementById("po-number").value;
// let salesOrder = document.getElementById("so-number").value;
// let markedItem = document.querySelector("item-nonconforming").value;
// let supplierChoice = document.querySelector("supplier-id").value;
// let processType = document.querySelector("process-type-id").value;
// let processAl = ocument.querySelector("process-applicable").value;

// // NCR LINE ITEM DETAILS
// let product = document.querySelector("product-id").value;
// let recivedQuantity = document.getElementById("recv-qty").value;
// let defectiveQuantity = document.getElementById("defect-qty").value;
// let issueCategory = document.querySelector("issue-cat-id").value;
// let defectDescription = document.getElementById("defect-desc").value;
// let inpectorID = document.getElementById("inspected-by").value;
// let dateInspected = document.getElementById("inspected-on").value;

// // Attachment 
// let photoDesc = document.getElementById("photo-desc");




