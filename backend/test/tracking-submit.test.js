import test from 'node:test'
import assert from 'node:assert/strict'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createTrackingService } from '../src/services/tracking.js'
import * as pub from '../src/controllers/public.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-submit'
const OWNER = '11111111-1111-4111-8111-111111111111', SURVEY = '22222222-2222-4222-8222-222222222222'
const Q = ['q1', 'q2', 'q3'].map((suffix, i) => `aaaaaaaa-0000-4000-8000-00000000000${i + 1}`)
const CONSENT = 'Tôi đồng ý lưu kết quả của mình để theo dõi tiến triển theo thời gian.'

/** Chạy pipeline nộp phản hồi THẬT (controllers/public.js) trên DB giả. */
async function boot() {
  const db = createFakeDb({
    surveys: [{ id: SURVEY, user_id: OWNER, title: 'Khảo sát', description: '', settings: {}, status: 'published', public_slug: 'demo', updated_at: '2026-01-01T00:00:00Z' }],
    questions: Q.map((id, position) => ({ id, survey_id: SURVEY, question_text: `Câu ${position + 1}`, question_type: 'likert', position, is_required: true, settings: {} })),
    responses: [], answers: []
  }, TRACKING_CONSTRAINTS)
  useSupabaseForTests(db)
  const service = createTrackingService(db)
  useTrackingService(service)
  await service.saveConfig({
    survey: db.rowsOf('surveys')[0], userId: OWNER, questions: db.rowsOf('questions'),
    body: { enabled: true, assessmentName: 'Wellbeing', consentText: CONSENT, scoring: { method: 'sum', items: Q.map(question_id => ({ question_id })) }, schedule: { intervalDays: 7 } }
  })
  return { db, service }
}
const call = async (handler, { params = { slug: 'demo' }, body = {}, cookies = {}, ip = '203.0.113.9' } = {}) => {
  const out = { status: 200 }
  const res = { status(code) { out.status = code; return this }, json(payload) { out.body = payload; return this } }
  await handler({ params, body, cookies, ip }, res)
  return out
}
const answers = values => Q.map((question_id, i) => ({ question_id, value: values[i] }))

test('a normal submission is unchanged: no tracking requested, no tracking fields leak, no sessions created', async () => {
  const { db } = await boot()
  const started = await call(pub.start)
  const submitted = await call(pub.submit, { body: { responseId: started.body.responseId, answers: answers([3, 4, 5]) } })
  assert.equal(submitted.status, 201)
  assert.equal(submitted.body.ok, true)
  assert.equal('tracking' in submitted.body, false)
  assert.equal(db.rowsOf('tracking_sessions').length, 0)
  assert.equal(db.rowsOf('answers').length, 3)
  assert.ok(db.rowsOf('responses')[0].submitted_at)
})

test('the public survey payload still exposes only its original fields', async () => {
  await boot()
  const { body } = await call(pub.getBySlug)
  assert.deepEqual(Object.keys(body.survey).sort(), ['description', 'id', 'questions', 'settings', 'title'])
  assert.equal(JSON.stringify(body).includes(OWNER), false)
})

test('enrolling after a real submission links the existing response and never copies answers', async () => {
  const { db, service } = await boot()
  const started = await call(pub.start)
  const submitted = await call(pub.submit, { body: { responseId: started.body.responseId, answers: answers([3, 4, 5]) } })
  const answersBefore = JSON.stringify(db.rowsOf('answers'))
  const enrolled = await service.enroll({ slug: 'demo', responseId: submitted.body.responseId, consent: { accepted: true, adultConfirmed: true, version: 1 }, label: '' })
  assert.equal(enrolled.session.score, 12)
  const [session] = db.rowsOf('tracking_sessions')
  assert.equal(session.response_id, submitted.body.responseId)
  assert.equal(JSON.stringify(db.rowsOf('answers')), answersBefore)          // câu trả lời không bị sao chép hay đổi
  assert.equal(Object.keys(session).some(key => /answer/i.test(key)), false)
})

test('a returning participant is tracked atomically with the submission, once per response', async () => {
  const { db, service } = await boot()
  const first = await call(pub.start)
  const firstSubmit = await call(pub.submit, { body: { responseId: first.body.responseId, answers: answers([3, 4, 5]) } })
  const enrolled = await service.enroll({ slug: 'demo', responseId: firstSubmit.body.responseId, consent: { accepted: true, adultConfirmed: true, version: 1 }, label: '' })

  const second = await call(pub.start, { ip: '203.0.113.50' })
  const body = { responseId: second.body.responseId, track: true, answers: answers([4, 4, 4]) }
  const result = await call(pub.submit, { body, cookies: { bs_track: enrolled.cookieToken }, ip: '203.0.113.50' })
  assert.equal(result.status, 201)
  assert.equal(result.body.tracking.status, 'saved')
  assert.equal(result.body.tracking.session.score, 12)
  assert.equal(db.rowsOf('tracking_sessions').length, 2)
  // gửi lại cùng phản hồi bị chặn bởi pipeline cũ (409), không tạo thêm session
  await assert.rejects(() => call(pub.submit, { body, cookies: { bs_track: enrolled.cookieToken } }), error => error.status === 409)
  assert.equal(db.rowsOf('tracking_sessions').length, 2)
})

test('track=true without a profile only reports the state and the response is still saved', async () => {
  const { db } = await boot()
  const started = await call(pub.start)
  const result = await call(pub.submit, { body: { responseId: started.body.responseId, track: true, answers: answers([1, 2, 3]) } })
  assert.equal(result.status, 201); assert.equal(result.body.tracking.status, 'needs_enrollment')
  assert.equal(db.rowsOf('tracking_sessions').length, 0)
})

test('a tracking failure can never fail the survey submission', async () => {
  const { db, service } = await boot()
  const first = await call(pub.start)
  const firstSubmit = await call(pub.submit, { body: { responseId: first.body.responseId, answers: answers([3, 4, 5]) } })
  const enrolled = await service.enroll({ slug: 'demo', responseId: firstSubmit.body.responseId, consent: { accepted: true, adultConfirmed: true, version: 1 }, label: '' })
  db.failWhen(table => table === 'tracking_sessions')
  const second = await call(pub.start, { ip: '203.0.113.77' })
  const result = await call(pub.submit, { body: { responseId: second.body.responseId, track: true, answers: answers([2, 2, 2]) }, cookies: { bs_track: enrolled.cookieToken }, ip: '203.0.113.77' })
  assert.equal(result.status, 201); assert.equal(result.body.ok, true); assert.equal(result.body.tracking.status, 'error')
  assert.ok(db.rowsOf('responses').find(row => row.id === second.body.responseId).submitted_at)
})

test('surveys without a tracking config keep working even when the tracking tables are missing', async () => {
  const { db } = await boot()
  db.rowsOf('survey_tracking_configs').length = 0
  db.failWhen(table => table.startsWith('tracking') || table === 'survey_tracking_configs', '42P01')
  const started = await call(pub.start)
  const result = await call(pub.submit, { body: { responseId: started.body.responseId, answers: answers([3, 3, 3]) } })
  assert.equal(result.status, 201)
  const withFlag = await call(pub.submit, { body: { track: true, answers: answers([3, 3, 3]) } })
  assert.equal(withFlag.status, 201); assert.equal(withFlag.body.tracking.status, 'error')
})
