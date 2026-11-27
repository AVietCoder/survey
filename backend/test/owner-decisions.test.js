// Quyết định của chủ dự án 2026-11-27: trần ngày 85, qua ngày mới, ngưỡng PSQI ngoài code, dữ liệu Y-01/Y-02 cho nhà nghiên cứu.
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import ExcelJS from 'exceljs'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { DEFAULT_SETTINGS, createRewardService } from '../src/services/reward.js'
import { SEED_TASKS } from '../src/services/reward-seed-tasks.js'
import { DAILY_CAP, planDailyCap, planYellowUpdate } from '../src/services/yellow-tasks.js'
import { confirmedPsqiCutoffs, psqiStudy, psqiYellowAllowed } from '../src/services/psqi-bands.js'
import { ANSWER_HEADERS, createTaskAnswerService } from '../src/services/task-answers.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-owner'
const OWNER = '11111111-1111-4111-8111-111111111111', RESEARCHER = '44444444-4444-4444-8444-444444444444', REVIEWER = '66666666-6666-4666-8666-666666666666', STRANGER = '77777777-7777-4777-8777-777777777777'
const P1 = '22222222-2222-4222-8222-222222222222', P2 = '22222222-2222-4222-8222-222222222223'
const S1 = '33333333-3333-4333-8333-333333333333', S2 = '55555555-5555-4555-8555-555555555555', PROJECT = '88888888-8888-4888-8888-888888888888'
const yellow = SEED_TASKS.filter(task => task.audience.includes('yellow'))
const CONSTRAINTS = { unique: { reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']] }, cascade: {} }
const vn = (day, time) => new Date(`2026-11-${String(day).padStart(2, '0')}T${time}:00+07:00`)
const TIMES = { 'Y-01': '12:00', 'Y-02': '07:00', 'Y-03': '21:00', 'Y-04': '15:00', 'Y-05': '06:30' }
const session = (profile, survey, over = {}) => ({ id: `${profile}-${survey}`, profile_id: profile, survey_id: survey, band: 1, band_thresholds: { direction: 'higher_worse', cutoffs: [14, 21], labels: ['a', 'b', 'c'] }, completed_at: '2026-11-01T00:00:00Z', ...over })

async function boot({ sessions = [session(P1, S1)], config = {}, settings = [], psqi, extra = {} } = {}) {
  let current = vn(18, '12:00')
  const db = createFakeDb({
    tracking_profiles: [{ id: P1 }, { id: P2 }], tracking_sessions: sessions,
    survey_tracking_configs: [{ survey_id: S1, rewards_enabled: true, ...config }, { survey_id: S2, rewards_enabled: true }],
    reward_settings: settings, reward_tasks: [], reward_task_starts: [], reward_completions: [], ...extra
  }, CONSTRAINTS)
  const service = createRewardService(db, { clock: () => current, ...(psqi ? { psqi } : {}) })
  for (const task of yellow) await service.createTask(task, OWNER)
  const setNow = value => { current = value }
  /** Làm một việc vàng đúng khung giờ của nó trong ngày `day`. */
  const run = async (code, day = 18, body, profile = P1) => {
    setNow(vn(day, TIMES[code]))
    if (code === 'Y-01') { await service.start(profile, code); setNow(vn(day, '12:21')); return service.complete(profile, code, body || {}) }
    return service.complete(profile, code, body || (code === 'Y-02' ? { choice: '15–30 phút' } : { confirmed: true }))
  }
  return { db, service, setNow, run }
}

const permutations = list => list.length < 2 ? [list] : list.flatMap((head, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map(rest => [head, ...rest]))

test('daily cap 85 equals the five yellow tasks: every one of the 120 orders pays each task in full', async () => {
  assert.equal(DAILY_CAP, 85); assert.equal(DEFAULT_SETTINGS.daily_cap, 85); assert.equal(DEFAULT_SETTINGS.weekly_cap, 250)
  assert.equal(yellow.reduce((sum, task) => sum + task.points, 0), 85)
  for (const order of permutations(Object.keys(TIMES))) {
    const { run } = await boot()
    const awarded = []
    for (const code of order) { const result = await run(code); awarded.push([code, result.points, result.capped]) }
    for (const [code, points, capped] of awarded) { assert.equal(points, yellow.find(task => task.code === code).points, `${order}: ${code}`); assert.equal(capped, false) }
  }
})

test('cap limits: an admin cap below 85 trims the last award, extra tasks get 0, and the total never depends on the order', async () => {
  const settings = [{ id: 'global', unit_name: 'Sao', unit_icon: '⭐', daily_cap: 40, weekly_cap: 250, cycle_days: 14, timezone: 'Asia/Ho_Chi_Minh', group_labels: {} }]
  for (const order of [['Y-01', 'Y-02', 'Y-03', 'Y-04', 'Y-05'], ['Y-05', 'Y-04', 'Y-03', 'Y-02', 'Y-01']]) {
    const { run } = await boot({ settings: structuredClone(settings) })
    const points = []
    for (const code of order) points.push((await run(code)).points)
    assert.equal(points.reduce((a, b) => a + b, 0), 40); assert.ok(points.includes(0))
  }
  const extra = await boot()
  for (const code of Object.keys(TIMES)) await extra.run(code)
  await extra.service.createTask({ code: 'Y-99', name: 'Thêm', audience: ['yellow'], points: 10, completion_type: 'self_report' }, OWNER)
  assert.deepEqual(await extra.service.complete(P1, 'Y-99', { confirmed: true }).then(r => [r.points, r.capped]), [0, true])
})

test('two different tasks sent at the same time cannot both slip under the cap', async () => {
  const settings = [{ id: 'global', unit_name: 'Sao', unit_icon: '⭐', daily_cap: 20, weekly_cap: 250, cycle_days: 14, timezone: 'Asia/Ho_Chi_Minh', group_labels: {} }]
  const { service, db } = await boot({ settings })
  const results = await Promise.all(['Y-03', 'Y-04'].map(code => service.complete(P1, code, { confirmed: true })))
  assert.equal(results.reduce((sum, r) => sum + r.points, 0), 20)
  assert.equal(db.rowsOf('reward_completions').reduce((sum, row) => sum + row.points, 0), 20)
  await assert.rejects(service.complete(P1, 'Y-03', {}), { status: 400 })
  assert.equal((await service.complete(P1, 'Y-03', { confirmed: true })).duplicate, true, 'một lượt lỗi không làm kẹt hàng đợi')
})

test('weekly cap stays 250: full days pay 85, 85, then 80 in total, and Monday starts over', async () => {
  const { run, service, setNow } = await boot()
  const day = async d => { let total = 0; for (const code of Object.keys(TIMES)) total += (await run(code, d)).points; return total }
  assert.deepEqual([await day(16), await day(17), await day(18)], [85, 85, 80])      // 16/11/2026 là thứ Hai
  assert.equal(await day(19), 0)
  assert.equal(await day(23), 85)
  setNow(vn(23, '23:00')); assert.equal((await service.today(P1)).week.earned, 85)
})

test('a new Vietnam day: tasks reopen and the daily total resets at 00:00, not at UTC midnight', async () => {
  const { run, service, setNow, db } = await boot()
  await run('Y-03', 18)
  setNow(vn(18, '23:59'))
  assert.equal((await service.today(P1)).day.earned, 20)
  assert.equal((await service.complete(P1, 'Y-03', { confirmed: true })).duplicate, true)
  setNow(vn(19, '00:00'))                                                            // 17:00 UTC ngày 18
  const next = await service.today(P1)
  assert.equal(next.localDate, '2026-11-19'); assert.equal(next.day.earned, 0)
  assert.equal(next.tasks.find(task => task.code === 'Y-03').completed, false)
  assert.deepEqual(await service.complete(P1, 'Y-03', { confirmed: true }).then(r => [r.duplicate, r.points]), [false, 20])
  assert.deepEqual(db.rowsOf('reward_completions').map(row => row.local_date), ['2026-11-18', '2026-11-19'])
  await assert.rejects(service.complete(P1, 'Y-01', {}), { status: 409 }, 'ngoài 11:00–14:00')
})

test('Y-01 window is 11:00–14:00 everywhere, and the yellow tasks are no longer placeholders', async () => {
  const nap = yellow.find(task => task.code === 'Y-01')
  assert.deepEqual([nap.window_start, nap.window_end], ['11:00', '14:00'])
  assert.doesNotMatch(`${nap.description} ${nap.instructions}`, /12[h:]30|14h00/)
  for (const [time, ok] of [['10:59', false], ['11:00', true], ['14:00', true], ['14:01', false]]) {
    const { service, setNow } = await boot(); setNow(vn(18, time))
    if (ok) await service.start(P1, 'Y-01'); else await assert.rejects(service.start(P1, 'Y-01'), { status: 409 }, time)
  }
  const { service } = await boot()
  assert.ok((await service.today(P1)).tasks.every(task => task.placeholder === false))
})

test('production update plan: earlier project versions are updated (placeholder removed), admin edits kept; cap 50 → 85 only', () => {
  const previous = yellow.map(task => ({ ...task, id: task.code, is_placeholder: true, description: task.description.replace('11:00–14:00', '12h30–14h00') }))
  assert.deepEqual(planYellowUpdate(previous).map(item => item.action), ['update', 'update', 'update', 'update', 'update'])
  assert.ok(planYellowUpdate(previous).every(item => item.task.is_placeholder === false))
  assert.deepEqual(planYellowUpdate(yellow.map(task => ({ ...task }))).map(item => item.action), ['same', 'same', 'same', 'same', 'same'])
  assert.equal(planYellowUpdate([{ ...yellow[2], name: 'Admin sửa' }]).find(item => item.task.code === 'Y-03').action, 'keep')
  assert.deepEqual([50, 85, 60].map(daily_cap => planDailyCap({ daily_cap }).action), ['update', 'same', 'keep'])
})

/* ------------------------------------------------------------------ PSQI */
const psqiSession = cutoffs => session(P1, S1, { band_thresholds: { direction: 'higher_worse', cutoffs, labels: cutoffs.map((_, i) => `m${i}`).concat('z') }, scoring_snapshot: { method: 'instrument', instrument: 'psqi' } })
const CONFIRMED = { confirmed: true, cutoffs: [6, 12], confirmedBy: 'Người thử (chỉ trong test)', confirmedAt: '2026-11-27' }

test('PSQI study thresholds are not confirmed in the repository, and only a complete confirmation counts', () => {
  assert.equal(psqiStudy().confirmed, false); assert.equal(psqiStudy().cutoffs, null); assert.equal(confirmedPsqiCutoffs(), null)
  assert.deepEqual(confirmedPsqiCutoffs(CONFIRMED), [6, 12])
  for (const bad of [{ confirmed: false }, { cutoffs: [6] }, { cutoffs: [12, 6] }, { cutoffs: [0, 6] }, { cutoffs: [6, 22] }, { confirmedBy: ' ' }, { confirmedAt: '' }]) assert.equal(confirmedPsqiCutoffs({ ...CONFIRMED, ...bad }), null, JSON.stringify(bad))
  assert.equal(psqiYellowAllowed({ cutoffs: [6, 11] }, CONFIRMED), false)
})

test('the PSQI yellow group stays off until the session was banded with the confirmed cut-offs', async () => {
  const blocked = await boot({ sessions: [psqiSession([6, 11])] })
  assert.equal((await blocked.service.today(P1)).enabled, false)
  await assert.rejects(blocked.service.complete(P1, 'Y-03', { confirmed: true }), { status: 403 })
  const other = await boot({ sessions: [psqiSession([6, 11])], psqi: CONFIRMED })
  assert.equal((await other.service.today(P1)).enabled, false, 'ngưỡng khác ngưỡng đã xác nhận')
  const matching = await boot({ sessions: [psqiSession([6, 12])], psqi: CONFIRMED })
  assert.equal((await matching.service.today(P1)).enabled, true)
  const byConfig = await boot({ config: { scoring: { method: 'instrument', instrument: 'psqi' } } })
  assert.equal((await byConfig.service.today(P1)).enabled, false)
  const hcl = await boot({ sessions: [session(P1, S1, { scoring_snapshot: { instrument: 'hcl32' } })] })
  assert.equal((await hcl.service.today(P1)).enabled, true, 'HCL-32 không bị ảnh hưởng')
})

/* ------------------------------------------------------------------ câu trả lời Y-01 / Y-02 */
async function answered() {
  const world = await boot({ sessions: [session(P1, S1), session(P2, S2)] })
  await world.run('Y-01', 18, { choice: 'Tỉnh táo hơn rồi ✨' })
  await world.run('Y-02', 18, { choice: 'Hơn 60 phút' })
  await world.run('Y-01', 19, {})
  await world.run('Y-03', 19)
  await world.run('Y-02', 19, { choice: 'Dưới 15 phút' }, P2)
  return world
}

test('answers are scoped to the survey, separate Y-01 and Y-02, keep timestamps and carry no personal data', async () => {
  const { db } = await answered()
  const service = createTaskAnswerService(db)
  const rows = await service.list(S1)
  assert.deepEqual(rows.map(row => [row.task, row.answer, row.date, row.time]), [
    ['Y-01', 'Tỉnh táo hơn rồi ✨', '2026-11-18', '12:21'], ['Y-02', 'Hơn 60 phút', '2026-11-18', '07:00'], ['Y-01', '', '2026-11-19', '12:21']
  ].sort((a, b) => `${a[2]}${a[3]}`.localeCompare(`${b[2]}${b[3]}`)))
  assert.equal(rows.find(row => row.task === 'Y-02').answeredAt, vn(18, '07:00').toISOString())
  assert.match(rows[0].participant, /^P-[0-9a-f]{10}$/); assert.equal(new Set(rows.map(row => row.participant)).size, 1)
  assert.doesNotMatch(JSON.stringify(rows), new RegExp(`${P1}|${P2}`))
  const second = await service.list(S2)
  assert.deepEqual(second.map(row => row.answer), ['Dưới 15 phút'])
  assert.notEqual(second[0].participant, rows[0].participant)
  assert.deepEqual((await service.list(S1, { task: 'Y-02' })).map(row => row.task), ['Y-02'])
  assert.equal((await service.list(S1, { from: '2026-11-19' })).length, 1)
  for (const bad of [{ task: 'Y-03' }, { from: 'hôm qua' }, { from: '2026-11-20', to: '2026-11-01' }]) await assert.rejects(service.list(S1, bad), { status: 400 })
  const [nap] = service.summarize(rows)
  assert.deepEqual([nap.total, nap.participants, nap.answers.map(a => a.count)], [2, 1, [1, 0, 1]])
})

test('rows saved before the survey mark existed are attributed to the survey that set the group at that time', async () => {
  const { db } = await answered()
  for (const row of db.rowsOf('reward_completions')) delete row.meta.survey
  const service = createTaskAnswerService(db)
  assert.equal((await service.list(S1)).length, 3); assert.equal((await service.list(S2)).length, 1)
})

test('HTTP: only the owner and project researchers can read or export the answers; files match the data', async () => {
  const { db } = await answered()
  Object.assign(db.tables, {})
  for (const [table, rows] of Object.entries({
    users: [{ id: OWNER, is_admin: false }, { id: RESEARCHER }, { id: REVIEWER }, { id: STRANGER }],
    surveys: [{ id: S1, user_id: OWNER, title: 'HCL thử' }],
    research_project_surveys: [{ project_id: PROJECT, survey_id: S1 }],
    research_projects: [{ id: PROJECT, owner_id: OWNER, title: 'NC' }],
    research_project_members: [{ project_id: PROJECT, user_id: RESEARCHER, role: 'researcher' }, { project_id: PROJECT, user_id: REVIEWER, role: 'reviewer' }],
    activity_logs: []
  })) for (const row of rows) await db.from(table).insert(row)
  useSupabaseForTests(db)
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const get = (path, user) => fetch(`http://127.0.0.1:${server.address().port}/api/tracking/surveys/${S1}/${path}`, { headers: user ? { cookie: `token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` } : {} })
  try {
    for (const path of ['task-answers', 'task-answers.csv', 'task-answers.xlsx']) {
      assert.equal((await get(path)).status, 401, path)
      assert.equal((await get(path, REVIEWER)).status, 404, `reviewer ${path}`)
      assert.equal((await get(path, STRANGER)).status, 404, `viewer ${path}`)
    }
    const view = await (await get('task-answers', RESEARCHER)).json()
    assert.equal(view.total, 3); assert.equal(view.rows.length, 3); assert.deepEqual(view.summary.map(item => item.task), ['Y-01', 'Y-02'])
    const csvResponse = await get('task-answers.csv?task=Y-02', OWNER)
    assert.equal(csvResponse.status, 200); assert.match(csvResponse.headers.get('content-disposition'), /task-answers-Y-02-/); assert.match(csvResponse.headers.get('cache-control'), /no-store/)
    const bytes = Buffer.from(await csvResponse.arrayBuffer()).toString('utf8')
    const lines = bytes.replace(/^﻿/, '').split('\r\n')
    assert.ok(bytes.startsWith('﻿')); assert.equal(lines.length, 2)
    assert.equal(lines[0], ANSWER_HEADERS.map(header => `"${header}"`).join(','))
    assert.match(lines[1], /"Y-02".*"Hơn 60 phút","2026-11-18","07:00","2026-11-18T00:00:00\.000Z"/)
    const book = new ExcelJS.Workbook()
    await book.xlsx.load(Buffer.from(await (await get('task-answers.xlsx', OWNER)).arrayBuffer()))
    assert.deepEqual(book.worksheets.map(sheet => sheet.name), ['Y-01', 'Y-02'])
    assert.deepEqual(book.getWorksheet('Y-01').getRows(1, 3).map(row => row.getCell(5).value || ''), ['Câu trả lời', 'Tỉnh táo hơn rồi ✨', ''])
    assert.equal(book.getWorksheet('Y-02').rowCount, 2)
    assert.equal(db.rowsOf('activity_logs').filter(row => row.action === 'export.task_answers').length, 2)
  } finally { server.close() }
})
