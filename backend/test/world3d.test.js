// Thế giới 3D phía máy chủ (migration 023): mặc định tắt, điều kiện mở, chống ghi trùng, không đụng tới Sao.
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useRewardService } from '../src/controllers/rewards.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createRewardService } from '../src/services/reward.js'
import { createTrackingService } from '../src/services/tracking.js'
import { createTrackingAccountService } from '../src/services/tracking-accounts.js'
import { WORLD_MAPS, describeWorld, findWorldItem } from '../src/services/world3d-content.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-world3d'
const ADMIN = '11111111-1111-4111-8111-111111111111', PROFILE = '22222222-2222-4222-8222-222222222222', SURVEY = '33333333-3333-4333-8333-333333333333'
const CONSTRAINTS = {
  unique: { ...TRACKING_CONSTRAINTS.unique, reward_completions: [['profile_id', 'task_id', 'local_date', 'slot']], reward_tasks: [['code']] },
  cascade: TRACKING_CONSTRAINTS.cascade
}
const settings = (over = {}) => ({ id: 'global', unit_name: 'Sao', unit_icon: '⭐', daily_cap: 50, weekly_cap: 250, cycle_days: 14, timezone: 'Asia/Ho_Chi_Minh', group_labels: { green: 'A', yellow: 'B', red: 'C' }, world3d_enabled: true, ...over })
const done = (count, points = 10) => Array.from({ length: count }, (_, i) => ({ id: `c${i}`, profile_id: PROFILE, task_id: 't', task_code: 'T-1', local_date: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}`, slot: 1 + Math.floor(i / 28), points }))

function boot({ completions = [], over = {}, rewards = true } = {}) {
  const db = createFakeDb({
    tracking_profiles: [{ id: PROFILE }],
    tracking_sessions: [{ id: 's1', profile_id: PROFILE, survey_id: SURVEY, band: 1, band_thresholds: { direction: 'higher_worse', cutoffs: [5, 10], labels: ['A', 'B', 'C'] }, completed_at: '2026-11-01T00:00:00Z' }],
    survey_tracking_configs: [{ survey_id: SURVEY, rewards_enabled: rewards }],
    reward_settings: [settings(over)], reward_tasks: [], reward_task_starts: [], reward_completions: completions, reward_profile_prefs: [], reward_world_items: []
  }, CONSTRAINTS)
  return { db, service: createRewardService(db, { clock: () => new Date('2026-11-18T05:00:00Z') }) }
}

test('content: item keys are unique, match the database check, and gates only use stars and completion counts', () => {
  const keys = WORLD_MAPS.flatMap(map => [...map.treasures.map(item => item.key), map.guardian.key])
  assert.equal(new Set(keys).size, keys.length)
  for (const key of keys) { assert.match(key, /^[a-z0-9_]{2,40}$/); assert.ok(findWorldItem(key)) }
  assert.equal(findWorldItem('nope'), null)
  assert.deepEqual(WORLD_MAPS.map(map => map.stars), [...WORLD_MAPS.map(map => map.stars)].sort((a, b) => a - b))
  assert.equal(WORLD_MAPS[0].stars, 0)
})

test('describeWorld opens maps by stars (or by an item already found there) and wakes guardians by completions', () => {
  const at = (stars, completions, found) => describeWorld(stars, completions, new Set(found))
  assert.deepEqual(at(0, 0).map(map => map.open), [true, false, false])
  assert.deepEqual(at(100, 0).map(map => map.open), [true, true, false])
  assert.deepEqual(at(0, 0, ['forest_pine']).map(map => map.open), [true, true, false], 'Sao giảm không khóa lại nơi đã đến')
  assert.equal(at(0, 4)[0].guardian.awake, false); assert.equal(at(0, 5)[0].guardian.awake, true)
  assert.equal(at(0, 99)[1].guardian.awake, false, 'trùm không thức khi bản đồ chưa mở')
  assert.equal(at(0, 5, ['keep_cloud'])[0].guardian.calmed, true)
})

test('collecting is off by default and reports collecting unavailable without migration 023', async () => {
  const off = boot({ over: { world3d_enabled: false } })
  const state = await off.service.world(PROFILE)
  assert.equal(state.enabled, false); assert.equal(state.collecting, false); assert.equal(state.maps.length, 3)
  const missing = boot()
  missing.db.failWhen(table => table === 'reward_world_items', 'PGRST205')
  const partial = await missing.service.world(PROFILE)
  assert.equal(partial.collecting, false); assert.equal(partial.maps[0].open, true)
  await assert.rejects(missing.service.collect(PROFILE, 'meadow_dew'), error => error.status === 503 && /023_world3d/.test(error.message))
})

test('collect: allowlist, open map, once only, and Stars or completions never change', async () => {
  const { db, service } = boot({ completions: done(5) })
  const before = await service.village(PROFILE)
  const first = await service.collect(PROFILE, 'meadow_dew')
  assert.deepEqual([first.duplicate, first.kind, first.name], [false, 'treasure', 'Giọt sương sớm'])
  assert.equal((await service.collect(PROFILE, 'meadow_dew')).duplicate, true)
  assert.equal((await db.from('reward_world_items').select('*')).data.length, 1)
  await assert.rejects(service.collect(PROFILE, 'forest_pine'), { status: 409 })       // 50 Sao, rừng cần 100
  await assert.rejects(service.collect(PROFILE, 'hack_item'), { status: 404 })
  await assert.rejects(service.collect(PROFILE, { key: 'meadow_dew' }), { status: 404 })
  const after = await service.village(PROFILE)
  assert.equal(after.stars, before.stars); assert.equal(after.completions, before.completions)
  assert.equal((await db.from('reward_completions').select('*')).data.length, 5)
  assert.equal((await service.world(PROFILE)).maps[0].treasures.find(item => item.key === 'meadow_dew').found, true)
})

test('collect: a guardian keepsake needs the guardian awake; parallel duplicate insert answers duplicate', async () => {
  const asleep = boot({ completions: done(4) })
  await assert.rejects(asleep.service.collect(PROFILE, 'keep_cloud'), { status: 409 })
  const awake = boot({ completions: done(5) })
  assert.equal((await awake.service.collect(PROFILE, 'keep_cloud')).name, 'Chiếc gối mây')
  const race = boot()
  race.db.failWhen((table, op) => table === 'reward_world_items' && op === 'insert', '23505')
  assert.equal((await race.service.collect(PROFILE, 'meadow_dew')).duplicate, true)
})

test('collect is refused when the world is off or rewards are off for the student', async () => {
  await assert.rejects(boot({ over: { world3d_enabled: false } }).service.collect(PROFILE, 'meadow_dew'), { status: 403 })
  await assert.rejects(boot({ rewards: false }).service.collect(PROFILE, 'meadow_dew'), { status: 403 })
})

test('settings: saving without the toggle never writes the 023 column; sending it without the migration is a 503', async () => {
  const { db, service } = boot({ over: { world3d_enabled: false } })
  const body = { unit_name: 'Sao', unit_icon: '⭐', daily_cap: 50, weekly_cap: 250, cycle_days: 14 }
  assert.equal((await service.saveSettings({ ...body, world3d_enabled: true }, ADMIN)).world3d_enabled, true)
  assert.equal((await service.saveSettings(body, ADMIN)).world3d_enabled, true, 'không gửi thì giữ nguyên')
  db.failWhen((table, op) => table === 'reward_settings' && op === 'update', 'PGRST204', "Could not find the 'world3d_enabled' column of 'reward_settings'")
  await assert.rejects(service.saveSettings({ ...body, world3d_enabled: true }, ADMIN), error => error.status === 503 && /023_world3d/.test(error.message))
})

test('deleting the tracking profile deletes its world items', async () => {
  const { db, service } = boot()
  await service.collect(PROFILE, 'meadow_dew')
  await db.from('tracking_profiles').delete().eq('id', PROFILE)
  assert.equal((await db.from('reward_world_items').select('*')).data.length, 0)
})

test('HTTP: both world routes sit behind the tracker cookie and the student account gate', async () => {
  const db = createFakeDb({ reward_settings: [settings()], reward_completions: [], reward_profile_prefs: [], reward_world_items: [], survey_tracking_configs: [{ survey_id: SURVEY, rewards_enabled: true }] }, CONSTRAINTS)
  useSupabaseForTests(db)
  const tracking = createTrackingService(db)
  useTrackingService(tracking, db); useRewardService(createRewardService(db))
  const accounts = createTrackingAccountService(db, { mintCredential: tracking.mintCredential, rounds: 4 })
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const call = async (method, path, cookie, body) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/track${path}`, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, json: await res.json().catch(() => ({})) }
  }
  try {
    assert.equal((await call('GET', '/rewards/world')).status, 401)
    const { profileId } = await tracking.startProfile('web')
    await accounts.createAccount(profileId, { username: 'hoc_sinh', password: 'matkhau123' })
    const login = await accounts.login({ username: 'hoc_sinh', password: 'matkhau123' }, 'web')
    const cookie = `bs_track=${login.cookieToken}`
    const read = await call('GET', '/rewards/world', cookie)
    assert.equal(read.status, 200); assert.equal(read.json.maps.length, 3)
    assert.equal(JSON.stringify(read.json).includes('"tier"'), false, 'không lộ nhóm')
    await db.from('tracking_accounts').delete().eq('profile_id', profileId)
    const blocked = await call('POST', '/rewards/world/collect', cookie, { key: 'meadow_dew' })
    assert.equal(blocked.status, 403); assert.equal(blocked.json.code, 'student_account_required')
  } finally { server.close() }
})
