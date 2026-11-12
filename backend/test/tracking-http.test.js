import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useTrackingService } from '../src/controllers/tracking.js'
import { createTrackingService } from '../src/services/tracking.js'
import { createFakeDb, TRACKING_CONSTRAINTS } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-http'
const OWNER = '11111111-1111-4111-8111-111111111111', SURVEY = '22222222-2222-4222-8222-222222222222'
const Q1 = 'aaaaaaaa-0000-4000-8000-000000000001'
const survey = { id: SURVEY, user_id: OWNER, title: 'S', status: 'published', public_slug: 'wb', updated_at: '2026-01-01T00:00:00Z' }
const questions = [{ id: Q1, question_text: 'Câu 1', question_type: 'likert' }]

async function boot() {
  const db = createFakeDb({ surveys: [survey], responses: [], answers: [] }, TRACKING_CONSTRAINTS)
  const service = createTrackingService(db)
  useTrackingService(service)
  await service.saveConfig({
    survey, userId: OWNER, questions, body: {
      enabled: true, assessmentName: 'Wellbeing', consentText: 'Tôi đồng ý lưu kết quả để theo dõi tiến triển.',
      scoring: { method: 'sum', items: [{ question_id: Q1 }] }, schedule: { intervalDays: 7 }
    }
  })
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  let counter = 0
  const newResponse = () => {
    const id = `bbbbbbbb-0000-4000-8000-${String(++counter).padStart(12, '0')}`
    db.rowsOf('responses').push({ id, survey_id: SURVEY, submitted_at: new Date().toISOString(), review_status: 'needs_review' })
    db.rowsOf('answers').push({ response_id: id, question_id: Q1, answer_value: 4 })
    return id
  }
  const call = async (method, path, { body, cookie } = {}) => {
    const res = await fetch(`${base}${path}`, {
      method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined
    })
    const text = await res.text()
    return { status: res.status, headers: res.headers, setCookie: res.headers.getSetCookie(), json: text ? JSON.parse(text) : null, text }
  }
  return { db, call, newResponse, close: () => server.close() }
}
const consent = { accepted: true, adultConfirmed: true, version: 1 }
const cookieOf = res => res.setCookie[0].split(';')[0]

