// Nhiệm vụ nhóm vàng (task-for-yellow-one.md) và ba mức HCL-32 (points-in-hcl-32.md).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRewardService, tierOf } from '../src/services/reward.js'
import { SEED_TASKS } from '../src/services/reward-seed-tasks.js'
import { OLD_YELLOW, planYellowUpdate } from '../src/services/yellow-tasks.js'
import { bandFor, normalizeBands } from '../src/services/tracking-scoring.js'
import { INSTRUMENTS, computeHcl32 } from '../src/services/tracking-instruments.js'
import { createFakeDb } from './helpers/fake-db.js'

const ADMIN = '11111111-1111-4111-8111-111111111111', PROFILE = '22222222-2222-4222-8222-222222222222', SURVEY = '33333333-3333-4333-8333-333333333333'
const yellow = SEED_TASKS.filter(task => task.audience.includes('yellow'))
// giờ Việt Nam = UTC + 7
const at = (time, day = '18') => `2026-11-${day}T${String(Number(time.slice(0, 2)) - 7).padStart(2, '0')}:${time.slice(3)}:00Z`

async function boot(now = at('12:00'), tasks = yellow) {
  let current = new Date(now)
  const db = createFakeDb({
    tracking_profiles: [{ id: PROFILE }],
    tracking_sessions: [{ id: 's1', profile_id: PROFILE, survey_id: SURVEY, band: 1, band_thresholds: { direction: 'higher_worse', cutoffs: [14, 21], labels: ['a', 'b', 'c'] }, completed_at: '2026-11-10T00:00:00Z' }],
    survey_tracking_configs: [{ survey_id: SURVEY, rewards_enabled: true }], reward_settings: [], reward_tasks: [], reward_task_starts: [], reward_completions: []
  }, { unique: { reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']] }, cascade: {} })
  const service = createRewardService(db, { clock: () => current })
  for (const task of tasks) await service.createTask(task, ADMIN)
  return { db, service, setNow: value => { current = new Date(value) } }
}

test('HCL-32: yes counts 1, and 0–13 / 14–20 / 21–32 map to green / yellow / red', () => {
  assert.equal(computeHcl32(key => (Number(key.slice(4)) <= 14 ? 'true' : 'false')).score, 14)
  const bands = normalizeBands({ enabled: true, ...INSTRUMENTS.hcl32.publishedBands, supportText: 'Phòng tư vấn' }, { method: 'instrument', min: 0, max: 32, itemCount: 32, items: [] })
  const tier = score => { const band = bandFor(bands, { status: 'scored', score }); return tierOf({ band: band.index, band_thresholds: { direction: bands.direction, cutoffs: bands.cutoffs } }) }
  assert.deepEqual([0, 13, 14, 20, 21, 32].map(tier), ['green', 'green', 'yellow', 'yellow', 'red', 'red'])
  assert.ok(bands.labels.every(label => !/xanh|vàng|đỏ/i.test(label)), 'không đặt tên mức bằng màu')
})

test('yellow tasks carry the exact names and points from the owner table', async () => {
  assert.deepEqual(yellow.map(task => [task.code, task.name, task.points]), [
    ['Y-01', "Power Nap 20'", 15], ['Y-02', 'Caffeine Curfew', 15], ['Y-03', 'Screen Dimming', 20], ['Y-04', 'Peak Block Lock', 15], ['Y-05', 'Anchor Wake-up', 20]])
  const { service } = await boot()
  assert.deepEqual((await service.today(PROFILE)).tasks.map(task => task.points), [15, 15, 20, 15, 20])
})

test('Power Nap: the follow-up answer is optional, validated, stored as a label, and never changes the points', async () => {
  for (const [choice, stored] of [[undefined, {}], ['Chưa thấy khác lắm 🌙', { choice: 'Chưa thấy khác lắm 🌙' }]]) {
    const { db, service, setNow } = await boot()
    await service.start(PROFILE, 'Y-01'); setNow(at('12:21'))
    await assert.rejects(service.complete(PROFILE, 'Y-01', { choice: 'chữ tự do' }), { status: 400 })
    assert.equal((await service.complete(PROFILE, 'Y-01', choice ? { choice } : {})).points, 15)
    assert.deepEqual(db.rowsOf('reward_completions')[0].meta, { ...stored, survey: SURVEY })
  }
})

test('timer windows are judged by the start time: finishing just after 14:00 counts, starting after it does not', async () => {
  const late = await boot(at('13:50'))
  await late.service.start(PROFILE, 'Y-01'); late.setNow(at('14:11'))
  assert.equal((await late.service.complete(PROFILE, 'Y-01', {})).points, 15)
  const outside = await boot(at('14:05'))
  await assert.rejects(outside.service.start(PROFILE, 'Y-01'), { status: 409 })
  await assert.rejects(outside.service.complete(PROFILE, 'Y-01', {}), { status: 409 })
  const stale = await boot(at('12:00'))
  await stale.service.start(PROFILE, 'Y-01'); stale.setNow(at('12:30', '19'))
  await assert.rejects(stale.service.complete(PROFILE, 'Y-01', {}), { status: 409 })
})

test('a nap started in time is still offered for completion after the window, also after a reload', async () => {
  const { service, setNow } = await boot(at('13:50'))
  await service.start(PROFILE, 'Y-01'); setNow(at('14:11'))
  const nap = (await service.today(PROFILE)).tasks.find(task => task.code === 'Y-01')
  assert.equal(nap.available, true); assert.equal(new Date(nap.startedAt).toISOString(), new Date(at('13:50')).toISOString())
  setNow(at('14:11', '19'))
  const nextDay = (await service.today(PROFILE)).tasks.find(task => task.code === 'Y-01')
  assert.equal(nextDay.available, false); assert.equal('startedAt' in nextDay, false)
})

test('a timer without a window may still finish just after midnight, as before', async () => {
  const breath = { code: 'T-1', name: 'Thở', audience: ['yellow'], points: 10, completion_type: 'timer', min_seconds: 60 }
  const { service, setNow } = await boot('2026-11-18T16:59:30Z', [breath])
  await service.start(PROFILE, 'T-1'); setNow('2026-11-18T17:01:00Z')
  assert.ok((await service.today(PROFILE)).tasks[0].startedAt)
  assert.equal((await service.complete(PROFILE, 'T-1', {})).points, 10)
})

test('Caffeine Curfew is answered the next morning with a sleep-latency range', async () => {
  const noon = await boot(at('13:00'))
  await assert.rejects(noon.service.complete(PROFILE, 'Y-02', { choice: 'Dưới 15 phút' }), { status: 409 })
  const morning = await boot(at('07:30'))
  await assert.rejects(morning.service.complete(PROFILE, 'Y-02', { confirmed: true }), { status: 400 })
  assert.equal((await morning.service.complete(PROFILE, 'Y-02', { choice: '15–30 phút' })).points, 15)
})

test('the update plan replaces only untouched old rows, keeps admin edits, creates missing ones and is repeatable', async () => {
  const old = SEED_TASKS.filter(task => OLD_YELLOW[task.code]).map(task => ({ ...task, ...OLD_YELLOW[task.code], choices: undefined, game: task.code === 'Y-01' ? 'rest_timer' : undefined }))
  const { service } = await boot(at('12:00'), old.filter(task => task.code !== 'Y-05'))
  await service.updateTask((await service.listTasks()).find(task => task.code === 'Y-03').id, { name: 'Tên admin đặt', is_active: false })
  const plan = planYellowUpdate(await service.listTasks())
  assert.deepEqual(plan.map(item => [item.task.code, item.action]), [['Y-01', 'update'], ['Y-02', 'update'], ['Y-03', 'keep'], ['Y-04', 'update'], ['Y-05', 'create']])
  for (const item of plan) {
    if (item.action === 'create') await service.createTask(item.task, ADMIN)
    if (item.action === 'update') await service.updateTask(item.current.id, item.task)
  }
  const after = await service.listTasks()
  assert.deepEqual(planYellowUpdate(after).map(item => item.action), ['same', 'same', 'keep', 'same', 'same'])
  assert.equal(after.find(task => task.code === 'Y-03').name, 'Tên admin đặt')
  assert.deepEqual(after.find(task => task.code === 'Y-01').choices.length, 2)
  assert.equal(planYellowUpdate([{ ...old[0], survey_id: SURVEY }])[0].action, 'create', 'không đụng nhiệm vụ riêng của khảo sát')
})
