import test from 'node:test'
import assert from 'node:assert/strict'
import { createTrackingService, consentHash } from '../src/services/tracking.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-for-tracking'

const OWNER = '11111111-1111-4111-8111-111111111111'
const SURVEY = '22222222-2222-4222-8222-222222222222'
const SURVEY_B = '33333333-3333-4333-8333-333333333333'
const Q1 = 'aaaaaaaa-0000-4000-8000-000000000001', Q2 = 'aaaaaaaa-0000-4000-8000-000000000002'
const questions = [
  { id: Q1, question_text: 'Câu 1', question_type: 'likert' },
  { id: Q2, question_text: 'Câu 2', question_type: 'likert' }
]
const surveyRow = { id: SURVEY, user_id: OWNER, title: 'Khảo sát', status: 'published', public_slug: 'wellbeing', updated_at: '2026-01-01T00:00:00Z' }
const CONSENT = 'Tôi đồng ý lưu kết quả của mình để theo dõi tiến triển theo thời gian.'
const consent = { accepted: true, adultConfirmed: true, version: 1 }

function setup(extra = {}) {
  const db = createFakeDb({ surveys: [surveyRow], responses: [], answers: [], ...extra }, TRACKING_CONSTRAINTS)
  const clock = { now: new Date('2026-03-01T10:00:00Z') }
  const service = createTrackingService(db, { clock: () => clock.now })
  return { db, service, clock }
}
const configure = (service, overrides = {}, survey = surveyRow) => service.saveConfig({
  survey, userId: OWNER, questions,
  body: {
    enabled: true, assessmentName: 'Wellbeing', consentText: CONSENT, scoreMeaning: 'Điểm cao hơn = mức hài lòng cao hơn',
    scoring: { method: 'sum', version: '1', items: [{ question_id: Q1 }, { question_id: Q2, reverse: true }] },
    schedule: { intervalDays: 7, upcomingDays: 2, graceDays: 3 }, ...overrides
  }
})
let counter = 0
function addResponse(db, { survey = SURVEY, at, answers = { [Q1]: 4, [Q2]: 2 } }) {
  const id = `bbbbbbbb-0000-4000-8000-${String(++counter).padStart(12, '0')}`
  db.rowsOf('responses').push({ id, survey_id: survey, submitted_at: at.toISOString(), review_status: 'needs_review' })
  for (const [question_id, answer_value] of Object.entries(answers)) db.rowsOf('answers').push({ response_id: id, question_id, answer_value })
  return id
}
const enrollFirst = async ({ db, service, clock }, over = {}) => {
  const responseId = addResponse(db, { at: clock.now })
  return { responseId, ...await service.enroll({ slug: 'wellbeing', responseId, consent, cookieToken: undefined, label: 'Chrome · Windows', ...over }) }
}

/* -------------------------------------------------------------------- cấu hình */
test('tracking is OFF by default: surveys without a config behave exactly as before', async () => {
  const { service } = setup()
  assert.deepEqual(await service.publicContext('wellbeing', undefined), { enabled: false })
  await assert.rejects(() => service.enroll({ slug: 'wellbeing', responseId: 'x', consent, label: '' }), error => error.status === 404)
})

test('a disabled config or a missing migration also reads as disabled to participants', async () => {
  const { service, db } = setup()
  await configure(service, { enabled: false })
  assert.equal((await service.publicContext('wellbeing')).enabled, false)
  const broken = createTrackingService({ from: table => table === 'surveys' ? db.from(table) : db.from('missing') }, { clock: () => new Date() })
  db.failWhen(table => table === 'missing', '42P01')
  assert.deepEqual(await broken.publicContext('wellbeing'), { enabled: false })
})

test('enabling requires clear consent text, scoring items and scale-compatible questions', async () => {
  const { service } = setup()
  await assert.rejects(() => configure(service, { consentText: 'ngắn' }), /Cần nội dung đồng ý rõ ràng/)
  await assert.rejects(() => configure(service, { scoring: { method: 'sum', items: [] } }), /ít nhất một câu/)
  await assert.rejects(() => configure(service, { assessmentName: '   ' }), /Tên loại đánh giá/)
  await assert.rejects(() => configure(service, { assessmentKey: 'Bad Key!' }), /Mã loại đánh giá/)
})

