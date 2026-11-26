# Graph Report - lumen-survey-fullstack  (2026-11-26)

## Corpus Check
- 111 files · ~427,334 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 3980 nodes · 7795 edges · 201 communities (101 shown, 100 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 480 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `daabcc62`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tracking-scoring.js
- Frontend App SPA
- seed-demo-study.js
- reward.js
- Tracking Controller
- Admin Controller
- three.core.js
- components.js
- Research Projects Controller
- package.json
- analytics.js
- three.module.js
- Vector3
- Vector2
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
- PMREMGenerator
- Vector4
- services/tracking.js
- Auth Controller
- 5. Lộ trình chi tiết
- createTrackingService
- WebGLRenderer
- BufferGeometry
- Tracking Docs & Fake DB
- controllers/research-projects.js
- Hero SVG illustration scene
- Spacing and layout (4px base, grid)
- tracking-pure.test.js
- Color
- rewards.js
- public.js
- Material
- createTrackingService
- earcutLinked
- BufferAttribute
- Quaternion
- Object3D
- WebGLTextures
- Box3
- .setAttribute
- Euler
- AnimationAction
- Mesh
- Texture
- Matrix4
- KeyframeTrack
- Line
- Matrix3
- AnimationClip
- AnimationMixer
- BatchedMesh
- .getAttribute
- WebGLState
- Interpolant
- FileLoader
- Audio
- Timer
- Box2
- Plane
- WebGLProgram
- .constructor
- LineSegments
- ObjectLoader
- Frustum
- PropertyBinding
- Sphere
- arraysEqual
- InterleavedBufferAttribute
- Ray
- WebGLUniforms
- WebGLBindingStates
- InstancedMesh
- Light
- Loader
- WebXRController
- Triangle
- PerspectiveCamera
- Curve
- error
- WebXRManager
- WebGLShadowMap
- warn
- PolyhedronGeometry
- .parseObject
- PositionalAudio
- PropertyMixer
- .clamp
- SphericalHarmonics3
- WebGLLights
- .constructor
- RenderTarget
- OrthographicCamera
- Path
- InterleavedBuffer
- Line3
- WebGLMaterials
- Plan: "Làng nhỏ" as a cute 3D voxel adventure
- .constructor
- Skeleton
- LightShadow
- MeshPhysicalMaterial
- QuadraticBezierCurve
- WebGLUniformsGroups
- Composite
- addShape
- LoadingManager
- WebGLPrograms
- initGLContext
- EventDispatcher
- CubicBezierCurve3
- CurvePath
- Float16BufferAttribute
- SpotLight
- VideoTexture
- WebGLRenderList
- WebGLShaderCache
- Plan: "Làng nhỏ" as a cute 3D voxel adventure
- generateUUID
- Raycaster
- CubeTexture
- DataArrayTexture
- ExternalTexture
- .dispose
- Layers
- QuadraticBezierCurve3
- setupRenderTarget
- WebGLOutput
- .parse
- SplineCurve
- CompressedArrayTexture
- LineCurve
- LineCurve3
- LOD
- UniformsGroup
- .constructor
- EllipseCurve
- .setInstanceCount
- Camera
- CubicBezierCurve
- Shape
- WebGLBackground
- PointLight
- WebGLClipping
- WebGLGeometries
- ._updateDrawParameters
- Cylindrical
- denormalize
- GLBufferAttribute
- MaterialLoader
- Points
- Sprite
- flatten
- world-support.js
- CatmullRomCurve3
- Clock
- InstancedInterleavedBuffer
- WebGLAttributes
- WebGLIndexedBufferRenderer
- WebGLProperties
- scripts
- cloneUniforms
- ExtrudeGeometry
- ImageBitmapLoader
- Matrix2
- TextureUtils
- WebGLCapabilities
- AudioAnalyser
- DataTextureLoader
- .load
- getNormalizationScale
- probeAsync
- Uniform
- README.md
- checkGeometryIntersection
- CubicPoly
- .lerp
- euclideanModulo
- getKeyframeOrder
- Int32BufferAttribute
- Uint16BufferAttribute
- Uint8BufferAttribute
- Uint8ClampedBufferAttribute

## God Nodes (most connected - your core abstractions)
1. `HttpError` - 128 edges
2. `Vector3` - 112 edges
3. `Vector2` - 90 edges
4. `ok()` - 87 edges
5. `Object3D` - 72 edges
6. `warn()` - 69 edges
7. `BufferGeometry` - 69 edges
8. `createTrackingService()` - 67 edges
9. `Vector4` - 65 edges
10. `BufferAttribute` - 56 edges

## Surprising Connections (you probably didn't know these)
- `8. Roadmap` --references--> `computeStreak()`  [INFERRED]
  curplan.md → backend/src/services/reward.js
- `Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration` --references--> `mintCredential()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/tracking.js
- `Mini-game "Làng nhỏ" - đã làm` --references--> `village()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js
- `Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22)` --references--> `textareaField()`  [INFERRED]
  docs/implementation-log.md → frontend/js/components.js
- `Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md)` --references--> `normalizeAvatar()`  [INFERRED]
  docs/implementation-log.md → backend/src/services/reward.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cozy Purple UI style system** — design_spec_cozy_purple_design_tokens, design_spec_cozy_purple_typography, design_spec_cozy_purple_chunky_edge, design_spec_cozy_purple_starter_css [EXTRACTED 1.00]
- **Reward system open decision categories** — docs_reward_system_open_decisions_task_content, docs_reward_system_open_decisions_points_cap, docs_reward_system_open_decisions_bands, docs_reward_system_open_decisions_consent [EXTRACTED 1.00]
- **Reward tasks with verification approaches** — solution_yellow_tasks, solution_red_tasks, solution_verification_hints [EXTRACTED 1.00]
- **Reward System design source documents** — docs_answer_decisions, claude_reward_system_plan, claude_invariant_principles, docs_answer_overall_principles [INFERRED 0.85]
- **Standard scale instruments feeding templates and score bands** — pittsburgh_sleep_quality_index_psqi_instrument, the_london_psychiatry_centre_hcl_32_instrument, claude_survey_templates, claude_score_bands [INFERRED 0.85]
- **Student game flow: account gate, unified game screen, village, pet** — claude_student_accounts, claude_game_gate, claude_unified_game_screen, claude_village_game, claude_companion_pet [INFERRED 0.85]

## Communities (201 total, 100 thin omitted)

### Community 0 - "tracking-scoring.js"
Cohesion: 0.11
Nodes (24): saveConfig(), MIN_GROUP_SIZE, BAND_DIRECTIONS, BAND_TONES, buildSnapshot(), computeScore(), defaultLabels(), fingerprintOf() (+16 more)

### Community 1 - "Frontend App SPA"
Cohesion: 0.06
Nodes (103): requireStudentAccount(), Ba kiểu nhân vật + đổi thú cưng nhanh hơn (2026-11-22, theo newtask.md), Companion pet stage 3C - implemented; manual verification pending, Game 3D, giai đoạn 0: nền tảng (2026-11-26), Game một màn hình thống nhất (2026-11-21) - đã làm, Giao diện nhiệm vụ theo kiểu + câu hỏi giờ trong ngày + tải ảnh (2026-11-22), Mini-game "Làng nhỏ" - đã làm, Nhật ký triển khai (+95 more)

### Community 2 - "seed-demo-study.js"
Cohesion: 0.05
Nodes (37): dotenv@^16.4.5, args, dry, project, survey, tracking, user, old (+29 more)

### Community 3 - "reward.js"
Cohesion: 0.07
Nodes (65): asDate(), AVATAR_LIMITS, AVATAR_PRESETS, COMPLETION_TYPES, computeStreak(), createRewardService(), cancelStart(), complete() (+57 more)

### Community 4 - "Tracking Controller"
Cohesion: 0.11
Nodes (33): surveyTasks(), accountLogin(), accounts, assessment(), canEditConfig(), changeAccountPassword(), clearTrackingCookie(), context() (+25 more)

### Community 5 - "Admin Controller"
Cohesion: 0.05
Nodes (38): Accessibility (contrast, 44px targets, reduced motion), Design tokens (purple scale, amber accent, radius, edges), Design Spec Cozy Purple, Motion spec (breathing, pop 320ms, meter 600ms), Progress inset card and meter, Responsive breakpoints (tab bar to pill to sidebar), Starter CSS (tokens, layout, components), Bottom tab bar component (+30 more)

### Community 6 - "three.core.js"
Cohesion: 0.01
Nodes (230): RFC-3987, _addedEvent, _alignedPosition, _axis, _baseVector, _batchIntersects, _boneMatrix, _box (+222 more)

### Community 7 - "components.js"
Cohesion: 0.24
Nodes (4): attrs(), button(), card(), textareaField()

### Community 8 - "Research Projects Controller"
Cohesion: 0.10
Nodes (21): Decisions reserved for authorized people (thresholds, support channel, consent, retention), Assent and guardian consent (stage 5, migration 014, planned), Control group and aggregated export (stage 6, migration 015, planned), Per-response bands in analytics (stage 8, migration 017, planned), Retention and deletion policy (stage 7, migration 016, planned), Reward inventory and unlock catalog (stage 3B, migration 012), Reward service (reward.js factory, ledger, caps), Reward System Plan (roadmap stages 3A-8) (+13 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (28): dependencies, bcrypt@^6.0.0, cookie-parser@^1.4.6, cors@^2.8.5, exceljs@^4.4.0, express@^4.19.2, express-rate-limit@^7.4.0, jsonwebtoken@^9.0.2 (+20 more)

### Community 10 - "analytics.js"
Cohesion: 0.15
Nodes (31): listSurveys(), bars(), bySurvey(), calculateCompletionRate(), calculateCorrelation(), calculateCronbachAlpha(), describeNumeric(), fetchAll() (+23 more)

### Community 11 - "three.module.js"
Cohesion: 0.01
Nodes (44): ColorManagement, getConsoleFunction(), InterpolationSamplingType, MathUtils, MOUSE, RenderObjectRefreshType, ReversedDepthFuncs, setConsoleFunction() (+36 more)

### Community 12 - "Vector3"
Cohesion: 0.04
Nodes (3): buildPlane(), generateTorso(), Vector3

### Community 14 - "Seed Data Script"
Cohesion: 0.28
Nodes (16): accessibleName(), choose(), close(), dismiss(), enabledOptions(), enhance(), enhanceTree(), focusOption() (+8 more)

### Community 15 - "tracking-service.test.js"
Cohesion: 0.28
Nodes (7): addResponse(), consent, enrollFirst(), questions, secondSession(), setup(), surveyRow

### Community 16 - "HttpError"
Cohesion: 0.08
Nodes (49): activity(), cleanPassword(), cleanUsername(), createSurvey(), createUser(), getSurvey(), listResponses(), listUsers() (+41 more)

### Community 17 - "Rewards Controller"
Cohesion: 0.20
Nodes (14): avatarSvg(), cleanAvatar(), companion(), companionBody(), disc(), emmaBody(), ground(), hero() (+6 more)

### Community 18 - "instruments-templates.test.js"
Cohesion: 0.18
Nodes (15): computeHcl32(), computePsqi(), frequency(), HCL32_KEYS, instrumentIds, INSTRUMENTS, mapInstrumentItems(), parseClock() (+7 more)

### Community 19 - "middleware/auth.js"
Cohesion: 0.07
Nodes (53): app, web, useSupabaseForTests(), useRewardService(), useTrackingService(), errorHandler(), requireAdmin(), requireAuth() (+45 more)

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

### Community 24 - "PMREMGenerator"
Cohesion: 0.07
Nodes (22): BoxGeometry, CubeCamera, floorPowerOfTwo(), RawShaderMaterial, ShaderMaterial, _createRenderTarget(), _getBlurMaterial(), _getCubemapMaterial() (+14 more)

### Community 26 - "services/tracking.js"
Cohesion: 0.26
Nodes (13): authenticate(), mintCredential(), recover(), expiryFor(), hashToken(), isUsable(), KINDS, newRecoveryCode() (+5 more)

### Community 27 - "Auth Controller"
Cohesion: 0.33
Nodes (9): Four modules: Response Quality, Psychology Analytics, Research Management, Export/Reporting, Response quality scoring signals (services/quality.js), Psychology analytics (descriptives, Cronbach alpha, crosstab, Pearson), Dataset versioning (metadata + HMAC checksum), CSV/XLSX export and print-to-PDF report, brainst0rm Project Context (survey platform overview), Research Management (projects, roles, participant codes), Response quality and researcher review (+1 more)

### Community 28 - "5. Lộ trình chi tiết"
Cohesion: 0.14
Nodes (13): 3. Quyết định đã chốt, 5. Lộ trình chi tiết, 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm), 7. Checklist trước khi báo hoàn thành một giai đoạn, Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy, Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`), Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`), Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ (+5 more)

