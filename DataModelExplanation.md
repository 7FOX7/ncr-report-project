## NCR Data Model 

Our NCR system is divided into **three main parts** to make tracking and communication clear for everyone:

1. **NCR (Non-Conformance Report):**

   The main record that identifies an issue. It stores basic details such as the NCR number, supplier, purchase order, and related product. Each NCR acts as the central reference point for all connected information.
2. **Quality Assurance (NCR Line):**

   This section records what was found during inspection — including the product involved, the quantity received, how many were defective, the type of defect, who inspected it, and when. It ensures that all quality findings are clearly documented.
3. **Engineering:**

   Once QA confirms a problem, Engineering decides what to do next. This includes actions like  *rework, repair, scrap, or use-as-is* . It also tracks the engineer’s name, any drawing or revision updates, and the dates these actions were submitted or approved.

Additional supporting tables connect users and system actions:

* **USER** and **ROLE** tables define who uses the system and their permissions.
* **NCRUserHistory** keeps a record of changes made to each NCR.
* **Attachment** stores any photos, reports, or documents linked to an NCR.
* **IssueCategory** and **Product** help classify problems and identify which product or supplier was involved.
