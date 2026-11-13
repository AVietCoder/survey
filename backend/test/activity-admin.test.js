import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { cleanMetadata, logActivity } from '../src/services/activity.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-activity'
process.env.IP_SALT = 'salt'
const ADMIN = '11111111-1111-4111-8111-111111111111'
const USER = '22222222-2222-4222-8222-222222222222'
const ADMIN2 = '33333333-3333-4333-8333-333333333333'
const SURVEY = '44444444-4444-4444-8444-444444444444'
const tokenFor = (id, username) => `token=${jwt.sign({ id, username }, process.env.JWT_SECRET)}`

async function boot(extra = {}) {
  const db = createFakeDb({
    users: [
      { id: ADMIN, username: 'root', is_admin: true, password_hash: bcrypt.hashSync('correct-horse', 4) },
      { id: USER, username: 'alice', is_admin: false, password_hash: 'x' }
    ],
    surveys: [{ id: SURVEY, user_id: USER, title: 'Khảo sát A', status: 'published', public_slug: 'a', updated_at: '2026-03-10T00:00:00Z', created_at: '2026-03-01T00:00:00Z' }],
    responses: [], answers: [], activity_logs: [], research_project_surveys: [], research_projects: [],
    ...extra
  })
  useSupabaseForTests(db)
  const app = express(); app.set('trust proxy', 1); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, { body, cookie } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    return { status: res.status, json: text ? JSON.parse(text) : null }
  }
  return { db, call, close: () => server.close() }
}
const asAdmin = tokenFor(ADMIN, 'root')
const asUser = tokenFor(USER, 'alice')

test('cleanMetadata drops secrets, truncates long strings and limits depth', () => {
  const clean = cleanMetadata({ status: 'published', password: 'p', recoveryCode: 'ABCD', token_hash: 'h', note: 'x'.repeat(500), deep: { a: { b: { c: 1 } } } })
  assert.equal(clean.status, 'published')
  assert.ok(!('password' in clean) && !('recoveryCode' in clean) && !('token_hash' in clean))
  assert.equal(clean.note.length, 200)
  assert.equal(clean.deep.a, null)
})

test('logActivity stores a row with a hashed IP and never the raw IP', async () => {
  const app = await boot()
  try {
    await logActivity({ ip: '203.0.113.9', user: { id: ADMIN, username: 'root' } }, 'survey.create', { type: 'survey', id: SURVEY, label: 'A' }, { status: 'draft' })
    const [row] = app.db.rowsOf('activity_logs')
    assert.equal(row.action, 'survey.create'); assert.equal(row.actor_name, 'root')
    assert.match(row.ip_hash, /^[0-9a-f]{32}$/)
    assert.ok(!JSON.stringify(row).includes('203.0.113.9'))
  } finally { app.close() }
})

test('logActivity never throws, even when the insert fails or the table is missing', async () => {
  const app = await boot()
  try {
    app.db.failWhen((table, op) => table === 'activity_logs' && op === 'insert', '42P01')
    await assert.doesNotReject(logActivity({ user: { id: ADMIN, username: 'root' } }, 'user.create'))
    app.db.clearFailures()
    app.db.failWhen((table, op) => table === 'activity_logs' && op === 'insert', 'XX000')
    await assert.doesNotReject(logActivity({ user: { id: ADMIN, username: 'root' } }, 'user.create'))
    assert.equal(app.db.rowsOf('activity_logs').length, 0)
  } finally { app.close() }
})

test('login success, failure and logout are recorded; passwords never are', async () => {
  const app = await boot()
  try {
    assert.equal((await app.call('POST', '/auth/login', { body: { username: 'root', password: 'wrong-password' } })).status, 401)
    assert.equal((await app.call('POST', '/auth/login', { body: { username: 'root', password: 'correct-horse' } })).status, 200)
    await app.call('POST', '/auth/logout', { cookie: asAdmin })
    const actions = app.db.rowsOf('activity_logs').map(row => row.action)
    assert.deepEqual(actions, ['auth.login_failed', 'auth.login', 'auth.logout'])
    assert.ok(!JSON.stringify(app.db.rowsOf('activity_logs')).includes('correct-horse'))
    assert.ok(!JSON.stringify(app.db.rowsOf('activity_logs')).includes('wrong-password'))
  } finally { app.close() }
})

test('a login still succeeds when the activity table is missing', async () => {
  const app = await boot()
  try {
    app.db.failWhen((table, op) => table === 'activity_logs' && op === 'insert', '42P01')
    assert.equal((await app.call('POST', '/auth/login', { body: { username: 'root', password: 'correct-horse' } })).status, 200)
  } finally { app.close() }
})