### Community 29 - "createTrackingService"
Cohesion: 0.18
Nodes (17): consentHash(), attachForSubmit(), attachSession(), bandForSubmit(), enabledConfigForSlug(), enroll(), getConfig(), hasConsent() (+9 more)

### Community 31 - "BufferGeometry"
Cohesion: 0.06
Nodes (10): BufferGeometry, CapsuleGeometry, CircleGeometry, LatheGeometry, PlaneGeometry, RingGeometry, ShapeGeometry, TorusGeometry (+2 more)

### Community 32 - "Tracking Docs & Fake DB"
Cohesion: 0.40
Nodes (4): Fake DB test helper (test/helpers/fake-db.js), Progress Tracking (anonymous participant profile, credentials), Progress Tracking user docs (enroll, recover, compare rules, schedule), Progress Tracking (migration 006, default off)

### Community 34 - "controllers/research-projects.js"
Cohesion: 0.13
Nodes (33): ok(), addMember(), addNote(), addParticipant(), create(), createDatasetVersion(), datasetVersionResult(), get() (+25 more)

### Community 38 - "tracking-pure.test.js"
Cohesion: 0.27
Nodes (9): buildHistory(), difference(), round2(), usable(), explainIncompatibility(), isCompatible(), fp, questions (+1 more)

