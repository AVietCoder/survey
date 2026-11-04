import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { loadQuestions } from '../services/surveys.js'
import { evaluate, hashIp } from '../services/quality.js'

async function published(slug) {
  const s = ok(await supabase.from('surveys').select('id,title,description,settings,status').eq('public_slug', slug).maybeSingle())
  if (!s || s.status !== 'published') throw new HttpError(404, 'Khảo sát không tồn tại hoặc đã đóng')
  return s
}

export async function getBySlug(req, res) {
  const s = await published(req.params.slug)
  const questions = (await loadQuestions(s.id)).map(({ survey_id, ...q }) => q)
  res.json({ survey: { id: s.id, title: s.title, description: s.description, settings: s.settings, questions } })
}

// Ghi nhận thời điểm bắt đầu (để tính completion rate và thời gian làm bài phía server)
export async function start(req, res) {
  const s = await published(req.params.slug)
  const r = ok(await supabase.from('responses').insert({ survey_id: s.id, ip_hash: hashIp(req.ip) }).select('id').single())
  res.status(201).json({ responseId: r.id })
}

export async function submit(req, res) {
  const s = await published(req.params.slug)
  const questions = await loadQuestions(s.id)
  const byId = Object.fromEntries(questions.map(q => [q.id, q]))
  const answers = (Array.isArray(req.body.answers) ? req.body.answers : [])
    .filter(a => byId[a.question_id] && a.value !== undefined && a.value !== null && a.value !== '')
  const have = new Set(answers.map(a => a.question_id))
  const missing = questions.find(q => q.is_required && !have.has(q.id))
  if (missing) throw new HttpError(400, `Vui lòng trả lời: ${missing.question_text}`)

  let resp = null
  if (req.body.responseId) {
    resp = ok(await supabase.from('responses').select('*').eq('id', req.body.responseId).eq('survey_id', s.id).maybeSingle())
    if (resp?.submitted_at) throw new HttpError(409, 'Phản hồi này đã được gửi')
  }
  resp ||= ok(await supabase.from('responses').insert({ survey_id: s.id, ip_hash: hashIp(req.ip) }).select('*').single())

  const now = new Date()
  const duration = Math.max(0, Math.round((now - new Date(resp.started_at)) / 1000))
  const q = await evaluate({ surveyId: s.id, responseId: resp.id, questions, answers, duration, ipHash: resp.ip_hash })
  if (answers.length) ok(await supabase.from('answers').insert(answers.map(a => ({ response_id: resp.id, question_id: a.question_id, answer_value: a.value }))))
  ok(await supabase.from('responses').update({
    submitted_at: now.toISOString(), duration_seconds: duration, quality_status: q.status,
    quality_score: q.score, signals: q.signals, answer_hash: q.answerHash
  }).eq('id', resp.id))
  res.status(201).json({ ok: true })   // không trả điểm chất lượng cho người tham gia
}
