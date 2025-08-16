
## **Global / Multi-Page**
1. **Update Quick Actions Menu (Global Component)**  
   - Change available quick actions to:  
     1. `Punch Up`  
     2. `Apply to Job`  
     3. `View Library`

---

## **Home / Dashboard**
2. **Remove Optimization Card**  
   - Remove the "Ready for your next optimization" card from the dashboard/home view.

---

## **Job Analysis Page**
3. **Enhance Job Analysis Page Functionality**  
   - Add an optional "Job Title" input; if empty, AI will infer from pasted content.  
   - On `Analyze Job Match` click:  
     - Remove bottom spinner.  
     - Remove "AI is comparing your resume..." text field.  
   - Build out analysis results to pull from actual data accurately.  
   - Replace red down arrows with a more positive icon (keep red highlight).  
   - On API completion, scroll view to the top of the page (also on next page navigation).  
   - Verify filter functionality works as expected.

---

## **Review Page**
4. **Revamp Review Page UI and Tabs**  
   - Update "Changes Summary" review logic.  
   - Rename and merge tabs:  
     - `[PDF Preview → Preview]`  
     - Merge `[Make Any Final Tweaks → Edit]` into Preview.  
     - `[Side by Side → Compare]` remains.  
     - Remove `[Unified Diff]`.  
     - Remove `[Latex Export]`.  
     - End result: **Preview** and **Side by Side** only.  
   - Preview tab should display updated text only.  
     - When backend finishes generating PDF, show "Export" button.  
   - Add loading spinner while PDF is being generated, then populate Preview pane.  
   - Ensure Side by Side tab displays raw text comparison correctly.  
   - Add bottom card with two options:  
     - `Optimize for another job`  
     - `Return Home`

---

## **Library Page**
5. **Simplify Library Page Data**  
   - Review current functionality and remove unnecessary data fields.  
   - Keep only:  
     - Resume rename option  
     - History (which resume it was derived from)  
     - Job description it was based on

---

## **Download Page**
6. **Improve Download Page UX**  
   - Resume Preview should display PDF directly.  
   - Remove redundant "Resume optimization complete" card at the top.  
   - Remove "What's Next?" card.

---

## **Flow & Navigation**
7. **Finalize Primary Flow (Resume–Job Description Flow)**  
   - Focus current implementation on Resume–Job Description flow.  
   - Add "Coming Soon" placeholder for Resume-Solo flow.  
   - Document request flow in a separate mapping document.  
   - Move "Export" out of the top step list — make it a separate action.  
   - Add sign-in/sign-up toggle switch element from v0 version (wide switch).  
   - Research and plan OAuth integration.

---

## **Backlog**
8. **Login Top Bar Update (Global)**  
   - Fix top bar so it updates after login.

9. **Analytics Integration (Global)**  
   - Implement correct analytics functionality once backend work is ready.