test('GET /admin/activity is admin-only', async () => {
  const app = await boot()
  try {
    assert.equal((await app.call('GET', '/admin/activity')).status, 401)
    assert.equal((await app.call('GET', '/admin/activity', { cookie: asUser })).status, 403)
    assert.equal((await app.call('GET', '/admin/activity', { cookie: asAdmin })).status, 200)
  } finally { app.close() }
})

test('activity list filters by actor, action group, exact action and date, and paginates', async () => {
  const app = await boot()
  try {
    const rows = app.db.rowsOf('activity_logs')
    const add = (actor, action, at) => rows.push({ id: crypto.randomUUID(), actor_name: actor, action, created_at: at, metadata: {} })
    add('root', 'user.create', '2026-03-01T10:00:00Z'); add('root', 'user.grant_admin', '2026-03-02T10:00:00Z')
    add('alice', 'survey.create', '2026-03-03T10:00:00Z'); add('alice', 'export.csv', '2026-03-04T10:00:00Z')
    for (let i = 0; i < 55; i++) add('bob', 'auth.login', `2026-04-01T10:${String(i).padStart(2, '0')}:00Z`)
    const get = async query => (await app.call('GET', `/admin/activity?${query}`, { cookie: asAdmin })).json
    assert.deepEqual((await get('actor=ali')).logs.map(l => l.action).sort(), ['export.csv', 'survey.create'])
    assert.deepEqual((await get('action=user')).logs.map(l => l.action).sort(), ['user.create', 'user.grant_admin'])
    assert.equal((await get('action=user.create')).total, 1)
    assert.equal((await get('from=2026-03-02&to=2026-03-03')).total, 2)
    const first = await get('action=auth'), second = await get('action=auth&page=2')
    assert.equal(first.total, 55); assert.equal(first.logs.length, 50); assert.equal(second.logs.length, 5)
    assert.ok(first.logs[0].created_at >= first.logs.at(-1).created_at, 'newest first')
    assert.equal((await app.call('GET', '/admin/activity?action=%27%3B--', { cookie: asAdmin })).status, 400)
    assert.equal((await app.call('GET', '/admin/activity?from=2026-05-02&to=2026-05-01', { cookie: asAdmin })).status, 400)
  } finally { app.close() }
})

test('activity endpoint returns a 503 hint when migration 007 is missing', async () => {
  const app = await boot()
  try {
    app.db.failWhen(table => table === 'activity_logs', 'PGRST205')
    const res = await app.call('GET', '/admin/activity', { cookie: asAdmin })
    assert.equal(res.status, 503); assert.match(res.json.error, /007_activity_logs/)
  } finally { app.close() }
})

test('admins can grant and revoke admin; changes are logged; guards hold', async () => {
  const app = await boot()
  try {
    assert.equal((await app.call('PUT', `/admin/users/${USER}`, { cookie: asUser, body: { is_admin: true } })).status, 403)
    const grant = await app.call('PUT', `/admin/users/${USER}`, { cookie: asAdmin, body: { is_admin: true } })
    assert.equal(grant.status, 200); assert.equal(grant.json.user.is_admin, true)
    assert.equal((await app.call('PUT', `/admin/users/${ADMIN}`, { cookie: asAdmin, body: { is_admin: false } })).status, 400, 'no self revoke')
    assert.equal((await app.call('PUT', `/admin/users/${USER}`, { cookie: asAdmin, body: { is_admin: 'yes' } })).status, 400)
    const revoke = await app.call('PUT', `/admin/users/${USER}`, { cookie: asAdmin, body: { is_admin: false } })
    assert.equal(revoke.json.user.is_admin, false)
    assert.deepEqual(app.db.rowsOf('activity_logs').map(l => l.action), ['user.grant_admin', 'user.revoke_admin'])
    // quản trị viên cuối cùng không thể bị thu hồi (kể cả bởi admin khác đã bị xóa)
    app.db.rowsOf('users').push({ id: ADMIN2, username: 'second', is_admin: true, password_hash: 'x' })
    const asSecond = tokenFor(ADMIN2, 'second')
    assert.equal((await app.call('PUT', `/admin/users/${ADMIN}`, { cookie: asSecond, body: { is_admin: false } })).status, 200)
    assert.equal((await app.call('PUT', `/admin/users/${ADMIN2}`, { cookie: asSecond, body: { is_admin: false } })).status, 400)
  } finally { app.close() }
})