### Community 39 - "Color"
Cohesion: 0.07
Nodes (6): Color, handleAlpha(), createColorManagement(), hue2rgb(), LinearToSRGB(), SRGBToLinear()

### Community 40 - "rewards.js"
Cohesion: 0.10
Nodes (30): surveyVotesCast(), surveyVotesClear(), login(), logout(), me(), pub(), register(), adminCreateItem() (+22 more)

### Community 41 - "public.js"
Cohesion: 0.20
Nodes (14): surveyVotes, getBySlug(), published(), start(), submit(), tracking, evaluate(), findInconsistentAnswers() (+6 more)

### Community 42 - "Material"
Cohesion: 0.06
Nodes (10): LineDashedMaterial, Material, MeshDepthMaterial, MeshDistanceMaterial, MeshMatcapMaterial, MeshNormalMaterial, MeshToonMaterial, PointsMaterial (+2 more)

### Community 43 - "createTrackingService"
Cohesion: 0.16
Nodes (20): createTrackingService(), assessmentDetail(), configWarnings(), createRecoveryLink(), currentAssessment(), describe(), excludedResponseIds(), listCredentials() (+12 more)

### Community 45 - "earcutLinked"
Cohesion: 0.08
Nodes (35): addContour(), compareXYSlope(), createNode(), cureLocalIntersections(), earcut(), Earcut, earcutLinked(), eliminateHole() (+27 more)

