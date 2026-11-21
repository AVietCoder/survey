# Graph Report - lumen-survey-fullstack  (2026-11-21)

## Corpus Check
- 94 files · ~114,781 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 4, (none) 2, .example 1)

## Summary
- 835 nodes · 2276 edges · 31 communities (29 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ef36cf1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Admin and Survey Controllers
- seed-demo-study.js
- Progress Tracking Service
- Frontend SPA (app.js)
- Tiêu Chí Cho Một Website Đẹp — Hướng Dẫn Đầy Đủ
- Template Seed Script
- Reward Service
- Tracking HTTP Controller
- package.json
- App verification approaches (timer, timestamp, character count, self-report)
- ui.js
- exports.js
- rewards.js
- Project Brief and Docs
- Reward Design Principles
- Reward System open decisions document
- README (none.md)
- Consent and Progress Docs
- seed.js
- UI & UX DESIGN RULES — BỘ LUẬT GIAO DIỆN
- Analytics Docs
- ref_node_assert
- quality.js
- middleware/auth.js
- scripts
- Pittsburgh Sleep Quality Index (PSQI) questionnaire
- Reward System plan
- London Psychiatry Centre HCL-32 hypomania checklist questionnaire
- village.js

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 122 edges
2. `ok()` - 87 edges
3. `createTrackingService()` - 67 edges
4. `logActivity()` - 36 edges
5. `createRewardService()` - 31 edges
6. `esc()` - 29 edges
7. `adminView()` - 27 edges
8. `createFakeDb()` - 24 edges
9. `api()` - 23 edges
10. `supabase` - 22 edges

## Surprising Connections (you probably didn't know these)
- `frontend/css/cozy.css` --semantically_similar_to--> `css/cozy.css`  [INFERRED] [semantically similar]
  PROJECT_CONTEXT.md → frontend/index.html
- `Tracking` --indirect_call--> `context()`  [INFERRED]
  frontend/js/tracking.js → backend/src/controllers/tracking.js
- `Typography (Nunito, clamp scale)` --references--> `Nunito Google font`  [INFERRED]
  design-spec-cozy-purple.md → frontend/index.html
- `Sao (TVT) point unit` --conceptually_related_to--> `Tasks and reward points (phase 2)`  [INFERRED]
  docs/answer.md → none.md
- `Tasks and reward points (phase 2)` --semantically_similar_to--> `Phase 2: task catalog, ledger, caps`  [INFERRED] [semantically similar]
  none.md → CLAUDE.md

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
Cohesion: 0.05
Nodes (121): ok(), supabase, activity(), cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey() (+113 more)

### Community 1 - "seed-demo-study.js"
Cohesion: 0.15
Nodes (11): dotenv@^16.4.5, args, dry, project, survey, tracking, user, existing (+3 more)

### Community 2 - "Progress Tracking Service"
Cohesion: 0.06
Nodes (78): consentHash(), createTrackingService(), assessmentDetail(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), configWarnings() (+70 more)

### Community 3 - "Frontend SPA (app.js)"
Cohesion: 0.09
Nodes (82): ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView(), adminSharedEditingView() (+74 more)

### Community 4 - "Tiêu Chí Cho Một Website Đẹp — Hướng Dẫn Đầy Đủ"
Cohesion: 0.09
Nodes (22): 10. Checklist đánh giá nhanh, 11. Công cụ kiểm tra gợi ý, 1. Mở đầu, 2.1. Bố cục (Layout), 2.2. Màu sắc (Color), 2.3. Typography (Chữ), 2.4. Hình ảnh & đa phương tiện, 2.5. Icon & minh họa (+14 more)

### Community 5 - "Template Seed Script"
Cohesion: 0.08
Nodes (29): args, service, user, username, list(), tracking, freq(), FREQUENCY (+21 more)

### Community 6 - "Reward Service"
Cohesion: 0.09
Nodes (52): asDate(), AVATAR_LIMITS, clock(), COMPLETION_TYPES, computeStreak(), createRewardService(), cancelStart(), complete() (+44 more)

### Community 7 - "Tracking HTTP Controller"
Cohesion: 0.08
Nodes (41): accountLogin(), accounts, assessment(), canEditConfig(), changeAccountPassword(), clearTrackingCookie(), context(), cookieOptions() (+33 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (17): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2, @supabase/supabase-js@^2.45.0 (+9 more)

### Community 9 - "App verification approaches (timer, timestamp, character count, self-report)"
Cohesion: 0.25
Nodes (15): Task catalog and self-report verification (Q1-Q3), solution.md: yellow and red group task solutions, R-01 Tactical Offload (+30 TVT reverse reward), R-02 Digital Hard-Stop (+25 TVT), R-03 Physiological Sigh (+20 TVT), R-04 Sleep Floor Recovery (+35 TVT), R-05 Brain Dump Note (+20 TVT), Red group tasks R-01 to R-05 (+7 more)

### Community 10 - "ui.js"
Cohesion: 0.09
Nodes (33): Accessibility rules, Components (card, button, form, sheet, toast), Design tokens (purple scale, amber, coral, green), Motion and reduced-motion, Page templates (Home, Landing), Reference self-care pet app image, Responsive layout (tab bar, pill, sidebar), Starter CSS block (+25 more)

### Community 11 - "exports.js"
Cohesion: 0.28
Nodes (10): safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile(), csvCell() (+2 more)

### Community 12 - "rewards.js"
Cohesion: 0.17
Nodes (14): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), complete(), equip(), inventory(), noStore() (+6 more)

### Community 13 - "Project Brief and Docs"
Cohesion: 0.18
Nodes (10): Four Modules (Quality, Analytics, Research, Export), Admin area, brainst0rm Survey Platform, Consent workflow (planned), Dataset versioning (migration 005), SQL migrations 001-006, Progress Tracking (migration 006), Research Management (migration 004) (+2 more)

### Community 14 - "Reward Design Principles"
Cohesion: 0.18
Nodes (14): Reward System design decisions (answer.md), Self-harm questions restriction, Data-driven task catalog, Support area 'Ban can nguoi dong hanh?', Data retention and deletion, Researcher-configured thresholds, Gentle reminders, no punishment, Control group support (+6 more)

### Community 15 - "Reward System open decisions document"
Cohesion: 0.17
Nodes (10): 14-day reassessment cycle, Reward System open decisions document, Already decided reward system choices, Reward System open decisions interactive HTML form, Copy answers / print to PDF actions, Operations and data: reminders, timezone, retention, real rewards (Q15-Q18), Study design: control group and reassessment interval (Q13-Q14), Three-band green/yellow/red thresholds and labels (Q7-Q8) (+2 more)

### Community 16 - "README (none.md)"
Cohesion: 0.15
Nodes (15): CLAUDE.md (repo guidance), Known pitfalls, Architecture (single Express process, Supabase), Common commands (npm, seed, test), Activity log (migration 007), Read/write access roles (viewer read-only), README: brainst0rm Survey Platform (none.md), Admin area and activity log (+7 more)

### Community 18 - "Consent and Progress Docs"
Cohesion: 0.20
Nodes (9): Assent and guardian consent, Minor assent and consent, final.md (Lumen completion brief), Completion Criteria, UI/UX Requirements (empty states, controls, tables), Consent workflow (pending), Pending migrations 006-009 on real DB, Psychology analytics (+1 more)

### Community 19 - "seed.js"
Cohesion: 0.20
Nodes (6): bcrypt@^6.0.0, old, survey, texts, user, bcrypt

### Community 20 - "UI & UX DESIGN RULES — BỘ LUẬT GIAO DIỆN"
Cohesion: 0.20
Nodes (9): 1. Visual Design, 2. Layout & Structure, 3. Color & Typography, 4. Components, 5. User Experience, 6. Animation & Effects, 7. Responsive & Accessibility, 8. Quality Standards (+1 more)

### Community 21 - "Analytics Docs"
Cohesion: 0.67
Nodes (3): Psychology analytics (alpha, crosstab, Pearson), CSV/XLSX export and PDF report, Researcher review and quality checks

### Community 23 - "ref_node_assert"
Cohesion: 0.40
Nodes (5): canonicalize(), DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset(), VARIABLE_COLUMNS

### Community 24 - "quality.js"
Cohesion: 0.46
Nodes (6): evaluate(), findInconsistentAnswers(), normalize(), SCALE, sig(), stableNormalize()

### Community 25 - "middleware/auth.js"
Cohesion: 0.05
Nodes (63): app, web, useSupabaseForTests(), useSurveyVotes(), useRewardService(), useTrackingService(), errorHandler(), requireAdmin() (+55 more)

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, seed, start, test

### Community 27 - "Pittsburgh Sleep Quality Index (PSQI) questionnaire"
Cohesion: 0.40
Nodes (5): Pittsburgh Sleep Quality Index (PSQI) questionnaire, PSQI bed partner items (Q10), PSQI sleep disturbance frequency items (Q5), PSQI sleep habit items (bedtime, latency, wake time, sleep duration), PSQI subjective quality, sleep medication and daytime dysfunction items (Q6-Q9)

### Community 28 - "Reward System plan"
Cohesion: 0.18
Nodes (12): Score bands (migration 008), Phase 2: task catalog, ledger, caps, Phase 3: pet, streak, Rest Card, Phase 4: task mini-games, Survey templates PSQI / HCL-32, Reward invariant principles, Progress Tracking service, Reward System plan (+4 more)

### Community 29 - "London Psychiatry Centre HCL-32 hypomania checklist questionnaire"
Cohesion: 0.50
Nodes (4): London Psychiatry Centre HCL-32 hypomania checklist questionnaire, HCL-32 impact, reaction, duration and 12-month high-period questions (Q4-Q8), HCL-32 personal info fields (age, gender, center, serial number), HCL-32 32 TRUE/FALSE high-state statements

### Community 30 - "village.js"
Cohesion: 0.25
Nodes (11): avatarSvg(), cat(), cleanAvatar(), disc(), ground(), hero(), heroBody(), plot() (+3 more)

## Ambiguous Edges - Review These
- `HCL-32 32 TRUE/FALSE high-state statements` → `TVT reward points`  [AMBIGUOUS]
  The London Psychiatry Centre HCL 32.md · relation: conceptually_related_to
- `R-01 Tactical Offload (+30 TVT reverse reward)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to
- `Y-03 Screen Dimming (+20 TVT)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to
- `Y-04 Peak Block Lock (+15 TVT)` → `App verification approaches (timer, timestamp, character count, self-report)`  [AMBIGUOUS]
  solution.md · relation: conceptually_related_to

## Knowledge Gaps
- **46 isolated node(s):** `css/style.css`, `css/tracking.css`, `Accessibility rules`, `Motion and reduced-motion`, `Page templates (Home, Landing)` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `context()` connect `Tracking HTTP Controller` to `ui.js`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `css/style.css`, `css/tracking.css`, `Accessibility rules` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin and Survey Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.05055724417426545 - nodes in this community are weakly interconnected._
- **Why does `Tracking` connect `ui.js` to `Frontend SPA (app.js)`, `Tracking HTTP Controller`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `HCL-32 32 TRUE/FALSE high-state statements` and `TVT reward points`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `R-01 Tactical Offload (+30 TVT reverse reward)` and `App verification approaches (timer, timestamp, character count, self-report)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._