test('consent version only moves when the text or adult attestation changes', async () => {
  const { service } = setup()
  assert.equal((await configure(service)).consent_version, 1)
  assert.equal((await configure(service, { assessmentName: 'Tên mới' })).consent_version, 1)
  assert.equal((await configure(service, { consentText: `${CONSENT} (đã sửa)` })).consent_version, 2)
  assert.equal((await configure(service, { consentText: `${CONSENT} (đã sửa)`, adultAttestation: false })).consent_version, 3)
})

/* --------------------------------------------------------------- đăng ký theo dõi */
test('enrolment creates profile, consent, scored session and one-time recovery code; only hashes are stored', async () => {
  const ctx = setup(); await configure(ctx.service)
  const result = await enrollFirst(ctx)
  assert.equal(result.isNew, true)
  assert.equal(result.session.score, 8)                   // 4 + (6 - 2)
  assert.match(result.recoveryCode, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)
  assert.equal(ctx.db.rowsOf('tracking_profiles').length, 1)
  assert.equal(ctx.db.rowsOf('tracking_consents').length, 1)
  assert.equal(ctx.db.rowsOf('tracking_consents')[0].consent_text_sha256, consentHash(CONSENT, true))
  assert.equal(ctx.db.rowsOf('tracking_sessions')[0].response_id, result.responseId)
  const stored = JSON.stringify(ctx.db.rowsOf('tracking_credentials'))
  assert.equal(stored.includes(result.cookieToken), false)
  assert.equal(stored.includes(result.recoveryCode), false)
  assert.equal(ctx.db.rowsOf('tracking_credentials').length, 2)   // cookie + mã khôi phục
})

test('enrolment requires explicit consent for the current version, adult confirmation and a fresh submitted response', async () => {
  const ctx = setup(); await configure(ctx.service)
  const responseId = addResponse(ctx.db, { at: ctx.clock.now })
  const attempt = body => ctx.service.enroll({ slug: 'wellbeing', responseId, label: '', ...body })
  await assert.rejects(() => attempt({ consent: { ...consent, accepted: false } }), /đồng ý rõ ràng/)
  await assert.rejects(() => attempt({ consent: { ...consent, adultConfirmed: false } }), /18 tuổi/)
  await assert.rejects(() => attempt({ consent: { ...consent, version: 9 } }), error => error.status === 409)
  await assert.rejects(() => attempt({ consent }).then(() => ctx.service.enroll({ slug: 'wellbeing', responseId: 'not-a-uuid', consent, label: '' })), /mã phản hồi/)
  assert.equal(ctx.db.rowsOf('tracking_profiles').length, 1)       // lần hợp lệ duy nhất ở trên tạo hồ sơ

  const stale = addResponse(ctx.db, { at: new Date(ctx.clock.now.getTime() - 3 * 3600e3) })
  await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId: stale, consent, label: '' }), error => error.status === 403)
  db_unsubmitted: {
    const id = 'cccccccc-0000-4000-8000-000000000001'
    ctx.db.rowsOf('responses').push({ id, survey_id: SURVEY, submitted_at: null })
    await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId: id, consent, label: '' }), error => error.status === 404)
  }
})

test('a response from another survey cannot be attached through this survey', async () => {
  const ctx = setup({ surveys: [surveyRow, { ...surveyRow, id: SURVEY_B, public_slug: 'other' }] }); await configure(ctx.service)
  const foreign = addResponse(ctx.db, { survey: SURVEY_B, at: ctx.clock.now })
  await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId: foreign, consent, label: '' }), error => error.status === 404)
})

test('enrolment is idempotent per response: same browser gets the same session, another browser gets 409', async () => {
  const ctx = setup(); await configure(ctx.service)
  const first = await enrollFirst(ctx)
  const again = await ctx.service.enroll({ slug: 'wellbeing', responseId: first.responseId, consent, cookieToken: first.cookieToken, label: '' })
  assert.equal(again.isNew, false); assert.equal(again.session.id, first.session.id); assert.equal(again.recoveryCode, undefined)
  await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId: first.responseId, consent, label: '' }), error => error.status === 409)
  assert.equal(ctx.db.rowsOf('tracking_sessions').length, 1)
  assert.equal(ctx.db.rowsOf('tracking_profiles').length, 1)
})