### Community 46 - "BufferAttribute"
Cohesion: 0.07
Nodes (5): BufferAttribute, convertBufferAttribute(), Int16BufferAttribute, Int8BufferAttribute, Uint32BufferAttribute

### Community 49 - "WebGLTextures"
Cohesion: 0.12
Nodes (35): getByteLength(), getTextureTypeByteLength(), WebGLTextures(), createCanvas(), deallocateRenderTarget(), deallocateTexture(), deleteTexture(), destroyRenderTarget() (+27 more)

### Community 51 - ".setAttribute"
Cohesion: 0.12
Nodes (4): arrayNeedsUint32(), Float32BufferAttribute, isUniqueEdge(), LineBasicMaterial

### Community 52 - "Euler"
Cohesion: 0.09
Nodes (4): Euler, MeshLambertMaterial, MeshPhongMaterial, Scene

### Community 54 - "Mesh"
Cohesion: 0.08
Nodes (6): HemisphereLightHelper, Mesh, MeshBasicMaterial, PointLightHelper, SkinnedMesh, SphereGeometry

### Community 55 - "Texture"
Cohesion: 0.08
Nodes (6): CanvasTexture, FramebufferTexture, HTMLTexture, Source, Texture, TextureSource

### Community 57 - "KeyframeTrack"
Cohesion: 0.10
Nodes (8): BooleanKeyframeTrack, ColorKeyframeTrack, KeyframeTrack, QuaternionKeyframeTrack, scaleTangentTimes(), shiftTangentTimes(), StringKeyframeTrack, VectorKeyframeTrack

