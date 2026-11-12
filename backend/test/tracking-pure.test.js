import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSnapshot, computeScore, explainIncompatibility, fingerprintOf, isCompatible, normalizeScoring, slugifyKey
} from '../src/services/tracking-scoring.js'
import { normalizeSchedule, scheduleStatus } from '../src/services/tracking-schedule.js'
import {
  deviceLabel, hashToken, isUsable, newRecoveryCode, newToken, normalizeRecoveryCode, parseCredentialInput
} from '../src/services/tracking-credentials.js'
import { assessmentRef, buildHistory } from '../src/services/tracking-history.js'

const likert = (id, text = id) => ({ id, question_text: text, question_type: 'likert' })
const questions = [likert('q1'), likert('q2'), likert('q3'), { id: 's1', question_text: 'Slider', question_type: 'slider' },
  { id: 'c1', question_text: 'Một lựa chọn', question_type: 'single' }]
const scoringOf = (items, method = 'sum', version = '1') => normalizeScoring({ method, version, items }, questions)

/* ------------------------------------------------------------------ scoring */
test('scoring accepts Likert items, keeps reverse flags and rejects invalid setups', () => {
  const scoring = scoringOf([{ question_id: 'q1' }, { question_id: 'q2', reverse: true }])
  assert.deepEqual(scoring.items, [{ question_id: 'q1', reverse: false }, { question_id: 'q2', reverse: true }])
  assert.throws(() => scoringOf([]), /ít nhất một câu/)
  assert.throws(() => scoringOf([{ question_id: 'q1' }, { question_id: 'q1' }]), /một lần/)
  assert.throws(() => scoringOf([{ question_id: 'nope' }]), /không thuộc khảo sát/)
  assert.throws(() => scoringOf([{ question_id: 'c1' }]), /không phải dạng thang đo số/)
  assert.throws(() => scoringOf([{ question_id: 'q1' }, { question_id: 's1' }]), /cùng khoảng giá trị/)
  assert.throws(() => normalizeScoring({ method: 'median', items: [{ question_id: 'q1' }] }, questions), /sum.*mean/)
})

test('computeScore sums or averages with reverse scoring and exact scale bounds', () => {
  const scoring = scoringOf([{ question_id: 'q1' }, { question_id: 'q2', reverse: true }, { question_id: 'q3' }])
  const snapshot = buildSnapshot(scoring, questions)
  const sum = computeScore(scoring, snapshot, { q1: 4, q2: 2, q3: 5 })   // 4 + (6-2) + 5
  assert.deepEqual({ status: sum.status, score: sum.score, min: sum.min, max: sum.max }, { status: 'scored', score: 13, min: 3, max: 15 })

  const meanScoring = scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }], 'mean')
  const mean = computeScore(meanScoring, buildSnapshot(meanScoring, questions), new Map([['q1', 4], ['q2', '5']]))
  assert.equal(mean.score, 4.5)
  assert.deepEqual([mean.min, mean.max], [1, 5])
})

test('computeScore never estimates: missing or out-of-range answers leave the session unscored', () => {
  const scoring = scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }])
  const snapshot = buildSnapshot(scoring, questions)
  const missing = computeScore(scoring, snapshot, { q1: 3 })
  assert.equal(missing.status, 'incomplete'); assert.equal(missing.score, null)
  assert.equal(computeScore(scoring, snapshot, { q1: 3, q2: 9 }).status, 'incomplete')
  assert.equal(computeScore(scoring, snapshot, { q1: 3, q2: 'abc' }).status, 'incomplete')
  assert.equal(computeScore(scoring, snapshot, { q1: 3, q2: '' }).status, 'incomplete')
})

test('fingerprint ignores question ids but changes with scoring semantics', () => {
  const base = buildSnapshot(scoringOf([{ question_id: 'q1' }, { question_id: 'q2', reverse: true }]), questions)
  const otherIds = buildSnapshot(normalizeScoring({ method: 'sum', version: '1', items: [{ question_id: 'x1' }, { question_id: 'x2', reverse: true }] },
    [likert('x1'), likert('x2')]), [likert('x1'), likert('x2')])
  assert.equal(fingerprintOf('well', base), fingerprintOf('well', otherIds))
  assert.notEqual(fingerprintOf('well', base), fingerprintOf('other', base))
  for (const patch of [{ method: 'mean' }, { version: '2' }, { itemCount: 3, reverse: [false, true, false] }, { reverse: [true, true] }])
    assert.notEqual(fingerprintOf('well', base), fingerprintOf('well', { ...base, ...patch }))
})

