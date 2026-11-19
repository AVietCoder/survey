import test from 'node:test'
import assert from 'node:assert/strict'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createTrackingService, MIN_GROUP_SIZE } from '../src/services/tracking.js'
import * as pub from '../src/controllers/public.js'
import { BAND_TONES, bandFor, bandForParticipant, normalizeBands, scoreRange } from '../src/services/tracking-scoring.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-bands'
const OWNER = '11111111-1111-4111-8111-111111111111', SURVEY = '22222222-2222-4222-8222-222222222222'
const Q = [1, 2, 3].map(i => `aaaaaaaa-0000-4000-8000-00000000000${i}`)
const CONSENT = 'Tôi đồng ý lưu kết quả của mình để theo dõi tiến triển theo thời gian.'
const SNAP = { method: 'sum', version: '1', min: 1, max: 5, itemCount: 3, reverse: [false, false, false] }   // khoảng điểm 3–15
const SUPPORT = 'Phòng tư vấn của trường: tầng 2, nhà A'
const valid = over => ({ enabled: true, direction: 'higher_worse', cutoffs: [7, 11], supportText: SUPPORT, ...over })
const scored = score => ({ status: 'scored', score })

test('scoreRange follows the method, including standard instruments', () => {
  assert.deepEqual(scoreRange(SNAP), [3, 15])
  assert.deepEqual(scoreRange({ ...SNAP, method: 'mean' }), [1, 5])
  assert.deepEqual(scoreRange({ method: 'instrument', min: 0, max: 21, itemCount: 18 }), [0, 21])
})

test('normalizeBands supports 2 to 6 levels and fills default names', () => {
  for (const count of [2, 3, 4, 5, 6]) {
    const cutoffs = Array.from({ length: count - 1 }, (_, index) => 4 + index * 2)       // 4,6,8,10,12 (trong 3–15)
    const bands = normalizeBands(valid({ cutoffs }), SNAP)
    assert.equal(bands.labels.length, count); assert.equal(bands.cutoffs.length, count - 1)
    assert.equal(BAND_TONES[count].length, count)
  }
  assert.deepEqual(normalizeBands(valid({ cutoffs: [7] }), SNAP).labels, ['Mức 1', 'Mức 2'])
  assert.equal(normalizeBands(valid(), SNAP).showToStudent, false, 'tên mức ẩn trừ khi nhà nghiên cứu cho hiện')
})

test('normalizeBands returns a disabled config for off/absent input and needs no snapshot then', () => {
  assert.equal(normalizeBands(undefined, null), null)
  assert.deepEqual(normalizeBands({ enabled: false, cutoffs: [1, 2] }, null), { enabled: false })
})

test('normalizeBands rejects invalid thresholds, level counts and missing safety information', () => {
  const bad = (input, pattern) => assert.throws(() => normalizeBands(input, SNAP), pattern)
  bad(valid({ cutoffs: [11, 7] }), /tăng dần/)
  bad(valid({ cutoffs: [7, 7] }), /tăng dần/)
  bad(valid({ cutoffs: [3, 11] }), /lớn hơn 3/)                      // vùng thấp sẽ rỗng
  bad(valid({ cutoffs: [7, 16] }), /không vượt 15/)
  bad(valid({ cutoffs: [] }), /điểm cắt/)                            // chỉ 1 mức
  bad(valid({ cutoffs: [4, 5, 6, 7, 8, 9] }), /điểm cắt/)            // 7 mức
  bad(valid({ cutoffs: ['', 11] }), /điểm cắt/)
  bad(valid({ cutoffs: ['abc', 11] }), /điểm cắt/)
  bad(valid({ direction: 'sideways' }), /điểm cao/)
  bad(valid({ supportText: '   ' }), /kênh hỗ trợ/)
  bad(valid({ supportText: 'x'.repeat(601) }), /600/)
  bad(valid({ labels: ['A', 'a', 'B'] }), /khác nhau/)
  bad(valid({ labels: ['x'.repeat(41), 'B', 'C'] }), /40/)
  assert.throws(() => normalizeBands(valid(), null), /chọn câu hỏi/)
})

test('bandFor maps zones by direction; each cutoff is the first score of the higher zone', () => {
  const worse = normalizeBands(valid(), SNAP), better = normalizeBands(valid({ direction: 'higher_better' }), SNAP)
  const scores = [3, 6.99, 7, 10.99, 11, 15]
  assert.deepEqual(scores.map(score => bandFor(worse, scored(score)).tone), ['green', 'green', 'yellow', 'yellow', 'red', 'red'])
  assert.deepEqual(scores.map(score => bandFor(better, scored(score)).tone), ['red', 'red', 'yellow', 'yellow', 'green', 'green'])
  assert.deepEqual(scores.map(score => bandFor(worse, scored(score)).index), [0, 0, 1, 1, 2, 2])
})

