//helpers 
const STORAGE_KEY = "ncrData";      
const DETAILS_KEY = "ncrDetails";   
function todayISO() { return new Date().toISOString().slice(0, 10); }
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function notChosen(v) { return v === "" || v === "0" || (typeof v === "string" && v.toLowerCase() === "select"); }
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

//state from URL 
const params = new URLSearchParams(window.location.search);
const ncrNumberParam = params.get("ncr") || "";
const urlCreated     = params.get("dateCreated") || "";
const urlSupplier    = params.get("supplier") || "";

//DOM refs 
const form           = document.getElementById("ncr-edit-form") || document.querySelector("form");
const inpNcr         = document.getElementById("ncr-number");
const inpCreated     = document.getElementById("create-date");      
const selSupplier    = document.getElementById("supplier-id");
const selProduct     = document.getElementById("product-id");
const inpRecvQty     = document.getElementById("recv-qty");
const inpDefectQty   = document.getElementById("defect-qty");
const selIssue       = document.getElementById("issue-cat-id");
const inpDefectDesc  = document.getElementById("defect-desc");
const inpInspector   = document.getElementById("inspected-by");
const inpInspectedOn = document.getElementById("inspected-on");
const selStatus      = document.getElementById("ncr-status");
const inpPONum       = document.getElementById("purchase-order");

//baseline snapshot for Reset 
let baselineDetails = null;  
let baselineRow     = null;  

//set select by visible text or create a temp option
function setSelectByText(selectEl, text) {
  if (!selectEl || !text) return;
  let matched = false;
  for (const opt of selectEl.options) {
    if (opt.text.trim() === text) { opt.selected = true; matched = true; break; }
  }
  if (!matched) {
    const opt = new Option(text, text);
    selectEl.appendChild(opt);
    opt.selected = true;
  }
}

//fill all fields from details row
function fillFormFrom(details, row) {
  if (inpCreated) {
    inpCreated.value = (details?.dateCreated || row?.dateCreated || urlCreated || todayISO());
  }
  if (selSupplier) {
    const supplierText = (details?.supplierName || row?.supplier || urlSupplier || "");
    setSelectByText(selSupplier, supplierText);
  }
  const setVal = (el, v) => { if (el && v != null && v !== "") el.value = v; };
  if (details) {
    setVal(inpPONum,       details.purchaseOrder);
    setVal(selProduct,     details.productValue);
    setVal(inpRecvQty,     details.recvQty);
    setVal(inpDefectQty,   details.defectQty);
    setVal(selIssue,       details.issueCategoryValue);
    setVal(inpDefectDesc,  details.defectDescription);
    setVal(inpInspector,   details.inspectedBy);
    setVal(inpInspectedOn, details.inspectedOn);
    setVal(selStatus,      details.status);
  }
}

//prefill on load
document.addEventListener("DOMContentLoaded", () => {
  // 1) show NCR number (read-only)
  if (inpNcr) {
    inpNcr.value = ncrNumberParam;
    inpNcr.readOnly = true;
    inpNcr.setAttribute("tabindex", "-1");
  }

  // load existing list row + details 
  const list = loadJSON(STORAGE_KEY, []);
  const row  = list.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || null;

  const detailsMap = loadJSON(DETAILS_KEY, {});
  const details    = detailsMap[ncrNumberParam] || null;

  //keep a baseline snapshot for Reset
  baselineRow     = deepClone(row);
  baselineDetails = deepClone(details);

  // fill the form from storage 
  fillFormFrom(details, row);

  // update 
  if (form) form.addEventListener("submit", onUpdateSubmit);

  // wire up Mark as Completed 
  const btnComplete = document.getElementById("btnComleted");
  if (btnComplete) {
    btnComplete.setAttribute("type","button");
    btnComplete.addEventListener("click", (e) => {
      e.preventDefault();
      const ans = window.prompt("Are you sure it is completed?\nType YES to continue, or leave blank to cancel.", "");
      if (ans && ans.toUpperCase() === "YES") {
        window.location.href = "index.html";
      }
    });
  }

  // wire up Reset Changes and also intercept native form reset
  const btnResetChanges = document.getElementById("btnResetChanges") || document.getElementById("btnReset");
  if (btnResetChanges) {
    btnResetChanges.addEventListener("click", onResetClick);
  }
  if (form) {
    form.addEventListener("reset", (e) => {
      //Prevent browser native reset 
      e.preventDefault();
      onResetClick(e);
    });
  }
});

