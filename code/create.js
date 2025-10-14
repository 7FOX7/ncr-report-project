// helpers 
function generateNcrNumber() {
  const year = new Date().getFullYear();
  const three = Math.floor(Math.random() * 900) + 100; 
  return `${year}-${three}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10); 
}
// Parse  input type="date" value as a *local* date 
function parseLocalDate(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); 
}
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

document.addEventListener("DOMContentLoaded", () => {
  // fill NCR number and lock it
  const ncrInput = document.getElementById("ncr-number");
  if (ncrInput) {
    ncrInput.value = generateNcrNumber();
    ncrInput.readOnly = true;
    ncrInput.setAttribute("tabindex", "-1"); 
  }

  // Created On shows today date 
  const createdOn = document.getElementById("created-on") || document.getElementById("create-date");
  if (createdOn) createdOn.value = todayISO();

  // submit validations + persist for Home + full details
  const submitBtn = document.getElementById("btnSubmit");
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault(); // stop real submit while we validate

      // read values at click time 
      const purchaseOrder     = document.getElementById("po-number")?.value.trim() || "";
      const salesOrder        = document.getElementById("so-number")?.value.trim() || "";  page; harml
      const supplierSelect    = document.getElementById("supplier-id");
      const supplierChoice    = supplierSelect?.value || "";
      const supplierText      = supplierSelect?.options[supplierSelect.selectedIndex]?.text?.trim() || supplierChoice;
      const processType       = document.getElementById("process-type-id")?.value || ""; 
      const product           = document.getElementById("product-id")?.value || "";
      const recvdQtyStr       = document.getElementById("recv-qty")?.value.trim() || "";
      const defectQtyStr      = document.getElementById("defect-qty")?.value.trim() || "";
      const issueCategory     = document.getElementById("issue-cat-id")?.value || "";
      const defectDescription = document.getElementById("defect-desc")?.value.trim() || "";
      const inspectorID       = document.getElementById("inspected-by")?.value.trim() || "";
      const dateInspectedVal  = document.getElementById("inspected-on")?.value || "";
      const statusVal         = document.getElementById("ncr-status")?.value || "Open";

      //created date shown on page
      const createdOnVal = createdOn?.value || todayISO();

      // validations 
      if (purchaseOrder === "") { alert("Enter Purchase Order number."); document.getElementById("po-number")?.focus(); return; }
      if (inspectorID === "")   { alert("Enter Inspector ID/Name.");     document.getElementById("inspected-by")?.focus(); return; }
      if (defectDescription === "") { alert("Describe the defect.");     document.getElementById("defect-desc")?.focus(); return; }

      const notChosen = (v) => v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select");
      if (notChosen(supplierChoice)) { alert("Choose a supplier.");       supplierSelect?.focus(); return; }
      if (notChosen(product))        { alert("Choose a product.");        document.getElementById("product-id")?.focus(); return; }
      if (notChosen(issueCategory))  { alert("Choose an issue category.");document.getElementById("issue-cat-id")?.focus(); return; }
      
      if (document.getElementById("process-type-id") && notChosen(processType)) {
        alert("Choose a process type."); document.getElementById("process-type-id")?.focus(); return;
      }

      const recvdQty  = Number(recvdQtyStr);
      const defectQty = Number(defectQtyStr);
      if (!Number.isFinite(recvdQty) || recvdQty <= 0) { alert("Enter received quantity (number > 0)."); document.getElementById("recv-qty")?.focus(); return; }
      if (!Number.isFinite(defectQty) || defectQty < 0){ alert("Enter defective quantity (number ≥ 0)."); document.getElementById("defect-qty")?.focus(); return; }
      //defective cannot exceed received
      if (defectQty > recvdQty) {
        alert("Defective quantity cannot be greater than received quantity.");
        document.getElementById("defect-qty")?.focus();
        return;
      }

      if (!dateInspectedVal) { alert("Pick the inspection date."); document.getElementById("inspected-on")?.focus(); return; }
      //parse as local date
      const picked = parseLocalDate(dateInspectedVal);
      const today  = new Date(); today.setHours(0,0,0,0);
      if (picked < today) {
        alert("Inspection date cannot be earlier than today.");
        document.getElementById("inspected-on")?.focus();
        return;
      }

      //persist BOTH the table row  and the full details 
      const ncrNumber = ncrInput ? ncrInput.value : generateNcrNumber();
      const lastModified = todayISO();

      
      const newRow = {
        id: Date.now(),
        ncrNumber,
        dateCreated: createdOnVal,
        lastModified,
        supplier: supplierText || supplierChoice
      };
      const staged = loadJSON("ncrNewRecords", []);
      if (!staged.some(r => r.ncrNumber === newRow.ncrNumber)) {
        staged.push(newRow);
        saveJSON("ncrNewRecords", staged);
      }

      //details for Edit prefill 
      const detailsMap = loadJSON("ncrDetails", {});
      detailsMap[ncrNumber] = {
        ncrNumber,
        dateCreated: createdOnVal,
        lastModified,
        purchaseOrder,
        salesOrder,                    
        supplierValue: supplierChoice,
        supplierName:  supplierText || supplierChoice,
        processTypeValue: processType, 
        productValue:  product,
        recvQty:       recvdQty,       
        defectQty:     defectQty,      
        issueCategoryValue: issueCategory,
        defectDescription,
        inspectedBy:   inspectorID,
        inspectedOn:   dateInspectedVal,
        status:        statusVal
      };
      saveJSON("ncrDetails", detailsMap);

      
      window.location.href = "index.html"; 
    });
  }

  // regenerates NCR number and resets today date
  const resetBtn = document.getElementById("btnReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const form = document.getElementById("ncr-form");
      if (form) form.reset();
      if (ncrInput) {
        ncrInput.value = generateNcrNumber();
        ncrInput.readOnly = true;
      }
      if (createdOn) createdOn.value = todayISO();
    });
  }
});