test('bandFor works for 2, 4 and 6 levels with tones ordered by need for support', () => {
  const two = normalizeBands(valid({ cutoffs: [6] }), { method: 'instrument', min: 0, max: 21, itemCount: 18 })
  assert.deepEqual([5, 6].map(score => bandFor(two, scored(score)).tone), ['green', 'red'])
  const four = normalizeBands(valid({ cutoffs: [5, 8, 11] }), SNAP)
  assert.deepEqual([4, 5, 8, 11].map(score => bandFor(four, scored(score)).tone), ['green', 'yellow', 'orange', 'red'])
  const six = normalizeBands(valid({ cutoffs: [4, 6, 8, 10, 12], direction: 'higher_better' }), SNAP)
  assert.equal(bandFor(six, scored(3)).tone, 'red'); assert.equal(bandFor(six, scored(15)).tone, 'blue')
})

test('bandFor never classifies an incomplete, unscored or disabled result', () => {
  const bands = normalizeBands(valid(), SNAP)
  assert.equal(bandFor(bands, { status: 'incomplete', score: null }), null)
  assert.equal(bandFor(bands, { status: 'unscored', score: null }), null)
  assert.equal(bandFor({ enabled: false }, scored(5)), null)
  assert.equal(bandFor(null, scored(5)), null)
})

test('participants see names only when allowed, but the highest-need level always carries the support text', () => {
  const hidden = normalizeBands(valid(), SNAP), shown = normalizeBands(valid({ showToStudent: true }), SNAP)
  const top = bandFor(hidden, scored(15)), low = bandFor(hidden, scored(3)), mid = bandFor(hidden, scored(8))
  assert.deepEqual(bandForParticipant(hidden, low), { tone: null, label: null, showLabel: false, levels: 3, support: null })
  const red = bandForParticipant(hidden, top)
  assert.equal(red.label, null); assert.equal(red.tone, null); assert.equal(red.support, SUPPORT)
  assert.equal(bandForParticipant(hidden, mid).support, null, 'middle levels do not get the support box')
  assert.equal(bandForParticipant(shown, bandFor(shown, scored(8))).label, 'Mức 2')
  // với hướng điểm cao là tốt, mức cần hỗ trợ nhiều nhất là vùng điểm THẤP
  const better = normalizeBands(valid({ direction: 'higher_better' }), SNAP)
  assert.equal(bandForParticipant(better, bandFor(better, scored(3))).support, SUPPORT)
  assert.equal(bandForParticipant(better, bandFor(better, scored(15))).support, null)
})

/* -------------------------------------------------- qua pipeline nộp phản hồi thật */
async function boot({ withBands = true, tracking = true, bandsOver = {} } = {}) {
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
    body: {
      enabled: tracking, assessmentName: 'Giấc ngủ', consentText: CONSENT, scoring: { method: 'sum', items: Q.map(question_id => ({ question_id })) },
      ...(withBands ? { bands: valid({ showToStudent: true, labels: ['Gói Giữ nhịp', 'Gói Chỉnh nhịp', 'Gói Hạ nhiệt'], ...bandsOver }) } : {})
    }
  })
  return { db, service }
}
const call = async (handler, { params = { slug: 'demo' }, body = {}, cookies = {} } = {}) => {
  const out = { status: 200 }
  const res = { status(code) { out.status = code; return this }, json(payload) { out.body = payload; return this } }
  await handler({ params, body, cookies, ip: '203.0.113.9' }, res)
  return out
}
const submitWith = async values => {
  const started = await call(pub.start)
  return call(pub.submit, { body: { responseId: started.body.responseId, answers: Q.map((question_id, i) => ({ question_id, value: values[i] })) } })
}

test('the level is returned at submit time even though the student never created a tracking profile', async () => {
  const { db } = await boot()
  const green = await submitWith([1, 2, 2]), red = await submitWith([5, 5, 5])
  assert.equal(green.body.band.tone, 'green'); assert.equal(green.body.band.label, 'Gói Giữ nhịp'); assert.equal(green.body.band.support, null)
  assert.equal(red.body.band.tone, 'red'); assert.equal(red.body.band.support, SUPPORT)
  assert.equal(db.rowsOf('tracking_sessions').length, 0, 'no profile and no session were created')
})

test('the support box is returned even when level names are hidden', async () => {
  await boot({ bandsOver: { showToStudent: false } })
  const red = await submitWith([5, 5, 5])
  assert.equal(red.body.band.tone, null); assert.equal(red.body.band.label, null); assert.equal(red.body.band.support, SUPPORT)
})

test('a two-level configuration works end to end', async () => {
  await boot({ bandsOver: { cutoffs: [9], labels: ['Ổn', 'Cần hỗ trợ'] } })
  assert.equal((await submitWith([2, 2, 2])).body.band.label, 'Ổn')
  const high = await submitWith([4, 4, 4])
  assert.equal(high.body.band.label, 'Cần hỗ trợ'); assert.equal(high.body.band.support, SUPPORT); assert.equal(high.body.band.levels, 2)
})

test('levels work even when progress tracking itself is switched off', async () => {
  await boot({ tracking: false })
  assert.equal((await submitWith([5, 5, 5])).body.band.tone, 'red')
})