test('a failed enrolment leaves no orphan profile', async () => {
  const ctx = setup(); await configure(ctx.service)
  const responseId = addResponse(ctx.db, { at: ctx.clock.now })
  ctx.db.failWhen((table, op) => table === 'tracking_sessions' && op === 'insert')
  await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId, consent, label: '' }))
  assert.equal(ctx.db.rowsOf('tracking_profiles').length, 0)
  assert.equal(ctx.db.rowsOf('tracking_credentials').length, 0)
})

/* ------------------------------------------------------------------ credential */
test('cookie authentication rejects revoked, expired and non-cookie credentials', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  assert.ok(await ctx.service.authenticate(enrolled.cookieToken))
  assert.equal(await ctx.service.authenticate(enrolled.recoveryCode), null)
  assert.equal(await ctx.service.authenticate('x'.repeat(43)), null)
  assert.equal(await ctx.service.authenticate(undefined), null)

  const cookie = ctx.db.rowsOf('tracking_credentials').find(row => row.kind === 'cookie')
  ctx.clock.now = new Date('2027-06-01T00:00:00Z')                       // quá 365 ngày
  assert.equal(await ctx.service.authenticate(enrolled.cookieToken), null)
  ctx.clock.now = new Date('2026-03-02T00:00:00Z')
  cookie.revoked_at = '2026-03-01T12:00:00Z'
  assert.equal(await ctx.service.authenticate(enrolled.cookieToken), null)
})

test('recovery code restores access on a new device and failures are indistinguishable', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  const restored = await ctx.service.recover(enrolled.recoveryCode.toLowerCase(), 'Firefox · Linux')
  assert.ok(await ctx.service.authenticate(restored.cookieToken))
  assert.equal(restored.profileId, (await ctx.service.authenticate(enrolled.cookieToken)).profileId)
  const messages = new Set()
  for (const wrong of ['ABCD-EFGH-JKMN-PQRS', 'not a code', '', enrolled.cookieToken]) {
    await assert.rejects(() => ctx.service.recover(wrong, ''), error => { messages.add(error.message); return error.status === 404 })
  }
  assert.equal(messages.size, 1)
})

test('recovery links work exactly once and can be revoked before use', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  const auth = await ctx.service.authenticate(enrolled.cookieToken)
  const link = await ctx.service.createRecoveryLink(auth.profileId)
  const restored = await ctx.service.recover(`https://app.example/#/track/recover/${link.token}`, '')
  assert.ok(await ctx.service.authenticate(restored.cookieToken))
  await assert.rejects(() => ctx.service.recover(link.token, ''), error => error.status === 404)   // dùng lần hai

  const revoked = await ctx.service.createRecoveryLink(auth.profileId)
  await ctx.service.revokeCredential(auth.profileId, revoked.credential.id)
  await assert.rejects(() => ctx.service.recover(revoked.token, ''), error => error.status === 404)
})

test('recovery links expire after 30 days', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  const auth = await ctx.service.authenticate(enrolled.cookieToken)
  const link = await ctx.service.createRecoveryLink(auth.profileId)
  ctx.clock.now = new Date('2026-04-15T00:00:00Z')
  await assert.rejects(() => ctx.service.recover(link.token, ''), error => error.status === 404)
})

test('regenerating the recovery code invalidates the old one', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  const auth = await ctx.service.authenticate(enrolled.cookieToken)
  const fresh = await ctx.service.replaceRecoveryCode(auth.profileId)
  await assert.rejects(() => ctx.service.recover(enrolled.recoveryCode, ''), error => error.status === 404)
  assert.ok(await ctx.service.recover(fresh.token, ''))
})

