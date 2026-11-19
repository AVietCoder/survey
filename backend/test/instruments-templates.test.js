import test from 'node:test'
import assert from 'node:assert/strict'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createTrackingService } from '../src/services/tracking.js'
import * as pub from '../src/controllers/public.js'
import {
  INSTRUMENTS, computeHcl32, computePsqi, detectInstruments, mapInstrumentItems, parseClock, parseHours, parseMinutes
} from '../src/services/tracking-instruments.js'
import { buildSnapshot, computeScore, fingerprintOf, normalizeBands, normalizeScoring } from '../src/services/tracking-scoring.js'
import { TEMPLATES, createSurveyFromTemplate, listTemplates } from '../src/services/survey-templates.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-instruments'
const USER = '11111111-1111-4111-8111-111111111111'

/* ------------------------------------------------------------------- đọc dữ liệu */
test('parseClock reads common Vietnamese/English time formats and rejects nonsense', () => {
  assert.equal(parseClock('23:30'), 23 * 60 + 30)
  assert.equal(parseClock('23h30'), 23 * 60 + 30)
  assert.equal(parseClock('23h'), 23 * 60)
  assert.equal(parseClock('6 giờ 30'), 6 * 60 + 30)
  assert.equal(parseClock('11:30 pm'), 23 * 60 + 30)
  assert.equal(parseClock('11 pm'), 23 * 60)
  assert.equal(parseClock('12 am'), 0)
  assert.equal(parseClock('06:05'), 6 * 60 + 5)
  for (const bad of ['', 'abc', '25:00', '24h', '12:60', '13 pm', '0 am', null, undefined]) assert.equal(parseClock(bad), null, String(bad))
})

test('parseMinutes and parseHours accept decimals with comma, units and reject invalid input', () => {
  assert.equal(parseMinutes('20'), 20); assert.equal(parseMinutes('20 phút'), 20); assert.equal(parseMinutes('1,5'), 1.5)
  assert.equal(parseHours('6.5'), 6.5); assert.equal(parseHours('6,5'), 6.5); assert.equal(parseHours('6h30'), 6.5); assert.equal(parseHours('6 giờ 30'), 6.5); assert.equal(parseHours('7 giờ'), 7)
  for (const bad of ['', 'abc', '-1', '25', '6h75']) { assert.equal(parseHours(bad), null, `hours ${bad}`) }
  for (const bad of ['', 'abc', '-5', '99999']) { assert.equal(parseMinutes(bad), null, `minutes ${bad}`) }
})

/* ------------------------------------------------------------------------- PSQI */
const psqiAnswers = (over = {}) => {
  const base = {
    psqi_bedtime: '23:00', psqi_latency_min: '10', psqi_waketime: '06:30', psqi_sleep_hours: '7.5',
    psqi_5a: '0', psqi_5b: '0', psqi_5c: '0', psqi_5d: '0', psqi_5e: '0', psqi_5f: '0', psqi_5g: '0', psqi_5h: '0', psqi_5i: '0',
    psqi_quality: '0', psqi_medication: '0', psqi_daytime_alert: '0', psqi_enthusiasm: '0', ...over
  }
  return key => base[key]
}

test('PSQI: a good sleeper scores 0 and the worst possible answers score 21', () => {
  const good = computePsqi(psqiAnswers())
  assert.equal(good.status, 'scored'); assert.equal(good.score, 0)
  const worst = computePsqi(psqiAnswers({
    psqi_latency_min: '70', psqi_waketime: '06:00', psqi_sleep_hours: '4.5', psqi_5a: '3', psqi_5b: '3', psqi_5c: '3', psqi_5d: '3', psqi_5e: '3',
    psqi_5f: '3', psqi_5g: '3', psqi_5h: '3', psqi_5i: '3', psqi_5j: '3', psqi_quality: '3', psqi_medication: '3', psqi_daytime_alert: '3', psqi_enthusiasm: '3'
  }))
  assert.equal(worst.score, 21); assert.deepEqual(Object.values(worst.components), [3, 3, 3, 3, 3, 3, 3])
})

