// Giai đoạn 0 của game 3D: hợp đồng của các API nhiệm vụ mà lớp 3D sẽ dựa vào (trước đây chưa có test),
// và phần chọn chế độ/tải thư viện 3D ở frontend. Không đổi hành vi backend.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { computeStreak, createRewardService } from '../src/services/reward.js'
import { createFakeDb } from './helpers/fake-db.js'

const ADMIN = '11111111-1111-4111-8111-111111111111', PROFILE = '22222222-2222-4222-8222-222222222222', SURVEY = '33333333-3333-4333-8333-333333333333'
const CONSTRAINTS = {
  unique: {
    reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']], reward_items: [['code']],
    reward_unlocks: [['profile_id', 'item_id']], reward_rest_cards: [['profile_id', 'local_date']], reward_profile_prefs: [['profile_id']]
  }, cascade: {}
}
const base = { audience: ['green', 'yellow', 'red'], points: 20, times_per_day: 1 }

async function boot({ settings = {} } = {}) {
  let current = new Date('2026-11-18T05:00:00Z')                       // 12:00 giờ Việt Nam, thứ Tư
  const db = createFakeDb({
    tracking_profiles: [{ id: PROFILE }],
    tracking_sessions: [{ id: 's1', profile_id: PROFILE, survey_id: SURVEY, band: 1, band_thresholds: { direction: 'higher_worse', cutoffs: [5, 10], labels: ['A', 'B', 'C'] }, completed_at: '2026-11-10T00:00:00Z' }],
    survey_tracking_configs: [{ survey_id: SURVEY, rewards_enabled: true }],
    reward_settings: [{ id: 'global', unit_name: 'Sao', unit_icon: '⭐', daily_cap: 50, weekly_cap: 250, cycle_days: 14, timezone: 'Asia/Ho_Chi_Minh', group_labels: { green: 'A', yellow: 'B', red: 'C' }, streak_enabled: true, rest_cards_per_week: 1, ...settings }],
    reward_tasks: [], reward_task_starts: [], reward_completions: [], reward_rest_cards: [], reward_items: [], reward_unlocks: [], reward_profile_prefs: []
  }, CONSTRAINTS)
  const service = createRewardService(db, { clock: () => current })
  return { db, service, setNow: value => { current = new Date(value) } }
}

test('computeStreak: consecutive days, a rest day bridges without counting down, an unfinished today does not break it', () => {
  assert.equal(computeStreak([], [], '2026-11-18').current, 0)
  assert.equal(computeStreak(['2026-11-16', '2026-11-17', '2026-11-18'], [], '2026-11-18').current, 3)
  assert.equal(computeStreak(['2026-11-16', '2026-11-17'], [], '2026-11-18').current, 2)
  const bridged = computeStreak(['2026-11-15', '2026-11-17', '2026-11-18'], ['2026-11-16'], '2026-11-18')
  assert.ok(bridged.current >= 3); assert.ok(bridged.best >= bridged.current)
  const broken = computeStreak(['2026-11-10', '2026-11-11', '2026-11-12'], [], '2026-11-18')
  assert.equal(broken.current, 0); assert.equal(broken.best, 3)
})

test('rest card: today or yesterday only, once per day, weekly limit, never changes points', async () => {
  const { db, service } = await boot()
  await assert.rejects(service.useRestCard(PROFILE, '2026-11-01'), { status: 400 })
  const used = await service.useRestCard(PROFILE, '2026-11-17')
  assert.equal(used.localDate, '2026-11-17'); assert.equal(used.streak.restCardsLeft, 0)
  await assert.rejects(service.useRestCard(PROFILE, '2026-11-17'), { status: 409 })
  await assert.rejects(service.useRestCard(PROFILE, '2026-11-18'), { status: 409 })
  assert.equal((await db.from('reward_completions').select('*')).data.length, 0)
  const off = await boot({ settings: { streak_enabled: false } })
  await assert.rejects(off.service.useRestCard(PROFILE), { status: 409 })
})

