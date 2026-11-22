import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import routes from '../src/routes/index.js'
import { errorHandler } from '../src/middleware/auth.js'
import { useSupabaseForTests } from '../src/config/supabase.js'
import { createFakeDb } from './helpers/fake-db.js'

process.env.JWT_SECRET = 'test-secret-question-time'
const OWNER = '11111111-1111-4111-8111-111111111111'
const SURVEY = 'aaaaaaaa-0000-4000-8000-000000000001'
const cookie = `token=${jwt.sign({ id: OWNER, username: 'owner' }, process.env.JWT_SECRET)}`
const image = (char = 'A', size = 24) => `data:image/png;base64,${char.repeat(size)}`

async function boot() {
  const db = createFakeDb({
    users: [{ id: OWNER, username: 'owner', is_admin: false }],
    surveys: [{ id: SURVEY, user_id: OWNER, title: 'Khảo sát', description: '', status: 'draft', public_slug: 'aaaaaa', settings: {}, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' }],
    questions: [], question_options: [], activity_log: []
  })
  useSupabaseForTests(db)
  const app = express(); app.use(express.json({ limit: '1mb' })); app.use(cookieParser()); app.use('/api', routes); app.use(errorHandler)
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    return { status: res.status, json: text && text.startsWith('{') ? JSON.parse(text) : null }
  }
  return { db, call, close: () => server.close() }
}

const save = (questions) => ({ title: 'Khảo sát', status: 'draft', questions })

test('a time question is saved through the normal survey update route', async () => {
  const app = await boot()
  try {
    const saved = await app.call('PUT', `/surveys/${SURVEY}`, save([{
      question_text: 'Bạn thường đi ngủ lúc mấy giờ?', question_type: 'time',
      settings: { placeholder: '23:30' }, options: []
    }]))
    assert.equal(saved.status, 200)
    assert.equal(saved.json.survey.questions[0].question_type, 'time')
    assert.equal(app.db.rowsOf('questions')[0].question_type, 'time')
  } finally { app.close() }
})

test('image options are stored in settings.images, never in the option value', async () => {
  const app = await boot()
  try {
    const saved = await app.call('PUT', `/surveys/${SURVEY}`, save([{
      question_text: 'Khung cảnh nào giúp bạn tập trung?', question_type: 'image',
      settings: { images: [image('A'), null] },
      options: [{ label: 'Rừng sớm', value: 'Rừng sớm' }, { label: 'Phố đêm', value: 'Phố đêm' }]
    }]))
    assert.equal(saved.status, 200)
    assert.deepEqual(saved.json.survey.questions[0].settings.images, [image('A'), null])
    assert.equal(app.db.rowsOf('question_options')[0].value, 'Rừng sớm')
  } finally { app.close() }
})

test('a database that still rejects time questions answers 503 with the migration hint', async () => {
  const app = await boot()
  app.db.failWhen((table, op) => table === 'questions' && op === 'insert', '23514',
    'new row for relation "questions" violates check constraint "questions_question_type_check"')
  try {
    const saved = await app.call('PUT', `/surveys/${SURVEY}`, save([{
      question_text: 'Mấy giờ bạn thức dậy?', question_type: 'time', settings: {}, options: []
    }]))
    assert.equal(saved.status, 503)
    assert.match(saved.json.error, /022_question_type_time\.sql/)
  } finally { app.close() }
})
