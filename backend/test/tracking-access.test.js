import test from 'node:test'
import assert from 'node:assert/strict'
import { canEditConfig, resolveSurveyAccess } from '../src/controllers/tracking.js'
import { HttpError } from '../src/middleware/auth.js'
import { createFakeDb } from './helpers/fake-db.js'

const SURVEY = '22222222-2222-4222-8222-222222222222'
const survey = { id: SURVEY, user_id: 'owner', title: 'S' }
const notFound = () => { throw new HttpError(404, 'Không tìm thấy khảo sát') }
const db = (users = []) => createFakeDb({ users, surveys: [survey] })

test('only the survey owner may change tracking configuration', () => {
  assert.equal(canEditConfig('owner'), true)
  for (const role of ['researcher', 'reviewer', 'admin', undefined]) assert.equal(canEditConfig(role), false, String(role))
})

test('existing survey access rules decide owner / researcher / reviewer roles', async () => {
  for (const role of ['owner', 'researcher', 'reviewer']) {
    const result = await resolveSurveyAccess(SURVEY, { id: 'u1' }, { getAccess: async () => ({ survey, role }), db: db() })
    assert.equal(result.role, role)
  }
})

test('a user without access gets 404, never a hint that the survey exists', async () => {
  await assert.rejects(() => resolveSurveyAccess(SURVEY, { id: 'stranger' }, { getAccess: notFound, db: db([{ id: 'stranger', is_admin: false }]) }),
    error => error.status === 404)
  await assert.rejects(() => resolveSurveyAccess(SURVEY, { id: 'ghost' }, { getAccess: notFound, db: db() }), error => error.status === 404)
})

test('admins get read-only access to any survey and cannot edit tracking', async () => {
  const access = await resolveSurveyAccess(SURVEY, { id: 'admin' }, { getAccess: notFound, db: db([{ id: 'admin', is_admin: true }]) })
  assert.equal(access.role, 'admin'); assert.equal(access.survey.id, SURVEY)
  assert.equal(canEditConfig(access.role), false)
})

test('admin fallback ignores malformed ids and unknown surveys; other errors propagate unchanged', async () => {
  const admins = db([{ id: 'admin', is_admin: true }])
  await assert.rejects(() => resolveSurveyAccess('not-a-uuid', { id: 'admin' }, { getAccess: notFound, db: admins }), error => error.status === 404)
  await assert.rejects(() => resolveSurveyAccess('99999999-9999-4999-8999-999999999999', { id: 'admin' }, { getAccess: notFound, db: admins }), error => error.status === 404)
  await assert.rejects(() => resolveSurveyAccess(SURVEY, { id: 'admin' }, { getAccess: async () => { throw new HttpError(500, 'boom') }, db: admins }), error => error.status === 500)
})
