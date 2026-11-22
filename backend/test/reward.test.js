import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { AVATAR_LIMITS, normalizeAvatar, currentGroup, createRewardService, inWindow, localParts, normalizeSettings, normalizeTask, tierOf, weekStart } from '../src/services/reward.js'
import { SEED_TASKS } from '../src/services/reward-seed-tasks.js'
import { useRewardService } from '../src/controllers/rewards.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-reward'
const ADMIN = '11111111-1111-4111-8111-111111111111', PROFILE = '22222222-2222-4222-8222-222222222222', SURVEY = '33333333-3333-4333-8333-333333333333'
const CONSTRAINTS = { unique: { reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']] }, cascade: {} }
const thresholds = (direction = 'higher_worse', cutoffs = [7, 11]) => ({ direction, cutoffs, labels: cutoffs.map((_, i) => `M${i}`).concat('M-last') })
const session = (id, band, completed_at, over = {}) => ({ id, profile_id: PROFILE, survey_id: SURVEY, band, band_thresholds: thresholds(), completed_at, ...over })
const T0 = '2026-11-17T05:00:00Z'                       // 12:00 giờ Việt Nam, thứ Ba

async function boot({ band = 2, enabled = true, now = T0, settings, tasks = true } = {}) {
  let current = new Date(now)
  const db = createFakeDb({
    tracking_profiles: [{ id: PROFILE }], tracking_sessions: band === null ? [] : [session('s1', band, '2026-11-10T00:00:00Z')],
    survey_tracking_configs: [{ survey_id: SURVEY, rewards_enabled: enabled }], reward_settings: [], reward_tasks: [], reward_task_starts: [], reward_completions: []
  }, CONSTRAINTS)
  const service = createRewardService(db, { clock: () => current })
  if (settings) await service.saveSettings(settings, ADMIN)
  if (tasks) for (const task of SEED_TASKS) await service.createTask(task, ADMIN)
  return { db, service, setNow: value => { current = new Date(value) } }
}

/* ------------------------------------------------------------------ hàm thuần */
test('localParts uses Vietnam time regardless of the server time zone, and weeks start on Monday', () => {
  assert.deepEqual(localParts(new Date('2026-11-19T17:30:00Z')), { date: '2026-11-20', minutes: 30 })       // sang ngày mới theo giờ VN
  assert.deepEqual(localParts(new Date('2026-11-19T16:59:00Z')), { date: '2026-11-19', minutes: 23 * 60 + 59 })
  assert.equal(weekStart('2026-11-20'), '2026-11-16'); assert.equal(weekStart('2026-11-16'), '2026-11-16'); assert.equal(weekStart('2026-11-22'), '2026-11-16')
})

test('inWindow is inclusive and open when no window is configured', () => {
  const task = { window_start: '11:00', window_end: '14:00' }
  assert.deepEqual([659, 660, 840, 841].map(minutes => inWindow(task, minutes)), [false, true, true, false])
  assert.equal(inWindow({}, 3), true)
})

test('tierOf maps the least-need level to green, the highest-need to red, the rest to yellow', () => {
  assert.deepEqual([0, 1, 2].map(band => tierOf(session('x', band, T0))), ['green', 'yellow', 'red'])
  assert.deepEqual([0, 1, 2].map(band => tierOf(session('x', band, T0, { band_thresholds: thresholds('higher_better') }))), ['red', 'yellow', 'green'])
  assert.deepEqual([0, 1].map(band => tierOf(session('x', band, T0, { band_thresholds: thresholds('higher_worse', [6]) }))), ['green', 'red'])
  assert.deepEqual([0, 1, 2, 3].map(band => tierOf(session('x', band, T0, { band_thresholds: thresholds('higher_worse', [3, 6, 9]) }))), ['green', 'yellow', 'yellow', 'red'])
  assert.equal(tierOf({ band: null }), null); assert.equal(tierOf({ band: 1 }), null)
})

test('the group stays fixed for a whole cycle: an early retake cannot change it', () => {
  const day = n => new Date(Date.UTC(2026, 10, 1 + n)).toISOString()
  const sessions = [session('a', 2, day(0)), session('b', 0, day(5)), session('c', 0, day(13))]
  assert.equal(currentGroup(sessions, 14).tier, 'red', 'retakes inside 14 days are ignored')
  assert.equal(currentGroup([...sessions, session('d', 0, day(14))], 14).tier, 'green', 'a valid re-assessment after the cycle updates the group')
  assert.equal(currentGroup([], 14), null)
  assert.equal(currentGroup([{ id: 'z', band: null, completed_at: day(0) }], 14), null)
})

test('normalizeTask validates every field and refuses inconsistent configurations', () => {
  const base = { code: 'T-1', name: 'Tên', audience: ['red'] }
  assert.equal(normalizeTask(base).points, 10)
  const bad = (input, pattern) => assert.throws(() => normalizeTask({ ...base, ...input }), pattern)
  bad({ code: '!!' }, /Mã nhiệm vụ/); bad({ name: '' }, /Tên nhiệm vụ/); bad({ audience: [] }, /Nhóm áp dụng/); bad({ audience: ['blue'] }, /Nhóm áp dụng/)
  bad({ points: 99 }, /Điểm thưởng/); bad({ points: -1 }, /Điểm thưởng/); bad({ completion_type: 'camera' }, /Cách xác minh/)
  bad({ completion_type: 'timer' }, /Thời gian tối thiểu/); bad({ completion_type: 'count_chars' }, /ký tự tối thiểu/)
  bad({ completion_type: 'choice', choices: ['một'] }, /lựa chọn/); bad({ completion_type: 'choice', choices: ['a', 'a'] }, /khác nhau/)
  bad({ window_start: '11:00' }, /cả giờ bắt đầu/); bad({ window_start: '14:00', window_end: '11:00' }, /sau giờ bắt đầu/); bad({ window_start: '25:00', window_end: '26:00' }, /HH:MM/)
  bad({ times_per_day: 9 }, /Số lần/)
  assert.equal(normalizeTask({ ...base, completion_type: 'timer', min_seconds: 60 }).min_seconds, 60)
})

test('normalizeSettings keeps one shared cap, distinct friendly names and a sane weekly cap', () => {
  const ok = normalizeSettings({ unit_name: 'Sao', unit_icon: '⭐', daily_cap: 50, weekly_cap: 250, cycle_days: 14 })
  assert.deepEqual(ok.group_labels, { green: 'Gói Duy trì', yellow: 'Gói Cân bằng', red: 'Gói Đồng hành' })
  assert.throws(() => normalizeSettings({ daily_cap: 100, weekly_cap: 50 }), /Trần tuần/)
  assert.throws(() => normalizeSettings({ daily_cap: 0 }), /Trần điểm mỗi ngày/)
  assert.throws(() => normalizeSettings({ group_labels: { green: 'A', yellow: 'a' } }), /khác nhau/)
  assert.throws(() => normalizeSettings({ unit_name: '' }), /Tên đơn vị/)
})

test('seed tasks are all placeholders with equal points, so no tier is rewarded more than another', () => {
  assert.ok(SEED_TASKS.every(task => task.is_placeholder === true))
  assert.equal(new Set(SEED_TASKS.map(task => task.points)).size, 1)
  assert.deepEqual([...new Set(SEED_TASKS.flatMap(task => task.audience))].sort(), ['green', 'red', 'yellow'])
  for (const task of SEED_TASKS) assert.doesNotThrow(() => normalizeTask(task), task.code)
})

/* ---------------------------------------------------------------- hôm nay / nhóm */
test('rewards are off unless the survey enables them and the profile has a banded session', async () => {
  assert.equal((await (await boot({ enabled: false })).service.today(PROFILE)).enabled, false)
  assert.equal((await (await boot({ band: null })).service.today(PROFILE)).enabled, false)
  const off = await (await boot({ enabled: false })).service.today(PROFILE)
  assert.deepEqual(off.tasks, []); assert.equal(off.unit.icon, '⭐')
})

test('today lists only the tasks for the profile group with the friendly name and unit', async () => {
  const { service } = await boot({ band: 2 })
  const view = await service.today(PROFILE)
  assert.equal(view.enabled, true); assert.equal(view.group.tier, 'red'); assert.equal(view.group.label, 'Gói Đồng hành')
  assert.deepEqual(view.tasks.map(task => task.code), ['R-01', 'R-02', 'R-03', 'R-04', 'R-05'])
  assert.ok(view.tasks.every(task => task.placeholder === true))
  assert.deepEqual([view.day.cap, view.week.cap, view.balance], [50, 250, 0])
  const green = await (await boot({ band: 0 })).service.today(PROFILE)
  assert.deepEqual(green.tasks.map(task => task.code), ['G-01', 'G-02', 'G-03'])
  assert.equal((await (await boot({ band: 1 })).service.today(PROFILE)).group.label, 'Gói Cân bằng')
})

test('hidden tasks disappear and a time window makes a task unavailable (not hidden) outside its hours', async () => {
  const { db, service } = await boot({ band: 1, now: '2026-11-17T01:00:00Z' })           // 08:00 giờ VN: ngoài khung 11–14 của Y-01
  assert.equal((await service.today(PROFILE)).tasks.find(task => task.code === 'Y-01').available, false)
  assert.equal((await service.today(PROFILE)).tasks.find(task => task.code === 'Y-02').available, true)
  db.rowsOf('reward_tasks').find(task => task.code === 'Y-02').is_active = false
  assert.equal((await service.today(PROFILE)).tasks.some(task => task.code === 'Y-02'), false)
})

/* ---------------------------------------------------------------- hoàn thành */
test('a self-reported task awards its points once; re-sending never adds points', async () => {
  const { db, service } = await boot({ band: 1 })
  assert.equal((await service.today(PROFILE)).tasks.find(task => task.code === 'Y-02').available, true)
  await assert.rejects(service.complete(PROFILE, 'Y-02', {}), /xác nhận/)
  const first = await service.complete(PROFILE, 'Y-02', { confirmed: true })
  assert.deepEqual([first.duplicate, first.points, first.balance], [false, 10, 10])
  const again = await service.complete(PROFILE, 'Y-02', { confirmed: true })
  assert.deepEqual([again.duplicate, again.points], [true, 10])
  assert.equal(db.rowsOf('reward_completions').length, 1)
  const view = await service.today(PROFILE)
  assert.equal(view.balance, 10); assert.equal(view.tasks.find(task => task.code === 'Y-02').completed, true)
})

test('parallel duplicate submissions still write a single ledger row', async () => {
  const { db, service } = await boot({ band: 1 })
  const results = await Promise.all([1, 2, 3, 4].map(() => service.complete(PROFILE, 'Y-03', { confirmed: true })))
  assert.equal(db.rowsOf('reward_completions').length, 1)
  assert.equal(results.filter(result => !result.duplicate).length, 1)
  assert.equal((await service.today(PROFILE)).balance, 10)
})

test('daily and weekly caps are shared, awards are trimmed instead of rejected, and missed days cost nothing', async () => {
  const { db, service, setNow } = await boot({ band: 1, settings: { daily_cap: 20, weekly_cap: 30 } })
  const codes = ['Y-02', 'Y-03', 'Y-04']
  const day1 = []
  for (const code of codes) day1.push(await service.complete(PROFILE, code, { confirmed: true }))
  assert.deepEqual(day1.map(result => result.points), [10, 10, 0]); assert.equal(day1[2].capped, true)
  assert.equal(db.rowsOf('reward_completions').length, 3, 'a capped completion is still recorded')
  setNow('2026-11-18T05:00:00Z')                                                          // hôm sau, cùng tuần
  assert.equal((await service.complete(PROFILE, 'Y-02', { confirmed: true })).points, 10)
  assert.equal((await service.complete(PROFILE, 'Y-03', { confirmed: true })).points, 0, 'weekly cap 30 reached')
  setNow('2026-11-24T05:00:00Z')                                                          // tuần mới
  assert.equal((await service.complete(PROFILE, 'Y-02', { confirmed: true })).points, 10)
  const view = await service.today(PROFILE)
  assert.equal(view.balance, 40); assert.equal(view.week.earned, 10)
})

test('all tiers share the same cap: a red profile cannot earn more per day than a yellow one', async () => {
  const run = async band => {
    const { service } = await boot({ band, settings: { daily_cap: 25, weekly_cap: 250 } })
    const view = await service.today(PROFILE)
    let total = 0
    for (const task of view.tasks.filter(task => task.completionType === 'self_report' && task.available)) total += (await service.complete(PROFILE, task.code, { confirmed: true })).points
    return total
  }
  const [yellow, red] = [await run(1), await run(2)]
  assert.ok(yellow <= 25 && red <= 25)
})

test('a task outside the profile group or inactive cannot be completed', async () => {
  const { db, service } = await boot({ band: 1 })
  await assert.rejects(service.complete(PROFILE, 'R-02', { confirmed: true }), /Không tìm thấy nhiệm vụ/)
  db.rowsOf('reward_tasks').find(task => task.code === 'Y-02').is_active = false
  await assert.rejects(service.complete(PROFILE, 'Y-02', { confirmed: true }), /Không tìm thấy nhiệm vụ/)
  await assert.rejects(service.complete(PROFILE, 'nope', { confirmed: true }), /Không tìm thấy nhiệm vụ/)
  const disabled = await boot({ band: 1, enabled: false })
  await assert.rejects(disabled.service.complete(PROFILE, 'Y-02', { confirmed: true }), /chưa được bật/)
})

test('time-window tasks are rejected outside their hours and accepted inside', async () => {
  const early = await boot({ band: 2, now: '2026-11-17T05:00:00Z' })                      // 12:00, ngoài khung 22:30–23:59 của R-02
  await assert.rejects(early.service.complete(PROFILE, 'R-02', { confirmed: true }), /22:30–23:59/)
  const late = await boot({ band: 2, now: '2026-11-17T16:00:00Z' })                       // 23:00 giờ VN
  assert.equal((await late.service.complete(PROFILE, 'R-02', { confirmed: true })).points, 10)
})

test('timer tasks need a server-side start and the minimum elapsed time', async () => {
  const { db, service, setNow } = await boot({ band: 2 })
  await assert.rejects(service.complete(PROFILE, 'R-03', {}), /bắt đầu/)
  await service.start(PROFILE, 'R-03')
  setNow('2026-11-17T05:01:00Z')
  await assert.rejects(service.complete(PROFILE, 'R-03', {}), /còn 120 giây/)
  setNow('2026-11-17T05:03:00Z')
  assert.equal((await service.complete(PROFILE, 'R-03', {})).points, 10)
  assert.equal(db.rowsOf('reward_task_starts').length, 0, 'the start record is consumed')
  await assert.rejects(service.start(PROFILE, 'R-02'), /không cần bắt đầu/)
})

test('restarting a timer resets the clock, so completing early after a restart is rejected', async () => {
  const { service, setNow } = await boot({ band: 2 })
  await service.start(PROFILE, 'R-03'); setNow('2026-11-17T05:02:50Z'); await service.start(PROFILE, 'R-03'); setNow('2026-11-17T05:03:00Z')
  await assert.rejects(service.complete(PROFILE, 'R-03', {}), /còn 170 giây/)
})

test('timer tasks with a window cannot start outside it (nap only 11:00–14:00)', async () => {
  const { service } = await boot({ band: 1, now: '2026-11-17T01:00:00Z' })
  await assert.rejects(service.start(PROFILE, 'Y-01'), /11:00–14:00/)
})

test('count and choice tasks store only a number or a choice label, never any typed content', async () => {
  const { db, service } = await boot({ band: 2 })
  await assert.rejects(service.complete(PROFILE, 'R-05', { count: 3 }), /ít nhất 12 ký tự/)
  await assert.rejects(service.complete(PROFILE, 'R-05', { count: 'abc' }), /ít nhất/)
  await service.complete(PROFILE, 'R-05', { count: 40, text: 'nội dung riêng tư', content: 'bí mật' })
  await assert.rejects(service.complete(PROFILE, 'R-01', { choice: 'khác' }), /không hợp lệ/)
  await service.complete(PROFILE, 'R-01', { choice: 'Nhờ người giúp' })
  const serialized = JSON.stringify(db.rowsOf('reward_completions'))
  assert.ok(!serialized.includes('riêng tư') && !serialized.includes('bí mật'))
  assert.deepEqual(db.rowsOf('reward_completions').map(row => row.meta), [{ count: 40 }, { choice: 'Nhờ người giúp' }])
})

test('times_per_day greater than one lets a task earn several times, each slot only once', async () => {
  const { db, service } = await boot({ band: 1 })
  await service.updateTask(db.rowsOf('reward_tasks').find(task => task.code === 'Y-02').id, { times_per_day: 2 })
  const results = [await service.complete(PROFILE, 'Y-02', { confirmed: true }), await service.complete(PROFILE, 'Y-02', { confirmed: true }), await service.complete(PROFILE, 'Y-02', { confirmed: true })]
  assert.deepEqual(results.map(result => result.duplicate), [false, false, true])
  assert.deepEqual(db.rowsOf('reward_completions').map(row => row.slot), [1, 2])
})

test('the ledger snapshots the tier and base points and renaming the unit never touches history', async () => {
  const { db, service } = await boot({ band: 1 })
  await service.complete(PROFILE, 'Y-02', { confirmed: true })
  await service.saveSettings({ unit_name: 'Ngôi sao', unit_icon: '🌟' }, ADMIN)
  const [row] = db.rowsOf('reward_completions')
  assert.deepEqual([row.group_tier, row.base_points, row.points, row.task_code], ['yellow', 10, 10, 'Y-02'])
  assert.deepEqual((await service.today(PROFILE)).unit, { name: 'Ngôi sao', icon: '🌟' })
  assert.equal((await service.today(PROFILE)).balance, 10)
})

/* ------------------------------------------------------------------ quản trị */
test('tasks can be created, edited and hidden but the code cannot change and duplicates are rejected', async () => {
  const { service } = await boot({ tasks: false })
  const created = await service.createTask({ code: 'X-1', name: 'Thử', audience: ['green'] }, ADMIN)
  assert.equal(created.is_placeholder, true, 'new tasks default to placeholder until an admin marks them official')
  await assert.rejects(service.createTask({ code: 'X-1', name: 'Trùng', audience: ['green'] }, ADMIN), /đã tồn tại/)
  const edited = await service.updateTask(created.id, { code: 'HACK', name: 'Tên mới', is_placeholder: false, is_active: false })
  assert.deepEqual([edited.code, edited.name, edited.is_placeholder, edited.is_active], ['X-1', 'Tên mới', false, false])
  await assert.rejects(service.updateTask('00000000-0000-4000-8000-000000000000', { name: 'x' }), /Không tìm thấy/)
  assert.equal((await service.listTasks({ onlyActive: true })).length, 0)
  assert.equal((await service.listTasks()).length, 1)
})

test('without migration 009 the service answers with a 503 hint instead of crashing', async () => {
  const { db, service } = await boot({ band: 1 })
  db.failWhen(table => table === 'reward_tasks', 'PGRST205')
  await assert.rejects(service.today(PROFILE), error => error.status === 503 && /009_reward_system/.test(error.message))
})

/* ----------------------------------------------------------------------- HTTP */
async function bootHttp() {
  const db = createFakeDb({ users: [{ id: ADMIN, username: 'root', is_admin: true }, { id: PROFILE, username: 'alice', is_admin: false }], reward_settings: [], reward_tasks: [], activity_logs: [] }, CONSTRAINTS)
  useSupabaseForTests(db); useRewardService(createRewardService(db))
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, { body, cookie } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    return { status: res.status, json: text.startsWith('{') ? JSON.parse(text) : null }
  }
  return { call, db, close: () => server.close() }
}
const tokenFor = (id, username) => `token=${jwt.sign({ id, username }, process.env.JWT_SECRET)}`

test('HTTP: participant reward routes need a tracking cookie; admin routes need an admin', async () => {
  const app = await bootHttp()
  try {
    assert.equal((await app.call('GET', '/track/rewards/today')).status, 401)
    assert.equal((await app.call('POST', '/track/rewards/tasks/Y-02/complete', { body: { confirmed: true } })).status, 401)
    assert.equal((await app.call('GET', '/admin/rewards/tasks')).status, 401)
    assert.equal((await app.call('GET', '/admin/rewards/tasks', { cookie: tokenFor(PROFILE, 'alice') })).status, 403)
    assert.equal((await app.call('POST', '/admin/rewards/tasks', { cookie: tokenFor(PROFILE, 'alice'), body: { code: 'A-1', name: 'x', audience: ['red'] } })).status, 403)
  } finally { app.close() }
})

test('HTTP: an admin can manage settings and tasks and every change is logged', async () => {
  const app = await bootHttp()
  const admin = tokenFor(ADMIN, 'root')
  try {
    const created = await app.call('POST', '/admin/rewards/tasks', { cookie: admin, body: { code: 'A-1', name: 'Thử', audience: ['red'] } })
    assert.equal(created.status, 201); assert.equal(created.json.task.is_placeholder, true)
    assert.equal((await app.call('POST', '/admin/rewards/tasks', { cookie: admin, body: { code: 'A-1', name: 'Trùng', audience: ['red'] } })).status, 409)
    assert.equal((await app.call('POST', '/admin/rewards/tasks', { cookie: admin, body: { code: 'A-2', name: 'Sai', audience: ['blue'] } })).status, 400)
    const hidden = await app.call('PUT', `/admin/rewards/tasks/${created.json.task.id}`, { cookie: admin, body: { is_active: false } })
    assert.equal(hidden.json.task.is_active, false)
    assert.equal((await app.call('PUT', '/admin/rewards/tasks/not-a-uuid', { cookie: admin, body: {} })).status, 404)
    assert.equal((await app.call('PUT', '/admin/rewards/settings', { cookie: admin, body: { daily_cap: 40, weekly_cap: 200, unit_name: 'Ngôi sao' } })).json.settings.daily_cap, 40)
    assert.equal((await app.call('PUT', '/admin/rewards/settings', { cookie: admin, body: { daily_cap: 500, weekly_cap: 200 } })).status, 400)
    assert.equal((await app.call('GET', '/admin/rewards/settings', { cookie: admin })).json.settings.unit_name, 'Ngôi sao')
    assert.deepEqual(app.db.rowsOf('activity_logs').map(row => row.action), ['reward.task_create', 'reward.task_update', 'reward.settings'])
  } finally { app.close() }
})

test('today exposes the researcher-configured support text and never invents one', async () => {
  const { db, service } = await boot({ band: 2 })
  assert.equal((await service.today(PROFILE)).support, null)
  db.rowsOf('survey_tracking_configs')[0].bands = { enabled: true, supportText: 'Phòng tư vấn: tầng 2 nhà A' }
  assert.equal((await service.today(PROFILE)).support, 'Phòng tư vấn: tầng 2 nhà A')
})

/* ------------------------------------------------------------------ nhân vật tùy chỉnh */
test('avatar: only in-range part indices are stored; invalid input is rejected; unknown keys are ignored', async () => {
  const { service } = await boot()
  assert.deepEqual(normalizeAvatar(undefined), { skin: 0, hair: 0, style: 0, shirt: 0, hat: 0 })
  assert.deepEqual(normalizeAvatar({ skin: 2, hair: 99, shirt: 'x', evil: '<script>' }), { skin: 2, hair: 0, style: 0, shirt: 0, hat: 0 })
  const max = Object.fromEntries(Object.entries(AVATAR_LIMITS).map(([key, limit]) => [key, limit - 1]))
  const saved = await service.equip(PROFILE, { kind: 'avatar', avatar: max })
  assert.deepEqual(saved.avatar, max)
  assert.deepEqual((await service.inventory(PROFILE)).avatar, max, 'đọc lại vẫn giữ nguyên, không bị bộ lọc vật phẩm xóa')
  assert.deepEqual((await service.village(PROFILE)).avatar, max)
  for (const bad of [{ ...max, skin: AVATAR_LIMITS.skin }, { ...max, hat: -1 }, { ...max, hair: 1.5 }, { ...max, shirt: '2' }, {}, null])
    await assert.rejects(service.equip(PROFILE, { kind: 'avatar', avatar: bad }), { status: 400 })
  assert.deepEqual((await service.inventory(PROFILE)).avatar, max, 'đầu vào sai không làm đổi nhân vật')
  const cat = await service.equip(PROFILE, { kind: 'pet', itemCode: 'fox' })
  assert.equal(cat.pet, 'fox'); assert.deepEqual(cat.avatar, max, 'đổi thú cưng không mất nhân vật')
})

test('avatar presets: Emma/Tịnh are accepted, unknown presets are ignored or rejected in strict mode', async () => {
  const { service } = await boot()
  const base = Object.fromEntries(Object.keys(AVATAR_LIMITS).map(key => [key, 0]))
  assert.deepEqual(normalizeAvatar({ ...base, preset: 'emma' }), { ...base, preset: 'emma' })
  assert.deepEqual(normalizeAvatar({ ...base, preset: 'tinh' }), { ...base, preset: 'tinh' })
  assert.deepEqual(normalizeAvatar({ ...base, preset: 'default' }), base, 'mặc định không lưu thêm khóa preset')
  assert.deepEqual(normalizeAvatar({ ...base, preset: '<script>' }), base, 'preset lạ bị bỏ qua khi đọc')
  assert.throws(() => normalizeAvatar({ ...base, preset: 'hacker' }, { strict: true }), { status: 400 })
  const saved = await service.equip(PROFILE, { kind: 'avatar', avatar: { ...base, preset: 'tinh' } })
  assert.equal(saved.avatar.preset, 'tinh')
  assert.equal((await service.inventory(PROFILE)).avatar.preset, 'tinh', 'đọc lại vẫn giữ nhân vật dựng sẵn')
  assert.equal((await service.village(PROFILE)).avatar.preset, 'tinh')
})
