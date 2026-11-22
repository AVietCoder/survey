# Graph Report - lumen-survey-fullstack  (2026-11-22)

## Corpus Check
- 103 files · ~122,402 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 891 nodes · 2449 edges · 35 communities (31 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 169 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e41cdf8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createTrackingService
- Frontend App SPA
- seed-demo-study.js
- Reward Service
- Tracking Controller
- Admin Controller
- supabase.js
- components.js
- Research Projects Controller
- package.json
- HttpError
- survey-reward-tasks.test.js
- instruments-templates.test.js
- ref_node_assert
- Seed Data Script
- tracking-service.test.js
- survey-votes.test.js
- Rewards Controller
- instruments-templates.test.js
- middleware/auth.js
- Migration Policy & Design Brief
- Pet, Accounts & Game Docs
- Access & Activity Docs
- Survey Votes Controller
- reward.test.js
- seed.js
- activity-admin.test.js
- Auth Controller
- 5. Lộ trình chi tiết
- Tracking Docs & Fake DB
- exports.js
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)

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
- `Giai đoạn 5 — Assent và đồng ý phụ huynh cấu hình được (migration `014`)` --references--> `consentHash()`  [INFERRED]
  docs/reward-roadmap.md → backend/src/services/tracking.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Mini-game "Làng nhỏ" - đã làm` --references--> `village()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `UI kit dùng chung (2026-11-21, theo tieu-chi-website-dep.md) - đã làm, chưa kiểm tra trình duyệt` --references--> `body()`  [INFERRED]
  docs/implementation-log.md → frontend/js/app.js