//  restore last saved state from storage 
function onResetClick(e) {
  if (e) e.preventDefault();

  // reload freshest saved state from storage 
  const latestDetailsMap = loadJSON(DETAILS_KEY, {});
  const latestDetails = latestDetailsMap[ncrNumberParam] || baselineDetails;

  const latestList = loadJSON(STORAGE_KEY, []);
  const latestRow  = latestList.find(r => String(r.ncrNumber) === String(ncrNumberParam)) || baselineRow;

  fillFormFrom(latestDetails, latestRow);
  
}

//Validate + Save 
function onUpdateSubmit(e, stayHere = false) {
  e.preventDefault();

  const ncrNumber   = (inpNcr?.value || "").trim();
  const dateCreated = (inpCreated?.value || todayISO());

  const supplierVal  = selSupplier?.value || "";
  const supplierText = selSupplier?.options[selSupplier.selectedIndex]?.text?.trim() || supplierVal;

  const productVal   = selProduct?.value || "";
  const recvQtyStr   = (inpRecvQty?.value || "").trim();
  const defectQtyStr = (inpDefectQty?.value || "").trim();
  const issueCatVal  = selIssue?.value || "";
  const defectDesc   = (inpDefectDesc?.value || "").trim();
  const inspectedBy  = (inpInspector?.value || "").trim();
  const inspectedOn  = (inpInspectedOn?.value || "");
  const statusVal    = selStatus?.value || "Open";
  const poNumber     = (inpPONum?.value || "").trim();

  //validations 
  if (poNumber === "")        { alert("Enter Purchase Order number.");  inpPONum?.focus(); return; }
  if (inspectedBy === "")     { alert("Enter Inspector ID/Name.");      inpInspector?.focus(); return; }
  if (defectDesc === "")      { alert("Describe the defect.");          inpDefectDesc?.focus(); return; }
  if (notChosen(supplierVal)) { alert("Choose a supplier.");            selSupplier?.focus(); return; }
  if (notChosen(productVal))  { alert("Choose a product.");             selProduct?.focus(); return; }
  if (notChosen(issueCatVal)) { alert("Choose an issue category.");     selIssue?.focus(); return; }

  const recvQty   = Number(recvQtyStr);
  const defectQty = Number(defectQtyStr);
  if (!Number.isFinite(recvQty) || recvQty <= 0)   { alert("Enter received quantity (number > 0).");   inpRecvQty?.focus(); return; }
  if (!Number.isFinite(defectQty) || defectQty < 0){ alert("Enter defective quantity (number ≥ 0).");  inpDefectQty?.focus(); return; }
  //defective cannot exceed received
  if (defectQty > recvQty) { alert("Defective quantity cannot be greater than received quantity."); inpDefectQty?.focus(); return; }

  if (!inspectedOn) { alert("Pick the inspection date."); inpInspectedOn?.focus(); return; }
  const picked = new Date(inspectedOn);
  const today  = new Date(); today.setHours(0,0,0,0);
  if (picked > today) { alert("Inspection date cannot be in the future."); inpInspectedOn?.focus(); return; }

  const lastModified = todayISO();

  //save full details map 
  const detailsMap = loadJSON(DETAILS_KEY, {});
  detailsMap[ncrNumber] = {
    ncrNumber,
    dateCreated,
    lastModified,
    purchaseOrder: poNumber,
    supplierValue: supplierVal,
    supplierName:  supplierText,
    productValue:  productVal,
    recvQty,
    defectQty,
    issueCategoryValue: issueCatVal,
    defectDescription:  defectDesc,
    inspectedBy,
    inspectedOn,
    status: statusVal
  };
  saveJSON(DETAILS_KEY, detailsMap);

  //Patch the home table list 
  const list = loadJSON(STORAGE_KEY, []);
  const idx  = list.findIndex(r => String(r.ncrNumber) === String(ncrNumber));
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      dateCreated,     
      lastModified,
      supplier: supplierText,
      status: statusVal
    };
  } else {
    list.push({
      id: Date.now(),
      ncrNumber,
      dateCreated,
      lastModified,
      supplier: supplierText,
      status: statusVal
    });
  }
  saveJSON(STORAGE_KEY, list);

  // update baseline so future Reset returns to this saved state 
  baselineDetails = deepClone(detailsMap[ncrNumber]);
  baselineRow     = deepClone(list.find(r => String(r.ncrNumber) === String(ncrNumber)));

  alert("NCR updated.");
  if (!stayHere) window.location.href = "index.html";
}
