import { createHash } from 'node:crypto'
import { ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import {
  KEY_PATTERN, SCALE_RANGES, buildSnapshot, computeScore, fingerprintOf, normalizeScoring, slugifyKey
} from './tracking-scoring.js'
import { normalizeSchedule, scheduleStatus } from './tracking-schedule.js'
import {
  KINDS, deviceLabel, expiryFor, hashToken, isUsable, newRecoveryCode, newToken, parseCredentialInput
} from './tracking-credentials.js'
import { assessmentRef, buildHistory } from './tracking-history.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ENROLL_WINDOW_MS = 2 * 60 * 60 * 1000       // chỉ gắn phản hồi vừa nộp vào hồ sơ trong 2 giờ
const TOUCH_INTERVAL_MS = 60 * 60 * 1000
export const MIN_GROUP_SIZE = 5                     // không công bố trung bình theo nhóm < 5 người
const MAX_SESSIONS_LOADED = 5000
const sha256 = text => createHash('sha256').update(text).digest('hex')
export const consentHash = (text, adultAttestation) => sha256(`brainst0rm:consent-v1\n${adultAttestation ? 1 : 0}\n${text}`)

const MISSING_TABLE = ['42P01', 'PGRST205', 'PGRST204']
export function trackingResult(result) {
  if (MISSING_TABLE.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/006_progress_tracking.sql để kích hoạt theo dõi tiến triển')
  return ok(result)
}
export const isMissingTable = error => MISSING_TABLE.includes(error?.code)

/**
 * Toàn bộ nghiệp vụ Progress Tracking. `db` là Supabase client (hoặc bản giả trong test).
 * Controller chỉ làm việc HTTP; mọi quy tắc quyền riêng tư/idempotency nằm ở đây.
 */
export function createTrackingService(db, { clock = () => new Date() } = {}) {
  const q = result => trackingResult(result)

  /* ---------------------------------------------------------------- cấu hình */
  async function getConfig(surveyId) {
    return q(await db.from('survey_tracking_configs').select('*').eq('survey_id', surveyId).maybeSingle())
  }

  async function publishedSurveyBySlug(slug) {
    const survey = ok(await db.from('surveys').select('id,user_id,title,status,public_slug').eq('public_slug', String(slug || '')).maybeSingle())
    if (!survey || survey.status !== 'published') throw new HttpError(404, 'Khảo sát không tồn tại hoặc đã đóng')
    return survey
  }

  async function enabledConfigForSlug(slug) {
    const survey = await publishedSurveyBySlug(slug)
    const config = await getConfig(survey.id)
    if (!config?.enabled) throw new HttpError(404, 'Khảo sát này không bật theo dõi tiến triển')
    return { survey, config }
  }

  /** Câu hỏi có thể chấm điểm để UI cấu hình hiển thị. */
  const scorableQuestions = questions => questions.filter(item => SCALE_RANGES[item.question_type])
    .map(item => ({ id: item.id, text: item.question_text, type: item.question_type, min: SCALE_RANGES[item.question_type][0], max: SCALE_RANGES[item.question_type][1] }))

  function configWarnings(config, questions) {
    if (!config?.scoring?.items) return []
    const byId = new Map(questions.map(item => [item.id, item]))
    const warnings = []
    const expected = config.scoring.snapshot
    for (const item of config.scoring.items) {
      const question = byId.get(item.question_id)
      if (!question) warnings.push('Một câu hỏi tính điểm đã bị xóa khỏi khảo sát; các lần nộp mới sẽ không được chấm điểm.')
      else if (!SCALE_RANGES[question.question_type] || SCALE_RANGES[question.question_type][0] !== expected?.min
        || SCALE_RANGES[question.question_type][1] !== expected?.max)
        warnings.push(`Câu "${question.question_text}" đã đổi dạng; thang điểm hiện tại không còn khớp.`)
    }
    return [...new Set(warnings)]
  }

  function serializeConfig(config, questions) {
    if (!config) return null
    const { scoring_fingerprint, ...rest } = config
    return {
      surveyId: rest.survey_id, enabled: rest.enabled, assessmentKey: rest.assessment_key, assessmentName: rest.assessment_name,
      scoring: { method: rest.scoring?.method || 'sum', version: rest.scoring?.version || '1', items: rest.scoring?.items || [] },
      fingerprint: scoring_fingerprint ? scoring_fingerprint.slice(0, 12) : null,
      scoreMeaning: rest.score_meaning, schedule: { ...normalizeSchedule(rest.schedule) },
      consentText: rest.consent_text, consentVersion: rest.consent_version, adultAttestation: rest.adult_attestation,
      updatedAt: rest.updated_at, warnings: configWarnings(config, questions)
    }
  }

  async function saveConfig({ survey, userId, body, questions }) {
    const existing = await getConfig(survey.id)
    const enabled = body.enabled === true
    const assessmentName = String(body.assessmentName ?? existing?.assessment_name ?? '').trim()
    if (!assessmentName || assessmentName.length > 120) throw new HttpError(400, 'Tên loại đánh giá cần từ 1 đến 120 ký tự')
    const assessmentKey = String(body.assessmentKey || existing?.assessment_key || slugifyKey(assessmentName)).trim().toLowerCase()
    if (!KEY_PATTERN.test(assessmentKey)) throw new HttpError(400, 'Mã loại đánh giá chỉ gồm chữ thường, số và dấu gạch ngang (2–48 ký tự)')
    const scoreMeaning = String(body.scoreMeaning ?? existing?.score_meaning ?? '').trim()
    if (scoreMeaning.length > 300) throw new HttpError(400, 'Mô tả ý nghĩa điểm không được vượt quá 300 ký tự')
    const consentText = String(body.consentText ?? existing?.consent_text ?? '').trim()
    if (consentText.length > 4000) throw new HttpError(400, 'Nội dung đồng ý không được vượt quá 4000 ký tự')
    const adultAttestation = body.adultAttestation === undefined ? (existing?.adult_attestation ?? true) : body.adultAttestation === true
    const schedule = normalizeSchedule(body.schedule ?? existing?.schedule ?? {})

    let scoring = {}, fingerprint = null
    const hasScoringInput = body.scoring && Array.isArray(body.scoring.items) && body.scoring.items.length
    if (hasScoringInput || enabled) {
      const clean = normalizeScoring(body.scoring ?? existing?.scoring ?? {}, questions)
      const snapshot = buildSnapshot(clean, questions)
      scoring = { ...clean, snapshot }
      fingerprint = fingerprintOf(assessmentKey, snapshot)
    } else if (existing?.scoring?.items) {
      scoring = existing.scoring; fingerprint = existing.scoring_fingerprint
    }
    if (enabled && consentText.length < 20) throw new HttpError(400, 'Cần nội dung đồng ý rõ ràng (tối thiểu 20 ký tự) trước khi bật theo dõi')

    // Mỗi lần nội dung đồng ý (hoặc yêu cầu xác nhận người lớn) đổi → tăng phiên bản; người đã đồng ý bản cũ sẽ được hỏi lại.
    const changed = existing && consentHash(existing.consent_text, existing.adult_attestation) !== consentHash(consentText, adultAttestation)
    const row = {
      enabled, assessment_key: assessmentKey, assessment_name: assessmentName, scoring, scoring_fingerprint: fingerprint,
      score_meaning: scoreMeaning, schedule, consent_text: consentText, adult_attestation: adultAttestation,
      consent_version: existing ? existing.consent_version + (changed ? 1 : 0) : 1, updated_by: userId
    }
    const saved = existing
      ? q(await db.from('survey_tracking_configs').update(row).eq('survey_id', survey.id).select('*').single())
      : q(await db.from('survey_tracking_configs').insert({ ...row, survey_id: survey.id }).select('*').single())
    return saved
  }

  /* -------------------------------------------------------------- credential */
  async function mintCredential(profileId, kind, label = '') {
    if (!KINDS.includes(kind)) throw new Error('Loại credential không hợp lệ')
    const token = kind === 'recovery_code' ? newRecoveryCode() : newToken()
    const credential = q(await db.from('tracking_credentials').insert({
      profile_id: profileId, kind, token_hash: hashToken(token), label: String(label).slice(0, 80), expires_at: expiryFor(kind, clock())
    }).select('id,kind,label,created_at,expires_at').single())
    return { token, credential }
  }

  /** Xác thực cookie → hồ sơ. Chỉ chấp nhận credential loại cookie còn hạn. */
  async function authenticate(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
    const credential = q(await db.from('tracking_credentials').select('*').eq('token_hash', hashToken(token)).maybeSingle())
    if (!credential || credential.kind !== 'cookie' || !isUsable(credential, clock())) return null
    const stale = !credential.last_used_at || clock() - new Date(credential.last_used_at) > TOUCH_INTERVAL_MS
    if (stale) {
      const stamp = clock().toISOString()
      await db.from('tracking_credentials').update({ last_used_at: stamp }).eq('id', credential.id)
      await db.from('tracking_profiles').update({ last_seen_at: stamp }).eq('id', credential.profile_id)
    }
    return { credentialId: credential.id, profileId: credential.profile_id }
  }

  async function startProfile(label) {
    const profile = q(await db.from('tracking_profiles').insert({ last_seen_at: clock().toISOString() }).select('id').single())
    const cookie = await mintCredential(profile.id, 'cookie', label)
    return { profileId: profile.id, cookieToken: cookie.token }
  }

  /** Khôi phục bằng mã hoặc liên kết. Lỗi luôn cùng một thông điệp để không lộ credential nào tồn tại. */
  async function recover(input, label) {
    const fail = () => new HttpError(404, 'Mã hoặc liên kết khôi phục không hợp lệ, đã hết hạn hoặc đã được dùng')
    const parsed = parseCredentialInput(input)
    if (!parsed) throw fail()
    const credential = q(await db.from('tracking_credentials').select('*').eq('token_hash', hashToken(parsed.value)).maybeSingle())
    if (!credential || credential.kind !== parsed.kind || !isUsable(credential, clock())) throw fail()
    const stamp = clock().toISOString()
    if (credential.kind === 'recovery_link') {
      // dùng một lần: giành quyền bằng cập nhật có điều kiện để hai yêu cầu song song không cùng thành công
      const claimed = q(await db.from('tracking_credentials').update({ used_at: stamp, revoked_at: stamp })
        .eq('id', credential.id).is('used_at', null).select('id'))
      if (!claimed?.length) throw fail()
    } else {
      await db.from('tracking_credentials').update({ last_used_at: stamp }).eq('id', credential.id)
    }
    const cookie = await mintCredential(credential.profile_id, 'cookie', label)
    await db.from('tracking_profiles').update({ last_seen_at: stamp }).eq('id', credential.profile_id)
    return { profileId: credential.profile_id, cookieToken: cookie.token }
  }

  async function listCredentials(profileId, currentCredentialId) {
    const rows = q(await db.from('tracking_credentials').select('id,kind,label,created_at,expires_at,last_used_at,used_at,revoked_at')
      .eq('profile_id', profileId).order('created_at', { ascending: false }))
    return rows.filter(row => isUsable(row, clock())).map(row => ({
      id: row.id, kind: row.kind, label: row.label, createdAt: row.created_at, expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at, current: row.id === currentCredentialId
    }))
  }

  async function revokeCredential(profileId, credentialId) {
    if (!UUID.test(credentialId || '')) throw new HttpError(404, 'Không tìm thấy credential')
    const rows = q(await db.from('tracking_credentials').update({ revoked_at: clock().toISOString() })
      .eq('profile_id', profileId).eq('id', credentialId).is('revoked_at', null).select('id'))
    if (!rows?.length) throw new HttpError(404, 'Không tìm thấy credential')
  }

  async function replaceRecoveryCode(profileId) {
    q(await db.from('tracking_credentials').update({ revoked_at: clock().toISOString() })
      .eq('profile_id', profileId).eq('kind', 'recovery_code').is('revoked_at', null))
    return mintCredential(profileId, 'recovery_code', 'Mã khôi phục')
  }

  async function createRecoveryLink(profileId) {
    // chỉ giữ tối đa 3 liên kết chưa dùng; liên kết cũ nhất bị thu hồi
    const active = (await db.from('tracking_credentials').select('id,created_at').eq('profile_id', profileId)
      .eq('kind', 'recovery_link').is('revoked_at', null).order('created_at', { ascending: false })).data || []
    for (const stale of active.slice(2)) await db.from('tracking_credentials').update({ revoked_at: clock().toISOString() }).eq('id', stale.id)
    return mintCredential(profileId, 'recovery_link', 'Liên kết khôi phục')
  }

  /* ------------------------------------------------------------------- consent */
  async function hasConsent(profileId, ownerId, key, hash) {
    const rows = q(await db.from('tracking_consents').select('consent_text_sha256')
      .eq('profile_id', profileId).eq('owner_id', ownerId).eq('assessment_key', key))
    return rows.some(row => row.consent_text_sha256 === hash)
  }

  async function recordConsent(profileId, survey, config) {
    q(await db.from('tracking_consents').insert({
      profile_id: profileId, owner_id: survey.user_id, assessment_key: config.assessment_key, survey_id: survey.id,
      consent_version: config.consent_version, consent_text_sha256: consentHash(config.consent_text, config.adult_attestation),
      adult_confirmed: config.adult_attestation === true
    }))
  }

  /* ------------------------------------------------------------------- session */
  async function attachSession({ profileId, survey, config, response, answers }) {
    const scoring = config.scoring || {}
    const snapshot = scoring.snapshot
    const result = snapshot && scoring.items
      ? computeScore(scoring, snapshot, answers)
      : { status: 'unscored', score: null, min: null, max: null, itemCount: null }
    const row = {
      profile_id: profileId, owner_id: survey.user_id, survey_id: survey.id, response_id: response.id,
      assessment_key: config.assessment_key, scoring_fingerprint: config.scoring_fingerprint || null,
      scoring_snapshot: snapshot || {}, score: result.score, score_min: result.min, score_max: result.max,
      item_count: result.itemCount, score_status: result.status === 'scored' ? 'scored' : result.status === 'incomplete' ? 'incomplete' : 'unscored',
      completed_at: response.submitted_at
    }
    const inserted = await db.from('tracking_sessions').insert(row).select('id,profile_id,score,score_status').single()
    if (inserted.error?.code === '23505') {          // idempotent: response này đã có session
      const existing = q(await db.from('tracking_sessions').select('id,profile_id,score,score_status').eq('response_id', response.id).maybeSingle())
      if (existing && existing.profile_id === profileId) return { session: existing, created: false }
      throw new HttpError(409, 'Phản hồi này đã được gắn vào một hồ sơ theo dõi khác')
    }
    return { session: q(inserted), created: true }
  }

  const summarizeSession = (session, survey, config) => ({
    id: session.id, assessmentRef: assessmentRef(survey.user_id, config.assessment_key), assessmentName: config.assessment_name,
    score: session.score === null ? null : Number(session.score), scoreStatus: session.score_status
  })

  /** Gắn session ngay trong luồng nộp phản hồi (người đã có hồ sơ + đồng ý bản hiện tại). Không bao giờ ném lỗi ra ngoài. */
  async function attachForSubmit({ survey, response, answers, cookieToken }) {
    try {
      const config = await getConfig(survey.id)
      if (!config?.enabled) return { status: 'disabled' }
      const auth = await authenticate(cookieToken)
      if (!auth) return { status: 'needs_enrollment' }
      if (!await hasConsent(auth.profileId, survey.user_id, config.assessment_key, consentHash(config.consent_text, config.adult_attestation)))
        return { status: 'needs_consent' }
      const map = new Map(answers.map(item => [item.question_id, item.value]))
      const { session } = await attachSession({ profileId: auth.profileId, survey, config, response, answers: map })
      return { status: 'saved', session: summarizeSession(session, survey, config) }
    } catch (error) {
      console.error('tracking attach failed', error?.message || error)
      return { status: 'error' }
    }
  }

  async function publicContext(slug, cookieToken) {
    try {
      const { survey, config } = await enabledConfigForSlug(slug)
      const auth = await authenticate(cookieToken)
      const hash = consentHash(config.consent_text, config.adult_attestation)
      return {
        enabled: true, assessmentName: config.assessment_name, consentText: config.consent_text, consentVersion: config.consent_version,
        adultAttestation: config.adult_attestation, scoreMeaning: config.score_meaning,
        hasProfile: Boolean(auth), consentOk: auth ? await hasConsent(auth.profileId, survey.user_id, config.assessment_key, hash) : false
      }
    } catch (error) {
      if (error.status === 404 || isMissingTable(error) || error.status === 503) return { enabled: false }   // khảo sát cũ/migration chưa chạy: hành vi cũ giữ nguyên
      throw error
    }
  }

  async function enroll({ slug, responseId, consent, cookieToken, label }) {
    const { survey, config } = await enabledConfigForSlug(slug)
    const auth = await authenticate(cookieToken)
    const currentHash = consentHash(config.consent_text, config.adult_attestation)
    // Đã đồng ý đúng nội dung hiện tại thì không hỏi lại; ngược lại cần đồng ý rõ ràng ở lần gọi này.
    const alreadyConsented = auth ? await hasConsent(auth.profileId, survey.user_id, config.assessment_key, currentHash) : false
    if (!alreadyConsented) {
      if (consent?.accepted !== true) throw new HttpError(400, 'Cần đồng ý rõ ràng trước khi tạo hồ sơ theo dõi')
      if (Number(consent.version) !== config.consent_version) throw new HttpError(409, 'Nội dung đồng ý đã thay đổi. Vui lòng tải lại trang và đọc bản mới.')
      if (config.adult_attestation && consent.adultConfirmed !== true) throw new HttpError(400, 'Cần xác nhận bạn từ 18 tuổi trở lên để tạo hồ sơ theo dõi')
    }
    if (!UUID.test(responseId || '')) throw new HttpError(400, 'Thiếu mã phản hồi cần gắn vào hồ sơ')

    const response = ok(await db.from('responses').select('id,survey_id,submitted_at').eq('id', responseId).eq('survey_id', survey.id).maybeSingle())
    if (!response?.submitted_at) throw new HttpError(404, 'Không tìm thấy phản hồi đã hoàn tất')
    if (clock() - new Date(response.submitted_at) > ENROLL_WINDOW_MS) throw new HttpError(403, 'Đã quá thời hạn để gắn phản hồi này vào hồ sơ theo dõi')

    const existing = q(await db.from('tracking_sessions').select('id,profile_id,score,score_status').eq('response_id', response.id).maybeSingle())
    if (existing) {
      if (auth && existing.profile_id === auth.profileId) return { isNew: false, profileId: auth.profileId, session: summarizeSession(existing, survey, config) }
      throw new HttpError(409, 'Phản hồi này đã được gắn vào một hồ sơ theo dõi')
    }

    let profileId = auth?.profileId, cookieOut = null, isNew = false
    if (!profileId) { ({ profileId, cookieToken: cookieOut } = await startProfile(label)); isNew = true }
    try {
      if (!alreadyConsented) await recordConsent(profileId, survey, config)
      const answerRows = ok(await db.from('answers').select('question_id,answer_value').eq('response_id', response.id))
      const answers = new Map(answerRows.map(row => [row.question_id, row.answer_value]))
      const { session } = await attachSession({ profileId, survey, config, response, answers })
      const out = { isNew, profileId, cookieToken: cookieOut, session: summarizeSession(session, survey, config) }
      if (isNew) out.recoveryCode = (await mintCredential(profileId, 'recovery_code', 'Mã khôi phục')).token
      return out
    } catch (error) {
      if (isNew) await db.from('tracking_profiles').delete().eq('id', profileId)    // không để lại hồ sơ mồ côi
      throw error
    }
  }

  /* ----------------------------------------------------------------- hiển thị */
  async function excludedResponseIds(responseIds) {
    const excluded = new Set()
    for (let i = 0; i < responseIds.length; i += 100) {
      const rows = ok(await db.from('responses').select('id,review_status').in('id', responseIds.slice(i, i + 100)))
      for (const row of rows) if (row.review_status === 'excluded') excluded.add(row.id)
    }
    return excluded
  }

  async function loadProfileSessions(profileId) {
    const rows = q(await db.from('tracking_sessions').select('*').eq('profile_id', profileId).order('completed_at', { ascending: true }).limit(MAX_SESSIONS_LOADED))
    const excluded = await excludedResponseIds(rows.map(row => row.response_id))
    return rows.map(row => ({ ...row, excluded: excluded.has(row.response_id) }))
  }

  const groupKey = row => `${row.owner_id}|${row.assessment_key}`

  /** Cấu hình hiện hành của một assessment (owner + key): ưu tiên khảo sát đang xuất bản, mới nhất. */
  async function currentAssessment(ownerId, key) {
    const configs = q(await db.from('survey_tracking_configs').select('*').eq('assessment_key', key).eq('enabled', true))
    if (!configs.length) return null
    const surveys = ok(await db.from('surveys').select('id,title,status,public_slug,updated_at,user_id').in('id', configs.map(item => item.survey_id)).eq('user_id', ownerId))
    const ranked = surveys.sort((a, b) => (b.status === 'published') - (a.status === 'published') || new Date(b.updated_at) - new Date(a.updated_at))
    const survey = ranked[0]
    if (!survey) return null
    return { config: configs.find(item => item.survey_id === survey.id), survey }
  }

  function describe(group, current) {
    const sessionsAsc = group.sessions
    const last = sessionsAsc[sessionsAsc.length - 1]
    const history = buildHistory(sessionsAsc)
    const schedule = scheduleStatus({
      sessionCount: sessionsAsc.length, lastCompletedAt: last.completed_at, schedule: current?.config?.schedule, now: clock()
    })
    return {
      ref: assessmentRef(group.ownerId, group.key),
      name: current?.config?.assessment_name || group.key,
      sessionCount: sessionsAsc.length, lastCompletedAt: last.completed_at,
      latestScore: history.chart.points.length ? history.chart.points[history.chart.points.length - 1].score : null,
      scale: history.chart.scale, comparisonStatus: history.comparison.status,
      schedule, takeSlug: current?.survey?.status === 'published' ? current.survey.public_slug : null,
      scoreMeaning: current?.config?.score_meaning || '', history
    }
  }

  async function overview(profileId) {
    const sessions = await loadProfileSessions(profileId)
    const groups = new Map()
    for (const row of sessions) {
      const key = groupKey(row)
      if (!groups.has(key)) groups.set(key, { ownerId: row.owner_id, key: row.assessment_key, sessions: [] })
      groups.get(key).sessions.push(row)
    }
    const items = []
    for (const group of groups.values()) {
      const { history, ...summary } = describe(group, await currentAssessment(group.ownerId, group.key))
      items.push(summary)
    }
    items.sort((a, b) => new Date(b.lastCompletedAt) - new Date(a.lastCompletedAt))
    return { assessments: items, sessionCount: sessions.length }
  }

  async function assessmentDetail(profileId, ref) {
    const sessions = await loadProfileSessions(profileId)
    const group = { sessions: [] }
    for (const row of sessions) {
      if (assessmentRef(row.owner_id, row.assessment_key) !== ref) continue
      group.ownerId = row.owner_id; group.key = row.assessment_key; group.sessions.push(row)
    }
    if (!group.sessions.length) throw new HttpError(404, 'Không tìm thấy loại đánh giá này trong hồ sơ của bạn')
    return describe(group, await currentAssessment(group.ownerId, group.key))
  }

  async function deleteProfile(profileId) {
    q(await db.from('tracking_profiles').delete().eq('id', profileId))
  }

  /* ------------------------------------------------- tổng hợp cho researcher */
  async function researcherSummary(survey, config) {
    const sessions = q(await db.from('tracking_sessions').select('profile_id,survey_id,score,score_status,scoring_fingerprint,completed_at')
      .eq('owner_id', survey.user_id).eq('assessment_key', config.assessment_key).order('completed_at', { ascending: true }).limit(MAX_SESSIONS_LOADED))
    const consents = q(await db.from('tracking_consents').select('profile_id').eq('owner_id', survey.user_id).eq('assessment_key', config.assessment_key).limit(MAX_SESSIONS_LOADED))
    const byProfile = new Map()
    for (const row of sessions) { if (!byProfile.has(row.profile_id)) byProfile.set(row.profile_id, []); byProfile.get(row.profile_id).push(row) }

    const statuses = { unscheduled: 0, completed: 0, upcoming: 0, due_soon: 0, due: 0, overdue: 0 }
    const perNumber = new Map()
    for (const rows of byProfile.values()) {
      const last = rows[rows.length - 1]
      statuses[scheduleStatus({ sessionCount: rows.length, lastCompletedAt: last.completed_at, schedule: config.schedule, now: clock() }).status]++
      rows.filter(row => row.score_status === 'scored' && row.scoring_fingerprint === config.scoring_fingerprint)
        .forEach((row, index) => { if (!perNumber.has(index + 1)) perNumber.set(index + 1, []); perNumber.get(index + 1).push(Number(row.score)) })
    }
    const bySessionNumber = [...perNumber.entries()].sort((a, b) => a[0] - b[0]).slice(0, 20).map(([number, scores]) => ({
      number, n: scores.length,
      mean: scores.length >= MIN_GROUP_SIZE ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length * 100) / 100 : null
    }))
    return {
      enrolledProfiles: new Set(consents.map(row => row.profile_id)).size,
      activeProfiles: byProfile.size,
      sessionsTotal: sessions.length,
      sessionsThisSurvey: sessions.filter(row => row.survey_id === survey.id).length,
      scheduleStatuses: statuses, bySessionNumber, minGroupSize: MIN_GROUP_SIZE,
      truncated: sessions.length >= MAX_SESSIONS_LOADED || consents.length >= MAX_SESSIONS_LOADED   // số liệu có thể thiếu
    }
  }

  return {
    getConfig, saveConfig, serializeConfig, scorableQuestions, publicContext, enroll, attachForSubmit, authenticate, recover,
    startProfile, mintCredential, listCredentials, revokeCredential, replaceRecoveryCode, createRecoveryLink, hasConsent,
    overview, assessmentDetail, deleteProfile, researcherSummary, deviceLabel
  }
}
