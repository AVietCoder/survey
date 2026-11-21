import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createTrackingService } from '../src/services/tracking.js'
import { createTrackingAccountService } from '../src/services/tracking-accounts.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-accounts'

function service() {
  const db = createFakeDb({}, TRACKING_CONSTRAINTS)
  const tracking = createTrackingService(db)
  const accounts = createTrackingAccountService(db, { mintCredential: tracking.mintCredential, rounds: 4 })
  return { db, tracking, accounts }
}

test('account: create, login mints a working cookie, wrong password rejected', async () => {
  const { tracking, accounts } = service()
  const { profileId } = await tracking.startProfile('a')
  const created = await accounts.createAccount(profileId, { username: '  Lan_Anh ', password: 'matkhau123' })
  assert.equal(created.username, 'lan_anh')
  const { cookieToken, profileId: loggedIn } = await accounts.login({ username: 'LAN_ANH', password: 'matkhau123' }, 'web')
  assert.equal(loggedIn, profileId)
  assert.equal((await tracking.authenticate(cookieToken)).profileId, profileId)
  await assert.rejects(accounts.login({ username: 'lan_anh', password: 'sai-mat-khau' }), { status: 401 })
  await assert.rejects(accounts.login({ username: 'khong_co', password: 'matkhau123' }), { status: 401 })
})

test('account: validation, one account per profile, unique username', async () => {
  const { tracking, accounts } = service()
  const a = (await tracking.startProfile('a')).profileId, b = (await tracking.startProfile('b')).profileId
  await assert.rejects(accounts.createAccount(a, { username: 'ab', password: 'matkhau123' }), { status: 400 })
  await assert.rejects(accounts.createAccount(a, { username: 'tên có dấu', password: 'matkhau123' }), { status: 400 })
  await assert.rejects(accounts.createAccount(a, { username: 'hocsinh1', password: 'ngan' }), { status: 400 })
  await accounts.createAccount(a, { username: 'hocsinh1', password: 'matkhau123' })
  await assert.rejects(accounts.createAccount(a, { username: 'hocsinh2', password: 'matkhau123' }), { status: 409 })
  await assert.rejects(accounts.createAccount(b, { username: 'HocSinh1', password: 'matkhau123' }), { status: 409 })
})

test('account: change password requires the current one', async () => {
  const { tracking, accounts } = service()
  const { profileId } = await tracking.startProfile('a')
  await accounts.createAccount(profileId, { username: 'hs_doi', password: 'matkhau123' })
  await assert.rejects(accounts.changePassword(profileId, { currentPassword: 'sai', newPassword: 'moi12345' }), { status: 400 })
  await accounts.changePassword(profileId, { currentPassword: 'matkhau123', newPassword: 'moi12345' })
  await accounts.login({ username: 'hs_doi', password: 'moi12345' })
  await assert.rejects(accounts.login({ username: 'hs_doi', password: 'matkhau123' }), { status: 401 })
})

test('account: deleting the profile removes the account', async () => {
  const { db, tracking, accounts } = service()
  const { profileId } = await tracking.startProfile('a')
  await accounts.createAccount(profileId, { username: 'hs_xoa', password: 'matkhau123' })
  await tracking.deleteProfile(profileId)
  assert.equal(db.rowsOf('tracking_accounts').length, 0)
  await assert.rejects(accounts.login({ username: 'hs_xoa', password: 'matkhau123' }), { status: 401 })
})

test('account: missing migration 019 → 503 on write, available:false on read', async () => {
  const { db, tracking, accounts } = service()
  const { profileId } = await tracking.startProfile('a')
  db.failWhen(table => table === 'tracking_accounts', 'PGRST205')
  assert.deepEqual(await accounts.getAccount(profileId), { available: false, account: null })
  await assert.rejects(accounts.createAccount(profileId, { username: 'hs_x', password: 'matkhau123' }), { status: 503 })
  await assert.rejects(accounts.login({ username: 'hs_x', password: 'matkhau123' }), { status: 503 })
})

test('HTTP: create account with tracker cookie, then log in from a fresh browser', async () => {
  const db = createFakeDb({}, TRACKING_CONSTRAINTS)
  const tracking = createTrackingService(db)
  useTrackingService(tracking, db)
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body, cookie) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, setCookie: res.headers.getSetCookie(), json: await res.json().catch(() => null) }
  }
  try {
    assert.equal((await call('POST', '/track/account', { username: 'hs_web', password: 'matkhau123' })).status, 401)
    const { cookieToken } = await tracking.startProfile('web')
    const cookie = `bs_track=${cookieToken}`
    assert.deepEqual((await call('GET', '/track/account', null, cookie)).json, { available: true, account: null })
    assert.equal((await call('POST', '/track/account', { username: 'hs_web', password: 'matkhau123' }, cookie)).status, 201)
    assert.equal((await call('GET', '/track/account', null, cookie)).json.account.username, 'hs_web')
    assert.equal((await call('POST', '/track/account/login', { username: 'hs_web', password: 'sai12345' })).status, 401)
    const login = await call('POST', '/track/account/login', { username: 'hs_web', password: 'matkhau123' })
    assert.equal(login.status, 200)
    const fresh = login.setCookie[0].split(';')[0]
    assert.match(login.setCookie[0], /HttpOnly/i)
    assert.equal((await call('GET', '/track/me', null, fresh)).status, 200)
  } finally { server.close() }
})

test('game gate: reward routes need a student account; survey tracking routes do not', async () => {
  const { useRewardService } = await import('../src/controllers/rewards.js')
  const { createRewardService } = await import('../src/services/reward.js')
  const db = createFakeDb({}, TRACKING_CONSTRAINTS)
  const tracking = createTrackingService(db)
  useTrackingService(tracking, db); useRewardService(createRewardService(db))
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, cookie, body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, json: await res.json().catch(() => null) }
  }
  try {
    const { profileId, cookieToken } = await tracking.startProfile('web')
    const cookie = `bs_track=${cookieToken}`
    // Chỉ có mã định danh/cookie: xem tiến triển được, vào game thì không
    assert.equal((await call('GET', '/track/me', cookie)).status, 200)
    for (const [method, path, body] of [['GET', '/track/rewards/today'], ['GET', '/track/rewards/village'], ['GET', '/track/rewards/inventory'], ['POST', '/track/rewards/equip', { kind: 'pet', itemCode: 'cat' }],
      ['PUT', '/track/rewards/reminders', { enabled: true }], ['POST', '/track/rewards/rest-card', {}], ['POST', '/track/rewards/tasks/R-03/start'], ['POST', '/track/rewards/tasks/R-03/complete', {}]]) {
      const res = await call(method, path, cookie, body)
      assert.equal(res.status, 403, `${method} ${path}`); assert.equal(res.json.code, 'student_account_required')
    }
    assert.equal((await call('GET', '/track/account', cookie)).status, 200)
    assert.equal((await call('POST', '/track/account', cookie, { username: 'hs_game', password: 'matkhau123' })).status, 201)
    assert.equal((await call('GET', '/track/rewards/today', cookie)).status, 200, 'có tài khoản thì vào được game')
    assert.equal((await call('GET', '/track/rewards/village', cookie)).status, 200)
    // Thiếu migration 019 → 503 kèm gợi ý, không vô tình mở game
    db.failWhen(table => table === 'tracking_accounts', 'PGRST205')
    const missing = await call('GET', '/track/rewards/today', cookie)
    assert.equal(missing.status, 503); assert.match(missing.json.error, /019/)
    db.clearFailures()
    await tracking.deleteProfile(profileId)
  } finally { server.close() }
})
