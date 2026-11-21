# Graph Report - lumen-survey-fullstack  (2026-11-20)

## Corpus Check
- 90 files · ~108,939 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 793 nodes · 2169 edges · 31 communities (29 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ef36cf1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Admin and Survey Controllers
- tracking-http.test.js
- Progress Tracking Service
- Frontend SPA (app.js)
- Tiêu Chí Cho Một Website Đẹp — Hướng Dẫn Đầy Đủ
- Template Seed Script
- Reward Service
- Tracking HTTP Controller
- seed.js
- Reward Decisions Docs
- ui.js
- exports.js
- rewards.js
- Project Brief and Docs
- Reward Design Principles
- Progress Tracking (anonymous participants)
- README (none.md)
- Consent and Progress Docs
- Progress Tracking service
- tracking-accounts.js
- Analytics Docs
- ref_node_assert
- index.js
- activity-admin.test.js
- createFakeDb
- tracking-service.test.js
- Reward System plan
- village.js
- final.md (Lumen completion brief)

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 116 edges
2. `ok()` - 81 edges
3. `createTrackingService()` - 67 edges
4. `logActivity()` - 34 edges
5. `createRewardService()` - 30 edges
6. `esc()` - 27 edges
7. `adminView()` - 26 edges
8. `api()` - 22 edges
9. `createFakeDb()` - 22 edges
10. `supabase` - 22 edges

## Surprising Connections (you probably didn't know these)
- `frontend/css/cozy.css` --semantically_similar_to--> `css/cozy.css`  [INFERRED] [semantically similar]
  PROJECT_CONTEXT.md → frontend/index.html
- `Tracking` --indirect_call--> `context()`  [INFERRED]
  frontend/js/tracking.js → backend/src/controllers/tracking.js
- `Typography (Nunito, clamp scale)` --references--> `Nunito Google font`  [INFERRED]
  design-spec-cozy-purple.md → frontend/index.html
- `Reward System plan` --references--> `Reward System design decisions (answer.md)`  [EXTRACTED]
  CLAUDE.md → docs/answer.md
- `14-day reassessment cycle` --conceptually_related_to--> `Progress Tracking (anonymous participants)`  [EXTRACTED]
  docs/answer.md → none.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Four upgrade modules** — project_context_research_management [EXTRACTED 0.95]
- **Task verification mechanisms across Y/R tasks** — solution_verification_approaches, solution_y_01_power_nap, solution_r_03_physiological_sigh, solution_r_05_brain_dump_note, solution_y_05_anchor_wake_up [EXTRACTED 0.95]
- **Frontend shell loads CSS and JS layers** — frontend_index_style_css, frontend_index_cozy_css, frontend_index_tracking_css, frontend_js_app [EXTRACTED 1.00]
- **Research data integrity features** — project_context_researcher_review, project_context_export, project_context_dataset_versioning [INFERRED 0.75]
- **Reward safety and ethics principles** — docs_answer_kenh_ho_tro, docs_answer_cau_hoi_tu_lam_hai, docs_answer_dong_y_duoi_18, docs_answer_ten_goi_than_thien [INFERRED 0.75]
- **Reward system decisions to plan to docs** — docs_answer, claude_reward_system, none_nhiem_vu_diem_thuong [INFERRED 0.85]
- **Reward system planning and design documents** — docs_reward_system_open_decisions, docs_reward_system_open_decisions_html_page, solution [INFERRED 0.85]

## Communities (31 total, 2 thin omitted)

### Community 0 - "Admin and Survey Controllers"
Cohesion: 0.06
Nodes (108): ok(), supabase, activity(), cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey() (+100 more)

### Community 1 - "tracking-http.test.js"
Cohesion: 0.22
Nodes (5): TRACKING_CONSTRAINTS, consent, questions, survey, Q

### Community 2 - "Progress Tracking Service"
Cohesion: 0.05
Nodes (85): consentHash(), createTrackingService(), assessmentDetail(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), configWarnings() (+77 more)

### Community 3 - "Frontend SPA (app.js)"
Cohesion: 0.10
Nodes (76): ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView(), adminSharedEditingView() (+68 more)

### Community 4 - "Tiêu Chí Cho Một Website Đẹp — Hướng Dẫn Đầy Đủ"
Cohesion: 0.09
Nodes (22): 10. Checklist đánh giá nhanh, 11. Công cụ kiểm tra gợi ý, 1. Mở đầu, 2.1. Bố cục (Layout), 2.2. Màu sắc (Color), 2.3. Typography (Chữ), 2.4. Hình ảnh & đa phương tiện, 2.5. Icon & minh họa (+14 more)

### Community 5 - "Template Seed Script"
Cohesion: 0.08
Nodes (31): args, service, user, username, createSurvey(), list(), tracking, createSurveyFromTemplate() (+23 more)

### Community 6 - "Reward Service"
Cohesion: 0.06
Nodes (64): args, dry, project, survey, tracking, user, existing, service (+56 more)

### Community 7 - "Tracking HTTP Controller"
Cohesion: 0.13
Nodes (29): accountLogin(), accounts, assessment(), canEditConfig(), changeAccountPassword(), clearTrackingCookie(), context(), cookieOptions() (+21 more)

### Community 8 - "seed.js"
Cohesion: 0.06
Nodes (34): dependencies, bcrypt@^6.0.0, cors@^2.8.5, dotenv@^16.4.5, exceljs@^4.4.0, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2, @supabase/supabase-js@^2.45.0 (+26 more)

### Community 9 - "Reward Decisions Docs"
Cohesion: 0.09
Nodes (29): Reward System open decisions document, Reward System open decisions interactive HTML form, Copy answers / print to PDF actions, Operations and data: reminders, timezone, retention, real rewards (Q15-Q18), Task catalog and self-report verification (Q1-Q3), Three-band green/yellow/red thresholds and labels (Q7-Q8), Pittsburgh Sleep Quality Index (PSQI) questionnaire, PSQI bed partner items (Q10) (+21 more)

### Community 10 - "ui.js"
Cohesion: 0.09
Nodes (33): Accessibility rules, Components (card, button, form, sheet, toast), Design tokens (purple scale, amber, coral, green), Motion and reduced-motion, Page templates (Home, Landing), Reference self-care pet app image, Responsive layout (tab bar, pill, sidebar), Starter CSS block (+25 more)

### Community 11 - "exports.js"
Cohesion: 0.25
Nodes (12): safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile(), csvCell() (+4 more)

### Community 12 - "rewards.js"
Cohesion: 0.17
Nodes (14): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), complete(), equip(), inventory(), noStore() (+6 more)