### Community 58 - "Line"
Cohesion: 0.09
Nodes (7): ArrowHelper, checkIntersection(), ConeGeometry, CylinderGeometry, DirectionalLightHelper, Line, PlaneHelper

### Community 59 - "Matrix3"
Cohesion: 0.10
Nodes (3): Matrix3, warnOnce(), WebGLExtensions()

### Community 60 - "AnimationClip"
Cohesion: 0.09
Nodes (7): AnimationClip, AnimationLoader, AnimationUtils, getTrackTypeForValueTypeName(), NumberKeyframeTrack, parseKeyframeTrack(), subclip()

### Community 63 - ".getAttribute"
Cohesion: 0.11
Nodes (8): CameraHelper, addLine(), addPoint(), copyAttributeData(), EdgesGeometry, getBoneList(), setPoint(), SkeletonHelper

### Community 64 - "WebGLState"
Cohesion: 0.12
Nodes (12): WebGLState(), ColorBuffer(), DepthBuffer(), disable(), enable(), setBlending(), setCullFace(), setFlipSided() (+4 more)

### Community 65 - "Interpolant"
Cohesion: 0.10
Nodes (8): BezierInterpolant, cubicBezierSlope(), CubicInterpolant, DiscreteInterpolant, Interpolant, LinearInterpolant, QuaternionLinearInterpolant, solveBezierParameter()

### Community 66 - "FileLoader"
Cohesion: 0.12
Nodes (7): handleError(), BufferGeometryLoader, CompressedTextureLoader, FileLoader, readData(), HttpError, LoaderUtils

### Community 68 - "Timer"
Cohesion: 0.10
Nodes (3): AudioContext, AudioListener, Timer

### Community 71 - "WebGLProgram"
Cohesion: 0.09
Nodes (19): filterEmptyLine(), generateDefines(), generateEnvMapBlendingDefine(), generateEnvMapModeDefine(), generatePrecision(), generateShadowMapTypeDefine(), generateVertexExtensions(), getEncodingComponents() (+11 more)

### Community 72 - ".constructor"
Cohesion: 0.15
Nodes (18): getDFGLUT(), countLightProbeGrids(), deallocateMaterial(), getProgram(), getProgramVariant(), getUniformList(), markUniformsLightsNeedsUpdate(), materialNeedsLights() (+10 more)

