import { createHash } from 'node:crypto'
import { HttpError } from '../middleware/auth.js'

/**
 * Chấm điểm theo dõi tiến triển — chỉ các câu số học trên thang đã biết.
 * Không diễn giải điểm (không "tốt/xấu", không chẩn đoán): chỉ tính điểm thô và so sánh khi thang tương thích.
 */

// Khoảng giá trị hợp lệ theo dạng câu hỏi (khớp với frontend: likert/rating 1–5, slider 1–100)
export const SCALE_RANGES = { likert: [1, 5], rating: [1, 5], slider: [1, 100] }
export const METHODS = ['sum', 'mean']
export const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,46}[a-z0-9]$/
const MAX_ITEMS = 60
const round2 = value => Math.round(value * 100) / 100

export function slugifyKey(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
}

/** Làm sạch và kiểm tra cấu hình chấm điểm so với câu hỏi thật của khảo sát. */
export function normalizeScoring(input, questions) {
  const method = input?.method
  if (!METHODS.includes(method)) throw new HttpError(400, 'Cách tính điểm phải là tổng (sum) hoặc trung bình (mean)')
  if (!Array.isArray(input.items) || !input.items.length) throw new HttpError(400, 'Chọn ít nhất một câu hỏi để tính điểm')
  if (input.items.length > MAX_ITEMS) throw new HttpError(400, `Tối đa ${MAX_ITEMS} câu hỏi cho mỗi thang điểm`)
  const version = String(input.version ?? '1').trim()
  if (!version || version.length > 40) throw new HttpError(400, 'Phiên bản thang điểm cần từ 1 đến 40 ký tự')

  const byId = new Map(questions.map(question => [question.id, question]))
  const seen = new Set()
  const items = []
  let range = null
  for (const raw of input.items) {
    const question = byId.get(raw?.question_id)
    if (!question) throw new HttpError(400, 'Có câu hỏi không thuộc khảo sát này')
    if (seen.has(question.id)) throw new HttpError(400, 'Một câu hỏi chỉ được chọn một lần')
    seen.add(question.id)
    const itemRange = SCALE_RANGES[question.question_type]
    if (!itemRange) throw new HttpError(400, `Câu "${question.question_text}" không phải dạng thang đo số (Likert, đánh giá sao hoặc thanh trượt)`)
    if (range && (range[0] !== itemRange[0] || range[1] !== itemRange[1]))
      throw new HttpError(400, 'Các câu trong cùng một thang điểm phải có cùng khoảng giá trị (không trộn thanh trượt với Likert/đánh giá sao)')
    range = itemRange
    items.push({ question_id: question.id, reverse: raw.reverse === true })
  }
  return { method, version, items }
}

/** Bản tóm tắt cấu trúc thang đo — không chứa id câu hỏi nên so sánh được giữa các phiên bản khảo sát. */
export function buildSnapshot(scoring, questions) {
  const byId = new Map(questions.map(question => [question.id, question]))
  const first = byId.get(scoring.items[0].question_id)
  const [min, max] = SCALE_RANGES[first.question_type]
  return {
    method: scoring.method, version: scoring.version, min, max,
    itemCount: scoring.items.length, reverse: scoring.items.map(item => item.reverse)
  }
}

export function fingerprintOf(assessmentKey, snapshot) {
  const canonical = JSON.stringify({
    key: assessmentKey, method: snapshot.method, version: snapshot.version,
    min: snapshot.min, max: snapshot.max, itemCount: snapshot.itemCount, reverse: snapshot.reverse
  })
  return createHash('sha256').update(`brainst0rm:scoring-v1:${canonical}`).digest('hex')
}

const numeric = value => {
  const number = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN)
  return Number.isFinite(number) ? number : null
}

/**
 * Tính điểm từ câu trả lời. Thiếu hoặc ngoài khoảng ở BẤT KỲ câu nào → không chấm (không ước lượng, không tính một phần).
 * @param answers Map hoặc object { question_id: value }
 */
export function computeScore(scoring, snapshot, answers) {
  const get = id => (answers instanceof Map ? answers.get(id) : answers?.[id])
  const base = { min: snapshot.method === 'sum' ? snapshot.min * snapshot.itemCount : snapshot.min,
    max: snapshot.method === 'sum' ? snapshot.max * snapshot.itemCount : snapshot.max, itemCount: snapshot.itemCount }
  let total = 0
  for (const item of scoring.items) {
    const value = numeric(get(item.question_id))
    if (value === null) return { ...base, status: 'incomplete', score: null, reason: 'Thiếu câu trả lời cho một hoặc nhiều câu tính điểm' }
    if (value < snapshot.min || value > snapshot.max) return { ...base, status: 'incomplete', score: null, reason: 'Có câu trả lời nằm ngoài thang đo' }
    total += item.reverse ? snapshot.min + snapshot.max - value : value
  }
  const score = snapshot.method === 'sum' ? total : total / snapshot.itemCount
  return { ...base, status: 'scored', score: round2(score), reason: null }
}

/** Hai session so sánh được khi cùng assessment và cùng dấu vân tay thang đo. */
export const isCompatible = (a, b) =>
  Boolean(a?.scoring_fingerprint) && a.scoring_fingerprint === b?.scoring_fingerprint

const METHOD_LABEL = { sum: 'tổng điểm', mean: 'điểm trung bình' }

/** Giải thích bằng tiếng Việt vì sao hai thang đo không so sánh được (rỗng nếu tương thích). */
export function explainIncompatibility(a, b) {
  if (isCompatible(a, b)) return []
  const x = a?.scoring_snapshot || {}, y = b?.scoring_snapshot || {}
  const reasons = []
  if (!a?.scoring_fingerprint || !b?.scoring_fingerprint) reasons.push('Một trong hai lần đo không có cấu hình thang điểm để đối chiếu.')
  if (x.method && y.method && x.method !== y.method) reasons.push(`Cách tính điểm khác nhau (${METHOD_LABEL[x.method]} so với ${METHOD_LABEL[y.method]}).`)
  if (x.itemCount !== undefined && y.itemCount !== undefined && x.itemCount !== y.itemCount) reasons.push(`Số câu tính điểm khác nhau (${x.itemCount} so với ${y.itemCount}).`)
  if (x.min !== y.min || x.max !== y.max) reasons.push(`Khoảng giá trị mỗi câu khác nhau (${x.min}–${x.max} so với ${y.min}–${y.max}).`)
  if (JSON.stringify(x.reverse) !== JSON.stringify(y.reverse) && x.itemCount === y.itemCount) reasons.push('Các câu đảo chiều khác nhau.')
  if (x.version !== y.version) reasons.push(`Phiên bản thang điểm khác nhau (${x.version ?? '—'} so với ${y.version ?? '—'}).`)
  if (!reasons.length) reasons.push('Cấu hình thang điểm đã thay đổi giữa hai lần đo.')
  return reasons
}
