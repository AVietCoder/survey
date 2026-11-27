# Graph Report - lumen-survey-fullstack  (2026-11-27)

## Corpus Check
- 123 files · ~135,645 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 1028 nodes · 2834 edges · 48 communities (38 shown, 10 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 208 edges (avg confidence: 0.87)
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
- tracking-accounts.test.js
- components.js
- Research Projects Controller
- backend/package.json
- analytics.js
- yellow-tasks.test.js
- instruments-templates.test.js
- Nhật ký triển khai
- Seed Data Script
- score-bands.test.js
- seed-demo-study.js
- Rewards Controller
- world-ui.js
- middleware/auth.js
- seed-templates.js
- apply-yellow-tasks.js
- Single Express process serving API and SPA frontend
- tracking-scoring.js
- scripts
- world3d/package.json
- world3d.test.js
- 5. Lộ trình chi tiết
- createTrackingService
- ok
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)
- services/tracking.js
- public.js
- tracking-pure.test.js
- ref_node_assert
- createFakeDb
- tracking-schedule.js
- assessmentDetail
- reward.test.js
- Plan: "Làng nhỏ" as a cute 3D voxel adventure

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 130 edges
2. `ok()` - 87 edges
3. `createTrackingService()` - 68 edges
4. `createRewardService()` - 50 edges
5. `logActivity()` - 38 edges
6. `createFakeDb()` - 35 edges
7. `esc()` - 28 edges
8. `adminView()` - 27 edges
9. `createEngine()` - 25 edges
10. `api()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md)` --references--> `normalizeAvatar()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `8. Roadmap` --references--> `computeStreak()`  [INFERRED]
  docs/world3d-plan.md → backend/src/services/reward.js
- `Mini-game "Làng nhỏ" - đã làm` --references--> `village()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22)` --references--> `textareaField()`  [INFERRED]
  docs/implementation-log.md → frontend/js/components.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (48 total, 10 thin omitted)

### Community 0 - "engine.js"
Cohesion: 0.06
Nodes (66): clamp(), createEngine(), animate(), buildHero(), buildMap(), buildPet(), interact(), placeCamera() (+58 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.08
Nodes (90): Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22), ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView() (+82 more)

### Community 2 - "survey-templates.js"
Cohesion: 0.17
Nodes (13): createSurvey(), list(), tracking, createSurveyFromTemplate(), freq(), FREQUENCY, HCL32_ITEMS, HCL32_QUESTIONS (+5 more)

### Community 3 - "reward.js"
Cohesion: 0.06
Nodes (85): requireTracker(), HttpError, requireAdmin(), asDate(), AVATAR_LIMITS, AVATAR_PRESETS, clock(), COMPLETION_TYPES (+77 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.06
Nodes (51): adminCreateItem(), adminCreateTask(), adminSaveSettings(), adminUpdateItem(), adminUpdateTask(), cancelStart(), collectWorld(), complete() (+43 more)

### Community 5 - "Admin Controller"
Cohesion: 0.06
Nodes (28): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+20 more)

### Community 6 - "tracking-accounts.test.js"
Cohesion: 0.21
Nodes (12): makeAccounts(), checkPassword(), createTrackingAccountService(), changePassword(), createAccount(), login(), getDummyHash(), MISSING (+4 more)

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (4): attrs(), button(), card(), textareaField()

### Community 8 - "Research Projects Controller"
Cohesion: 0.05
Nodes (42): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Companion pet (stage 3C, positive states only), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Fake DB test helper (test/helpers/fake-db.js), Frontend CSS/JS load order (style, cozy, tracking, game; ui, tracking, app), Game gate requireStudentAccount (403/503), Progress Tracking (anonymous participant profile, credentials) (+34 more)

### Community 9 - "backend/package.json"
Cohesion: 0.13
Nodes (17): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2, @supabase/supabase-js@^2.45.0 (+9 more)

### Community 10 - "analytics.js"
Cohesion: 0.09
Nodes (44): exceljs@^4.4.0, activity(), listSurveys(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha() (+36 more)

### Community 11 - "yellow-tasks.test.js"
Cohesion: 0.22
Nodes (8): existing, service, SEED_TASKS, differs(), OLD_YELLOW, planYellowUpdate(), boot(), yellow

### Community 12 - "instruments-templates.test.js"
Cohesion: 0.19
Nodes (14): computeHcl32(), computePsqi(), detectInstruments(), frequency(), HCL32_KEYS, instrumentIds, INSTRUMENTS, mapInstrumentItems() (+6 more)

### Community 13 - "Nhật ký triển khai"
Cohesion: 0.12
Nodes (16): requireStudentAccount(), Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md), Chuột điều khiển camera và màn chọn 2D / 3D beta (2026-11-26), Companion pet stage 3C - implemented; manual verification pending, Game 3D, giai đoạn 0: nền tảng (2026-11-26), Game 3D, giai đoạn 1–5 (2026-11-26), Game một màn hình thống nhất (2026-11-21) - đã làm, Mini-game "Làng nhỏ" - đã làm (+8 more)

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "score-bands.test.js"
Cohesion: 0.33
Nodes (5): call(), Q, SNAP, submitWith(), valid()

### Community 16 - "seed-demo-study.js"
Cohesion: 0.25
Nodes (6): args, dry, project, survey, tracking, user

### Community 17 - "Rewards Controller"
Cohesion: 0.20
Nodes (14): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), emmaBody(), ground(), hero() (+6 more)

### Community 18 - "world-ui.js"
Cohesion: 0.17
Nodes (17): celebrate(), collect(), currentMap(), extend(), fail(), guardianPanel(), interact(), mapPanel() (+9 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.10
Nodes (21): app, web, requireAuth(), a, ad, p, r, rp (+13 more)

### Community 20 - "seed-templates.js"
Cohesion: 0.25
Nodes (5): args, service, user, username, TEMPLATES

### Community 22 - "apply-yellow-tasks.js"
Cohesion: 0.29
Nodes (6): dotenv@^16.4.5, apply, own, plan, service, dotenv

### Community 23 - "Single Express process serving API and SPA frontend"
Cohesion: 0.50
Nodes (4): Activity log (logActivity never throws), Single Express process serving API and SPA frontend, Default survey by admin vote (migration 020), Role-based access (getSurveyAccess / READ_ROLES, viewer read-only)

### Community 24 - "tracking-scoring.js"
Cohesion: 0.15
Nodes (18): saveConfig(), BAND_DIRECTIONS, BAND_TONES, buildSnapshot(), computeScore(), defaultLabels(), fingerprintOf(), KEY_PATTERN (+10 more)

### Community 25 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, seed, start, test

### Community 27 - "world3d.test.js"
Cohesion: 0.50
Nodes (3): boot(), CONSTRAINTS, settings()

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.13
Nodes (14): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+6 more)

### Community 29 - "createTrackingService"
Cohesion: 0.18
Nodes (25): consentHash(), createTrackingService(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), createRecoveryLink(), enabledConfigForSlug() (+17 more)

### Community 34 - "ok"
Cohesion: 0.05
Nodes (84): ok(), supabase, cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey(), listResponses() (+76 more)

### Community 38 - "services/tracking.js"
Cohesion: 0.21
Nodes (12): deviceLabel(), expiryFor(), KINDS, newRecoveryCode(), newToken(), normalizeRecoveryCode(), parseCredentialInput(), tokenSecret() (+4 more)

### Community 41 - "public.js"
Cohesion: 0.13
Nodes (17): old, survey, texts, user, surveyVotes, getBySlug(), published(), start() (+9 more)

### Community 42 - "tracking-pure.test.js"
Cohesion: 0.23
Nodes (11): buildHistory(), difference(), round2(), usable(), explainIncompatibility(), isCompatible(), normalizeScoring(), fp (+3 more)

### Community 43 - "ref_node_assert"
Cohesion: 0.12
Nodes (14): TRACKING_CONSTRAINTS, db(), survey, consent, questions, survey, addResponse(), consent (+6 more)

### Community 45 - "createFakeDb"
Cohesion: 0.23
Nodes (18): useSupabaseForTests(), useRewardService(), useTrackingService(), errorHandler(), boot(), createFakeDb(), bootDb(), boot() (+10 more)

### Community 46 - "tracking-schedule.js"
Cohesion: 0.29
Nodes (7): configWarnings(), researcherSummary(), serializeConfig(), DEFAULT_SCHEDULE, intOrNull(), normalizeSchedule(), scheduleStatus()

### Community 47 - "assessmentDetail"
Cohesion: 0.43
Nodes (7): assessmentDetail(), currentAssessment(), describe(), excludedResponseIds(), loadProfileSessions(), overview(), assessmentRef()

### Community 48 - "reward.test.js"
Cohesion: 0.38
Nodes (5): boot(), CONSTRAINTS, FIXTURE_TASKS, session(), thresholds()

### Community 108 - "Plan: "Làng nhỏ" as a cute 3D voxel adventure"
Cohesion: 0.17
Nodes (12): 10. Still needing an authorised person, 1. Context, 2. What exists and is reused, 3. Technology and architecture, 4. Gameplay design, 5. UI/UX, 6. Backend changes (only Phase 3 onward), 7. Risks (+4 more)

## Knowledge Gaps
- **31 isolated node(s):** `Activity log (logActivity never throws)`, `Default survey by admin vote (migration 020)`, `Hero SVG illustration scene`, `Icon and illustration style (flat sticker, ground shadow, pink cheeks)`, `Spacing and layout (4px base, grid)` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 285 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HttpError` connect `reward.js` to `ok`, `survey-templates.js`, `Tracking Controller`, `services/tracking.js`, `tracking-accounts.test.js`, `public.js`, `analytics.js`, `tracking-pure.test.js`, `ref_node_assert`, `Nhật ký triển khai`, `tracking-schedule.js`, `assessmentDetail`, `middleware/auth.js`, `tracking-scoring.js`, `createTrackingService`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Activity log (logActivity never throws)`, `Default survey by admin vote (migration 020)`, `Hero SVG illustration scene` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06288568909785483 - nodes in this community are weakly interconnected._
- **Why does `world()` connect `reward.js` to `engine.js`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `collect()`) actually correct?**
  _`createRewardService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend App SPA` be split into smaller, more focused modules?**
  _Cohesion score 0.07887667887667887 - nodes in this community are weakly interconnected._