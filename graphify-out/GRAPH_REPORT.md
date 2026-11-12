# Graph Report - lumen-survey-fullstack  (2026-11-12)

## Corpus Check
- Corpus is ~25,307 words - fits in a single context window. You may not need a graph.

## Summary
- 307 nodes · 897 edges · 9 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend App Views
- Backend Controllers
- Dependencies & Package
- Analytics & Supabase
- CSV/XLSX Export
- Project Docs & Brief
- Seed Data
- UI Helpers
- Auth Controller

## God Nodes (most connected - your core abstractions)
1. `ok()` - 59 edges
2. `HttpError` - 53 edges
3. `adminView()` - 23 edges
4. `esc()` - 21 edges
5. `researchView()` - 18 edges
6. `builderRender()` - 18 edges
7. `getProjectAccess()` - 17 edges
8. `dashboardView()` - 17 edges
9. `analyticsView()` - 17 edges
10. `api()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `REST API Reference` --implements--> `Research Management`  [INFERRED]
  none.md → PROJECT_CONTEXT.md
- `Four Modules (Quality, Analytics, Research, Export)` --conceptually_related_to--> `Psychology Analytics`  [INFERRED]
  final.md → PROJECT_CONTEXT.md
- `overview()` --calls--> `ok()`  [EXTRACTED]
  backend/src/controllers/admin.js → backend/src/config/supabase.js
- `searchUsers()` --calls--> `ok()`  [EXTRACTED]
  backend/src/controllers/admin.js → backend/src/config/supabase.js
- `fetchAll()` --calls--> `ok()`  [EXTRACTED]
  backend/src/controllers/analytics.js → backend/src/config/supabase.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Four upgrade modules** — project_context_response_quality_review, project_context_psychology_analytics, project_context_research_management, project_context_export_reporting [EXTRACTED 0.95]
- **Project status and brief documents** — project_context, upgrade_progress, final, none [INFERRED 0.75]

## Communities (9 total, 0 thin omitted)

### Community 0 - "Frontend App Views"
Cohesion: 0.11
Nodes (64): addQuestion(), adminPager(), adminQualityLabel, adminQuestion(), adminTabs(), adminTypes, adminView(), ago() (+56 more)

### Community 1 - "Backend Controllers"
Cohesion: 0.11
Nodes (53): ok(), cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey(), listResponses(), listSurveys() (+45 more)

### Community 2 - "Dependencies & Package"
Cohesion: 0.06
Nodes (39): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^16.4.5, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+31 more)

### Community 3 - "Analytics & Supabase"
Cohesion: 0.19
Nodes (24): supabase, bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+16 more)

### Community 4 - "CSV/XLSX Export"
Cohesion: 0.12
Nodes (18): exceljs@^4.4.0, safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile() (+10 more)

### Community 5 - "Project Docs & Brief"
Cohesion: 0.11
Nodes (26): final.md (Lumen completion brief), Completion Criteria, Four Modules (Quality, Analytics, Research, Export), UI/UX Requirements (empty states, controls, tables), app root div, none.md (README), Admin Privilege Grant via SQL, REST API Reference (+18 more)

### Community 6 - "Seed Data"
Cohesion: 0.16
Nodes (15): old, survey, texts, user, getBySlug(), published(), start(), submit() (+7 more)

### Community 7 - "UI Helpers"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 8 - "Auth Controller"
Cohesion: 0.50
Nodes (7): login(), logout(), me(), pub(), register(), cookieOpts(), signToken()

## Knowledge Gaps
- **4 isolated node(s):** `Second-account Permission QA`, `Completion Criteria`, `Setup and Run Instructions`, `app root div`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 56 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ok()` connect `Backend Controllers` to `Auth Controller`, `Analytics & Supabase`, `CSV/XLSX Export`, `Seed Data`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `Second-account Permission QA`, `Completion Criteria`, `Setup and Run Instructions` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend App Views` be split into smaller, more focused modules?**
  _Cohesion score 0.10961538461538461 - nodes in this community are weakly interconnected._
- **Why does `HttpError` connect `Backend Controllers` to `Dependencies & Package`, `Analytics & Supabase`, `CSV/XLSX Export`, `Seed Data`, `Auth Controller`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `Backend Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.11221507890122735 - nodes in this community are weakly interconnected._
- **Why does `bcrypt` connect `Dependencies & Package` to `Auth Controller`, `Backend Controllers`, `Seed Data`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `Dependencies & Package` be split into smaller, more focused modules?**
  _Cohesion score 0.057004830917874394 - nodes in this community are weakly interconnected._