### Community 73 - "LineSegments"
Cohesion: 0.10
Nodes (7): AxesHelper, Box3Helper, BoxHelper, GridHelper, LineSegments, PolarGridHelper, SpotLightHelper

### Community 74 - "ObjectLoader"
Cohesion: 0.18
Nodes (5): DataTexture, ObjectLoader, deserializeImage(), loadImage(), parseConstant()

### Community 78 - "arraysEqual"
Cohesion: 0.17
Nodes (22): allocTexUnits(), arraysEqual(), copyArray(), initShadowTexture(), setValueM2(), setValueM3(), setValueM4(), setValueT1() (+14 more)

### Community 81 - "WebGLUniforms"
Cohesion: 0.10
Nodes (12): addUniform(), fetchAttributeLocations(), getPureArraySetter(), getShaderErrors(), getSingularSetter(), handleSource(), parseUniform(), PureArrayUniform (+4 more)

### Community 82 - "WebGLBindingStates"
Cohesion: 0.19
Nodes (21): WebGLBindingStates(), bindVertexArrayObject(), createBindingState(), createVertexArrayObject(), deleteVertexArrayObject(), disableUnusedAttributes(), dispose(), enableAttribute() (+13 more)

### Community 83 - "InstancedMesh"
Cohesion: 0.14
Nodes (4): 3. Technology and architecture, 3. Technology and architecture, InstancedBufferAttribute, InstancedMesh

### Community 84 - "Light"
Cohesion: 0.10
Nodes (5): AmbientLight, HemisphereLight, Light, LightProbe, RectAreaLight

### Community 85 - "Loader"
Cohesion: 0.11
Nodes (4): AudioLoader, ImageLoader, Loader, TextureLoader

### Community 90 - "error"
Cohesion: 0.12
Nodes (14): enhanceLogMessage(), error(), WebGLInfo(), update(), compressedTexImage2D(), compressedTexImage3D(), compressedTexSubImage2D(), compressedTexSubImage3D() (+6 more)

### Community 92 - "WebGLShadowMap"
Cohesion: 0.17
Nodes (8): CubeDepthTexture, DepthTexture, WebGLRenderTarget, WebGLShadowMap(), getDepthMaterial(), onMaterialDispose(), renderObject(), VSMPass()

### Community 93 - "warn"
Cohesion: 0.15
Nodes (7): createCanvasElement(), createElementNS(), ImageUtils, serializeImage(), setQuaternionFromProperEuler(), warn(), allocateTextureUnit()

### Community 94 - "PolyhedronGeometry"
Cohesion: 0.13
Nodes (5): DodecahedronGeometry, IcosahedronGeometry, OctahedronGeometry, PolyhedronGeometry, TetrahedronGeometry

### Community 95 - ".parseObject"
Cohesion: 0.13
Nodes (6): Fog, FogExp2, LineLoop, getGeometry(), getMaterial(), getTexture()

### Community 100 - "WebGLLights"
Cohesion: 0.13
Nodes (8): shadowCastingAndTexturingLightsFirst(), ShadowUniformsCache(), UniformsCache(), WebGLLights(), setup(), WebGLRenderState(), WebGLRenderStates(), get()

### Community 101 - ".constructor"
Cohesion: 0.25
Nodes (11): applyRadius(), azimuth(), correctSeam(), correctUV(), correctUVs(), generateUVs(), getVertexByIndex(), inclination() (+3 more)

### Community 102 - "RenderTarget"
Cohesion: 0.20
Nodes (4): Data3DTexture, RenderTarget, RenderTarget3D, WebGL3DRenderTarget

### Community 103 - "OrthographicCamera"
Cohesion: 0.18
Nodes (3): DirectionalLight, DirectionalLightShadow, OrthographicCamera