test('credential management is scoped to the authenticated profile (changing the id cannot touch others)', async () => {
  const ctx = setup(); await configure(ctx.service)
  const a = await enrollFirst(ctx), b = await enrollFirst(ctx)
  const profileA = (await ctx.service.authenticate(a.cookieToken)).profileId
  const profileB = (await ctx.service.authenticate(b.cookieToken)).profileId
  assert.notEqual(profileA, profileB)
  const bCookie = ctx.db.rowsOf('tracking_credentials').find(row => row.profile_id === profileB && row.kind === 'cookie')
  await assert.rejects(() => ctx.service.revokeCredential(profileA, bCookie.id), error => error.status === 404)
  assert.ok(await ctx.service.authenticate(b.cookieToken))
  await assert.rejects(() => ctx.service.revokeCredential(profileA, 'not-a-uuid'), error => error.status === 404)
  const listed = await ctx.service.listCredentials(profileA, null)
  assert.equal(listed.some(item => item.id === bCookie.id), false)
  assert.equal(JSON.stringify(listed).includes('token'), false)
})

/* ---------------------------------------------------- nhiều assessment, lịch sử */
async function secondSession(ctx, enrolled, { at, answers }) {
  const response = addResponse(ctx.db, { at, answers })
  ctx.clock.now = at
  return ctx.service.attachForSubmit({
    survey: surveyRow, response: { id: response, submitted_at: at.toISOString() },
    answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })), cookieToken: enrolled.cookieToken
  })
}

test('submit-time tracking reports its state and is idempotent per response', async () => {
  const ctx = setup(); await configure(ctx.service)
  const responseId = addResponse(ctx.db, { at: ctx.clock.now })
  const submit = (cookieToken, id = responseId) => ctx.service.attachForSubmit({
    survey: surveyRow, response: { id, submitted_at: ctx.clock.now.toISOString() },
    answers: [{ question_id: Q1, value: 4 }, { question_id: Q2, value: 2 }], cookieToken
  })
  assert.equal((await submit(undefined)).status, 'needs_enrollment')

  const enrolled = await enrollFirst(ctx)
  const second = addResponse(ctx.db, { at: ctx.clock.now })
  const saved = await submit(enrolled.cookieToken, second)
  assert.equal(saved.status, 'saved')
  const sessionsAfterOne = ctx.db.rowsOf('tracking_sessions').length
  assert.equal((await submit(enrolled.cookieToken, second)).status, 'saved')
  assert.equal(ctx.db.rowsOf('tracking_sessions').length, sessionsAfterOne)

  await configure(ctx.service, { consentText: `${CONSENT} Bản cập nhật.` })     // phiên bản đồng ý mới
  assert.equal((await submit(enrolled.cookieToken, addResponse(ctx.db, { at: ctx.clock.now }))).status, 'needs_consent')
  await configure(ctx.service, { enabled: false })
  assert.equal((await submit(enrolled.cookieToken)).status, 'disabled')
})

test('tracking failures never propagate into the survey submission', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  ctx.db.failWhen(table => table === 'tracking_sessions')
  const outcome = await ctx.service.attachForSubmit({
    survey: surveyRow, response: { id: addResponse(ctx.db, { at: ctx.clock.now }), submitted_at: ctx.clock.now.toISOString() },
    answers: [], cookieToken: enrolled.cookieToken
  })
  assert.equal(outcome.status, 'error')
})

test('history compares sessions, keeps assessments separate and isolates profiles', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)                                        // điểm 8
  await secondSession(ctx, enrolled, { at: new Date('2026-03-09T10:00:00Z'), answers: { [Q1]: 5, [Q2]: 1 } })   // 5 + 5 = 10
  const profileId = (await ctx.service.authenticate(enrolled.cookieToken)).profileId

  const overview = await ctx.service.overview(profileId)
  assert.equal(overview.assessments.length, 1)
  const [item] = overview.assessments
  assert.equal(item.sessionCount, 2); assert.equal(item.latestScore, 10); assert.equal(item.takeSlug, 'wellbeing')
  assert.equal(item.schedule.status, 'upcoming')                                // 7 ngày kể từ 09/03; đang ở 09/03

  const detail = await ctx.service.assessmentDetail(profileId, item.ref)
  assert.equal(detail.history.comparison.status, 'ok')
  assert.equal(detail.history.comparison.vsPrevious.delta, 2)
  assert.equal(detail.history.sessions.length, 2)

  // Assessment B (cùng chủ, khác key) có lịch sử riêng, không gộp điểm
  const surveyB = { ...surveyRow, id: SURVEY_B, public_slug: 'sleep' }
  ctx.db.rowsOf('surveys').push(surveyB)
  await configure(ctx.service, { assessmentName: 'Sleep', consentText: `${CONSENT} (giấc ngủ)` }, surveyB)
  const responseB = addResponse(ctx.db, { survey: SURVEY_B, at: ctx.clock.now })
  await ctx.service.enroll({ slug: 'sleep', responseId: responseB, consent, cookieToken: enrolled.cookieToken, label: '' })
  const both = await ctx.service.overview(profileId)
  assert.equal(both.assessments.length, 2)
  assert.deepEqual(both.assessments.map(a => a.sessionCount).sort(), [1, 2])

})

