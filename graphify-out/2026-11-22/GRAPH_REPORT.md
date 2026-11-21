# Graph Report - lumen-survey-fullstack  (2026-11-21)

## Corpus Check
- 98 files · ~120,246 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 849 nodes · 2346 edges · 30 communities (26 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 133 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8773ff8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Tracking Service Core
- Frontend App SPA
- seed-demo-study.js
- Reward Service
- Tracking Controller
- Admin Controller
- analytics.js
- components.js
- Research Projects Controller
- package.json
- admin.js
- HttpError
- reward.test.js
- survey-templates.js
- Seed Data Script
- public.js
- createSurveyVotesService
- Rewards Controller
- Score Bands & Templates
- Migration Policy & Design Brief
- Pet, Accounts & Game Docs
- Access & Activity Docs
- Survey Votes Controller
- Auth Controller
- ok
- Tracking Docs & Fake DB
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 126 edges
2. `ok()` - 87 edges
3. `createTrackingService()` - 67 edges
4. `logActivity()` - 38 edges
5. `createRewardService()` - 37 edges
6. `esc()` - 28 edges
7. `createFakeDb()` - 27 edges
8. `adminView()` - 27 edges
9. `api()` - 23 edges
10. `supabase` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Assent + guardian consent for minors, versioned and hashed` --semantically_similar_to--> `Assent and guardian consent (stage 5, migration 014, planned)`  [INFERRED] [semantically similar]
  docs/answer.md → CLAUDE.md
- `Control group support (no student self-selection)` --semantically_similar_to--> `Control group and aggregated export (stage 6, migration 015, planned)`  [INFERRED] [semantically similar]
  docs/answer.md → CLAUDE.md
- `Data minimization and retention decided by authority` --semantically_similar_to--> `Retention and deletion policy (stage 7, migration 016, planned)`  [INFERRED] [semantically similar]
  docs/answer.md → CLAUDE.md
- `Asia/Ho_Chi_Minh timezone, streak with Rest Card, no penalty` --semantically_similar_to--> `Streaks and Rest Card (stage 3A, migration 010)`  [INFERRED] [semantically similar]
  docs/answer.md → CLAUDE.md
- `10 overall design principles (no mental-health competition, modular, minimal data)` --semantically_similar_to--> `Reward System Invariant Principles (9 rules)`  [INFERRED] [semantically similar]
  docs/answer.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward tasks with verification approaches** — solution_yellow_tasks, solution_red_tasks, solution_verification_hints [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (30 total, 4 thin omitted)

### Community 0 - "Tracking Service Core"
Cohesion: 0.05
Nodes (90): consentHash(), createTrackingService(), assessmentDetail(), attachForSubmit(), attachSession(), authenticate(), bandForSubmit(), configWarnings() (+82 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.09
Nodes (83): ACTIVITY_GROUPS, addQuestion(), adminActivityView(), adminPager(), adminQualityLabel, adminQuestion(), adminRewardsView(), adminSharedEditingView() (+75 more)

### Community 2 - "seed-demo-study.js"
Cohesion: 0.06
Nodes (26): dotenv@^16.4.5, args, dry, project, survey, tracking, user, old (+18 more)

### Community 3 - "Reward Service"
Cohesion: 0.08
Nodes (57): asDate(), AVATAR_LIMITS, clock(), COMPLETION_TYPES, computeStreak(), createRewardService(), cancelStart(), complete() (+49 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.08
Nodes (43): surveyTasks(), accountLogin(), accounts, assessment(), canEditConfig(), changeAccountPassword(), clearTrackingCookie(), context() (+35 more)

### Community 5 - "Admin Controller"
Cohesion: 0.05
Nodes (38): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+30 more)

### Community 6 - "analytics.js"
Cohesion: 0.14
Nodes (30): listSurveys(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+22 more)

### Community 7 - "components.js"
Cohesion: 0.32
Nodes (3): attrs(), button(), card()

### Community 8 - "Research Projects Controller"
Cohesion: 0.10
Nodes (21): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Per-response bands in analytics (stage 8, migration 017, planned), Retention and deletion policy (stage 7, migration 016, planned), Reward inventory and unlock catalog (stage 3B, migration 012), Reward service (reward.js factory, ledger, caps), Reward System Plan (roadmap stages 3A-8) (+13 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (34): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+26 more)

### Community 10 - "admin.js"
Cohesion: 0.12
Nodes (31): supabase, activity(), createSurvey(), getSurvey(), listResponses(), listUsers(), overview(), pageNumber() (+23 more)

### Community 11 - "HttpError"
Cohesion: 0.17
Nodes (15): cleanPassword(), cleanUsername(), createUser(), updateUser(), me(), HttpError, rewardResult(), scheduleResult() (+7 more)

### Community 12 - "reward.test.js"
Cohesion: 0.05
Nodes (65): app, web, useSupabaseForTests(), useRewardService(), useTrackingService(), errorHandler(), requireAdmin(), requireAuth() (+57 more)

### Community 13 - "survey-templates.js"
Cohesion: 0.17
Nodes (13): createSurvey(), list(), tracking, createSurveyFromTemplate(), freq(), FREQUENCY, HCL32_ITEMS, HCL32_QUESTIONS (+5 more)

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "public.js"
Cohesion: 0.36
Nodes (8): surveyVotes, getBySlug(), published(), start(), submit(), hashIp(), loadQuestions(), COOKIE_NAME

### Community 16 - "createSurveyVotesService"
Cohesion: 0.47
Nodes (5): createSurveyVotesService(), defaultSurvey(), publishedSurveys(), tally(), vote()

### Community 17 - "Rewards Controller"
Cohesion: 0.22
Nodes (12): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), ground(), hero(), heroBody() (+4 more)

### Community 19 - "Score Bands & Templates"
Cohesion: 0.10
Nodes (30): saveSharedEditingSettings(), surveyVotesCast(), surveyVotesClear(), login(), logout(), pub(), register(), adminCreateItem() (+22 more)

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

### Community 27 - "Auth Controller"
Cohesion: 0.33
Nodes (9): Four modules: Response Quality, Psychology Analytics, Research Management, Export/Reporting, Response quality scoring signals (services/quality.js), Psychology analytics (descriptives, Cronbach alpha, crosstab, Pearson), Dataset versioning (metadata + HMAC checksum), CSV/XLSX export and print-to-PDF report, brainst0rm Project Context (survey platform overview), Research Management (projects, roles, participant codes), Response quality and researcher review (+1 more)

### Community 30 - "ok"
Cohesion: 0.17
Nodes (29): ok(), addMember(), addNote(), addParticipant(), create(), createDatasetVersion(), datasetVersionResult(), get() (+21 more)

### Community 32 - "Tracking Docs & Fake DB"
Cohesion: 0.40
Nodes (4): Fake DB test helper (test/helpers/fake-db.js), Progress Tracking (anonymous participant profile, credentials), Progress Tracking user docs (enroll, recover, compare rules, schedule), Progress Tracking (migration 006, default off)

## Ambiguous Edges - Review These
- `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` → `Cozy Purple theme (cozy.css)`  [AMBIGUOUS]
  final.md · relation: conceptually_related_to

## Knowledge Gaps
- **38 isolated node(s):** `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)`, `HCL-32 current vs usual state questions`, `HCL-32 personal info fields (age, gender, centre, number)` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 218 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tracking` connect `Tracking Controller` to `Frontend App SPA`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createTrackingService()` (e.g. with `assessmentDetail()` and `attachForSubmit()`) actually correct?**
  _`createTrackingService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tracking Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.050673854447439354 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `Frontend App SPA` to `Tracking Controller`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `createRewardService()` (e.g. with `cancelStart()` and `complete()`) actually correct?**
  _`createRewardService()` has 19 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` and `Cozy Purple theme (cozy.css)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._