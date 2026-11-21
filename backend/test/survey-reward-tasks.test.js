import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useRewardService } from '../src/controllers/rewards.js'
import { createRewardService, inDays, normalizeTask, programDay, taskPool } from '../src/services/reward.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-survey-tasks'
const OWNER = '11111111-1111-4111-8111-111111111111', RESEARCHER = '44444444-4444-4444-8444-444444444444', PROFILE = '22222222-2222-4222-8222-222222222222'
const S1 = '33333333-3333-4333-8333-333333333333', S2 = '55555555-5555-4555-8555-555555555555'
const CONSTRAINTS = { unique: { reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']] }, cascade: {} }
const thresholds = { direction: 'higher_worse', cutoffs: [7, 11], labels: ['A', 'B', 'C'] }
const base = { description: '', instructions: '', points: 10, audience: ['green', 'yellow', 'red'], completion_type: 'self_report', times_per_day: 1, is_active: true, is_placeholder: true, sort_order: 0 }
const START = '2026-11-10T05:00:00Z'                     // 12:00 giờ VN, ngày 1

async function boot({ now = '2026-11-10T06:00:00Z', surveyId = S1 } = {}) {
  let current = new Date(now)
  const db = createFakeDb({
    tracking_profiles: [{ id: PROFILE }],
    tracking_sessions: [{ id: 's1', profile_id: PROFILE, survey_id: surveyId, band: 1, band_thresholds: thresholds, completed_at: START }],
    survey_tracking_configs: [{ survey_id: S1, rewards_enabled: true }, { survey_id: S2, rewards_enabled: true }],
    reward_settings: [], reward_tasks: [], reward_task_starts: [], reward_completions: []
  }, CONSTRAINTS)
  const service = createRewardService(db, { clock: () => current })
  await service.createTask({ ...base, code: 'G-GLOBAL', name: 'Việc chung' }, OWNER)
  return { db, service, setNow: value => { current = new Date(value) } }
}

test('programDay counts local Vietnam days, crossing midnight at 00:00 ICT, and never goes below 1', () => {
  assert.equal(programDay('2026-11-10T16:59:00Z', '2026-11-10'), 1)        // 23:59 ngày 10 giờ VN
  assert.equal(programDay('2026-11-10T16:59:00Z', '2026-11-11'), 2)
  assert.equal(programDay('2026-11-10T17:01:00Z', '2026-11-11'), 1)        // đã sang ngày 11 giờ VN: ngày 1
  assert.equal(programDay('2026-11-10T05:00:00Z', '2026-11-01'), 1)
  assert.equal(programDay('2026-11-10T05:00:00Z', '2026-11-24'), 15)
})

test('normalizeTask validates the day range and leaves it out when unset', () => {
  assert.equal('start_day' in normalizeTask({ ...base, code: 'AB-1', name: 'x' }), false)
  assert.deepEqual([3, 5], (({ start_day, end_day }) => [start_day, end_day])(normalizeTask({ ...base, code: 'AB-1', name: 'x', start_day: 3, end_day: 5 })))
  assert.throws(() => normalizeTask({ ...base, code: 'AB-1', name: 'x', start_day: 5, end_day: 3 }), { status: 400 })
  assert.throws(() => normalizeTask({ ...base, code: 'AB-1', name: 'x', start_day: 0 }), { status: 400 })
  assert.throws(() => normalizeTask({ ...base, code: 'AB-1', name: 'x', end_day: 366 }), { status: 400 })
  assert.equal(inDays({ start_day: 2, end_day: 4 }, 1), false); assert.equal(inDays({ start_day: 2, end_day: 4 }, 4), true); assert.equal(inDays({}, 99), true)
})

test('taskPool: a survey with its own active tasks uses only them; otherwise the global set (old behaviour)', () => {
  const global = { code: 'G', survey_id: null }, own = { code: 'S', survey_id: S1 }, other = { code: 'O', survey_id: S2 }
  assert.deepEqual(taskPool([global, own, other], S1).map(t => t.code), ['S'])
  assert.deepEqual(taskPool([global, other], S1).map(t => t.code), ['G'])
  assert.deepEqual(taskPool([global], S1).map(t => t.code), ['G'])
})

test('no survey tasks: the student sees exactly the global tasks, as before', async () => {
  const { service } = await boot()
  const today = await service.today(PROFILE)
  assert.deepEqual(today.tasks.map(t => t.code), ['G-GLOBAL'])
  assert.equal(today.programDay, 1)
})

test('survey tasks replace the global set and follow the day schedule; hiding returns to the old set', async () => {
  const { service, setNow } = await boot()
  const early = await service.createSurveyTask(S1, { ...base, name: 'Ngày 1–2', start_day: 1, end_day: 2 }, OWNER)
  const late = await service.createSurveyTask(S1, { ...base, name: 'Ngày 5 trở đi', start_day: 5 }, OWNER)
  await service.createSurveyTask(S2, { ...base, name: 'Của khảo sát khác' }, OWNER)
  assert.match(early.code, /^S[0-9a-f]{6}-\d\d$/); assert.ok(early.code.length <= 24)
  assert.deepEqual((await service.today(PROFILE)).tasks.map(t => t.name), ['Ngày 1–2'])
  setNow('2026-11-14T06:00:00Z')                                          // ngày 5
  assert.deepEqual((await service.today(PROFILE)).tasks.map(t => t.name), ['Ngày 5 trở đi'])
  setNow('2026-11-12T06:00:00Z')                                          // ngày 3: không có việc nào trong lịch, KHÔNG rơi về bộ chung
  assert.deepEqual((await service.today(PROFILE)).tasks, [])
  await service.updateSurveyTask(S1, early.id, { is_active: false }); await service.updateSurveyTask(S1, late.id, { is_active: false })
  assert.deepEqual((await service.today(PROFILE)).tasks.map(t => t.code), ['G-GLOBAL'])
})

test('complete/start refuse another survey\'s task, a global task once the survey has its own, and tasks outside the schedule', async () => {
  const { service, setNow } = await boot()
  const own = await service.createSurveyTask(S1, { ...base, name: 'Riêng', start_day: 1, end_day: 2 }, OWNER)
  const foreign = await service.createSurveyTask(S2, { ...base, name: 'Khác' }, OWNER)
  await assert.rejects(service.complete(PROFILE, foreign.code, { confirmed: true }), { status: 404 })
  await assert.rejects(service.complete(PROFILE, 'G-GLOBAL', { confirmed: true }), { status: 404 })
  assert.equal((await service.complete(PROFILE, own.code, { confirmed: true })).points, 10)
  setNow('2026-11-14T06:00:00Z')
  await assert.rejects(service.complete(PROFILE, own.code, { confirmed: true }), { status: 409 })
})

test('survey tasks are owned by their survey: updating through another survey is a 404 and the code never changes', async () => {
  const { service } = await boot()
  const task = await service.createSurveyTask(S1, { ...base, name: 'Riêng' }, OWNER)
  await assert.rejects(service.updateSurveyTask(S2, task.id, { name: 'Đổi' }), { status: 404 })
  const updated = await service.updateSurveyTask(S1, task.id, { name: 'Đổi', code: 'HACK-1', survey_id: S2, start_day: 2, end_day: 9 })
  assert.equal(updated.code, task.code); assert.equal(updated.survey_id, S1); assert.equal(updated.name, 'Đổi')
  assert.deepEqual((await service.listSurveyTasks(S1)).tasks.map(t => t.id), [task.id])
  assert.deepEqual((await service.listSurveyTasks(S2)).tasks, [])
})

test('without migration 021: ordinary tasks still work, listing says unavailable, survey task writes answer 503', async () => {
  const { db, service } = await boot()
  db.failWhen((table, op) => table === 'reward_tasks' && op === 'insert', 'PGRST204', "Could not find the 'survey_id' column of 'reward_tasks'")
  await assert.rejects(service.createSurveyTask(S1, { ...base, name: 'Riêng' }, OWNER), error => error.status === 503 && /021_survey_reward_tasks/.test(error.message))
  db.clearFailures()
  db.failWhen((table, op) => table === 'reward_tasks' && op === 'select' , 'PGRST204', "column reward_tasks.survey_id does not exist")
  assert.deepEqual(await service.listSurveyTasks(S1), { available: false, tasks: [] })
})

/* ------------------------------------------------------------------ HTTP: quyền */
async function bootHttp() {
  const db = createFakeDb({
    users: [{ id: OWNER, username: 'owner', is_admin: false }, { id: RESEARCHER, username: 'res', is_admin: false }],
    surveys: [{ id: S1, user_id: OWNER, title: 'KS 1', status: 'draft' }, { id: S2, user_id: RESEARCHER, title: 'KS 2', status: 'draft' }],
    research_projects: [], research_project_members: [], research_project_surveys: [],
    reward_settings: [], reward_tasks: [], activity_logs: []
  }, CONSTRAINTS)
  useSupabaseForTests(db); useRewardService(createRewardService(db))
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const call = async (method, path, user, body) => {
    const headers = { 'content-type': 'application/json' }
    if (user) headers.cookie = `token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}`
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, json: await res.json().catch(() => ({})) }
  }
  return { call, close: () => server.close() }
}

test('HTTP: only the survey owner writes survey tasks; other accounts read at most; a task cannot be reached through another survey', async () => {
  const { call, close } = await bootHttp()
  try {
    assert.equal((await call('GET', `/tracking/surveys/${S1}/tasks`)).status, 401)
    const made = await call('POST', `/tracking/surveys/${S1}/tasks`, OWNER, { ...base, name: 'Thở', start_day: 1, end_day: 7 })
    assert.equal(made.status, 201); assert.equal(made.json.task.survey_id, S1)
    assert.equal((await call('POST', `/tracking/surveys/${S1}/tasks`, RESEARCHER, { ...base, name: 'Lén' })).status, 403)
    assert.equal((await call('POST', `/tracking/surveys/${S1}/tasks`, OWNER, { ...base, name: 'Sai', start_day: 9, end_day: 2 })).status, 400)
    const list = await call('GET', `/tracking/surveys/${S1}/tasks`, OWNER)
    assert.equal(list.status, 200); assert.equal(list.json.canEdit, true); assert.equal(list.json.tasks.length, 1)
    const viewer = await call('GET', `/tracking/surveys/${S1}/tasks`, RESEARCHER)
    assert.equal(viewer.json.canEdit, false)
    assert.equal((await call('PUT', `/tracking/surveys/${S2}/tasks/${made.json.task.id}`, RESEARCHER, { name: 'Chiếm' })).status, 404)
    assert.equal((await call('PUT', `/tracking/surveys/${S1}/tasks/${made.json.task.id}`, OWNER, { is_active: false })).status, 200)
    assert.equal((await call('GET', '/admin/rewards/tasks', OWNER)).status, 403)
  } finally { close() }
})
