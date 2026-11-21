import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { useSurveyVotes } from '../src/controllers/admin.js'
import { createSurveyVotesService } from '../src/services/survey-votes.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-votes'
const A1 = '11111111-1111-4111-8111-111111111111', A2 = '22222222-2222-4222-8222-222222222222', USER = '33333333-3333-4333-8333-333333333333'
const S1 = 'aaaaaaaa-0000-4000-8000-000000000001', S2 = 'aaaaaaaa-0000-4000-8000-000000000002', S3 = 'aaaaaaaa-0000-4000-8000-000000000003'
const survey = (id, status = 'published', slug = id.slice(-4)) => ({ id, user_id: A1, title: `KS ${slug}`, description: 'mô tả', public_slug: slug, status })
const UNIQUE = { unique: { survey_votes: [['admin_id']] }, cascade: {} }
const make = (extra = {}) => {
  const db = createFakeDb({ surveys: [survey(S1), survey(S2), survey(S3, 'draft')], survey_votes: [], users: [{ id: A1, is_admin: true, username: 'a1' }, { id: A2, is_admin: true, username: 'a2' }, { id: USER, is_admin: false, username: 'u' }], ...extra }, UNIQUE)
  return { db, service: createSurveyVotesService(db) }
}

test('no votes → no default survey; the most votes wins; one vote per admin and it can be changed', async () => {
  const { service } = make()
  assert.equal(await service.defaultSurvey(), null)
  await service.vote(A1, S1)
  assert.equal((await service.defaultSurvey()).slug, '0001')
  await service.vote(A2, S2)
  assert.equal((await service.defaultSurvey()).slug, '0001', 'hòa phiếu: khảo sát nhận phiếu sớm nhất thắng')
  await service.vote(A1, S2)                                  // A1 đổi phiếu: S2 có 2 phiếu
  const tally = await service.tally(A1)
  assert.deepEqual(tally.surveys.map(s => [s.slug, s.votes]), [['0002', 2], ['0001', 0]])
  assert.equal(tally.myVote, S2); assert.equal((await service.defaultSurvey()).slug, '0002')
  await service.clearVote(A1); await service.clearVote(A2)
  assert.equal(await service.defaultSurvey(), null)
})

test('only published surveys can be voted for or win; votes for closed surveys are ignored', async () => {
  const { db, service } = make()
  await assert.rejects(service.vote(A1, S3), { status: 400 })
  await assert.rejects(service.vote(A1, 'aaaaaaaa-0000-4000-8000-0000000000ff'), { status: 400 })
  await service.vote(A1, S1)
  db.rowsOf('surveys').find(s => s.id === S1).status = 'archived'
  assert.equal(await service.defaultSurvey(), null)
})

test('missing migration 020: public default is null (old behaviour), admin writes give 503', async () => {
  const { db, service } = make()
  db.failWhen(table => table === 'survey_votes', 'PGRST205')
  assert.equal(await service.defaultSurvey(), null)
  await assert.rejects(service.tally(A1), { status: 503 })
  await assert.rejects(service.vote(A1, S1), { status: 503 })
})

test('HTTP: public default endpoint leaks nothing but slug/title/description; only admins vote', async () => {
  const { db, service } = make()
  useSupabaseForTests(db); useSurveyVotes(service)
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const as = id => `token=${jwt.sign({ id, username: id === USER ? 'u' : 'a1' }, process.env.JWT_SECRET)}`
  const call = async (method, path, cookie, body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, json: await res.json().catch(() => null), cache: res.headers.get('cache-control') }
  }
  try {
    assert.deepEqual((await call('GET', '/public/default-survey')).json, { survey: null })
    assert.equal((await call('PUT', '/admin/survey-votes', undefined, { surveyId: S1 })).status, 401)
    assert.equal((await call('PUT', '/admin/survey-votes', as(USER), { surveyId: S1 })).status, 403)
    assert.equal((await call('PUT', '/admin/survey-votes', as(A1), { surveyId: 'x' })).status, 400)
    const voted = await call('PUT', '/admin/survey-votes', as(A1), { surveyId: S1 })
    assert.equal(voted.status, 200); assert.equal(voted.json.surveys[0].votes, 1); assert.equal(voted.json.surveys[0].mine, true)
    const pub = await call('GET', '/public/default-survey')
    assert.deepEqual(Object.keys(pub.json.survey).sort(), ['description', 'slug', 'title']); assert.equal(pub.cache, 'no-store')
    assert.equal((await call('DELETE', '/admin/survey-votes', as(A1))).status, 200)
    assert.deepEqual((await call('GET', '/public/default-survey')).json, { survey: null })
  } finally { server.close() }
})
