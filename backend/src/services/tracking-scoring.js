import { createHash } from 'node:crypto'
import { HttpError } from '../middleware/auth.js'
import { INSTRUMENTS, mapInstrumentItems } from './tracking-instruments.js'

/**
 * Chấm điểm theo dõi tiến triển — chỉ các câu số học trên thang đã biết.
 * Không diễn giải điểm (không "tốt/xấu", không chẩn đoán): chỉ tính điểm thô và so sánh khi thang tương thích.
 */

// Khoảng giá trị hợp lệ theo dạng câu hỏi (khớp với frontend: likert/rating 1–5, slider 1–100)
export const SCALE_RANGES = { likert: [1, 5], rating: [1, 5], slider: [1, 100] }
export const METHODS = ['sum', 'mean', 'instrument']
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
  if (!METHODS.includes(method)) throw new HttpError(400, 'Cách tính điểm phải là tổng (sum), trung bình (mean) hoặc theo thang chuẩn (instrument)')
  if (method === 'instrument') {
    const instrument = INSTRUMENTS[input.instrument]
    if (!instrument) throw new HttpError(400, 'Thang chuẩn không được hỗ trợ')
    const items = mapInstrumentItems(instrument.id, questions)
    if (!items) throw new HttpError(400, `Khảo sát này chưa có đủ các câu hỏi của ${instrument.name}. Hãy tạo khảo sát từ mẫu dựng sẵn.`)
    const version = String(input.version ?? '1').trim()
    if (!version || version.length > 40) throw new HttpError(400, 'Phiên bản thang điểm cần từ 1 đến 40 ký tự')
    return { method, instrument: instrument.id, version, items }
  }
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
  if (scoring.method === 'instrument') {
    const instrument = INSTRUMENTS[scoring.instrument]
    return { method: 'instrument', instrument: instrument.id, version: scoring.version, min: instrument.range[0], max: instrument.range[1], itemCount: scoring.items.length, reverse: [] }
  }
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
    key: assessmentKey, method: snapshot.method, instrument: snapshot.instrument || null, version: snapshot.version,
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
  if (scoring.method === 'instrument') {
    const instrument = INSTRUMENTS[scoring.instrument]
    if (!instrument) return { status: 'unscored', score: null, min: null, max: null, itemCount: null, reason: 'Thang chuẩn không được hỗ trợ' }
    const byKey = Object.fromEntries(scoring.items.map(item => {
      const answer = get(item.question_id)
      return [item.key, item.choices && typeof answer === 'string' && Object.hasOwn(item.choices, answer) ? item.choices[answer] : answer]
    }))
    const result = instrument.compute(key => byKey[key])
    return { ...result, score: result.score }
  }
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

const METHOD_LABEL = { sum: 'tổng điểm', mean: 'điểm trung bình', instrument: 'thang chuẩn' }

/** Giải thích bằng tiếng Việt vì sao hai thang đo không so sánh được (rỗng nếu tương thích). */
export function explainIncompatibility(a, b) {
  if (isCompatible(a, b)) return []
  const x = a?.scoring_snapshot || {}, y = b?.scoring_snapshot || {}
  const reasons = []
  if (!a?.scoring_fingerprint || !b?.scoring_fingerprint) reasons.push('Một trong hai lần đo không có cấu hình thang điểm để đối chiếu.')
  if (x.method && y.method && x.method !== y.method) reasons.push(`Cách tính điểm khác nhau (${METHOD_LABEL[x.method]} so với ${METHOD_LABEL[y.method]}).`)
  if (x.instrument !== y.instrument) reasons.push('Hai lần đo dùng hai thang chuẩn khác nhau.')
  if (x.itemCount !== undefined && y.itemCount !== undefined && x.itemCount !== y.itemCount) reasons.push(`Số câu tính điểm khác nhau (${x.itemCount} so với ${y.itemCount}).`)
  if (x.min !== y.min || x.max !== y.max) reasons.push(`Khoảng giá trị mỗi câu khác nhau (${x.min}–${x.max} so với ${y.min}–${y.max}).`)
  if (JSON.stringify(x.reverse) !== JSON.stringify(y.reverse) && x.itemCount === y.itemCount) reasons.push('Các câu đảo chiều khác nhau.')
  if (x.version !== y.version) reasons.push(`Phiên bản thang điểm khác nhau (${x.version ?? '—'} so với ${y.version ?? '—'}).`)
  if (!reasons.length) reasons.push('Cấu hình thang điểm đã thay đổi giữa hai lần đo.')
  return reasons
}

/* ============================================================================
   Chia mức điểm (2–6 mức) — dùng để gợi ý gói nhiệm vụ / nhóm hỗ trợ, KHÔNG phải chẩn đoán.
   Ngưỡng do nhà nghiên cứu nhập (phải lấy từ công cụ đã chuẩn hóa); hệ thống chỉ kiểm tra tính hợp lệ.
   Biểu diễn: n-1 điểm cắt tăng dần → n vùng theo điểm tăng dần: [min,c1) · [c1,c2) · … · [c(n-1),max].
   Mỗi điểm cắt là điểm ĐẦU TIÊN của vùng cao hơn. `direction` quyết định vùng thấp là tốt hay cần hỗ trợ.
   ============================================================================ */
