# Graph Report - lumen-survey-fullstack  (2026-11-27)

## Corpus Check
- 127 files · ~140,193 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 1074 nodes · 2984 edges · 47 communities (37 shown, 10 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 211 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d46341a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine.js
- Frontend App SPA
- survey-templates.js
- reward.js
- Tracking Controller
- Admin Controller
- exports.js
- components.js
- Research Projects Controller
- seed.js
- analytics.js
- seed-reward-tasks.js
- ok
- Nhật ký triển khai
- Seed Data Script
- score-bands.test.js
- seed-demo-study.js
- Rewards Controller
- world-ui.js
- middleware/auth.js
- seed-templates.js
- yellow-tasks.js
- Single Express process serving API and SPA frontend
- instruments-templates.test.js
- services/surveys.js
- world3d/package.json
- routes/index.js
- 5. Lộ trình chi tiết
- createTrackingService
- HttpError
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)
- ref_node_crypto
- owner-decisions.test.js
- controllers/auth.js
- public.js
- tracking-history.js
- tracking-service.test.js
- createSurveyVotesService
- Plan: "Làng nhỏ" as a cute 3D voxel adventure

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 135 edges
2. `ok()` - 89 edges
3. `createTrackingService()` - 68 edges
4. `createRewardService()` - 54 edges
5. `logActivity()` - 40 edges
6. `createFakeDb()` - 37 edges
7. `esc()` - 28 edges
8. `adminView()` - 27 edges
9. `createEngine()` - 25 edges
10. `supabase` - 24 edges

