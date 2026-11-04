import crypto from 'node:crypto'
import { supabase } from '../config/supabase.js'

const SCALE = ['likert', 'rating', 'sd', 'matrix']
const sig = (code, weight, message) => ({ code, weight, message })

export const hashIp = ip => crypto.createHash('sha256').update((process.env.IP_SALT || '') + (ip || '')).digest('hex').slice(0, 32)

/**
 * Chấm điểm chất lượng 0–100 từ nhiều tín hiệu.
 * Spam chỉ được kết luận khi có >= 2 tín hiệu khác nhau; một tín hiệu đơn lẻ tối đa là "suspicious".
 */
export async function evaluate({ surveyId, responseId, questions, answers, duration, ipHash }) {
  const signals = []
  const byId = Object.fromEntries(questions.map(q => [q.id, q]))

  // 1. Hoàn thành quá nhanh
  const minSec = Math.max(8, Math.round(questions.length * 2.5))
  if (duration < minSec) signals.push(sig('too_fast', 35, `Hoàn thành trong ${duration} giây, thấp hơn mức tối thiểu hợp lý (~${minSec} giây).`))

  // 2. Chọn cùng một đáp án ở mọi câu thang đo
  const scaleVals = []
  for (const a of answers) {
    const t = byId[a.question_id]?.question_type
    if (!SCALE.includes(t)) continue
    if (a.value && typeof a.value === 'object') scaleVals.push(...Object.values(a.value))
    else scaleVals.push(a.value)
  }
  if (scaleVals.length >= 4 && new Set(scaleVals.map(String)).size === 1)
    signals.push(sig('straightline', 30, 'Chọn cùng một đáp án ở tất cả các câu dạng thang đo.'))

  // 3. Văn bản vô nghĩa
  const texts = answers.filter(a => ['text', 'longtext'].includes(byId[a.question_id]?.question_type) && typeof a.value === 'string')
  if (texts.some(a => /(.)\1{4,}/.test(a.value) || /asdf|qwer|zxcv|jkl;/i.test(a.value)))
    signals.push(sig('gibberish', 20, 'Câu trả lời mở có dấu hiệu vô nghĩa (ký tự lặp hoặc gõ ngẫu nhiên).'))

  // 4. Trùng lặp bộ câu trả lời
  const norm = answers.slice().sort((a, b) => a.question_id.localeCompare(b.question_id)).map(a => [a.question_id, a.value])
  const answerHash = crypto.createHash('sha1').update(JSON.stringify(norm)).digest('hex')
  if (answers.length >= 3) {
    const { count } = await supabase.from('responses').select('id', { count: 'exact', head: true })
      .eq('survey_id', surveyId).eq('answer_hash', answerHash).not('submitted_at', 'is', null)
    if (count > 0) signals.push(sig('duplicate', 35, 'Bộ câu trả lời trùng khớp hoàn toàn với một phản hồi khác.'))
  }

  // 5. Tần suất gửi từ cùng thiết bị
  if (ipHash) {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await supabase.from('responses').select('id', { count: 'exact', head: true })
      .eq('survey_id', surveyId).eq('ip_hash', ipHash).gte('started_at', since).neq('id', responseId)
    if (count >= 2) signals.push(sig('frequency', 30, `Có ${count + 1} phản hồi từ cùng một thiết bị trong 10 phút.`))
  }

  const score = Math.max(0, 100 - signals.reduce((s, x) => s + x.weight, 0))
  const status = signals.length >= 2 && score < 45 ? 'spam' : score < 75 ? 'suspicious' : 'normal'
  return { score, status, signals, answerHash }
}
