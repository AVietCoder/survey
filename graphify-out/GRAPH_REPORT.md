# Graph Report - lumen-survey-fullstack  (2026-11-17)

## Corpus Check
- 57 files · ~58,273 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 3, .example 1, (none) 1)

## Summary
- 484 nodes · 1411 edges · 11 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Progress Tracking Service
- Admin and Survey Controllers
- Frontend SPA (app.js)
- Activity Log and Test Hooks
- Backend Dependencies
- Cozy Purple Design Spec
- Analytics and Statistics
- Project Brief and Docs
- Tracking HTTP Controller
- Seed Data Script
- Export (CSV/XLSX)

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 78 edges
2. `ok()` - 67 edges
3. `createTrackingService()` - 54 edges
4. `logActivity()` - 25 edges
5. `adminView()` - 24 edges
6. `esc()` - 23 edges
7. `loadQuestions()` - 18 edges
8. `researchView()` - 18 edges
9. `builderRender()` - 18 edges
10. `getProjectAccess()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `frontend/css/cozy.css` --semantically_similar_to--> `css/cozy.css`  [INFERRED] [semantically similar]
  PROJECT_CONTEXT.md → frontend/index.html
- `Tracking` --indirect_call--> `context()`  [INFERRED]
  frontend/js/tracking.js → backend/src/controllers/tracking.js
- `Progress Tracking feature` --semantically_similar_to--> `Progress Tracking (migration 006)`  [INFERRED] [semantically similar]
  none.md → PROJECT_CONTEXT.md
- `Typography (Nunito, clamp scale)` --references--> `Nunito Google font`  [INFERRED]
  design-spec-cozy-purple.md → frontend/index.html
- `revokeCredential()` --calls--> `HttpError`  [EXTRACTED]
  backend/src/services/tracking.js → backend/src/middleware/auth.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Four upgrade modules** — project_context_research_management [EXTRACTED 0.95]
- **Frontend shell loads CSS and JS layers** — frontend_index_style_css, frontend_index_cozy_css, frontend_index_tracking_css, frontend_js_app [EXTRACTED 1.00]
- **Research data integrity features** — project_context_researcher_review, project_context_export, project_context_dataset_versioning [INFERRED 0.75]

## Communities (11 total, 0 thin omitted)

### Community 0 - "Progress Tracking Service"
Cohesion: 0.07
Nodes (70): consentHash(), createTrackingService(), assessmentDetail(), attachForSubmit(), attachSession(), authenticate(), configWarnings(), createRecoveryLink() (+62 more)

### Community 1 - "Admin and Survey Controllers"
Cohesion: 0.10
Nodes (66): ok(), supabase, cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey(), listResponses() (+58 more)

### Community 2 - "Frontend SPA (app.js)"
Cohesion: 0.11
Nodes (66): ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminTabs(), adminTypes (+58 more)

### Community 3 - "Activity Log and Test Hooks"
Cohesion: 0.08
Nodes (30): useSupabaseForTests(), useTrackingService(), errorHandler(), cleanMetadata(), canonicalize(), DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset() (+22 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.06
Nodes (39): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^16.4.5, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+31 more)

### Community 5 - "Cozy Purple Design Spec"
Cohesion: 0.10
Nodes (33): Accessibility rules, Components (card, button, form, sheet, toast), Design tokens (purple scale, amber, coral, green), Motion and reduced-motion, Page templates (Home, Landing), Reference self-care pet app image, Responsive layout (tab bar, pill, sidebar), Starter CSS block (+25 more)

### Community 6 - "Analytics and Statistics"
Cohesion: 0.16
Nodes (27): activity(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+19 more)

### Community 7 - "Project Brief and Docs"
Cohesion: 0.07
Nodes (29): final.md (Lumen completion brief), Completion Criteria, Four Modules (Quality, Analytics, Research, Export), UI/UX Requirements (empty states, controls, tables), Admin activity logs (migration 007), Admin privilege granting via SQL, REST API endpoints, Dataset versions HMAC (+21 more)

### Community 8 - "Tracking HTTP Controller"
Cohesion: 0.13
Nodes (25): assessment(), canEditConfig(), clearTrackingCookie(), context(), cookieOptions(), credentials(), deleteProfile(), enroll() (+17 more)

### Community 9 - "Seed Data Script"
Cohesion: 0.14
Nodes (17): old, survey, texts, user, getBySlug(), published(), start(), submit() (+9 more)

### Community 10 - "Export (CSV/XLSX)"
Cohesion: 0.23
Nodes (13): exceljs@^4.4.0, safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile() (+5 more)

## Knowledge Gaps
- **20 isolated node(s):** `UI/UX Requirements (empty states, controls, tables)`, `Completion Criteria`, `Psychology analytics (alpha, crosstab, Pearson)`, `Admin area`, `Tech stack (vanilla JS, Express, Supabase)` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 105 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tracking` connect `Tracking HTTP Controller` to `Frontend SPA (app.js)`?**
  _High betweenness centrality (0.404) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UI/UX Requirements (empty states, controls, tables)`, `Completion Criteria`, `Psychology analytics (alpha, crosstab, Pearson)` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Progress Tracking Service` be split into smaller, more focused modules?**
  _Cohesion score 0.06677215189873417 - nodes in this community are weakly interconnected._
- **Why does `frontend/index.html app shell` connect `Cozy Purple Design Spec` to `Tracking HTTP Controller`, `Frontend SPA (app.js)`?**
  _High betweenness centrality (0.245) - this node is a cross-community bridge._
- **Should `Admin and Survey Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.09543859649122807 - nodes in this community are weakly interconnected._
- **Should `Frontend SPA (app.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.10719131614654002 - nodes in this community are weakly interconnected._