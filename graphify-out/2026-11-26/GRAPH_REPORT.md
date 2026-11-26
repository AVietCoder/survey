# Graph Report - lumen-survey-fullstack  (2026-11-26)

## Corpus Check
- 123 files · ~143,481 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 1053 nodes · 2852 edges · 52 communities (45 shown, 7 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 225 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `523bfe90`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine.js
- Frontend App SPA
- seed-demo-study.js
- reward.js
- Tracking Controller
- Admin Controller
- tracking-accounts.test.js
- components.js
- Research Projects Controller
- package.json
- analytics.js
- services/surveys.js
- instruments-templates.test.js
- Nhật ký triển khai
- Seed Data Script
- createFakeDb
- HttpError
- Rewards Controller
- world-ui.js
- middleware/auth.js
- Migration Policy & Design Brief
- Pet, Accounts & Game Docs
- Access & Activity Docs
- Survey Votes Controller
- tracking-scoring.js
- dataset-versions.js
- world3d/package.json
- Auth Controller
- 5. Lộ trình chi tiết
- createTrackingService
- supabase.js
- exports.js
- Tracking Docs & Fake DB
- controllers/research-projects.js
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)
- services/tracking.js
- createSurveyVotesService
- logActivity
- public.js
- tracking-pure.test.js
- ref_node_assert
- world3d.test.js
- tracking-schedule.js
- assessmentDetail
- reward.test.js
- survey-votes.test.js
- Plan: "Làng nhỏ" as a cute 3D voxel adventure

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 130 edges
2. `ok()` - 87 edges
3. `createTrackingService()` - 68 edges
4. `createRewardService()` - 47 edges
5. `logActivity()` - 38 edges
6. `createFakeDb()` - 33 edges
7. `esc()` - 28 edges
8. `adminView()` - 27 edges
9. `createEngine()` - 24 edges
10. `api()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md)` --references--> `normalizeAvatar()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `Mini-game "Làng nhỏ" - đã làm` --references--> `village()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `UI/UX tổng thể + cảnh báo tốc độ + màn hình kết quả + nút nhiệm vụ (2026-11-22)` --references--> `surveyView()`  [INFERRED]
  docs/implementation-log.md → frontend/js/app.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22)` --references--> `textareaField()`  [INFERRED]
  docs/implementation-log.md → frontend/js/components.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward tasks with verification approaches** — solution_yellow_tasks, solution_red_tasks, solution_verification_hints [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (52 total, 7 thin omitted)

### Community 0 - "engine.js"
Cohesion: 0.06
Nodes (65): clamp(), createEngine(), animate(), buildCharacters(), buildMap(), interact(), placeCamera(), renderOnce() (+57 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.08
Nodes (90): Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22), ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView() (+82 more)

### Community 2 - "seed-demo-study.js"
Cohesion: 0.07
Nodes (27): args, dry, project, survey, tracking, user, existing, service (+19 more)

### Community 3 - "reward.js"
Cohesion: 0.05
Nodes (85): asDate(), AVATAR_LIMITS, AVATAR_PRESETS, clock(), COMPLETION_TYPES, computeStreak(), createRewardService(), cancelStart() (+77 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.07
Nodes (48): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), collectWorld(), complete(), equip(), inventory() (+40 more)

### Community 5 - "Admin Controller"
Cohesion: 0.05
Nodes (38): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+30 more)

### Community 6 - "tracking-accounts.test.js"
Cohesion: 0.23
Nodes (11): makeAccounts(), checkPassword(), createTrackingAccountService(), changePassword(), createAccount(), login(), getDummyHash(), MISSING (+3 more)

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (4): attrs(), button(), card(), textareaField()

### Community 8 - "Research Projects Controller"
Cohesion: 0.11
Nodes (21): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Per-response bands in analytics (stage 8, migration 017, planned), Retention and deletion policy (stage 7, migration 016, planned), Reward inventory and unlock catalog (stage 3B, migration 012), Reward service (reward.js factory, ledger, caps), Reward System Plan (roadmap stages 3A-8) (+13 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (36): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^16.4.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0 (+28 more)

### Community 10 - "analytics.js"
Cohesion: 0.17
Nodes (27): listSurveys(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+19 more)

### Community 11 - "services/surveys.js"
Cohesion: 0.17
Nodes (18): supabase, createSurvey(), updateSurvey(), create(), get(), list(), remove(), STATUSES (+10 more)

### Community 12 - "instruments-templates.test.js"
Cohesion: 0.19
Nodes (14): computeHcl32(), computePsqi(), detectInstruments(), frequency(), HCL32_KEYS, instrumentIds, INSTRUMENTS, mapInstrumentItems() (+6 more)

### Community 13 - "Nhật ký triển khai"
Cohesion: 0.12
Nodes (15): requireStudentAccount(), Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md), Chuột điều khiển camera và màn chọn 2D / 3D beta (2026-11-26), Companion pet stage 3C - implemented; manual verification pending, Game 3D, giai đoạn 0: nền tảng (2026-11-26), Game 3D, giai đoạn 1–5 (2026-11-26), Game một màn hình thống nhất (2026-11-21) - đã làm, Mini-game "Làng nhỏ" - đã làm (+7 more)

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "createFakeDb"
Cohesion: 0.18
Nodes (13): useTrackingService(), createFakeDb(), TRACKING_CONSTRAINTS, bootDb(), boot(), call(), Q, SNAP (+5 more)

### Community 16 - "HttpError"
Cohesion: 0.15
Nodes (24): activity(), cleanPassword(), cleanUsername(), createUser(), getSurvey(), listResponses(), listUsers(), overview() (+16 more)

### Community 17 - "Rewards Controller"
Cohesion: 0.20
Nodes (14): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), emmaBody(), ground(), hero() (+6 more)

### Community 18 - "world-ui.js"
Cohesion: 0.17
Nodes (17): celebrate(), collect(), currentMap(), extend(), fail(), guardianPanel(), interact(), mapPanel() (+9 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.11
Nodes (16): app, web, requireAdmin(), requireAuth(), a, ad, p, r (+8 more)

### Community 20 - "Migration Policy & Design Brief"
Cohesion: 0.16
Nodes (14): Score bands (2-6 levels, computed at submit), Survey templates (PSQI, HCL-32), Friendly group names (Goi Duy tri / Can bang / Dong hanh), no color labels, Score bands docs, standard scales PSQI/HCL-32, template creation, PSQI bed partner items (Q10), Pittsburgh Sleep Quality Index (PSQI) questionnaire, PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9), PSQI sleep disturbance frequency items (Q5a-j) (+6 more)

### Community 21 - "Pet, Accounts & Game Docs"
Cohesion: 0.15
Nodes (10): Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans), Selection, dropdown and form controls consistency requirement, final.md: Lumen full implementation, UI/UX refinement brief, Single UPGRADE_PROGRESS.md progress file rule, QA: functional, UI, regression testing, Tables, cards, loading and feedback states requirements, seed-demo-study.js trial study script, Pending migrations to run (006-013, 018-020) (+2 more)

### Community 22 - "Access & Activity Docs"
Cohesion: 0.25
Nodes (8): Companion pet (stage 3C, positive states only), Frontend CSS/JS load order (style, cozy, tracking, game; ui, tracking, app), Game gate requireStudentAccount (403/503), Student accounts (username+password, migration 019), Unified one-screen game (HUD + world + panels, no tabs), Lang nho village game (pixel SVG, buildings unlocked by total stars), Gentle reminders, no guilt, pet never sad, Cozy Purple theme (cozy.css)

### Community 23 - "Survey Votes Controller"
Cohesion: 0.20
Nodes (11): Activity log (logActivity never throws), Single Express process serving API and SPA frontend, Default survey by admin vote (migration 020), Role-based access (getSurveyAccess / READ_ROLES, viewer read-only), Admin activity log and server-side filtered response table, Admin grant via SQL only (is_admin), Core API reference (surveys, responses, analytics, research, exports, admin), Response quality scoring signals (services/quality.js) (+3 more)

### Community 24 - "tracking-scoring.js"
Cohesion: 0.15
Nodes (18): saveConfig(), BAND_DIRECTIONS, BAND_TONES, buildSnapshot(), computeScore(), defaultLabels(), fingerprintOf(), KEY_PATTERN (+10 more)

### Community 25 - "dataset-versions.js"
Cohesion: 0.32
Nodes (5): canonicalize(), DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset(), VARIABLE_COLUMNS

### Community 27 - "Auth Controller"
Cohesion: 0.39
Nodes (8): Four modules: Response Quality, Psychology Analytics, Research Management, Export/Reporting, Psychology analytics (descriptives, Cronbach alpha, crosstab, Pearson), Dataset versioning (metadata + HMAC checksum), CSV/XLSX export and print-to-PDF report, brainst0rm Project Context (survey platform overview), Research Management (projects, roles, participant codes), Response quality and researcher review, Tech stack (vanilla JS, Node ESM, Express 4, Supabase)

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.13
Nodes (14): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+6 more)

### Community 29 - "createTrackingService"
Cohesion: 0.18
Nodes (25): consentHash(), createTrackingService(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), createRecoveryLink(), enabledConfigForSlug() (+17 more)

### Community 30 - "supabase.js"
Cohesion: 0.20
Nodes (9): useSupabaseForTests(), errorHandler(), asAdmin, asUser, boot(), asAlice, asBob, boot() (+1 more)

### Community 31 - "exports.js"
Cohesion: 0.28
Nodes (10): safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile(), csvCell() (+2 more)

### Community 32 - "Tracking Docs & Fake DB"
Cohesion: 0.40
Nodes (4): Fake DB test helper (test/helpers/fake-db.js), Progress Tracking (anonymous participant profile, credentials), Progress Tracking user docs (enroll, recover, compare rules, schedule), Progress Tracking (migration 006, default off)

### Community 34 - "controllers/research-projects.js"
Cohesion: 0.23
Nodes (24): ok(), addMember(), addNote(), addParticipant(), create(), createDatasetVersion(), datasetVersionResult(), get() (+16 more)

### Community 38 - "services/tracking.js"
Cohesion: 0.21
Nodes (12): deviceLabel(), expiryFor(), KINDS, newRecoveryCode(), newToken(), normalizeRecoveryCode(), parseCredentialInput(), tokenSecret() (+4 more)

### Community 39 - "createSurveyVotesService"
Cohesion: 0.47
Nodes (5): createSurveyVotesService(), defaultSurvey(), publishedSurveys(), tally(), vote()

### Community 40 - "logActivity"
Cohesion: 0.17
Nodes (18): surveyVotesCast(), surveyVotesClear(), login(), logout(), me(), pub(), register(), adminUpdateItem() (+10 more)

### Community 41 - "public.js"
Cohesion: 0.42
Nodes (7): surveyVotes, getBySlug(), published(), start(), submit(), hashIp(), loadQuestions()

### Community 42 - "tracking-pure.test.js"
Cohesion: 0.23
Nodes (11): buildHistory(), difference(), round2(), usable(), explainIncompatibility(), isCompatible(), normalizeScoring(), fp (+3 more)

### Community 43 - "ref_node_assert"
Cohesion: 0.16
Nodes (10): db(), notFound(), survey, addResponse(), consent, enrollFirst(), questions, secondSession() (+2 more)

### Community 45 - "world3d.test.js"
Cohesion: 0.22
Nodes (8): useRewardService(), base, boot(), bootHttp(), CONSTRAINTS, thresholds, CONSTRAINTS, cookie-parser

### Community 46 - "tracking-schedule.js"
Cohesion: 0.29
Nodes (7): configWarnings(), researcherSummary(), serializeConfig(), DEFAULT_SCHEDULE, intOrNull(), normalizeSchedule(), scheduleStatus()

### Community 47 - "assessmentDetail"
Cohesion: 0.43
Nodes (7): assessmentDetail(), currentAssessment(), describe(), excludedResponseIds(), loadProfileSessions(), overview(), assessmentRef()

### Community 48 - "reward.test.js"
Cohesion: 0.38
Nodes (5): boot(), bootHttp(), CONSTRAINTS, session(), thresholds()

### Community 49 - "survey-votes.test.js"
Cohesion: 0.40
Nodes (5): useSurveyVotes(), make(), survey(), UNIQUE, jsonwebtoken

### Community 108 - "Plan: "Làng nhỏ" as a cute 3D voxel adventure"
Cohesion: 0.20
Nodes (10): 10. Still needing an authorised person, 1. Context, 2. What exists and is reused, 3. Technology and architecture, 4. Gameplay design, 5. UI/UX, 7. Risks, 9. Verification (+2 more)

## Ambiguous Edges - Review These
- `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` → `Cozy Purple theme (cozy.css)`  [AMBIGUOUS]
  final.md · relation: conceptually_related_to

## Knowledge Gaps
- **37 isolated node(s):** `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)`, `HCL-32 current vs usual state questions`, `HCL-32 personal info fields (age, gender, centre, number)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 282 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HttpError` connect `HttpError` to `seed-demo-study.js`, `reward.js`, `Tracking Controller`, `tracking-accounts.test.js`, `analytics.js`, `services/surveys.js`, `Nhật ký triển khai`, `middleware/auth.js`, `tracking-scoring.js`, `createTrackingService`, `controllers/research-projects.js`, `services/tracking.js`, `createSurveyVotesService`, `logActivity`, `public.js`, `tracking-pure.test.js`, `ref_node_assert`, `tracking-schedule.js`, `assessmentDetail`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06383619391749473 - nodes in this community are weakly interconnected._
- **Why does `world()` connect `reward.js` to `engine.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `collect()`) actually correct?**
  _`createRewardService()` has 21 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` and `Cozy Purple theme (cozy.css)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._