test('unlocks happen when the inventory is read, once, from lifetime stars, without spending them', async () => {
  const { db, service } = await boot()
  await service.createItem({ code: 'badge_one', kind: 'badge', name: 'Huy hiệu', unlock_stars: 20, asset_key: 'star' }, ADMIN)
  await service.createItem({ code: 'badge_two', kind: 'badge', name: 'Huy hiệu 2', unlock_stars: 100, asset_key: 'leaf' }, ADMIN)
  const task = await service.createTask({ ...base, code: 'T-1', name: 'Một việc', completion_type: 'self_report' }, ADMIN)
  assert.equal((await service.inventory(PROFILE)).items.filter(item => item.unlocked).length, 0)
  await service.complete(PROFILE, task.code, { confirmed: true })
  assert.equal((await db.from('reward_unlocks').select('*')).data.length, 0, 'hoàn thành việc chưa tự mở vật phẩm')
  const after = await service.inventory(PROFILE)
  assert.deepEqual(after.items.filter(item => item.unlocked).map(item => item.code), ['badge_one'])
  await service.inventory(PROFILE)
  assert.equal((await db.from('reward_unlocks').select('*')).data.length, 1)
  assert.equal((await service.village(PROFILE)).stars, 20, 'mở khóa không tiêu Sao')
})

test('cancelStart removes only a breathing timer; village reports the counts the world is built from', async () => {
  const { db, service, setNow } = await boot()
  const breathe = await service.createTask({ ...base, code: 'B-1', name: 'Thở', completion_type: 'timer', min_seconds: 60, game: 'breathing' }, ADMIN)
  const rest = await service.createTask({ ...base, code: 'N-1', name: 'Nghỉ', completion_type: 'timer', min_seconds: 60, game: 'rest_timer' }, ADMIN)
  await service.start(PROFILE, breathe.code)
  assert.deepEqual(await service.cancelStart(PROFILE, breathe.code), { cancelled: true })
  assert.equal((await db.from('reward_task_starts').select('*')).data.length, 0)
  await assert.rejects(service.complete(PROFILE, breathe.code, {}), { status: 409 })
  await service.start(PROFILE, rest.code)
  await assert.rejects(service.cancelStart(PROFILE, rest.code), { status: 400 })
  setNow('2026-11-18T05:02:00Z')
  await service.complete(PROFILE, rest.code, {})
  const village = await service.village(PROFILE)
  assert.equal(village.completions, 1); assert.equal(village.activeDays, 1); assert.deepEqual(village.tasks, { 'N-1': 1 }); assert.equal(village.enabled, true)
})

/* ------------------------------------------------------------------ frontend: chọn chế độ và tải thư viện */
function loadSupport() {
  const window = {}
  vm.runInNewContext(fs.readFileSync(new URL('../../frontend/js/world-support.js', import.meta.url), 'utf8'), { window })
  return window.World3DSupport
}

test('world mode: 3D is off unless previewed, and falls back to light mode by choice or without WebGL2', () => {
  const support = loadSupport()
  const mode = input => support.chooseMode(input).reason
  assert.equal(mode({ preview: false, webgl2: true }), 'preview-off')
  assert.equal(mode({ preview: true, webgl2: true, preference: 'light' }), 'user-choice')
  assert.equal(mode({ preview: true, webgl2: false }), 'no-webgl2')
  assert.equal(support.chooseMode({ preview: true, webgl2: true, preference: null }).mode, '3d')
  assert.equal(support.previewRequested({ search: '?world=3d', hash: '' }), true)
  assert.equal(support.previewRequested({ search: '', hash: '#/track/village?world=3d' }), true)
  assert.equal(support.previewRequested({ search: '?world=3dx', hash: '#/track' }), false)
})

test('vendored three.js loads, matches the pinned revision, and a failed load answers null and can be retried', async () => {
  const support = loadSupport()
  const real = await import(new URL(`../../frontend${support.THREE_URL}`, import.meta.url))
  assert.equal(real.REVISION, support.THREE_REVISION)
  assert.equal(await support.loadEngine(() => Promise.reject(new Error('offline'))), null)
  assert.equal(await support.loadEngine(() => Promise.resolve(real)), real)
  assert.equal(await loadSupport().loadEngine(() => Promise.resolve({ REVISION: '1' })), null)
})
