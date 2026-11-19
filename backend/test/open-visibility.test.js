import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { getProjectAccess, getSurveyAccess } from '../src/services/research-projects.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-visibility'
const ALICE = '11111111-1111-4111-8111-111111111111', BOB = '22222222-2222-4222-8222-222222222222', CARL = '33333333-3333-4333-8333-333333333333'
const S_ALICE = 'aaaaaaaa-0000-4000-8000-000000000001', S_BOB = 'bbbbbbbb-0000-4000-8000-000000000002'
const P_ALICE = 'cccccccc-0000-4000-8000-000000000001', P_BOB = 'dddddddd-0000-4000-8000-000000000002'
const tokenFor = (id, username) => `token=${jwt.sign({ id, username }, process.env.JWT_SECRET)}`
const asAlice = tokenFor(ALICE, 'alice'), asBob = tokenFor(BOB, 'bob')

async function boot() {
  const survey = (id, user_id, title, status = 'published') => ({ id, user_id, title, description: '', status, public_slug: id.slice(0, 6), settings: {}, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' })
  const db = createFakeDb({
    users: [{ id: ALICE, username: 'alice', is_admin: false }, { id: BOB, username: 'bob', is_admin: false }, { id: CARL, username: 'carl', is_admin: false }],
    surveys: [survey(S_ALICE, ALICE, 'Khảo sát của Alice'), survey(S_BOB, BOB, 'Khảo sát của Bob', 'draft')],
    questions: [{ id: 'q1', survey_id: S_BOB, question_text: 'Câu 1', question_type: 'likert', position: 0, is_required: true, settings: {} }],
    question_options: [],
    responses: [{ id: 'r1', survey_id: S_BOB, submitted_at: '2026-03-01T00:00:00Z', quality_score: 90, quality_status: 'normal', duration_seconds: 60, review_status: 'needs_review', signals: [] }],
    answers: [],
    research_projects: [
      { id: P_ALICE, owner_id: ALICE, title: 'Nghiên cứu của Alice', description: '', status: 'active', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-02T00:00:00Z' },
      { id: P_BOB, owner_id: BOB, title: 'Nghiên cứu của Bob', description: '', status: 'draft', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' }
    ],
    research_project_members: [{ project_id: P_BOB, user_id: CARL, role: 'researcher' }],
    research_project_surveys: [{ project_id: P_BOB, survey_id: S_BOB }]
  })
  useSupabaseForTests(db)
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, { body, cookie } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    return { status: res.status, json: text && text.startsWith('{') ? JSON.parse(text) : null }
  }
  return { db, call, close: () => server.close() }
}

test('the default survey list stays personal, scope=all shows everyone with owner names', async () => {
  const app = await boot()
  try {
    const mine = await app.call('GET', '/surveys', { cookie: asAlice })
    assert.deepEqual(mine.json.surveys.map(item => item.title), ['Khảo sát của Alice'])
    const all = await app.call('GET', '/surveys?scope=all', { cookie: asAlice })
    assert.equal(all.json.surveys.length, 2)
    const bobs = all.json.surveys.find(item => item.title === 'Khảo sát của Bob')
    assert.equal(bobs.owner, 'bob'); assert.equal(bobs.mine, false); assert.equal('user_id' in bobs, false)
    assert.equal(all.json.surveys.find(item => item.title === 'Khảo sát của Alice').mine, true)
    assert.equal((await app.call('GET', '/surveys?scope=all')).status, 401, 'cần đăng nhập')
  } finally { app.close() }
})

test('another user can open a survey read-only but cannot edit or delete it', async () => {
  const app = await boot()
  try {
    const seen = await app.call('GET', `/surveys/${S_BOB}`, { cookie: asAlice })
    assert.equal(seen.status, 200); assert.equal(seen.json.readOnly, true); assert.equal(seen.json.survey.owner, 'bob')
    assert.equal(seen.json.survey.questions.length, 1); assert.equal('user_id' in seen.json.survey, false)
    const own = await app.call('GET', `/surveys/${S_BOB}`, { cookie: asBob })
    assert.equal(own.json.readOnly, undefined)
    assert.equal((await app.call('PUT', `/surveys/${S_BOB}`, { cookie: asAlice, body: { title: 'hack' } })).status, 404)
    assert.equal((await app.call('DELETE', `/surveys/${S_BOB}`, { cookie: asAlice })).status, 404)
    assert.equal(app.db.rowsOf('surveys').find(item => item.id === S_BOB).title, 'Khảo sát của Bob')
    assert.equal((await app.call('GET', '/surveys/not-a-uuid', { cookie: asAlice })).status, 404)
  } finally { app.close() }
})

test('another user can read responses but cannot review, export or delete them', async () => {
  const app = await boot()
  try {
    const list = await app.call('GET', `/responses/survey/${S_BOB}`, { cookie: asAlice })
    assert.equal(list.status, 200); assert.equal(list.json.total, 1); assert.equal(list.json.canReview, false)
    assert.equal((await app.call('GET', `/responses/survey/${S_BOB}`, { cookie: asBob })).json.canReview, true)
    assert.equal((await app.call('PUT', '/responses/r1/review', { cookie: asAlice, body: { status: 'accepted' } })).status, 404)
    assert.equal(app.db.rowsOf('responses')[0].review_status, 'needs_review')
    assert.equal((await app.call('GET', `/exports/survey/${S_BOB}.csv`, { cookie: asAlice })).status, 404)
    assert.equal((await app.call('GET', `/responses/survey/${S_BOB}`)).status, 401)
  } finally { app.close() }
})

test('access helpers: a non-member is a read-only viewer, members keep their real role', async () => {
  const app = await boot()
  try {
    assert.equal((await getSurveyAccess(S_BOB, ALICE)).role, 'viewer')
    assert.equal((await getSurveyAccess(S_BOB, BOB)).role, 'owner')
    assert.equal((await getSurveyAccess(S_BOB, CARL)).role, 'researcher', 'thành viên dự án không bị hạ xuống viewer')
    assert.equal((await getProjectAccess(P_BOB, ALICE)).role, 'viewer')
    assert.equal((await getProjectAccess(P_BOB, CARL)).role, 'researcher')
    await assert.rejects(getSurveyAccess(S_BOB, ALICE, ['owner', 'researcher']), /Không tìm thấy/)
    await assert.rejects(getProjectAccess(P_BOB, ALICE, ['owner', 'researcher']), /Không tìm thấy/)
    await assert.rejects(getProjectAccess(P_BOB, CARL, ['owner']), /Không tìm thấy/)
  } finally { app.close() }
})

test('research projects: everyone sees every project, with role owner / member / viewer', async () => {
  const app = await boot()
  try {
    const asCarl = tokenFor(CARL, 'carl')
    const alice = (await app.call('GET', '/research/projects', { cookie: asAlice })).json.projects
    assert.deepEqual(alice.map(item => [item.title, item.role, item.owner]), [['Nghiên cứu của Alice', 'owner', 'alice'], ['Nghiên cứu của Bob', 'viewer', 'bob']])
    const carl = (await app.call('GET', '/research/projects', { cookie: asCarl })).json.projects
    assert.equal(carl.find(item => item.id === P_BOB).role, 'member')
    assert.equal(carl.find(item => item.id === P_BOB).surveyCount, 1)
  } finally { app.close() }
})

test('research projects: a viewer cannot change anything', async () => {
  const app = await boot()
  try {
    assert.equal((await app.call('PATCH', `/research/projects/${P_BOB}`, { cookie: asAlice, body: { title: 'hack' } })).status, 404)
    assert.equal((await app.call('POST', `/research/projects/${P_BOB}/members`, { cookie: asAlice, body: { username: 'alice', role: 'researcher' } })).status, 404)
    assert.equal((await app.call('POST', `/research/projects/${P_BOB}/participants`, { cookie: asAlice, body: {} })).status, 404)
    assert.equal((await app.call('POST', `/research/projects/${P_BOB}/dataset-versions`, { cookie: asAlice, body: {} })).status, 404)
    assert.equal(app.db.rowsOf('research_projects').find(item => item.id === P_BOB).title, 'Nghiên cứu của Bob')
    assert.equal(app.db.rowsOf('research_project_members').length, 1)
  } finally { app.close() }
})

test('the accessible-survey list used by analytics shows every survey with its owner', async () => {
  const app = await boot()
  try {
    const out = (await app.call('GET', '/research/surveys', { cookie: asAlice })).json.surveys
    assert.equal(out.length, 2)
    assert.deepEqual(out.map(item => [item.owner, item.mine]).sort(), [['alice', true], ['bob', false]])
    assert.ok(out.every(item => !('user_id' in item)))
  } finally { app.close() }
})
