## NCR Project – Meeting Summary & Action Checklist

### 🔧 **Data Model & Readability**

* [X] Simplify how the **data model** is presented — the current structure is too technical.
* [X] Target a  **“AAA readability level”** : easy for everyone (including non-technical users) to understand.
* [X] Clearly describe the three main categories:
* [X] **NCR** – Tracks the main report and its identification details.
* [X] **Quality Assurance** – Tracks inspection findings and nonconformance validation.
* [X] **Engineering** – Tracks corrective/disposition actions and engineering review.

---

### 🧭 **User Interface & Layout**

* [X] Reduce the **filter panel** size when opened; it currently takes up too much space.
* [X] Add a **Supplier dropdown** in the filter section (using NCR Supplier data).
* [X] Display **records per page** control at the bottom of the page.
* [X] Improve **contrast** between the **Edit** and **Archive** buttons for better visibility.
* [ ] Include a **column showing progress** — indicate which department (QA / Engineering) is currently handling the NCR.
* [ ] Add a **“Sort by Progress”** option to organize NCRs by their current workflow stage.

---

### 🧾 **Form Improvements**

* [ ] Make **NCR Number** automatically generated and  **displayed as a label** , not a textbox.
* [ ] Place **NCR Number** and **Date Created** as static labels at the **top** of the form.
* [X] Highlight or mark **incomplete fields** and automatically **scroll/focus** to them.
* [X] Visually mark all **required fields** (add red asterisk or similar indicator).

---

### 💾 **Saving & Completion Logic**

* [X] Allow saving **partially completed NCRs** (add a separate button for “Save Progress”).
* [X] Keep **“Mark as Completed”** as a final step for full completion.
* [ ] Before allowing completion, users must **review the NCR** summary page.
* [ ] Add a **Text Preview page** that displays a read-only text version of the NCR before confirming completion.
* [X] Provide **success feedback** when saving (e.g., message: “NCR successfully saved”).

---

### 📂 **Archiving & PDF Handling**

* [ ] Clarify how to **unarchive** NCRs (add an “Unarchive” option).
* [ ] **Archived NCRs** should be  **view-only** , not editable.
* [ ] Keep **PDF view/download** available for archived NCRs.
* [ ] Allow text-based NCR preview even when archived.
