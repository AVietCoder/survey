# Plan: "Làng nhỏ" as a cute 3D voxel adventure

## 1. Context

The student game is today a 2D pixel village (inline SVG) with DOM panels. The goal is a third-person 3D voxel adventure: character select, WASD/arrows, run and jump, several maps, collectibles, NPCs, guardians (bosses). The quest system stays as it is: same APIs, tables, points and completion logic. The 3D world is a new presentation layer over it.

## 2. What exists and is reused

| Piece | Where | Use in 3D |
|---|---|---|
| Quest APIs `GET today / village / inventory`, `POST start / cancel / complete / rest-card / equip`, `PUT reminders` | `backend/src/services/reward.js`, `routes/index.js:68-95` | Unchanged |
| Quest UI `taskCard`, `tasksBody`, `wireTasks(data, refresh, root)` | `frontend/js/tracking.js:264, 274, 599` | HTML overlay above the canvas |
| Panels `openPanel` / `closePanel`, `avatarEditor`, login and locked views | `tracking.js:313, 436-597, 675-705` | Reused; hero preview repointed to the 3D model |
| Mini-games (breathing, rest timer, three plans) | `frontend/js/games.js` | Unchanged; breathing rhythm also drives one guardian |
| `BUILDINGS`, `MECHANISMS`, `AVATAR_PARTS`, `CHARACTER_PRESETS`, palette, pet looks | `frontend/js/village.js` | Landmarks, NPC dialogue, voxel colours, character select |
| HUD and panel CSS, mobile bottom sheet, reduced motion | `frontend/css/game.css` | Reused; SVG-world rules stay only for light mode |

## 3. Technology and architecture

- **Three.js**, one exact pinned release copied into `frontend/vendor/three/`. No CDN, no bundler. Loaded by `await import()` only when the game opens, so survey pages download nothing extra (adds a few hundred KB to the game; measure in Phase 0).
- No add-ons: own third-person camera, input, and simple box (AABB) collision; no physics engine. Voxels drawn with `InstancedMesh`. All models and textures are built in code.
- New native ES module folder `frontend/js/world3d/`; the rest of the app stays classic scripts. One bridge object (`window.World3D`) with `mount(container, state)`, `update(state)`, `pause()`, `dispose()`.

```
world3d/
  index.js      bridge, lifecycle, quality settings
  engine.js     renderer, loop, resize, pause when hidden or a panel is open
  input.js      keyboard + touch joystick (ignores keys while typing or in a panel)
  player.js     movement: walk, run, jump, collision
  camera.js     third-person follow camera
  voxel.js      block meshes, avatar and pet models
  maps/*.js     one data file per map (terrain, landmarks, NPCs, collectibles, guardian)
  interact.js   "press E / tap" prompts that call openPanel()
  guardian.js   boss encounters
```

Rule: `world3d/` never calls quest endpoints itself. `tracking.js` fetches data, passes state in, and receives events (`open panel`, `collected`, `guardian done`).

## 4. Gameplay design

**Loop:** open game → pick character (first time) → explore → open today's quests (from HUD or the quest board NPC) → complete them → earn Stars as today → landmarks appear, maps and guardians open → find treasures → fill the collection.

| Map (trial) | Opens at lifetime Stars | Identity | Landmarks (from `BUILDINGS`) | Guardian |
|---|---|---|---|---|
| Làng Khởi Đầu (meadow) | 0 | grass, tents, flowers | tent, garden, hammock, teahouse | Mây Ngái Ngủ |
| Rừng Đèn Lồng (night forest) | 100 | lanterns, clock tower | lantern, clocktower, library | Cú Thao Thức |
| Hồ Trên Mây (sky lake) | 280 | pond, floating islands | pond, observatory, cloud house, big tree | Rồng Sương |

All thresholds, names and guardian conditions are **trial values** that an authorised person must confirm. At the 50 Stars/day cap, map 2 is at least 2 days away and map 3 at least 6.

**Guardians (cannot be lost).** A guardian wakes when its map is open and the student has a set number of completed quests (`village.completions`; trial 5 / 15 / 30). The player calms it with a short interaction: breathing rhythm, collecting light orbs, or an order puzzle. No HP loss, countdown, randomness or failure; leaving and returning is free. Reward: a fixed cosmetic collectible and a celebration. **No Stars.**

**Collectibles.** Fixed, hand-placed treasures per map, including hidden spots. Never random or rare, no Stars. Shown in the collection with silhouettes for ones not yet found.

**Rules carried over from `docs/answer.md`:** every quest opens from the HUD without walking; the support button is always visible; the world never reflects the student's group; no leaderboard or comparison; no sad or hurt characters; no position or movement data is sent or stored.

Quest groups cannot be tied to specific task codes in v1, because survey tasks get generated codes. Gates therefore use Stars and completion counts. Researcher-defined quest groups would be a later backend and admin feature.

## 5. UI/UX

One full-screen game, panels over the canvas, no page navigation, Cozy Purple tokens with chunky block-style buttons.