test('incompatibility is explained in Vietnamese and never silently compared', () => {
  const a = buildSnapshot(scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }]), questions)
  const b = buildSnapshot(scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }, { question_id: 'q3' }], 'mean', '2'), questions)
  const sa = { scoring_fingerprint: fingerprintOf('k', a), scoring_snapshot: a }
  const sb = { scoring_fingerprint: fingerprintOf('k', b), scoring_snapshot: b }
  assert.equal(isCompatible(sa, sa), true)
  assert.equal(isCompatible(sa, sb), false)
  assert.deepEqual(explainIncompatibility(sa, sa), [])
  const reasons = explainIncompatibility(sa, sb).join(' ')
  assert.match(reasons, /Cách tính điểm khác nhau/); assert.match(reasons, /Số câu tính điểm khác nhau \(2 so với 3\)/); assert.match(reasons, /Phiên bản thang điểm/)
  assert.equal(isCompatible({ scoring_fingerprint: null }, { scoring_fingerprint: null }), false)
})

test('slugifyKey strips Vietnamese diacritics', () => {
  assert.equal(slugifyKey('Đánh giá sức khỏe tinh thần!'), 'danh-gia-suc-khoe-tinh-than')
})

/* ----------------------------------------------------------------- schedule */
test('schedule status: unscheduled, upcoming, due soon, due, overdue, completed', () => {
  const schedule = normalizeSchedule({ intervalDays: 14, upcomingDays: 3, graceDays: 7 })
  const last = '2026-03-01T00:00:00Z'
  const at = day => scheduleStatus({ sessionCount: 1, lastCompletedAt: last, schedule, now: new Date(`2026-03-${String(day).padStart(2, '0')}T00:00:00Z`) })
  assert.equal(at(5).status, 'upcoming')
  assert.equal(at(13).status, 'due_soon')          // còn 2 ngày
  assert.equal(at(16).status, 'due')               // quá hạn 1 ngày, vẫn trong thời gian chờ
  assert.equal(at(25).status, 'overdue')           // quá hạn 10 ngày
  assert.equal(at(5).nextDueAt, '2026-03-15T00:00:00.000Z')
  assert.equal(scheduleStatus({ sessionCount: 1, lastCompletedAt: last, schedule: {}, now: new Date() }).status, 'unscheduled')
  assert.equal(scheduleStatus({ sessionCount: 3, lastCompletedAt: last, schedule: { ...schedule, maxSessions: 3 }, now: new Date() }).status, 'completed')
})

test('schedule validation rejects out-of-range values and applies defaults', () => {
  assert.deepEqual(normalizeSchedule({}), { intervalDays: null, upcomingDays: 3, graceDays: 7, maxSessions: null })
  assert.throws(() => normalizeSchedule({ intervalDays: 0 }), /từ 1 đến 365/)
  assert.throws(() => normalizeSchedule({ graceDays: 1.5 }), /số nguyên/)
  assert.equal(normalizeSchedule({ intervalDays: '30' }).intervalDays, 30)
})

/* -------------------------------------------------------------- credentials */
test('recovery codes are well-formed, unambiguous and normalised from user input', () => {
  const code = newRecoveryCode()
  assert.match(code, /^[A-HJKMNP-Z2-9]{4}(-[A-HJKMNP-Z2-9]{4}){3}$/)
  assert.notEqual(code, newRecoveryCode())
  assert.equal(normalizeRecoveryCode(code.toLowerCase().replaceAll('-', ' ')), code)
  assert.equal(normalizeRecoveryCode('0000-0000-0000-0000'), null)      // 0/O/1/I không thuộc bảng chữ cái
  assert.equal(normalizeRecoveryCode('ABCD-EFGH'), null)
})

test('credential input is recognised as code, bare token or pasted link; garbage is rejected', () => {
  const token = newToken()
  assert.equal(token.length, 43)
  const code = newRecoveryCode()
  assert.deepEqual(parseCredentialInput(` ${code.toLowerCase()} `), { kind: 'recovery_code', value: code })
  assert.deepEqual(parseCredentialInput(token), { kind: 'recovery_link', value: token })
  assert.deepEqual(parseCredentialInput(`https://example.org/#/track/recover/${token}`), { kind: 'recovery_link', value: token })
  for (const bad of ['', null, 'hello', 'x'.repeat(500), `${token}x`]) assert.equal(parseCredentialInput(bad), null)
})

test('tokens are stored as keyed hashes, never reversible or secret-independent', () => {
  const token = newToken()
  const hash = hashToken(token, 'secret-a')
  assert.match(hash, /^[0-9a-f]{64}$/)
  assert.equal(hash, hashToken(token, 'secret-a'))
  assert.notEqual(hash, hashToken(token, 'secret-b'))
  assert.equal(hash.includes(token), false)
  const saved = { JWT: process.env.JWT_SECRET, TRACK: process.env.TRACKING_TOKEN_SECRET }
  delete process.env.JWT_SECRET; delete process.env.TRACKING_TOKEN_SECRET
  try { assert.throws(() => hashToken(token), error => error.status === 503) }
  finally { if (saved.JWT) process.env.JWT_SECRET = saved.JWT; if (saved.TRACK) process.env.TRACKING_TOKEN_SECRET = saved.TRACK }
})