test('a stranger with a valid profile gets 404 for someone else’s assessment ref', async () => {
  const ctx = setup(); await configure(ctx.service)
  const owner = await enrollFirst(ctx)
  await secondSession(ctx, owner, { at: new Date('2026-03-09T10:00:00Z'), answers: { [Q1]: 5, [Q2]: 1 } })
  const ref = (await ctx.service.overview((await ctx.service.authenticate(owner.cookieToken)).profileId)).assessments[0].ref
  const stranger = await enrollFirst(ctx, {})
  // người lạ có đúng một session nên ref giống nhau, nhưng chỉ thấy session của chính mình
  const strangerProfile = (await ctx.service.authenticate(stranger.cookieToken)).profileId
  const detail = await ctx.service.assessmentDetail(strangerProfile, ref)
  assert.equal(detail.sessionCount, 1)
  await assert.rejects(() => ctx.service.assessmentDetail(strangerProfile, 'f'.repeat(20)), error => error.status === 404)
})

test('changing the scoring makes older sessions incompatible instead of silently comparing them', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  await configure(ctx.service, { scoring: { method: 'mean', version: '2', items: [{ question_id: Q1 }, { question_id: Q2 }] } })
  await secondSession(ctx, enrolled, { at: new Date('2026-03-09T10:00:00Z'), answers: { [Q1]: 4, [Q2]: 4 } })
  const profileId = (await ctx.service.authenticate(enrolled.cookieToken)).profileId
  const { ref } = (await ctx.service.overview(profileId)).assessments[0]
  const detail = await ctx.service.assessmentDetail(profileId, ref)
  assert.equal(detail.history.comparison.status, 'insufficient')
  const old = detail.history.sessions.find(item => !item.comparable)
  assert.match(old.note, /Cách tính điểm khác nhau/)
  assert.equal(detail.history.chart.points.length, 1)
})

test('responses excluded by a researcher stop counting toward comparisons without exposing why', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  await secondSession(ctx, enrolled, { at: new Date('2026-03-09T10:00:00Z'), answers: { [Q1]: 5, [Q2]: 1 } })
  ctx.db.rowsOf('responses').find(row => row.id === ctx.db.rowsOf('tracking_sessions')[1].response_id).review_status = 'excluded'
  const profileId = (await ctx.service.authenticate(enrolled.cookieToken)).profileId
  const { ref } = (await ctx.service.overview(profileId)).assessments[0]
  const { history } = await ctx.service.assessmentDetail(profileId, ref)
  assert.equal(history.comparison.status, 'insufficient')
  const excluded = history.sessions[1]
  assert.equal(excluded.score, null); assert.equal(excluded.note, 'Không dùng để so sánh.')
  assert.equal(JSON.stringify(history).includes('excluded'), false)
})

test('session schedule status follows researcher configuration and can reach completed', async () => {
  const ctx = setup(); await configure(ctx.service, { schedule: { intervalDays: 7, upcomingDays: 2, graceDays: 3, maxSessions: 2 } })
  const enrolled = await enrollFirst(ctx)
  const profileId = (await ctx.service.authenticate(enrolled.cookieToken)).profileId
  ctx.clock.now = new Date('2026-03-07T10:00:00Z')
  assert.equal((await ctx.service.overview(profileId)).assessments[0].schedule.status, 'due_soon')
  ctx.clock.now = new Date('2026-03-09T10:00:00Z')
  assert.equal((await ctx.service.overview(profileId)).assessments[0].schedule.status, 'due')
  ctx.clock.now = new Date('2026-03-15T10:00:00Z')
  assert.equal((await ctx.service.overview(profileId)).assessments[0].schedule.status, 'overdue')
  await secondSession(ctx, enrolled, { at: new Date('2026-03-16T10:00:00Z'), answers: { [Q1]: 3, [Q2]: 3 } })
  assert.equal((await ctx.service.overview(profileId)).assessments[0].schedule.status, 'completed')
})

