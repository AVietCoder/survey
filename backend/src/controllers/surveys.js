import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { logActivity } from '../services/activity.js'
import { getOwned, withQuestions, saveQuestions, newSlug } from '../services/surveys.js'

const STATUSES = ['draft', 'published', 'archived']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Danh sách khảo sát. Mặc định chỉ của mình; `?scope=all` trả khảo sát của mọi tài khoản (chỉ đọc), kèm chủ sở hữu.
 */
export async function list(req, res) {
  const all = req.query.scope === 'all'
  let query = supabase.from('surveys').select('id,user_id,title,description,status,public_slug,created_at,updated_at').order('updated_at', { ascending: false })
  if (!all) query = query.eq('user_id', req.user.id)
  const surveys = ok(await query.limit(500))
  const ownerRows = all && surveys.length ? ok(await supabase.from('users').select('id,username').in('id', [...new Set(surveys.map(s => s.user_id))])) : []
  const ownerNames = Object.fromEntries(ownerRows.map(row => [row.id, row.username]))
  const ids = surveys.map(s => s.id)
  const rs = ids.length ? ok(await supabase.from('responses').select('survey_id, submitted_at').in('survey_id', ids)) : []
  const agg = {}
  for (const r of rs) { const a = agg[r.survey_id] ||= { total: 0, done: 0 }; a.total++; if (r.submitted_at) a.done++ }
  res.json({ surveys: surveys.map(s => {
    const a = agg[s.id] || { total: 0, done: 0 }
    const { user_id, ...rest } = s
    return { ...rest, response_count: a.done, completion_rate: a.total ? Math.round(a.done / a.total * 100) : 0, ...(all ? { owner: ownerNames[user_id] || 'Không rõ', mine: user_id === req.user.id } : {}) }
  }) })
}

export async function create(req, res) {
  const { title, description } = req.body
  const survey = ok(await supabase.from('surveys').insert({
    user_id: req.user.id, title: String(title || 'Khảo sát chưa đặt tên').slice(0, 200),
    description: String(description || '').slice(0, 1000), public_slug: newSlug()
  }).select('*').single())
  if (Array.isArray(req.body.questions)) await saveQuestions(survey.id, req.body.questions)
  await logActivity(req, 'survey.create', { type: 'survey', id: survey.id, label: survey.title })
  res.status(201).json({ survey: await withQuestions(survey) })
}

/** Chủ sở hữu nhận bản chỉnh sửa được; tài khoản khác nhận bản CHỈ ĐỌC (readOnly) để xem cấu trúc khảo sát. */
export async function get(req, res) {
  try {
    res.json({ survey: await withQuestions(await getOwned(req.params.id, req.user.id)) })
  } catch (error) {
    if (error.status !== 404 || !UUID_RE.test(req.params.id)) throw error
    const survey = ok(await supabase.from('surveys').select('*').eq('id', req.params.id).maybeSingle())
    if (!survey) throw error
    const owner = ok(await supabase.from('users').select('username').eq('id', survey.user_id).maybeSingle())
    const { user_id, ...rest } = survey
    res.json({ survey: { ...(await withQuestions(rest)), owner: owner?.username || 'Không rõ' }, readOnly: true })
  }
}

export async function update(req, res) {
  const cur = await getOwned(req.params.id, req.user.id)
  const b = req.body, patch = {}
  if (b.title !== undefined) patch.title = String(b.title).trim().slice(0, 200) || 'Khảo sát chưa đặt tên'
  if (b.description !== undefined) patch.description = String(b.description).slice(0, 1000)
  if (b.settings && typeof b.settings === 'object') patch.settings = b.settings
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) throw new HttpError(400, 'Trạng thái không hợp lệ')
    patch.status = b.status
  }
  if (Array.isArray(b.questions)) await saveQuestions(cur.id, b.questions)
  const full = await withQuestions({ ...cur, ...patch })
  if (patch.status === 'published' && !full.questions.length) throw new HttpError(400, 'Cần ít nhất 1 câu hỏi để xuất bản')
  const survey = Object.keys(patch).length
    ? ok(await supabase.from('surveys').update(patch).eq('id', cur.id).select('*').single()) : cur
  if (patch.status && patch.status !== cur.status) await logActivity(req, patch.status === 'published' ? 'survey.publish' : 'survey.update', { type: 'survey', id: cur.id, label: survey.title }, { status: patch.status })
  res.json({ survey: await withQuestions(survey) })
}

export async function remove(req, res) {
  const s = await getOwned(req.params.id, req.user.id)
  ok(await supabase.from('surveys').delete().eq('id', s.id))
  await logActivity(req, 'survey.delete', { type: 'survey', id: s.id, label: s.title })
  res.json({ ok: true })
}