## Surprising Connections (you probably didn't know these)
- `8. Roadmap` --references--> `computeStreak()`  [INFERRED]
  docs/world3d-plan.md → backend/src/services/reward.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22)` --references--> `textareaField()`  [INFERRED]
  docs/implementation-log.md → frontend/js/components.js
- `UI/UX tổng thể + cảnh báo tốc độ + màn hình kết quả + nút nhiệm vụ (2026-11-22)` --references--> `surveyView()`  [INFERRED]
  docs/implementation-log.md → frontend/js/app.js
- `Giai đoạn 5 — Assent và đồng ý phụ huynh cấu hình được (migration `014`)` --references--> `consentHash()`  [INFERRED]
  docs/reward-roadmap.md → backend/src/services/tracking.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (47 total, 10 thin omitted)

### Community 0 - "engine.js"
Cohesion: 0.06
Nodes (66): clamp(), createEngine(), animate(), buildHero(), buildMap(), buildPet(), interact(), placeCamera() (+58 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.08
Nodes (91): Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22), UI kit dùng chung (2026-11-21, theo tieu-chi-website-dep.md) - đã làm, chưa kiểm tra trình duyệt, ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion() (+83 more)

### Community 2 - "survey-templates.js"
Cohesion: 0.18
Nodes (11): list(), tracking, freq(), FREQUENCY, HCL32_ITEMS, HCL32_QUESTIONS, IMPACT, listTemplates() (+3 more)

### Community 3 - "reward.js"
Cohesion: 0.05
Nodes (82): requireAdmin(), ANSWERED_TASKS, asDate(), AVATAR_LIMITS, AVATAR_PRESETS, clock(), COMPLETION_TYPES, computeStreak() (+74 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.05
Nodes (60): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), collectWorld(), complete(), equip(), inventory() (+52 more)

### Community 5 - "Admin Controller"
Cohesion: 0.06
Nodes (28): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+20 more)

### Community 6 - "exports.js"
Cohesion: 0.12
Nodes (29): loadAnswers(), safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), taskAnswers(), taskAnswersCsv(), taskAnswersXlsx() (+21 more)

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (4): attrs(), button(), card(), textareaField()

### Community 8 - "Research Projects Controller"
Cohesion: 0.05
Nodes (42): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Companion pet (stage 3C, positive states only), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Fake DB test helper (test/helpers/fake-db.js), Frontend CSS/JS load order (style, cozy, tracking, game; ui, tracking, app), Game gate requireStudentAccount (403/503), Progress Tracking (anonymous participant profile, credentials) (+34 more)

### Community 9 - "seed.js"
Cohesion: 0.06
Nodes (34): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+26 more)

### Community 10 - "analytics.js"
Cohesion: 0.16
Nodes (28): supabase, bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+20 more)

### Community 11 - "seed-reward-tasks.js"
Cohesion: 0.40
Nodes (3): existing, service, SEED_TASKS

### Community 12 - "ok"
Cohesion: 0.23
Nodes (24): ok(), addMember(), addNote(), addParticipant(), create(), createDatasetVersion(), datasetVersionResult(), get() (+16 more)

### Community 13 - "Nhật ký triển khai"
Cohesion: 0.10
Nodes (26): requireStudentAccount(), computeHcl32(), computePsqi(), frequency(), HCL32_KEYS, instrumentIds, parseClock(), parseHours() (+18 more)

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "score-bands.test.js"
Cohesion: 0.24
Nodes (8): MIN_GROUP_SIZE, BAND_TONES, boot(), call(), Q, SNAP, submitWith(), valid()

### Community 16 - "seed-demo-study.js"
Cohesion: 0.17
Nodes (12): args, dry, project, psqiBands(), survey, tracking, user, confirmedPsqiCutoffs() (+4 more)

### Community 17 - "Rewards Controller"
Cohesion: 0.20
Nodes (14): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), emmaBody(), ground(), hero() (+6 more)

### Community 18 - "world-ui.js"
Cohesion: 0.17
Nodes (17): celebrate(), collect(), currentMap(), extend(), fail(), guardianPanel(), interact(), mapPanel() (+9 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.09
Nodes (42): useSupabaseForTests(), useRewardService(), useTrackingService(), errorHandler(), r, asAdmin, asUser, boot() (+34 more)

### Community 20 - "seed-templates.js"
Cohesion: 0.20
Nodes (7): dotenv@^16.4.5, args, service, user, username, TEMPLATES, dotenv

### Community 22 - "yellow-tasks.js"
Cohesion: 0.21
Nodes (12): apply, cap, own, plan, service, COMPARED, content(), DAILY_CAP (+4 more)

### Community 23 - "Single Express process serving API and SPA frontend"
Cohesion: 0.50
Nodes (4): Activity log (logActivity never throws), Single Express process serving API and SPA frontend, Default survey by admin vote (migration 020), Role-based access (getSurveyAccess / READ_ROLES, viewer read-only)

### Community 24 - "instruments-templates.test.js"
Cohesion: 0.10
Nodes (20): INSTRUMENTS, mapInstrumentItems(), BAND_DIRECTIONS, computeScore(), defaultLabels(), KEY_PATTERN, MAX_BAND_LEVELS, METHOD_LABEL (+12 more)

### Community 25 - "services/surveys.js"
Cohesion: 0.18
Nodes (17): createSurvey(), create(), get(), list(), remove(), STATUSES, update(), getSharedSurveyEditing() (+9 more)

### Community 27 - "routes/index.js"
Cohesion: 0.12
Nodes (10): app, web, requireAuth(), a, ad, p, rp, s (+2 more)

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.13
Nodes (14): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+6 more)

### Community 29 - "createTrackingService"
Cohesion: 0.10
Nodes (47): consentHash(), createTrackingService(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), configWarnings(), createRecoveryLink() (+39 more)

### Community 34 - "HttpError"
Cohesion: 0.08
Nodes (44): activity(), cleanPassword(), cleanUsername(), createUser(), getSurvey(), listResponses(), listSurveys(), listUsers() (+36 more)

### Community 38 - "ref_node_crypto"
Cohesion: 0.28
Nodes (5): canonicalize(), DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset(), VARIABLE_COLUMNS

### Community 39 - "owner-decisions.test.js"
Cohesion: 0.25
Nodes (10): answered(), boot(), CONFIRMED, CONSTRAINTS, permutations(), psqiSession(), session(), TIMES (+2 more)

### Community 40 - "controllers/auth.js"
Cohesion: 0.50
Nodes (7): login(), logout(), me(), pub(), register(), cookieOpts(), signToken()

### Community 41 - "public.js"
Cohesion: 0.36
Nodes (7): surveyVotes, getBySlug(), published(), start(), submit(), hashIp(), COOKIE_NAME

### Community 42 - "tracking-history.js"
Cohesion: 0.25
Nodes (13): assessmentDetail(), currentAssessment(), describe(), excludedResponseIds(), loadProfileSessions(), overview(), assessmentRef(), buildHistory() (+5 more)

### Community 43 - "tracking-service.test.js"
Cohesion: 0.28
Nodes (7): addResponse(), consent, enrollFirst(), questions, secondSession(), setup(), surveyRow

### Community 44 - "createSurveyVotesService"
Cohesion: 0.47
Nodes (5): createSurveyVotesService(), defaultSurvey(), publishedSurveys(), tally(), vote()

### Community 108 - "Plan: "Làng nhỏ" as a cute 3D voxel adventure"
Cohesion: 0.18
Nodes (11): 10. Still needing an authorised person, 1. Context, 2. What exists and is reused, 3. Technology and architecture, 4. Gameplay design, 5. UI/UX, 7. Risks, 8. Roadmap (+3 more)

## Knowledge Gaps
- **31 isolated node(s):** `Activity log (logActivity never throws)`, `Default survey by admin vote (migration 020)`, `Hero SVG illustration scene`, `Icon and illustration style (flat sticker, ground shadow, pink cheeks)`, `Spacing and layout (4px base, grid)` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 296 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `world()` connect `reward.js` to `engine.js`, `HttpError`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Activity log (logActivity never throws)`, `Default survey by admin vote (migration 020)`, `Hero SVG illustration scene` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06288568909785483 - nodes in this community are weakly interconnected._
- **Why does `HttpError` connect `HttpError` to `survey-templates.js`, `reward.js`, `Tracking Controller`, `exports.js`, `controllers/auth.js`, `public.js`, `analytics.js`, `tracking-history.js`, `ok`, `Nhật ký triển khai`, `createSurveyVotesService`, `middleware/auth.js`, `instruments-templates.test.js`, `services/surveys.js`, `routes/index.js`, `createTrackingService`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `collect()`) actually correct?**
  _`createRewardService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend App SPA` be split into smaller, more focused modules?**
  _Cohesion score 0.0778786430960344 - nodes in this community are weakly interconnected._