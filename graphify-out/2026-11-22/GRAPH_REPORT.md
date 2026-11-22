# Graph Report - lumen-survey-fullstack  (2026-11-22)

## Corpus Check
- 104 files · ~124,552 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 897 nodes · 2470 edges · 45 communities (40 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `805f2df8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tracking-scoring.js
- Frontend App SPA
- seed-demo-study.js
- reward.js
- Tracking Controller
- Admin Controller
- admin.js
- components.js
- Research Projects Controller
- package.json
- analytics.js
- createRewardService
- createFakeDb
- services/surveys.js
- Seed Data Script
- tracking-service.test.js
- HttpError
- Rewards Controller
- instruments-templates.test.js
- middleware/auth.js
- Migration Policy & Design Brief
- Pet, Accounts & Game Docs
- Access & Activity Docs
- Survey Votes Controller
- reward.test.js
- seed.js
- services/tracking.js
- Auth Controller
- 5. Lộ trình chi tiết
- createTrackingService
- ok
- survey-templates.js
- Tracking Docs & Fake DB
- controllers/research-projects.js
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)
- tracking-pure.test.js
- Nhật ký triển khai
- middleware/auth.js
- public.js
- assessmentDetail
- tracking-schedule.js

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 128 edges
2. `ok()` - 87 edges
3. `createTrackingService()` - 67 edges
4. `logActivity()` - 38 edges
5. `createRewardService()` - 37 edges
6. `createFakeDb()` - 29 edges
7. `esc()` - 28 edges
8. `adminView()` - 27 edges
9. `api()` - 23 edges
10. `supabase` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Mini-game "Làng nhỏ" - đã làm` --references--> `village()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md)` --references--> `normalizeAvatar()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Giai đoạn 5 — Assent và đồng ý phụ huynh cấu hình được (migration `014`)` --references--> `consentHash()`  [INFERRED]
  docs/reward-roadmap.md → backend/src/services/tracking.js
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

## Communities (45 total, 5 thin omitted)

### Community 0 - "tracking-scoring.js"
Cohesion: 0.10
Nodes (25): bandForSubmit(), isMissingTable(), MIN_GROUP_SIZE, BAND_DIRECTIONS, BAND_TONES, bandFor(), bandForParticipant(), computeScore() (+17 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.08
Nodes (89): Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22), ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView() (+81 more)

### Community 2 - "seed-demo-study.js"
Cohesion: 0.10
Nodes (16): dotenv@^16.4.5, args, dry, project, survey, tracking, user, existing (+8 more)

### Community 3 - "reward.js"
Cohesion: 0.11
Nodes (31): AVATAR_PRESETS, clock(), COMPLETION_TYPES, createSurveyTask(), createTask(), listSurveyTasks(), updateSurveyTask(), updateTask() (+23 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.07
Nodes (48): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), complete(), createSurveyTask(), equip(), inventory() (+40 more)

### Community 5 - "Admin Controller"
Cohesion: 0.05
Nodes (38): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+30 more)

### Community 6 - "admin.js"
Cohesion: 0.17
Nodes (15): supabase, activity(), listResponses(), listUsers(), pageNumber(), saveSharedEditingSettings(), sharedEditingSettings(), STATUSES (+7 more)

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (4): attrs(), button(), card(), textareaField()

### Community 8 - "Research Projects Controller"
Cohesion: 0.10
Nodes (21): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Per-response bands in analytics (stage 8, migration 017, planned), Retention and deletion policy (stage 7, migration 016, planned), Reward inventory and unlock catalog (stage 3B, migration 012), Reward service (reward.js factory, ledger, caps), Reward System Plan (roadmap stages 3A-8) (+13 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (34): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+26 more)

### Community 10 - "analytics.js"
Cohesion: 0.17
Nodes (28): listSurveys(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+20 more)

### Community 11 - "createRewardService"
Cohesion: 0.16
Nodes (31): asDate(), computeStreak(), createRewardService(), cancelStart(), complete(), createItem(), equip(), getSettings() (+23 more)

### Community 12 - "createFakeDb"
Cohesion: 0.10
Nodes (33): useSupabaseForTests(), useRewardService(), useTrackingService(), errorHandler(), asAdmin, asUser, boot(), createFakeDb() (+25 more)