test('PSQI: a mixed example matches the hand-computed components', () => {
  // bed 23:00 → wake 06:00 = 7h; ngủ 5.5h = 78.6% (c4=1); duration 5.5 (c3=2); latency 45 phút (2) + 5a=2 → 4 → c2=2
  // 5b..5j = 1+1 = 2 → c5=1; quality=2 (c1); thuốc=1 (c6); ban ngày 2+1=3 → c7=2  → tổng 2+2+2+1+1+1+2 = 11
  const result = computePsqi(psqiAnswers({ psqi_latency_min: '45', psqi_waketime: '06:00', psqi_sleep_hours: '5.5', psqi_5a: '2', psqi_5b: '1', psqi_5c: '1', psqi_quality: '2', psqi_medication: '1', psqi_daytime_alert: '2', psqi_enthusiasm: '1' }))
  assert.deepEqual(result.components, { c1: 2, c2: 2, c3: 2, c4: 1, c5: 1, c6: 1, c7: 2 })
  assert.equal(result.score, 11)
})

test('PSQI: boundaries of duration, efficiency and latency follow the published bands', () => {
  const comp = over => computePsqi(psqiAnswers({ psqi_bedtime: '22:00', psqi_waketime: '06:00', ...over })).components
  assert.deepEqual([8, 7.01, 7, 6, 5.99, 5, 4.99].map(hours => comp({ psqi_sleep_hours: String(hours) }).c3), [0, 0, 1, 1, 2, 2, 3])
  assert.equal(comp({ psqi_sleep_hours: '6.8' }).c4, 0, '6.8/8 = 85% đúng ngưỡng → 0')
  assert.equal(comp({ psqi_sleep_hours: '6.79' }).c4, 1)
  assert.equal(comp({ psqi_sleep_hours: '6' }).c4, 1, '75% đúng ngưỡng → 1')
  assert.equal(comp({ psqi_sleep_hours: '5.2' }).c4, 2, '65% đúng ngưỡng → 2')
  assert.equal(comp({ psqi_sleep_hours: '5.19' }).c4, 3)
  assert.deepEqual([15, 16, 30, 31, 60, 61].map(m => comp({ psqi_latency_min: String(m) }).c2), [0, 1, 1, 1, 1, 2])   // chỉ riêng độ trễ (5a=0): điểm 0,1,1,2,2,3 → thành phần 0,1,1,1,1,2
})

test('PSQI: bedtime after midnight and efficiency above 100% are handled', () => {
  const result = computePsqi(psqiAnswers({ psqi_bedtime: '00:30', psqi_waketime: '07:30', psqi_sleep_hours: '8' }))   // 7h trên giường, ngủ 8h → trần 100%
  assert.equal(result.status, 'scored'); assert.equal(result.efficiency, 100); assert.equal(result.components.c4, 0)
  assert.equal(computePsqi(psqiAnswers({ psqi_bedtime: '23:00', psqi_waketime: '23:00' })).status, 'incomplete', 'cùng giờ → không tính được')
})

test('PSQI: sleep disturbance sum maps to 0 / 1–9 / 10–18 / 19–27', () => {
  const comp = values => computePsqi(psqiAnswers(Object.fromEntries(['5b', '5c', '5d', '5e', '5f', '5g', '5h', '5i', '5j'].map((k, i) => [`psqi_${k}`, String(values[i] ?? 0)])))).components.c5
  assert.equal(comp([]), 0); assert.equal(comp([1]), 1); assert.equal(comp([3, 3, 3]), 1)
  assert.equal(comp([3, 3, 3, 1]), 2); assert.equal(comp([3, 3, 3, 3, 3, 3]), 2); assert.equal(comp([3, 3, 3, 3, 3, 3, 1]), 3)
})