- `Nâng cấp khảo sát + game (2026-11-20, theo tieu-chi-giao-dien-game.md) - đã làm, chờ chạy migration 020` --references--> `collect()`  [INFERRED]
  docs/implementation-log.md → frontend/js/app.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward tasks with verification approaches** — solution_yellow_tasks, solution_red_tasks, solution_verification_hints [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (35 total, 4 thin omitted)

### Community 0 - "createTrackingService"
Cohesion: 0.05
Nodes (88): consentHash(), createTrackingService(), assessmentDetail(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), configWarnings() (+80 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.08
Nodes (88): ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView(), adminSharedEditingView() (+80 more)

### Community 2 - "seed-demo-study.js"
Cohesion: 0.07
Nodes (26): dotenv@^16.4.5, args, dry, project, survey, tracking, user, existing (+18 more)

### Community 3 - "Reward Service"
Cohesion: 0.08
Nodes (62): asDate(), AVATAR_LIMITS, clock(), COMPLETION_TYPES, computeStreak(), createRewardService(), cancelStart(), complete() (+54 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.06
Nodes (55): adminCreateItem(), adminCreateTask(), adminSaveSettings(), cancelStart(), complete(), equip(), inventory(), noStore() (+47 more)

### Community 5 - "Admin Controller"
Cohesion: 0.05
Nodes (38): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+30 more)

### Community 6 - "supabase.js"
Cohesion: 0.25
Nodes (5): useSupabaseForTests(), asAlice, asBob, boot(), boot()

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (3): attrs(), button(), card()

### Community 8 - "Research Projects Controller"
Cohesion: 0.10
Nodes (21): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Per-response bands in analytics (stage 8, migration 017, planned), Retention and deletion policy (stage 7, migration 016, planned), Reward inventory and unlock catalog (stage 3B, migration 012), Reward service (reward.js factory, ledger, caps), Reward System Plan (roadmap stages 3A-8) (+13 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (24): dependencies, bcrypt@^6.0.0, cors@^2.8.5, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2, @supabase/supabase-js@^2.45.0, name (+16 more)

### Community 10 - "HttpError"
Cohesion: 0.05
Nodes (118): ok(), supabase, activity(), cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey() (+110 more)

### Community 11 - "survey-reward-tasks.test.js"
Cohesion: 0.25
Nodes (9): useRewardService(), errorHandler(), bootHttp(), base, boot(), bootHttp(), CONSTRAINTS, thresholds (+1 more)

### Community 12 - "instruments-templates.test.js"
Cohesion: 0.16
Nodes (11): useTrackingService(), createFakeDb(), TRACKING_CONSTRAINTS, bootDb(), boot(), boot(), consent, questions (+3 more)

### Community 13 - "ref_node_assert"
Cohesion: 0.20
Nodes (4): TYPES, db(), notFound(), survey

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "tracking-service.test.js"
Cohesion: 0.28
Nodes (7): addResponse(), consent, enrollFirst(), questions, secondSession(), setup(), surveyRow

### Community 16 - "survey-votes.test.js"
Cohesion: 0.33
Nodes (6): cookie-parser@^1.4.6, useSurveyVotes(), make(), survey(), UNIQUE, cookie-parser

### Community 17 - "Rewards Controller"
Cohesion: 0.22
Nodes (12): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), ground(), hero(), heroBody() (+4 more)

### Community 18 - "instruments-templates.test.js"
Cohesion: 0.13
Nodes (21): requireStudentAccount(), computeHcl32(), computePsqi(), frequency(), HCL32_KEYS, instrumentIds, parseClock(), parseHours() (+13 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.13
Nodes (12): app, web, requireAdmin(), requireAuth(), a, ad, p, r (+4 more)

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
Cohesion: 0.47
Nodes (4): boot(), CONSTRAINTS, session(), thresholds()

### Community 25 - "seed.js"
Cohesion: 0.12
Nodes (18): old, survey, texts, user, surveyVotes, getBySlug(), published(), start() (+10 more)

### Community 26 - "activity-admin.test.js"
Cohesion: 0.40
Nodes (3): asAdmin, asUser, boot()

### Community 27 - "Auth Controller"
Cohesion: 0.33
Nodes (9): Four modules: Response Quality, Psychology Analytics, Research Management, Export/Reporting, Response quality scoring signals (services/quality.js), Psychology analytics (descriptives, Cronbach alpha, crosstab, Pearson), Dataset versioning (metadata + HMAC checksum), CSV/XLSX export and print-to-PDF report, brainst0rm Project Context (survey platform overview), Research Management (projects, roles, participant codes), Response quality and researcher review (+1 more)

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.13
Nodes (14): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+6 more)

### Community 32 - "Tracking Docs & Fake DB"
Cohesion: 0.40
Nodes (4): Fake DB test helper (test/helpers/fake-db.js), Progress Tracking (anonymous participant profile, credentials), Progress Tracking user docs (enroll, recover, compare rules, schedule), Progress Tracking (migration 006, default off)

### Community 34 - "exports.js"
Cohesion: 0.15
Nodes (16): exceljs@^4.4.0, safeFilename(), sendExport(), surveyCsv(), surveyXlsx(), answerToText(), createCsv(), createCsvFile() (+8 more)

## Ambiguous Edges - Review These
- `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` → `Cozy Purple theme (cozy.css)`  [AMBIGUOUS]
  final.md · relation: conceptually_related_to

## Knowledge Gaps
- **38 isolated node(s):** `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)`, `HCL-32 current vs usual state questions`, `HCL-32 personal info fields (age, gender, centre, number)` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 242 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HttpError` connect `HttpError` to `createTrackingService`, `seed-demo-study.js`, `Reward Service`, `Tracking Controller`, `ref_node_assert`, `instruments-templates.test.js`, `middleware/auth.js`, `seed.js`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createTrackingService` be split into smaller, more focused modules?**
  _Cohesion score 0.05256648113790971 - nodes in this community are weakly interconnected._
- **Why does `1. Trạng thái hiện tại` connect `Reward Service` to `Frontend App SPA`, `Tracking Controller`, `survey-reward-tasks.test.js`, `middleware/auth.js`, `5. Lộ trình chi tiết`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `complete()`) actually correct?**
  _`createRewardService()` has 19 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` and `Cozy Purple theme (cozy.css)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._