/* ---------------------------------------------------------------- quyền riêng tư */
test('deleting the profile removes credentials, consent and sessions but never the survey response', async () => {
  const ctx = setup(); await configure(ctx.service)
  const enrolled = await enrollFirst(ctx)
  const profileId = (await ctx.service.authenticate(enrolled.cookieToken)).profileId
  await ctx.service.deleteProfile(profileId)
  for (const table of ['tracking_profiles', 'tracking_credentials', 'tracking_consents', 'tracking_sessions']) assert.equal(ctx.db.rowsOf(table).length, 0, table)
  assert.equal(ctx.db.rowsOf('responses').length, 1)
  assert.equal(await ctx.service.authenticate(enrolled.cookieToken), null)
})

test('researcher summary is aggregate-only and hides means for small groups', async () => {
  const ctx = setup(); await configure(ctx.service)
  const people = []
  for (let i = 0; i < 6; i++) people.push(await enrollFirst(ctx))
  await secondSession(ctx, people[0], { at: new Date('2026-03-09T10:00:00Z'), answers: { [Q1]: 5, [Q2]: 1 } })
  const survey = ctx.db.rowsOf('surveys')[0]
  const summary = await ctx.service.researcherSummary(survey, await ctx.service.getConfig(SURVEY))
  assert.equal(summary.enrolledProfiles, 6); assert.equal(summary.sessionsTotal, 7); assert.equal(summary.activeProfiles, 6); assert.equal(summary.truncated, false)
  assert.equal(summary.bySessionNumber[0].n, 6); assert.equal(typeof summary.bySessionNumber[0].mean, 'number')
  assert.equal(summary.bySessionNumber[1].n, 1); assert.equal(summary.bySessionNumber[1].mean, null)
  const profileIds = ctx.db.rowsOf('tracking_profiles').map(row => row.id)
  const text = JSON.stringify(summary)
  for (const id of profileIds) assert.equal(text.includes(id), false)
})

test('serialised config never leaks the full scoring fingerprint and warns about edited questions', async () => {
  const ctx = setup(); const saved = await configure(ctx.service)
  const clean = ctx.service.serializeConfig(saved, questions)
  assert.equal(clean.fingerprint.length, 12); assert.equal(clean.warnings.length, 0)
  const edited = ctx.service.serializeConfig(saved, [questions[0], { ...questions[1], question_type: 'single' }])
  assert.match(edited.warnings.join(' '), /đã đổi dạng/)
  assert.match(ctx.service.serializeConfig(saved, [questions[0]]).warnings.join(' '), /đã bị xóa/)
})

test('a returning participant who already agreed to the current text is not asked again, but a new text requires fresh consent', async () => {
  const ctx = setup(); await configure(ctx.service)
  const first = await enrollFirst(ctx)
  const nextResponse = addResponse(ctx.db, { at: ctx.clock.now })
  const noConsentPayload = await ctx.service.enroll({ slug: 'wellbeing', responseId: nextResponse, consent: undefined, cookieToken: first.cookieToken, label: '' })
  assert.equal(noConsentPayload.isNew, false)
  assert.equal(ctx.db.rowsOf('tracking_consents').length, 1)                 // không ghi thêm bản ghi đồng ý

  await configure(ctx.service, { consentText: `${CONSENT} Phiên bản mới.` })
  const third = addResponse(ctx.db, { at: ctx.clock.now })
  await assert.rejects(() => ctx.service.enroll({ slug: 'wellbeing', responseId: third, consent: undefined, cookieToken: first.cookieToken, label: '' }), /đồng ý rõ ràng/)
  await ctx.service.enroll({ slug: 'wellbeing', responseId: third, consent: { ...consent, version: 2 }, cookieToken: first.cookieToken, label: '' })
  assert.equal(ctx.db.rowsOf('tracking_consents').length, 2)
  assert.equal(ctx.db.rowsOf('tracking_sessions').length, 3)
})
