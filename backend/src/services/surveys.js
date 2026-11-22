import crypto from 'node:crypto'
import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

export const TYPES = ['single', 'mc', 'text', 'longtext', 'likert', 'rating', 'rank', 'slider', 'matrix', 'image', 'sd', 'time']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Ảnh lựa chọn được thu nhỏ ở trình duyệt rồi lưu dạng data URL trong settings.images.
// Chỉ nhận ảnh raster (không nhận SVG vì có thể chứa script) và giới hạn tổng dung lượng.
const IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/
const MAX_IMAGE_CHARS = 200_000
const MAX_IMAGES_CHARS = 800_000
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

function cleanImages(images, questionIndex) {
  if (!Array.isArray(images)) return undefined
  let total = 0
  return images.slice(0, 50).map((value, optionIndex) => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value !== 'string' || !IMAGE_DATA_URL.test(value))
      throw new HttpError(400, `Ảnh ở lựa chọn ${optionIndex + 1} của câu ${questionIndex + 1} không hợp lệ (chỉ nhận PNG, JPEG, WebP hoặc GIF)`)
    if (value.length > MAX_IMAGE_CHARS)
      throw new HttpError(400, `Ảnh ở lựa chọn ${optionIndex + 1} của câu ${questionIndex + 1} quá lớn; hãy chọn ảnh nhỏ hơn`)
    total += value.length
    if (total > MAX_IMAGES_CHARS)
      throw new HttpError(400, `Tổng dung lượng ảnh của câu ${questionIndex + 1} quá lớn; hãy dùng ít ảnh hơn hoặc ảnh nhỏ hơn`)
    return value
  })
}

export function cleanQuestion(q, i) {
  if (!TYPES.includes(q.question_type)) throw new HttpError(400, `Dạng câu hỏi không hợp lệ: ${q.question_type}`)
  const text = String(q.question_text || '').trim().slice(0, 500)
  if (!text) throw new HttpError(400, `Câu ${i + 1} chưa có nội dung`)
  const settings = q.settings && typeof q.settings === 'object' && !Array.isArray(q.settings) ? { ...q.settings } : {}
  if (q.question_type === 'image') {
    const images = cleanImages(settings.images, i)
    if (images) settings.images = images
    else delete settings.images
  } else delete settings.images
  return {
    question_text: text, question_type: q.question_type, position: i,
    is_required: q.is_required !== false, settings,
    options: (q.options || []).slice(0, 50).map(o => ({ label: String(o.label ?? '').trim().slice(0, 200), value: String(o.value ?? o.label ?? '').trim().slice(0, 200) })).filter(o => o.label)
  }
}

/** Đồng bộ danh sách câu hỏi: giữ nguyên id cũ (không mất câu trả lời), thêm mới, xóa câu bị loại. */
export async function saveQuestions(surveyId, incoming) {
  const list = incoming.map(cleanQuestion.bind(null))
  const existing = ok(await supabase.from('questions').select('id').eq('survey_id', surveyId)).map(r => r.id)
  const keep = new Set()
  try {
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
  } catch (error) {
    // DB thật có thể còn ràng buộc cũ chỉ cho 11 dạng câu hỏi. Trả 503 kèm migration thay vì lỗi 500 khó hiểu.
    if (error?.code === '23514' && /question_type/i.test(error.message || ''))
      throw new HttpError(503, 'Dạng câu hỏi “Giờ trong ngày” chưa được bật trong cơ sở dữ liệu. Chạy backend/migrations/022_question_type_time.sql trong Supabase SQL Editor rồi lưu lại.')
    throw error
  }
  const drop = existing.filter(id => !keep.has(id))
  if (drop.length) ok(await supabase.from('questions').delete().in('id', drop))
}