### Community 107 - "WebGLMaterials"
Cohesion: 0.33
Nodes (14): WebGLMaterials(), refreshMaterialUniforms(), refreshTransformUniform(), refreshUniformsCommon(), refreshUniformsDash(), refreshUniformsDistance(), refreshUniformsLine(), refreshUniformsMatcap() (+6 more)

### Community 108 - "Plan: "Làng nhỏ" as a cute 3D voxel adventure"
Cohesion: 0.15
Nodes (12): clock(), 6. Backend changes (only Phase 3 onward), 10. Still needing an authorised person, 1. Context, 2. What exists and is reused, 4. Gameplay design, 5. UI/UX, 6. Backend changes (only Phase 3 onward) (+4 more)

### Community 109 - ".constructor"
Cohesion: 0.21
Nodes (5): ArrayCamera, WebGLAnimation(), onInputSourcesChange(), onSessionEnd(), onSessionEvent()

### Community 113 - "QuadraticBezierCurve"
Cohesion: 0.17
Nodes (4): QuadraticBezierCurve, ShapePath, getInteriorPoint(), pointInPolygon()

### Community 114 - "WebGLUniformsGroups"
Cohesion: 0.28
Nodes (11): WebGLUniformsGroups(), createBuffer(), getUniformSize(), hasUniformChanged(), hasValueChanged(), onUniformsGroupsDispose(), prepareUniformsGroup(), update() (+3 more)

### Community 116 - "addShape"
Cohesion: 0.27
Nodes (10): addShape(), addUV(), addVertex(), buildLidFaces(), buildSideFaces(), f3(), f4(), getBevelVec() (+2 more)

### Community 118 - "WebGLPrograms"
Cohesion: 0.21
Nodes (8): isPackedRGFormat(), WebGLPrograms(), acquireProgram(), getChannel(), getParameters(), getProgramCacheKey(), getProgramCacheKeyBooleans(), getProgramCacheKeyParameters()

### Community 119 - "initGLContext"
Cohesion: 0.18
Nodes (6): WebGLBufferRenderer(), WebGLObjects(), onInstancedMeshDispose(), update(), initGLContext(), WebGLUtils()

### Community 121 - "CubicBezierCurve3"
Cohesion: 0.18
Nodes (6): CubicBezier(), CubicBezierCurve3, CubicBezierP0(), CubicBezierP1(), CubicBezierP2(), CubicBezierP3()

### Community 126 - "WebGLRenderList"
Cohesion: 0.24
Nodes (7): WebGLRenderList(), getNextRenderItem(), materialVariant(), push(), unshift(), WebGLRenderLists(), get()

### Community 128 - "Plan: "Làng nhỏ" as a cute 3D voxel adventure"
Cohesion: 0.20
Nodes (9): 10. Still needing an authorised person, 1. Context, 2. What exists and is reused, 4. Gameplay design, 5. UI/UX, 7. Risks, 8. Roadmap, 9. Verification (+1 more)

### Community 130 - "Raycaster"
Cohesion: 0.24
Nodes (3): ascSort(), intersect(), Raycaster

### Community 131 - "CubeTexture"
Cohesion: 0.20
Nodes (4): loadTexture(), CubeTexture, CubeTextureLoader, loadTexture()

### Community 132 - "DataArrayTexture"
Cohesion: 0.20
Nodes (4): DataArrayTexture, WebGLArrayRenderTarget, WebGLMorphtargets(), update()

### Community 133 - "ExternalTexture"
Cohesion: 0.20
Nodes (3): ExternalTexture, WebXRDepthSensing, onAnimationFrame()

### Community 134 - ".dispose"
Cohesion: 0.22
Nodes (6): log(), onContextCreationError(), onContextLost(), onContextRestore(), onXRSessionEnd(), onXRSessionStart()

### Community 136 - "QuadraticBezierCurve3"
Cohesion: 0.20
Nodes (5): QuadraticBezier(), QuadraticBezierCurve3, QuadraticBezierP0(), QuadraticBezierP1(), QuadraticBezierP2()