test('PSQI: missing or unreadable required answers give no score, but a blank 5j counts as 0', () => {
  for (const key of ['psqi_bedtime', 'psqi_latency_min', 'psqi_waketime', 'psqi_sleep_hours', 'psqi_5a', 'psqi_5i', 'psqi_quality', 'psqi_medication', 'psqi_daytime_alert', 'psqi_enthusiasm']) {
    const result = computePsqi(psqiAnswers({ [key]: undefined }))
    assert.equal(result.status, 'incomplete', key); assert.equal(result.score, null)
  }
  assert.equal(computePsqi(psqiAnswers({ psqi_bedtime: 'khuya' })).status, 'incomplete')
  assert.equal(computePsqi(psqiAnswers({ psqi_5b: '9' })).status, 'incomplete', 'tần suất ngoài 0–3')
  assert.equal(computePsqi(psqiAnswers({ psqi_5j: '' })).status, 'scored')
})

/* ----------------------------------------------------------------------- HCL-32 */
const hclAnswers = (trueCount, over = {}) => key => (key in over ? over[key] : Number(key.slice(4)) <= trueCount ? 'true' : 'false')

test('HCL-32 counts the TRUE statements (0–32)', () => {
  assert.equal(computeHcl32(hclAnswers(0)).score, 0)
  assert.equal(computeHcl32(hclAnswers(13)).score, 13)
  assert.equal(computeHcl32(hclAnswers(14)).score, 14)
  assert.equal(computeHcl32(hclAnswers(32)).score, 32)
})

test('HCL-32 needs all 32 statements answered true/false', () => {
  const missing = computeHcl32(hclAnswers(10, { hcl_17: undefined }))
  assert.equal(missing.status, 'incomplete'); assert.equal(missing.score, null)
  assert.equal(computeHcl32(hclAnswers(10, { hcl_5: 'maybe' })).status, 'incomplete')
  assert.equal(computeHcl32(hclAnswers(10, { hcl_5: 'TRUE' })).status, 'scored', 'không phân biệt hoa/thường')
})

/* ------------------------------------------------------------- tích hợp bộ chấm điểm */
const fakeQuestions = templateKey => TEMPLATES[templateKey].questions.map((question, index) => ({ id: `q-${templateKey}-${index}`, question_text: question.question_text, question_type: question.question_type, settings: question.settings }))

test('templates carry every required key, so each instrument is detected from its template', () => {
  assert.deepEqual(detectInstruments(fakeQuestions('psqi')), ['psqi'])
  assert.deepEqual(detectInstruments(fakeQuestions('hcl32')), ['hcl32'])
  assert.deepEqual(detectInstruments([{ id: 'x', settings: {} }]), [])
  for (const key of Object.keys(TEMPLATES)) assert.ok(mapInstrumentItems(TEMPLATES[key].instrument, fakeQuestions(key)))
  assert.equal(mapInstrumentItems('psqi', fakeQuestions('hcl32')), null)
})

test('template questions are valid for the survey builder (types, required options, unique keys)', () => {
  for (const template of Object.values(TEMPLATES)) {
    const keys = template.questions.map(question => question.settings.key)
    assert.equal(new Set(keys).size, keys.length, `${template.key}: key trùng`)
    for (const question of template.questions) {
      assert.ok(question.question_text.length <= 500, `${question.settings.key}: quá 500 ký tự`)
      if (question.question_type === 'single') assert.ok(question.options.length >= 2)
    }
  }
  assert.equal(TEMPLATES.psqi.questions.filter(q => q.is_required).length, 17)
  assert.equal(TEMPLATES.hcl32.questions.filter(q => q.is_required).length, 32)
})