test('credential usability honours revoke, expiry and one-time links', () => {
  const now = new Date('2026-03-10T00:00:00Z')
  const base = { kind: 'cookie', expires_at: '2026-04-01T00:00:00Z', revoked_at: null, used_at: null }
  assert.equal(isUsable(base, now), true)
  assert.equal(isUsable({ ...base, revoked_at: '2026-03-02T00:00:00Z' }, now), false)
  assert.equal(isUsable({ ...base, expires_at: '2026-03-09T00:00:00Z' }, now), false)
  assert.equal(isUsable({ ...base, kind: 'recovery_link', used_at: '2026-03-05T00:00:00Z' }, now), false)
  assert.equal(isUsable({ ...base, kind: 'recovery_code', used_at: '2026-03-05T00:00:00Z' }, now), true)
  assert.equal(isUsable(null, now), false)
})

test('device labels are coarse and never store the raw user agent', () => {
  assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0) AppleWebKit Chrome/120 Safari/537'), 'Chrome · Windows')
  assert.equal(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/605'), 'Safari · iOS')
  assert.equal(deviceLabel(''), 'Trình duyệt · thiết bị khác')
})

/* ------------------------------------------------------------------ history */
const snapshot = buildSnapshot(scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }]), questions)
const fp = fingerprintOf('well', snapshot)
const session = (n, score, extra = {}) => ({
  id: `s${n}`, survey_id: 'survey', completed_at: `2026-03-0${n}T00:00:00Z`, score, score_min: 2, score_max: 10,
  score_status: score === null ? 'incomplete' : 'scored', scoring_fingerprint: fp, scoring_snapshot: snapshot, excluded: false, ...extra
})

test('first session is the baseline and is not compared with itself', () => {
  const history = buildHistory([session(1, 6)])
  assert.equal(history.comparison.status, 'insufficient')
  assert.equal(history.comparison.baseline.score, 6)
  assert.equal(history.sessions[0].isBaseline, true)
  assert.equal(history.chart.points.length, 1)
})

test('compares latest vs previous and vs baseline using neutral, numeric language', () => {
  const history = buildHistory([session(3, 8), session(1, 6), session(2, 5)])
  assert.equal(history.comparison.status, 'ok')
  assert.deepEqual(history.comparison.vsPrevious, { fromSessionId: 's2', toSessionId: 's3', fromScore: 5, toScore: 8, delta: 3, direction: 'higher', percentOfScale: 37.5 })
  assert.equal(history.comparison.vsBaseline.delta, 2)
  assert.deepEqual(history.chart.points.map(point => point.score), [6, 5, 8])
  assert.equal(JSON.stringify(history).match(/improv|worse|tốt lên|xấu đi|cải thiện|nặng hơn/i), null)
  assert.match(history.disclaimer, /không phải kết luận/)
})

test('with exactly two compatible sessions baseline and previous coincide, so only one comparison is given', () => {
  const comparison = buildHistory([session(1, 4), session(2, 4)]).comparison
  assert.equal(comparison.vsPrevious.direction, 'same')
  assert.equal(comparison.vsBaseline, null)
})

test('incompatible, incomplete and excluded sessions are listed with a reason but never compared', () => {
  const other = buildSnapshot(scoringOf([{ question_id: 'q1' }, { question_id: 'q2' }], 'mean', '2'), questions)
  const history = buildHistory([
    session(1, 6, { scoring_fingerprint: fingerprintOf('well', other), scoring_snapshot: other }),
    session(2, 5), session(3, null), session(4, 9, { excluded: true }), session(5, 7)
  ])
  assert.equal(history.comparison.status, 'ok')
  assert.deepEqual(history.chart.points.map(point => point.sessionId), ['s2', 's5'])
  const bySession = Object.fromEntries(history.sessions.map(item => [item.id, item]))
  assert.match(bySession.s1.note, /Cách tính điểm khác nhau/)
  assert.match(bySession.s3.note, /Chưa đủ câu trả lời/)
  assert.equal(bySession.s4.note, 'Không dùng để so sánh.')
  assert.equal(bySession.s4.score, null)            // không lộ điểm của lần đo bị loại
  assert.equal(history.incompatibleCount, 3)
})

test('no scored session yields an explicit empty comparison instead of a number', () => {
  assert.equal(buildHistory([session(1, null)]).comparison.status, 'no_scored')
  assert.equal(buildHistory([]).comparison.status, 'no_scored')
})

test('assessment refs are opaque, stable and scoped to owner + key', () => {
  assert.equal(assessmentRef('owner-1', 'well'), assessmentRef('owner-1', 'well'))
  assert.notEqual(assessmentRef('owner-1', 'well'), assessmentRef('owner-2', 'well'))
  assert.notEqual(assessmentRef('owner-1', 'well'), assessmentRef('owner-1', 'other'))
  assert.equal(assessmentRef('owner-1', 'well').includes('owner-1'), false)
})