### Community 137 - "setupRenderTarget"
Cohesion: 0.42
Nodes (10): getInternalFormat(), getRenderTargetSamples(), rebindTextures(), setupDepthRenderbuffer(), setupDepthTexture(), setupFrameBufferTexture(), setupRenderBufferStorage(), setupRenderTarget() (+2 more)

### Community 139 - ".parse"
Cohesion: 0.28
Nodes (5): getArrayBuffer(), getInterleavedBuffer(), getTypedArray(), InstancedBufferGeometry, deserializeImage()

### Community 141 - "CompressedArrayTexture"
Cohesion: 0.22
Nodes (3): CompressedArrayTexture, CompressedCubeTexture, CompressedTexture

### Community 146 - ".constructor"
Cohesion: 0.31
Nodes (5): TubeGeometry, generateBufferData(), generateIndices(), generateSegment(), generateUVs()

### Community 152 - "WebGLBackground"
Cohesion: 0.39
Nodes (7): getUnlitUniformColorSpace(), WebGLBackground(), addToRenderList(), getBackground(), render(), setClear(), refreshFogUniforms()

### Community 155 - "WebGLGeometries"
Cohesion: 0.39
Nodes (7): WebGLGeometries(), destroyGeometry(), dispose(), get(), getWireframeAttribute(), onGeometryDispose(), updateWireframeAttribute()

### Community 163 - "flatten"
Cohesion: 0.29
Nodes (7): flatten(), setValueM2Array(), setValueM3Array(), setValueM4Array(), setValueV2fArray(), setValueV3fArray(), setValueV4fArray()

### Community 164 - "world-support.js"
Cohesion: 0.47
Nodes (3): chooseMode(), detect(), hasWebGL2()

### Community 169 - "WebGLAttributes"
Cohesion: 0.47
Nodes (4): WebGLAttributes(), createBuffer(), update(), updateBuffer()

### Community 172 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, seed, start, test

### Community 173 - "cloneUniforms"
Cohesion: 0.40
Nodes (4): cloneUniforms(), cloneUniformsGroups(), isThreeObject(), mergeUniforms()

### Community 181 - ".load"
Cohesion: 0.83
Nodes (3): onImageError(), onImageLoad(), removeEventListeners()

## Ambiguous Edges - Review These
- `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` → `Cozy Purple theme (cozy.css)`  [AMBIGUOUS]
  final.md · relation: conceptually_related_to

## Knowledge Gaps
- **39 isolated node(s):** `RFC-3987`, `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)`, `PSQI sleep disturbance frequency items (Q5a-j)`, `HCL-32 current vs usual state questions` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1722 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **100 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `InstancedMesh` connect `InstancedMesh` to `three.core.js`, `ObjectLoader`, `three.module.js`, `Mesh`, `.parseObject`?**
  _High betweenness centrality (0.291) - this node is a cross-community bridge._
- **What connects `RFC-3987`, `PSQI bed partner items (Q10)`, `PSQI overall quality, sleep medication, daytime dysfunction items (Q6-9)` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tracking-scoring.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
- **Why does `clock()` connect `Plan: "Làng nhỏ" as a cute 3D voxel adventure` to `HttpError`, `reward.js`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Should `Frontend App SPA` be split into smaller, more focused modules?**
  _Cohesion score 0.06227106227106227 - nodes in this community are weakly interconnected._
- **Why does `HttpError` connect `HttpError` to `tracking-scoring.js`, `Frontend App SPA`, `controllers/research-projects.js`, `seed-demo-study.js`, `Tracking Controller`, `reward.js`, `rewards.js`, `public.js`, `analytics.js`, `createTrackingService`, `Plan: "Làng nhỏ" as a cute 3D voxel adventure`, `instruments-templates.test.js`, `middleware/auth.js`, `services/tracking.js`, `createTrackingService`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lumen design consistency (lavender, navy, iris, teal, amber, rose; Fraunces, Plus Jakarta Sans)` and `Cozy Purple theme (cozy.css)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._