test('an incomplete scoring answer set returns no level instead of guessing', async () => {
  const { db } = await boot()
  db.rowsOf('questions')[2].is_required = false          // cho phép bỏ trống câu 3 để kiểm tra riêng phần chấm mức
  const started = await call(pub.start)
  const out = await call(pub.submit, { body: { responseId: started.body.responseId, answers: [{ question_id: Q[0], value: 5 }, { question_id: Q[1], value: 5 }] } })
  assert.equal(out.status, 201); assert.equal('band' in out.body, false)
})

test('a survey without levels behaves exactly as before: no band field in the response', async () => {
  await boot({ withBands: false })
  assert.equal('band' in (await submitWith([5, 5, 5])).body, false)
})

test('a survey with no tracking config at all is unaffected', async () => {
  const db = createFakeDb({
    surveys: [{ id: SURVEY, user_id: OWNER, title: 'Khảo sát', description: '', settings: {}, status: 'published', public_slug: 'demo', updated_at: '2026-01-01T00:00:00Z' }],
    questions: Q.map((id, position) => ({ id, survey_id: SURVEY, question_text: `Câu ${position + 1}`, question_type: 'likert', position, is_required: true, settings: {} })),
    responses: [], answers: []
  }, TRACKING_CONSTRAINTS)
  useSupabaseForTests(db); useTrackingService(createTrackingService(db))
  const out = await submitWith([5, 5, 5])
  assert.equal(out.status, 201); assert.equal('band' in out.body, false)
})

test('submission still succeeds when the tracking tables are missing (migration not applied)', async () => {
  const { db } = await boot()
  db.failWhen(table => table === 'survey_tracking_configs', 'PGRST205')
  const out = await submitWith([5, 5, 5])
  assert.equal(out.status, 201); assert.equal(out.body.ok, true); assert.equal('band' in out.body, false)
})

test('the level index, thresholds and names used are frozen on a saved session', async () => {
  const { db, service } = await boot()
  const out = await submitWith([5, 5, 5])
  await service.enroll({ slug: 'demo', responseId: out.body.responseId, consent: { accepted: true, adultConfirmed: true, version: 1 }, label: '' })
  const [session] = db.rowsOf('tracking_sessions')
  assert.equal(session.band, 2)
  assert.deepEqual(session.band_thresholds, { direction: 'higher_worse', cutoffs: [7, 11], labels: ['Gói Giữ nhịp', 'Gói Chỉnh nhịp', 'Gói Hạ nhiệt'] })
  await service.saveConfig({ survey: db.rowsOf('surveys')[0], userId: OWNER, questions: db.rowsOf('questions'), body: { bands: valid({ cutoffs: [13, 15] }) } })
  assert.equal(db.rowsOf('tracking_sessions')[0].band, 2)
  assert.deepEqual(db.rowsOf('tracking_sessions')[0].band_thresholds.cutoffs, [7, 11])
})

test('saveConfig without a bands field never touches the bands column (works before migration 008)', async () => {
  const { db, service } = await boot({ withBands: false })
  assert.equal('bands' in db.rowsOf('survey_tracking_configs')[0], false)
  await service.saveConfig({ survey: db.rowsOf('surveys')[0], userId: OWNER, questions: db.rowsOf('questions'), body: { assessmentName: 'Giấc ngủ 2' } })
  assert.equal('bands' in db.rowsOf('survey_tracking_configs')[0], false)
})

test('enabling levels requires a scored scale and support text, and is rejected otherwise', async () => {
  const { db, service } = await boot({ withBands: false })
  const save = body => service.saveConfig({ survey: db.rowsOf('surveys')[0], userId: OWNER, questions: db.rowsOf('questions'), body })
  await assert.rejects(save({ bands: valid({ supportText: '' }) }), /kênh hỗ trợ/)
  await assert.rejects(save({ bands: valid({ cutoffs: [2, 11] }) }), /lớn hơn 3/)
  assert.equal((await save({ bands: valid() })).bands.enabled, true)
})

test('researcher aggregate counts per level hide small groups', async () => {
  const { db, service } = await boot()
  const config = await service.getConfig(SURVEY), survey = db.rowsOf('surveys')[0]
  const add = (band, count) => { for (let i = 0; i < count; i++) db.rowsOf('tracking_sessions').push({ id: crypto.randomUUID(), profile_id: crypto.randomUUID(), owner_id: OWNER, survey_id: SURVEY, assessment_key: config.assessment_key, score: 5, score_status: 'scored', scoring_fingerprint: config.scoring_fingerprint, completed_at: '2026-03-01T00:00:00Z', band }) }
  add(0, 2)
  let summary = await service.researcherSummary(survey, config)
  assert.equal(summary.bands.suppressed, true); assert.equal(summary.bands.total, null)
  assert.deepEqual(summary.bands.levels.map(level => level.count), [null, null, null])
  add(1, MIN_GROUP_SIZE); add(2, 1)
  summary = await service.researcherSummary(survey, config)
  assert.equal(summary.bands.suppressed, false)
  assert.deepEqual(summary.bands.levels.map(level => level.count), [null, MIN_GROUP_SIZE, null], 'cells under the minimum are hidden')
  assert.deepEqual(summary.bands.levels.map(level => level.label), ['Gói Giữ nhịp', 'Gói Chỉnh nhịp', 'Gói Hạ nhiệt'])
})