test('normalizeScoring/computeScore score a whole instrument through the generic engine', () => {
  const questions = fakeQuestions('hcl32')
  const scoring = normalizeScoring({ method: 'instrument', instrument: 'hcl32' }, questions)
  const snapshot = buildSnapshot(scoring, questions)
  assert.deepEqual([snapshot.min, snapshot.max], [0, 32])
  const answers = new Map(scoring.items.map((item, index) => [item.question_id, index < 14 ? 'true' : 'false']))
  assert.equal(computeScore(scoring, snapshot, answers).score, 14)
  assert.throws(() => normalizeScoring({ method: 'instrument', instrument: 'psqi' }, questions), /chưa có đủ/)
  assert.throws(() => normalizeScoring({ method: 'instrument', instrument: 'nope' }, questions), /không được hỗ trợ/)
})

test('two different instruments never share a scoring fingerprint', () => {
  const a = buildSnapshot(normalizeScoring({ method: 'instrument', instrument: 'psqi' }, fakeQuestions('psqi')), fakeQuestions('psqi'))
  const b = buildSnapshot(normalizeScoring({ method: 'instrument', instrument: 'hcl32' }, fakeQuestions('hcl32')), fakeQuestions('hcl32'))
  assert.notEqual(fingerprintOf('x', a), fingerprintOf('x', b))
})

test('published cutoffs of each instrument are valid band configurations', () => {
  for (const instrument of Object.values(INSTRUMENTS)) {
    const bands = normalizeBands({ enabled: true, ...instrument.publishedBands, supportText: 'Liên hệ phòng tư vấn' }, { method: 'instrument', min: instrument.range[0], max: instrument.range[1], itemCount: 1 })
    assert.equal(bands.labels.length, instrument.publishedBands.labels.length)
  }
})

/* ------------------------------------------------- tạo khảo sát từ mẫu + nộp thật */
async function bootDb() {
  const db = createFakeDb({ surveys: [], questions: [], question_options: [], responses: [], answers: [] }, TRACKING_CONSTRAINTS)
  useSupabaseForTests(db)
  const service = createTrackingService(db)
  useTrackingService(service)
  return { db, service }
}
const call = async (handler, { params, body = {} } = {}) => {
  const out = { status: 200 }
  const res = { status(code) { out.status = code; return this }, json(payload) { out.body = payload; return this } }
  await handler({ params, body, cookies: {}, ip: '203.0.113.9' }, res)
  return out
}

test('listTemplates exposes both instruments with their published cutoffs and no question internals', () => {
  const list = listTemplates()
  assert.deepEqual(list.map(item => item.key), ['psqi', 'hcl32'])
  assert.ok(list.every(item => item.questionCount > 10 && item.publishedBands.cutoffs.length === 1 && !('questions' in item)))
})

test('createSurveyFromTemplate builds a draft with all questions and a disabled instrument scoring config', async () => {
  const { db, service } = await bootDb()
  const { survey, trackingConfigured } = await createSurveyFromTemplate({ key: 'psqi', userId: USER, trackingService: service })
  assert.equal(survey.status, 'draft'); assert.equal(trackingConfigured, true)
  assert.equal(db.rowsOf('questions').filter(q => q.survey_id === survey.id).length, TEMPLATES.psqi.questions.length)
  const config = db.rowsOf('survey_tracking_configs')[0]
  assert.equal(config.enabled, false); assert.equal(config.scoring.method, 'instrument'); assert.equal(config.scoring.instrument, 'psqi')
  assert.deepEqual(config.bands ?? undefined, undefined, 'mức điểm không được tự bật (cần kênh hỗ trợ thật)')
})

test('createSurveyFromTemplate still creates the survey when tracking migration 006 is missing', async () => {
  const { db, service } = await bootDb()
  db.failWhen(table => table === 'survey_tracking_configs', 'PGRST205')
  const out = await createSurveyFromTemplate({ key: 'hcl32', userId: USER, trackingService: service })
  assert.equal(out.trackingConfigured, false); assert.match(out.trackingHint, /006/)
  assert.equal(db.rowsOf('questions').length, TEMPLATES.hcl32.questions.length)
})