export const BAND_DIRECTIONS = ['higher_worse', 'higher_better']
export const MIN_BAND_LEVELS = 2
export const MAX_BAND_LEVELS = 6
// Tông màu theo mức độ cần hỗ trợ tăng dần (độ nặng 0 = ổn nhất)
export const BAND_TONES = {
  2: ['green', 'red'],
  3: ['green', 'yellow', 'red'],
  4: ['green', 'yellow', 'orange', 'red'],
  5: ['green', 'lime', 'yellow', 'orange', 'red'],
  6: ['blue', 'green', 'lime', 'yellow', 'orange', 'red']
}
const MAX_LABEL = 40, MAX_SUPPORT = 600

/** Khoảng điểm đạt được của thang (tổng, trung bình hoặc thang chuẩn). */
export function scoreRange(snapshot) {
  if (snapshot.method === 'instrument') return [snapshot.min, snapshot.max]
  return snapshot.method === 'sum'
    ? [snapshot.min * snapshot.itemCount, snapshot.max * snapshot.itemCount]
    : [snapshot.min, snapshot.max]
}

/** Tên mặc định khi nhà nghiên cứu để trống. */
const defaultLabels = count => Array.from({ length: count }, (_, index) => `Mức ${index + 1}`)

/** Làm sạch cấu hình mức điểm. Trả về { enabled:false } nếu tắt. `snapshot` bắt buộc khi bật. */
export function normalizeBands(input, snapshot) {
  if (!input || input.enabled !== true) return input && typeof input === 'object' ? { enabled: false } : null
  if (!snapshot) throw new HttpError(400, 'Cần chọn câu hỏi tính điểm trước khi bật chia mức điểm')
  const direction = input.direction
  if (!BAND_DIRECTIONS.includes(direction)) throw new HttpError(400, 'Hãy chọn điểm cao nghĩa là tốt hơn hay cần hỗ trợ nhiều hơn')
  const cuts = Array.isArray(input.cutoffs) ? input.cutoffs.map(value => (value === '' || value === null || value === undefined ? NaN : Number(value))) : []
  const count = cuts.length + 1
  if (count < MIN_BAND_LEVELS || count > MAX_BAND_LEVELS || cuts.some(value => !Number.isFinite(value)))
    throw new HttpError(400, `Cần từ ${MIN_BAND_LEVELS - 1} đến ${MAX_BAND_LEVELS - 1} điểm cắt hợp lệ (chia thành ${MIN_BAND_LEVELS}–${MAX_BAND_LEVELS} mức)`)
  const [min, max] = scoreRange(snapshot)
  const rounded = cuts.map(value => Math.round(value * 100) / 100)
  const ascending = rounded.every((value, index) => index === 0 || value > rounded[index - 1])
  if (!(rounded[0] > min && ascending && rounded[rounded.length - 1] <= max))
    throw new HttpError(400, `Các điểm cắt phải tăng dần và nằm trong khoảng điểm đạt được (${min}–${max}): điểm cắt đầu lớn hơn ${min}, điểm cắt cuối không vượt ${max}`)
  const given = Array.isArray(input.labels) ? input.labels : []
  const fallback = defaultLabels(count)
  const labels = fallback.map((def, index) => {
    const label = String(given[index] ?? '').trim() || def
    if (label.length > MAX_LABEL) throw new HttpError(400, `Tên mức không được vượt quá ${MAX_LABEL} ký tự`)
    return label
  })
  if (new Set(labels.map(label => label.toLocaleLowerCase('vi'))).size !== count) throw new HttpError(400, 'Các tên mức phải khác nhau')
  const supportText = String(input.supportText ?? '').trim()
  if (!supportText) throw new HttpError(400, 'Cần nhập thông tin kênh hỗ trợ (ví dụ phòng tư vấn của trường) trước khi bật chia mức điểm')
  if (supportText.length > MAX_SUPPORT) throw new HttpError(400, `Thông tin hỗ trợ không được vượt quá ${MAX_SUPPORT} ký tự`)
  return { enabled: true, direction, cutoffs: rounded, labels, showToStudent: input.showToStudent === true, supportText, range: [min, max] }
}

/** Phân mức của một kết quả đã chấm: { index (theo điểm tăng dần), severity (0 = ổn nhất), tone, label, levels } hoặc null. */
export function bandFor(bands, result) {
  if (!bands?.enabled || result?.status !== 'scored' || !Number.isFinite(result.score)) return null
  const levels = bands.cutoffs.length + 1
  const index = bands.cutoffs.filter(cut => result.score >= cut).length
  const severity = bands.direction === 'higher_worse' ? index : levels - 1 - index
  return { index, severity, levels, tone: BAND_TONES[levels][severity], label: bands.labels[index] }
}

/** Phần mức điểm trả cho người tham gia. Hộp hỗ trợ của mức cần hỗ trợ nhiều nhất luôn có, kể cả khi ẩn tên mức. */
export function bandForParticipant(bands, band) {
  if (!band) return null
  return {
    tone: bands.showToStudent ? band.tone : null,
    label: bands.showToStudent ? band.label : null,
    showLabel: bands.showToStudent === true,
    levels: band.levels,
    support: band.severity === band.levels - 1 ? bands.supportText : null
  }
}