### Community 13 - "Project Brief and Docs"
Cohesion: 0.25
Nodes (7): Admin area, brainst0rm Survey Platform, Consent workflow (planned), SQL migrations 001-006, Progress Tracking (migration 006), Tech stack (vanilla JS, Express, Supabase), tracking controllers, services, frontend js/css

### Community 14 - "Reward Design Principles"
Cohesion: 0.22
Nodes (11): Reward System design decisions (answer.md), Self-harm questions restriction, Data-driven task catalog, Support area 'Ban can nguoi dong hanh?', Data retention and deletion, Researcher-configured thresholds, Gentle reminders, no punishment, Control group support (+3 more)

### Community 15 - "Progress Tracking (anonymous participants)"
Cohesion: 0.29
Nodes (7): Survey templates PSQI / HCL-32, Progress Tracking service, 14-day reassessment cycle, Already decided reward system choices, Study design: control group and reassessment interval (Q13-Q14), Progress Tracking (anonymous participants), Comparison rules via scale fingerprint

### Community 16 - "README (none.md)"
Cohesion: 0.20
Nodes (12): Architecture (single Express process, Supabase), Activity log (migration 007), Read/write access roles (viewer read-only), README: brainst0rm Survey Platform (none.md), Admin area and activity log, REST API reference, Response quality scoring and review, Setup and run (+4 more)