test('createSurveyFromTemplate rejects unknown templates and leaves no half-built survey on failure', async () => {
  const { db, service } = await bootDb()
  await assert.rejects(createSurveyFromTemplate({ key: 'nope', userId: USER, trackingService: service }), /Không tìm thấy mẫu/)
  db.failWhen((table, op) => table === 'questions' && op === 'insert', 'XX000')
  await assert.rejects(createSurveyFromTemplate({ key: 'psqi', userId: USER, trackingService: service }))
  assert.equal(db.rowsOf('surveys').length, 0)
})

test('PSQI end to end: publish, a student submits real answers, and gets the right level with support', async () => {
  const { db, service } = await bootDb()
  const { survey } = await createSurveyFromTemplate({ key: 'psqi', userId: USER, trackingService: service, status: 'published' })
  const questions = db.rowsOf('questions').filter(q => q.survey_id === survey.id)
  await service.saveConfig({
    survey, userId: USER, questions, body: {
      scoring: { method: 'instrument', instrument: 'psqi' }, assessmentName: 'PSQI',
      bands: { enabled: true, ...INSTRUMENTS.psqi.publishedBands, showToStudent: true, labels: ['Ngủ tốt', 'Ngủ kém'], supportText: 'Phòng tư vấn của trường' }
    }
  })
  const byKey = Object.fromEntries(questions.map(q => [q.settings.key, q.id]))
  const submit = async values => {
    const started = await call(pub.start, { params: { slug: survey.public_slug } })
    const answers = Object.entries(values).map(([key, value]) => ({ question_id: byKey[key], value }))
    return call(pub.submit, { params: { slug: survey.public_slug }, body: { responseId: started.body.responseId, answers } })
  }
  const good = await submit(Object.fromEntries(['psqi_bedtime', 'psqi_latency_min', 'psqi_waketime', 'psqi_sleep_hours', 'psqi_5a', 'psqi_5b', 'psqi_5c', 'psqi_5d', 'psqi_5e', 'psqi_5f', 'psqi_5g', 'psqi_5h', 'psqi_5i', 'psqi_quality', 'psqi_medication', 'psqi_daytime_alert', 'psqi_enthusiasm'].map(key => [key, { psqi_bedtime: '23:00', psqi_latency_min: '10', psqi_waketime: '06:30', psqi_sleep_hours: '7.5' }[key] ?? '0'])))
  assert.equal(good.status, 201); assert.equal(good.body.band.label, 'Ngủ tốt'); assert.equal(good.body.band.score, 0); assert.equal(good.body.band.support, null)
  const poor = await submit(Object.fromEntries(['psqi_bedtime', 'psqi_latency_min', 'psqi_waketime', 'psqi_sleep_hours', 'psqi_5a', 'psqi_5b', 'psqi_5c', 'psqi_5d', 'psqi_5e', 'psqi_5f', 'psqi_5g', 'psqi_5h', 'psqi_5i', 'psqi_quality', 'psqi_medication', 'psqi_daytime_alert', 'psqi_enthusiasm'].map(key => [key, { psqi_bedtime: '01:00', psqi_latency_min: '50', psqi_waketime: '06:00', psqi_sleep_hours: '4', psqi_quality: '3' }[key] ?? '2'])))
  assert.equal(poor.body.band.label, 'Ngủ kém'); assert.equal(poor.body.band.support, 'Phòng tư vấn của trường'); assert.ok(poor.body.band.score >= 6)
})