test('enrolment sets a hardened cookie, shows the recovery code once and never caches', async () => {
  const app = await boot()
  try {
    const responseId = app.newResponse()
    const res = await app.call('POST', '/track/enroll', { body: { slug: 'wb', responseId, consent } })
    assert.equal(res.status, 201)
    const header = res.setCookie[0]
    assert.match(header, /^bs_track=[A-Za-z0-9_-]{43};/)
    assert.match(header, /HttpOnly/i); assert.match(header, /SameSite=Lax/i); assert.match(header, /Path=\//)
    assert.match(header, /Max-Age=31536000/); assert.doesNotMatch(header, /Secure/i)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    assert.match(res.json.recoveryCode, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)

    const again = await app.call('POST', '/track/enroll', { body: { slug: 'wb', responseId, consent }, cookie: cookieOf(res) })
    assert.equal(again.status, 200); assert.equal(again.json.recoveryCode, null); assert.equal(again.setCookie.length, 0)
    assert.equal(app.db.rowsOf('tracking_sessions').length, 1)
  } finally { app.close() }
})

test('the cookie is Secure in production', async () => {
  const app = await boot(); const previous = process.env.NODE_ENV
  try {
    process.env.NODE_ENV = 'production'
    const res = await app.call('POST', '/track/enroll', { body: { slug: 'wb', responseId: app.newResponse(), consent } })
    assert.match(res.setCookie[0], /Secure/i)
  } finally { process.env.NODE_ENV = previous; app.close() }
})

test('profile endpoints reject missing or invalid cookies and clear bad ones', async () => {
  const app = await boot()
  try {
    for (const [method, path] of [['GET', '/track/me'], ['GET', '/track/credentials'], ['GET', '/track/assessments/abc'], ['POST', '/track/signout'], ['DELETE', '/track/profile']]) {
      const res = await app.call(method, path)
      assert.equal(res.status, 401, `${method} ${path}`); assert.equal(res.setCookie.length, 0)
    }
    const bad = await app.call('GET', '/track/me', { cookie: `bs_track=${'z'.repeat(43)}` })
    assert.equal(bad.status, 401); assert.match(bad.setCookie[0], /bs_track=;.*Expires=Thu, 01 Jan 1970/i)
    assert.equal((await app.call('GET', '/tracking/surveys/x/config')).status, 401)         // API researcher cần đăng nhập
  } finally { app.close() }
})

test('full participant journey: dashboard, recover on a new device, sign out and delete', async () => {
  const app = await boot()
  try {
    const enrolled = await app.call('POST', '/track/enroll', { body: { slug: 'wb', responseId: app.newResponse(), consent } })
    const cookie = cookieOf(enrolled)
    const dashboard = await app.call('GET', '/track/me', { cookie })
    assert.equal(dashboard.status, 200); assert.equal(dashboard.json.assessments.length, 1)
    assert.equal(dashboard.json.assessments[0].name, 'Wellbeing')
    assert.equal(/token_hash|owner_id|profile_id|response_id/.test(dashboard.text), false)

    const detail = await app.call('GET', `/track/assessments/${dashboard.json.assessments[0].ref}`, { cookie })
    assert.equal(detail.status, 200); assert.equal(detail.json.assessment.history.comparison.status, 'insufficient')

    const second = await app.call('POST', '/track/recover', { body: { credential: enrolled.json.recoveryCode } })
    assert.equal(second.status, 200)
    assert.equal((await app.call('GET', '/track/me', { cookie: cookieOf(second) })).json.assessments.length, 1)
    assert.equal((await app.call('POST', '/track/recover', { body: { credential: 'ABCD-EFGH-JKMN-PQRS' } })).status, 404)

    const list = await app.call('GET', '/track/credentials', { cookie })
    assert.equal(list.json.credentials.filter(item => item.current).length, 1)
    const link = await app.call('POST', '/track/credentials/recovery-link', { cookie })
    assert.equal(link.status, 201); assert.match(link.json.token, /^[A-Za-z0-9_-]{43}$/)
    const viaLink = await app.call('POST', '/track/recover', { body: { credential: link.json.token } })
    assert.equal(viaLink.status, 200)
    assert.equal((await app.call('POST', '/track/recover', { body: { credential: link.json.token } })).status, 404)

    const out = await app.call('POST', '/track/signout', { cookie })
    assert.equal(out.status, 200); assert.match(out.setCookie[0], /bs_track=;/)
    assert.equal((await app.call('GET', '/track/me', { cookie })).status, 401)                 // cookie đã thu hồi
    assert.equal((await app.call('GET', '/track/me', { cookie: cookieOf(second) })).status, 200)

    const gone = await app.call('DELETE', '/track/profile', { cookie: cookieOf(second) })
    assert.equal(gone.status, 200)
    assert.equal(app.db.rowsOf('tracking_sessions').length, 0)
    assert.equal(app.db.rowsOf('responses').length, 1)
  } finally { app.close() }
})

test('survey context is public but exposes only consent text and the caller’s own status', async () => {
  const app = await boot()
  try {
    const anon = await app.call('GET', '/track/context/wb')
    assert.deepEqual({ enabled: anon.json.enabled, hasProfile: anon.json.hasProfile, consentOk: anon.json.consentOk }, { enabled: true, hasProfile: false, consentOk: false })
    assert.equal(/owner|survey_id|fingerprint|scoring/i.test(anon.text), false)
    assert.deepEqual((await app.call('GET', '/track/context/unknown')).json, { enabled: false })
    const enrolled = await app.call('POST', '/track/enroll', { body: { slug: 'wb', responseId: app.newResponse(), consent } })
    const known = await app.call('GET', '/track/context/wb', { cookie: cookieOf(enrolled) })
    assert.deepEqual({ hasProfile: known.json.hasProfile, consentOk: known.json.consentOk }, { hasProfile: true, consentOk: true })
  } finally { app.close() }
})
