# brainst0rm Upgrade Progress

- **Current Phase:** UI refresh complete; remaining permission QA with a second account
- **Completed:**
  - [x] Response quality scoring, review states, and researcher-configured consistency checks
  - [x] Psychology analytics with descriptive statistics, group comparison, crosstab, correlation, reliability, and date filters
  - [x] Research projects, survey links, role-based collaborators, notes/activity, and pseudonymous participant codes
  - [x] CSV/XLSX exports and print-to-PDF report implementation
  - [x] Migrations 004 and 005 active; dataset version create/list verified through API and UI
  - [x] UI refresh (same palette/fonts): unified tokens, sidebar with user block, KPI cards with icons, centered empty states with CTAs, onboarding state, dashboard survey table with search and status counts, grouped builder library, sectioned analytics, custom checkbox/radio/range, success/error toasts, split-layout login, card-style public survey
  - [x] Fixed: date-filtered group/crosstab/correlation and Cronbach's alpha requests (missing `?`), empty response table on page 2+, stale builder question count, analytics empty-state link opening the wrong survey, export confirmation label
  - [x] Verified with real QA responses: analytics charts, review row editor, correlation/alpha with date filter, CSV download with SHA-256, report page
  - [x] Responsive check at 1440/820/390px: no horizontal page overflow on Dashboard, Builder, Analytics, Research, Login
  - [x] 23 backend tests, syntax checks, and `git diff --check` pass
- **In Progress:**
  - [ ] Verify Owner/Researcher/Reviewer permissions with a second account
  - [ ] Visual check of Admin screens with an admin account (styles harmonized, not browser-verified)
- **Pending:**
  - [ ] Consent workflow; the application does not currently record consent or guardian verification
- **Last Updated:** 2026-11-05