### Community 13 - "services/surveys.js"
Cohesion: 0.22
Nodes (14): createSurvey(), updateSurvey(), create(), get(), remove(), STATUSES, update(), cleanImages() (+6 more)

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "tracking-service.test.js"
Cohesion: 0.28
Nodes (7): addResponse(), consent, enrollFirst(), questions, secondSession(), setup(), surveyRow

### Community 16 - "HttpError"
Cohesion: 0.14
Nodes (26): cleanPassword(), cleanUsername(), createUser(), getSurvey(), removeResponse(), removeSurvey(), removeUser(), surveyVotesCast() (+18 more)

### Community 17 - "Rewards Controller"
Cohesion: 0.20
Nodes (14): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), emmaBody(), ground(), hero() (+6 more)

### Community 18 - "instruments-templates.test.js"
Cohesion: 0.19
Nodes (14): computeHcl32(), computePsqi(), detectInstruments(), frequency(), HCL32_KEYS, instrumentIds, INSTRUMENTS, mapInstrumentItems() (+6 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.11
Nodes (15): app, web, useSurveyVotes(), a, ad, p, r, rp (+7 more)

### Community 20 - "Migration Policy & Design Brief"
Cohesion: 0.16
Nodes (14): Score bands (2-6 levels, computed at submit), Survey templates (PSQI, HCL-32), Friendly group names (Goi Duy tri / Can bang / Dong hanh), no color labels, Score bands docs, standard scales PSQI/HCL-32, template creation, PSQI bed partner items (Q10), Pittsburgh Sleep Quality Index (PSQI) questionnaire, PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9), PSQI sleep disturbance frequency items (Q5a-j) (+6 more)

### Community 21 - "Pet, Accounts & Game Docs"
Cohesion: 0.15
Nodes (10): Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans), Selection, dropdown and form controls consistency requirement, final.md: Lumen full implementation, UI/UX refinement brief, Single UPGRADE_PROGRESS.md progress file rule, QA: functional, UI, regression testing, Tables, cards, loading and feedback states requirements, seed-demo-study.js trial study script, Pending migrations to run (006-013, 018-020) (+2 more)

### Community 22 - "Access & Activity Docs"
Cohesion: 0.20
Nodes (10): Companion pet (stage 3C, positive states only), Frontend CSS/JS load order (style, cozy, tracking, game; ui, tracking, app), Game gate requireStudentAccount (403/503), Student accounts (username+password, migration 019), Unified one-screen game (HUD + world + panels, no tabs), Lang nho village game (pixel SVG, buildings unlocked by total stars), Gentle reminders, no guilt, pet never sad, Cozy Purple theme (cozy.css) (+2 more)

### Community 23 - "Survey Votes Controller"
Cohesion: 0.22
Nodes (10): Activity log (logActivity never throws), Single Express process serving API and SPA frontend, Default survey by admin vote (migration 020), Role-based access (getSurveyAccess / READ_ROLES, viewer read-only), Admin activity log and server-side filtered response table, Admin grant via SQL only (is_admin), Core API reference (surveys, responses, analytics, research, exports, admin), none.md: brainst0rm user documentation (README) (+2 more)

### Community 24 - "reward.test.js"
Cohesion: 0.38
Nodes (5): AVATAR_LIMITS, boot(), CONSTRAINTS, session(), thresholds()

### Community 25 - "seed.js"
Cohesion: 0.18
Nodes (10): old, survey, texts, user, evaluate(), findInconsistentAnswers(), normalize(), SCALE (+2 more)

### Community 26 - "services/tracking.js"
Cohesion: 0.17
Nodes (18): createRecoveryLink(), listCredentials(), mintCredential(), recover(), replaceRecoveryCode(), COOKIE_NAME, expiryFor(), hashToken() (+10 more)

### Community 27 - "Auth Controller"
Cohesion: 0.33
Nodes (9): Four modules: Response Quality, Psychology Analytics, Research Management, Export/Reporting, Response quality scoring signals (services/quality.js), Psychology analytics (descriptives, Cronbach alpha, crosstab, Pearson), Dataset versioning (metadata + HMAC checksum), CSV/XLSX export and print-to-PDF report, brainst0rm Project Context (survey platform overview), Research Management (projects, roles, participant codes), Response quality and researcher review (+1 more)

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.14
Nodes (13): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+5 more)