test('deleting an account is logged with the username that was deleted', async () => {
  const app = await boot()
  try {
    assert.equal((await app.call('DELETE', `/admin/users/${USER}`, { cookie: asAdmin })).status, 200)
    const log = app.db.rowsOf('activity_logs').find(l => l.action === 'user.delete')
    assert.equal(log.target_label, 'alice'); assert.equal(log.actor_name, 'root')
  } finally { app.close() }
})

test('admin survey list filters by status, title and updated date', async () => {
  const app = await boot()
  try {
    app.db.rowsOf('surveys').push({ id: '55555555-5555-4555-8555-555555555555', user_id: USER, title: 'Bản nháp B', status: 'draft', public_slug: 'b', updated_at: '2026-05-10T00:00:00Z', created_at: '2026-05-01T00:00:00Z' })
    const get = async query => (await app.call('GET', `/admin/surveys?${query}`, { cookie: asAdmin })).json
    assert.equal((await get('status=draft')).surveys.length, 1)
    assert.equal((await get('q=khảo')).surveys[0].title, 'Khảo sát A')
    assert.equal((await get('from=2026-05-01&to=2026-05-31')).surveys[0].title, 'Bản nháp B')
    assert.equal((await get('')).total, 2)
    assert.equal((await app.call('GET', '/admin/surveys?status=bogus', { cookie: asAdmin })).status, 400)
  } finally { app.close() }
})

test('survey owner response table filters by score, quality, date and sorts server-side', async () => {
  const app = await boot()
  try {
    const rows = app.db.rowsOf('responses')
    const add = (n, score, quality, at, duration) => rows.push({ id: `66666666-6666-4666-8666-${String(n).padStart(12, '0')}`, survey_id: SURVEY, submitted_at: at, quality_score: score, quality_status: quality, duration_seconds: duration, review_status: 'needs_review', signals: [] })
    add(1, 90, 'normal', '2026-03-01T08:00:00Z', 120); add(2, 40, 'spam', '2026-03-05T08:00:00Z', 5)
    add(3, 70, 'suspicious', '2026-03-09T08:00:00Z', 60); add(4, 100, 'normal', '2026-03-12T08:00:00Z', 200)
    const get = async query => (await app.call('GET', `/responses/survey/${SURVEY}?${query}`, { cookie: asUser })).json
    assert.equal((await get('minScore=70')).total, 3)
    assert.equal((await get('minScore=50&maxScore=95')).total, 2)
    assert.deepEqual((await get('quality=spam')).responses.map(r => r.quality_score), [40])
    assert.equal((await get('from=2026-03-05&to=2026-03-09')).total, 2)
    assert.deepEqual((await get('sort=quality_score&dir=asc')).responses.map(r => r.quality_score), [40, 70, 90, 100])
    assert.deepEqual((await get('sort=duration_seconds&dir=desc')).responses.map(r => r.duration_seconds), [200, 120, 60, 5])
    assert.deepEqual((await get('')).responses.map(r => r.quality_score), [100, 70, 40, 90], 'default newest first')
    assert.equal((await get('minScore=10&maxScore=20')).total, 0)
    for (const bad of ['minScore=abc', 'minScore=-1', 'minScore=80&maxScore=10', 'quality=bogus', 'sort=password', 'from=nope'])
      assert.equal((await app.call('GET', `/responses/survey/${SURVEY}?${bad}`, { cookie: asUser })).status, 400, bad)
  } finally { app.close() }
})

test('admin edits to another user survey are logged with the fields changed', async () => {
  const app = await boot()
  try {
    const res = await app.call('PUT', `/admin/surveys/${SURVEY}`, { cookie: asAdmin, body: { title: 'Đổi tên', status: 'archived' } })
    assert.equal(res.status, 200)
    const log = app.db.rowsOf('activity_logs').find(l => l.action === 'survey.update')
    assert.equal(log.actor_name, 'root'); assert.equal(log.target_label, 'Đổi tên')
    assert.deepEqual(log.metadata.fields.sort(), ['status', 'title']); assert.equal(log.metadata.by, 'admin')
  } finally { app.close() }
})

test('public registration is disabled unless explicitly enabled', async () => {
  const app = await boot()
  try {
    const res = await app.call('POST', '/auth/register', { body: { username: 'newbie', password: 'password123' } })
    assert.equal(res.status, 403)
    assert.equal(app.db.rowsOf('users').some(u => u.username === 'newbie'), false)
    process.env.ALLOW_REGISTRATION = 'true'
    try { assert.equal((await app.call('POST', '/auth/register', { body: { username: 'newbie', password: 'password123' } })).status, 201) }
    finally { delete process.env.ALLOW_REGISTRATION }
  } finally { app.close() }
})