| Screen | Content |
|---|---|
| Title | Play, choose character, settings, light mode |
| Character select | presets and parts from `AVATAR_PARTS`, companion, rotating 3D preview; saved with existing `equip` |
| HUD | portrait, Stars, quest tracker, next goal, interaction prompt, support, settings, controls hint |
| Quests | existing task cards and mini-games |
| Map | three maps, locked ones show what opens them |
| Bag and collection | existing items plus world treasures and guardian keepsakes |
| Guardian | calm meter that only goes up, instructions, leave button |
| Rewards and achievements | personal milestones only |

Controls: WASD or arrows, Shift run, Space jump, E interact, Esc close, mouse drag to turn camera; on touch, joystick, drag to look, jump and interact buttons (all ≥ 44px). Reduced motion: no camera sway, bobbing or confetti. Keyboard alone must be enough to play.

**Light mode:** today's 2D village stays. It is used when WebGL2 is missing, when the 3D module fails to load, when frame rate stays low (offered, not forced), or when chosen in settings.

## 6. Backend changes (only Phase 3 onward)

Migration `023_world3d.sql` (additive, run by hand; 014–017 stay reserved):
- `reward_settings.world3d_enabled boolean default false`, admin toggle (project rule: new features default off).
- `reward_world_items(profile_id → tracking_profiles on delete cascade, item_key text, found_at, primary key(profile_id, item_key))`, RLS with no policy, revoke from anon/authenticated.

Service additions in `reward.js` (factory with `db`, `clock`): `world(profileId)` and `collect(profileId, key)`. The server holds an allowlist of keys with each map's requirement, checks it, and ignores duplicates through the primary key. Gameplay itself is not verified, which is acceptable for cosmetics. A map with found items stays open even if lifetime Stars later drop (deleting a survey cascades completions).

Routes: `GET /api/track/rewards/world`, `POST /api/track/rewards/world/collect`, behind the existing tracker and student-account gates. Missing migration → 503 with the file name; the 3D world still runs with collecting disabled.

Before Phase 3 the 3D game needs no backend change; it is switched on with a local preview flag (`?world=3d`).

## 7. Risks

| Risk | Handling |
|---|---|
| Deployment to Vercel is not described in the repo; Express presets may not serve `frontend/` the way local does | Phase 0 preview deploy that loads a `/vendor/...js` file with a JavaScript MIME type, before any game code |
| `refresh()` → `gameView()` rewrites `#app` after every quest action and would destroy the canvas | Phase 0 refactor: mount once, refetch, patch HUD and panel |
| No teardown on route change: GPU and listener leaks, `document.onkeydown` leaks into researcher pages | `dispose()` from `render()` and `frame()`, skipped between game routes; `addEventListener` with removal; load generation token |
| Weak school computers and phones | cap pixel ratio at 1.5, low/medium quality, short view distance, pause when hidden or panel open, light mode |
| Per-IP rate limits shared by a whole school | no polling; fetch on entry and after actions only |
| Unlocks are only created by `GET inventory` | call it after every completion (as today) |
| Never writing `innerHTML` per frame (`ui.js` observes the body) | HUD updates only on state change |
| Art volume grows without limit | three maps, a small shared block kit, maps as data files |
| Software WebGL in headless tests says nothing about speed | manual frame-rate check on real hardware |

## 8. Roadmap

| Phase | Deliverable | Done when |
|---|---|---|
| 0. Foundation | Vercel check, vendored Three.js, lifecycle and refresh refactor, load token, WebGL detection and fallback, contract tests for rest card, `computeStreak`, unlocks, `cancelStart` | 2D game behaves as before; tests green; preview deploy serves the vendor file |
| 1. First playable | Meadow map, character, camera, movement, collision, HUD and quest overlay | a quest can be completed inside 3D and Stars update without a reload |
| 2. World | Maps 2 and 3, unlocks, map screen, landmarks, NPCs explaining `MECHANISMS`, character select | progression follows lifetime Stars in seeded states |
| 3. Collection | Migration 023, world APIs, admin toggle, treasures, collection screen | idempotent collecting; 503 and flag-off behaviour tested |
| 4. Guardians | three encounters, keepsakes | no path to failure or Stars; keyboard and touch both work |
| 5. Polish | touch controls, achievements, optional generated sound with mute, quality settings, accessibility and performance | checks in section 9 pass; manual check on a real laptop and phone |

Each phase is reviewed before the next starts. Phases 1–2 are testable with no database change.

## 9. Verification

- `cd backend && npm test` all green, existing quest tests unmodified; new tests for each added rule (gates, duplicates, missing 023, flag off, profile deletion cascade).
- Browser harness on a fake database (Firefox + geckodriver, scratchpad): screenshots at 1440, 820, 390; no horizontal overflow; targets ≥ 44px; Esc and focus return; reduced motion; WebGL disabled → light mode; switching routes repeatedly leaves one canvas at most and none outside the game.
- Regression: survey submission, progress tracking, researcher pages, 2D village.
- Manual on real devices: frame rate (target 30+ fps on a modest laptop), touch controls, Safari.
- After each phase: entry in `docs/implementation-log.md`, status in `docs/reward-roadmap.md`, `graphify update .`; no commit unless asked.

## 10. Still needing an authorised person

Map and guardian thresholds, names and keepsakes; confirmation that calm-guardian encounters are acceptable for the study; whether the research team wants the 3D game active during data collection, since changing the experience mid-study may affect results.