### Community 29 - "createTrackingService"
Cohesion: 0.22
Nodes (19): consentHash(), createTrackingService(), attachForSubmit(), attachSession(), authenticate(), configWarnings(), enabledConfigForSlug(), enroll() (+11 more)

### Community 30 - "ok"
Cohesion: 0.18
Nodes (14): ok(), overview(), searchUsers(), me(), list(), createSurveyVotesService(), defaultSurvey(), publishedSurveys() (+6 more)

### Community 31 - "survey-templates.js"
Cohesion: 0.17
Nodes (13): createSurvey(), list(), tracking, createSurveyFromTemplate(), freq(), FREQUENCY, HCL32_ITEMS, HCL32_QUESTIONS (+5 more)

### Community 32 - "Tracking Docs & Fake DB"
Cohesion: 0.40
Nodes (4): Fake DB test helper (test/helpers/fake-db.js), Progress Tracking (anonymous participant profile, credentials), Progress Tracking user docs (enroll, recover, compare rules, schedule), Progress Tracking (migration 006, default off)

### Community 34 - "controllers/research-projects.js"
Cohesion: 0.13
Nodes (28): addMember(), addNote(), addParticipant(), create(), createDatasetVersion(), datasetVersionResult(), get(), linkSurvey() (+20 more)

### Community 38 - "tracking-pure.test.js"
Cohesion: 0.23
Nodes (11): buildHistory(), difference(), round2(), usable(), explainIncompatibility(), isCompatible(), normalizeScoring(), fp (+3 more)

### Community 39 - "Nhật ký triển khai"
Cohesion: 0.17
Nodes (11): requireStudentAccount(), Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md), Companion pet stage 3C - implemented; manual verification pending, Game một màn hình thống nhất (2026-11-21) - đã làm, Mini-game "Làng nhỏ" - đã làm, Nhật ký triển khai, Nâng cấp khảo sát + game (2026-11-20, theo tieu-chi-giao-dien-game.md) - đã làm, chờ chạy migration 020, Reward inventory stage 3B (migration 012) - implemented; user reported migration applied (+3 more)

### Community 40 - "middleware/auth.js"
Cohesion: 0.40
Nodes (8): login(), logout(), pub(), register(), cookieOpts(), requireAdmin(), requireAuth(), signToken()

### Community 41 - "public.js"
Cohesion: 0.43
Nodes (6): surveyVotes, getBySlug(), published(), start(), submit(), hashIp()

### Community 42 - "assessmentDetail"
Cohesion: 0.43
Nodes (7): assessmentDetail(), currentAssessment(), describe(), excludedResponseIds(), loadProfileSessions(), overview(), assessmentRef()

### Community 43 - "tracking-schedule.js"
Cohesion: 0.40
Nodes (5): researcherSummary(), DEFAULT_SCHEDULE, intOrNull(), normalizeSchedule(), scheduleStatus()

## Ambiguous Edges - Review These
- `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` → `Cozy Purple theme (cozy.css)`  [AMBIGUOUS]
  final.md · relation: conceptually_related_to

## Knowledge Gaps
- **38 isolated node(s):** `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)`, `HCL-32 current vs usual state questions`, `HCL-32 personal info fields (age, gender, centre, number)` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 243 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HttpError` connect `HttpError` to `tracking-scoring.js`, `reward.js`, `Tracking Controller`, `admin.js`, `analytics.js`, `createRewardService`, `createFakeDb`, `services/surveys.js`, `services/tracking.js`, `createTrackingService`, `ok`, `survey-templates.js`, `controllers/research-projects.js`, `tracking-pure.test.js`, `Nhật ký triển khai`, `middleware/auth.js`, `public.js`, `assessmentDetail`, `tracking-schedule.js`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tracking-scoring.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Why does `Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22)` connect `Frontend App SPA` to `Nhật ký triển khai`, `services/surveys.js`, `components.js`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `complete()`) actually correct?**
  _`createRewardService()` has 19 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` and `Cozy Purple theme (cozy.css)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._