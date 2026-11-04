import crypto from 'node:crypto'
import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

export const TYPES = ['single', 'mc', 'text', 'longtext', 'likert', 'rating', 'rank', 'slider', 'matrix', 'image', 'sd']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const newSlug = () => crypto.randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, 'x')

export async function getOwned(id, userId) {
  if (!UUID.test(id)) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const s = ok(await supabase.from('surveys').select('*').eq('id', id).eq('user_id', userId).maybeSingle())
  if (!s) throw new HttpError(404, 'Không tìm thấy khảo sát')
  return s
}

export async function loadQuestions(surveyId) {
  const rows = ok(await supabase.from('questions').select('*, question_options(*)').eq('survey_id', surveyId).order('position'))
  return rows.map(({ question_options, ...q }) => ({
    ...q, options: (question_options || []).sort((a, b) => a.position - b.position).map(o => ({ label: o.label, value: o.value }))
  }))
}

export async function withQuestions(survey) { return { ...survey, questions: await loadQuestions(survey.id) } }

function cleanQuestion(q, i) {
  if (!TYPES.includes(q.question_type)) throw new HttpError(400, `Dạng câu hỏi không hợp lệ: ${q.question_type}`)
  const text = String(q.question_text || '').trim().slice(0, 500)
  if (!text) throw new HttpError(400, `Câu ${i + 1} chưa có nội dung`)
  return {
    question_text: text, question_type: q.question_type, position: i,
    is_required: q.is_required !== false, settings: q.settings && typeof q.settings === 'object' ? q.settings : {},
    options: (q.options || []).slice(0, 50).map(o => ({ label: String(o.label).slice(0, 200), value: String(o.value ?? o.label).slice(0, 200) })).filter(o => o.label)
  }
}

/** Đồng bộ danh sách câu hỏi: giữ nguyên id cũ (không mất câu trả lời), thêm mới, xóa câu bị loại. */
export async function saveQuestions(surveyId, incoming) {
  const list = incoming.map(cleanQuestion.bind(null))
  const existing = ok(await supabase.from('questions').select('id').eq('survey_id', surveyId)).map(r => r.id)
  const keep = new Set()
  for (let i = 0; i < list.length; i++) {
    const { options, ...row } = list[i]
    let id = incoming[i].id
    if (UUID.test(id || '') && existing.includes(id)) {
      ok(await supabase.from('questions').update(row).eq('id', id))
      ok(await supabase.from('question_options').delete().eq('question_id', id))
    } else {
      id = ok(await supabase.from('questions').insert({ ...row, survey_id: surveyId }).select('id').single()).id
    }
    keep.add(id)
    if (options.length) ok(await supabase.from('question_options').insert(options.map((o, p) => ({ ...o, question_id: id, position: p }))))
  }
  const drop = existing.filter(id => !keep.has(id))
  if (drop.length) ok(await supabase.from('questions').delete().in('id', drop))
}