### Community 18 - "Consent and Progress Docs"
Cohesion: 0.29
Nodes (6): Assent and guardian consent, Minor assent and consent, Consent workflow (pending), Pending migrations 006-009 on real DB, Psychology analytics, UI refresh

### Community 19 - "Progress Tracking service"
Cohesion: 0.33
Nodes (7): Score bands (migration 008), Phase 2: task catalog, ledger, caps, Sao (TVT) point unit, Shared daily/weekly point cap, Score bands 2-6 levels, Tasks and reward points (phase 2), Standard scales PSQI and HCL-32

### Community 20 - "tracking-accounts.js"
Cohesion: 0.23
Nodes (11): accountResult(), checkPassword(), createTrackingAccountService(), changePassword(), createAccount(), login(), getDummyHash(), MISSING (+3 more)

### Community 21 - "Analytics Docs"
Cohesion: 0.67
Nodes (3): Psychology analytics (alpha, crosstab, Pearson), CSV/XLSX export and PDF report, Researcher review and quality checks

### Community 23 - "ref_node_assert"
Cohesion: 0.28
Nodes (5): canonicalize(), DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset(), VARIABLE_COLUMNS

### Community 24 - "index.js"
Cohesion: 0.17
Nodes (9): requireAdmin(), requireAuth(), a, ad, p, rp, s, t (+1 more)

### Community 25 - "activity-admin.test.js"
Cohesion: 0.14
Nodes (11): cookie-parser@^1.4.6, express@^4.19.2, app, web, r, asAdmin, asUser, asAlice (+3 more)

### Community 26 - "createFakeDb"
Cohesion: 0.21
Nodes (15): useSupabaseForTests(), makeAccounts(), useTrackingService(), errorHandler(), boot(), createFakeDb(), bootDb(), boot() (+7 more)

### Community 27 - "tracking-service.test.js"
Cohesion: 0.28
Nodes (7): addResponse(), consent, enrollFirst(), questions, secondSession(), setup(), surveyRow

### Community 28 - "Reward System plan"
Cohesion: 0.22
Nodes (9): CLAUDE.md (repo guidance), Known pitfalls, Phase 3: pet, streak, Rest Card, Phase 4: task mini-games, Common commands (npm, seed, test), Reward invariant principles, Reward System plan, Timezone and streak with Rest Card (+1 more)

### Community 30 - "village.js"
Cohesion: 0.31
Nodes (8): cat(), disc(), ground(), hero(), plot(), scene(), sceneLabel(), sky()

### Community 31 - "final.md (Lumen completion brief)"
Cohesion: 0.33
Nodes (6): final.md (Lumen completion brief), Completion Criteria, Four Modules (Quality, Analytics, Research, Export), UI/UX Requirements (empty states, controls, tables), Dataset versioning (migration 005), Research Management (migration 004)

## Ambiguous Edges - Review These
- `R-01 Tactical Offload (+30 TVT reverse reward)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to
- `TVT reward points` → `HCL-32 32 TRUE/FALSE high-state statements`  [AMBIGUOUS]
  The London Psychiatry Centre HCL 32.md · relation: conceptually_related_to
- `Y-03 Screen Dimming (+20 TVT)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to
- `Y-04 Peak Block Lock (+15 TVT)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to

## Knowledge Gaps
- **46 isolated node(s):** `css/style.css`, `css/tracking.css`, `Accessibility rules`, `Motion and reduced-motion`, `Page templates (Home, Landing)` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `context()` connect `Tracking HTTP Controller` to `ui.js`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `css/style.css`, `css/tracking.css`, `Accessibility rules` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin and Survey Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.06038709677419355 - nodes in this community are weakly interconnected._
- **Why does `Tracking` connect `ui.js` to `Frontend SPA (app.js)`, `Tracking HTTP Controller`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `R-01 Tactical Offload (+30 TVT reverse reward)` and `App verification approaches (timer, timestamp, character count, self-report)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TVT reward points` and `HCL-32 32 TRUE/FALSE high-state statements`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._