test('single-choice answers are stored as option LABELS; the instrument maps them to scores', async () => {
  const { db, service } = await bootDb()
  const { survey } = await createSurveyFromTemplate({ key: 'hcl32', userId: USER, trackingService: service, status: 'published' })
  const questions = (await import('../src/services/surveys.js')).loadQuestions
  const loaded = await questions(survey.id)
  const config = await service.getConfig(survey.id)
  assert.deepEqual(config.scoring.items.find(item => item.key === 'hcl_1').choices, { Đúng: 'true', Sai: 'false' })
  const byKey = Object.fromEntries(loaded.map(q => [q.settings.key, q.id]))
  const answers = Array.from({ length: 32 }, (_, index) => ({ question_id: byKey[`hcl_${index + 1}`], value: index < 14 ? 'Đúng' : 'Sai' }))   // đúng như giao diện lưu
  const result = computeScore(config.scoring, config.scoring.snapshot, new Map(answers.map(a => [a.question_id, a.value])))
  assert.equal(result.status, 'scored'); assert.equal(result.score, 14)
  // đổi tên lựa chọn rồi KHÔNG lưu lại cấu hình → không chấm (không cho điểm sai)
  const renamed = new Map(answers.map(a => [a.question_id, a.value === 'Đúng' ? 'Chính xác' : a.value]))
  assert.equal(computeScore(config.scoring, config.scoring.snapshot, renamed).status, 'incomplete')
})

test('PSQI frequency labels map to 0–3 and a label-only submission scores correctly end to end', async () => {
  const { db, service } = await bootDb()
  const { survey } = await createSurveyFromTemplate({ key: 'psqi', userId: USER, trackingService: service, status: 'published' })
  const loaded = await (await import('../src/services/surveys.js')).loadQuestions(survey.id)
  const byKey = Object.fromEntries(loaded.map(q => [q.settings.key, q]))
  const labelFor = (key, value) => byKey[key].options.find(option => option.value === String(value)).label
  const values = { psqi_bedtime: '23:00', psqi_latency_min: '10', psqi_waketime: '06:30', psqi_sleep_hours: '7.5' }
  const answers = [...Object.entries(values).map(([key, value]) => ({ question_id: byKey[key].id, value })),
    ...['5a', '5b', '5c', '5d', '5e', '5f', '5g', '5h', '5i'].map(item => ({ question_id: byKey[`psqi_${item}`].id, value: labelFor(`psqi_${item}`, 3) })),
    { question_id: byKey.psqi_quality.id, value: labelFor('psqi_quality', 3) }, { question_id: byKey.psqi_medication.id, value: labelFor('psqi_medication', 3) },
    { question_id: byKey.psqi_daytime_alert.id, value: labelFor('psqi_daytime_alert', 3) }, { question_id: byKey.psqi_enthusiasm.id, value: labelFor('psqi_enthusiasm', 3) }]
  const config = await service.getConfig(survey.id)
  const result = computeScore(config.scoring, config.scoring.snapshot, new Map(answers.map(a => [a.question_id, a.value])))
  // c1=3; c2: 10 phút (0)+3 → 3 → 2; c3: 7.5h → 0; c4: 100% → 0; c5: 9 mục × 3 = 27 → 3 (5j trống = 0 nên 24 → 3); c6=3; c7: 3+3 → 3
  assert.equal(result.status, 'scored'); assert.deepEqual(result.components, { c1: 3, c2: 2, c3: 0, c4: 0, c5: 3, c6: 3, c7: 3 }); assert.equal(result.score, 14)
})

test('an instrument-scored config shows no false "question changed type" warnings', async () => {
  const { db, service } = await bootDb()
  const { survey } = await createSurveyFromTemplate({ key: 'psqi', userId: USER, trackingService: service })
  const loaded = await (await import('../src/services/surveys.js')).loadQuestions(survey.id)
  const config = await service.getConfig(survey.id)
  assert.deepEqual(service.serializeConfig(config, loaded).warnings, [])
  db.rowsOf('questions').splice(db.rowsOf('questions').findIndex(q => q.settings.key === 'psqi_quality'), 1)
  const remaining = await (await import('../src/services/surveys.js')).loadQuestions(survey.id)
  assert.match(service.serializeConfig(config, remaining).warnings[0], /đã bị xóa/)
})
