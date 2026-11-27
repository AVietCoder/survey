/**
 * Chấm điểm các thang đo chuẩn (PSQI, HCL-32) từ câu trả lời của khảo sát.
 * Mỗi câu hỏi của khảo sát mẫu mang `settings.key` để ánh xạ đúng mục của thang đo.
 *
 * Quy tắc chung: thiếu hoặc không đọc được BẤT KỲ mục bắt buộc nào → không chấm (status 'incomplete'),
 * không ước lượng, không tính một phần. Điểm chỉ mang tính sàng lọc, KHÔNG phải chẩn đoán.
 */
import { PSQI_PUBLISHED } from './psqi-bands.js'


/* ------------------------------------------------------------------ đọc dữ liệu */
const text = value => (value === null || value === undefined ? '' : String(value)).trim()

/** "23:30", "23h30", "23h", "11:30 pm", "6 giờ 30" → số phút trong ngày (0–1439) hoặc null. */
export function parseClock(value) {
  const raw = text(value).toLowerCase().replace(/\s+/g, ' ')
  if (/^\d{1,2}$/.test(raw)) return Number(raw) <= 23 ? Number(raw) * 60 : null      // "3" → 03:00, "22" → 22:00 (đồng hồ 24 giờ)
  const match = raw.match(/^(\d{1,2})\s*(?:[:h]|g(?:iờ)?|giờ)\s*(\d{1,2})?\s*(am|pm|sáng|chiều|tối)?$/u) || raw.match(/^(\d{1,2})\s*(am|pm)$/u)
  if (!match) return null
  let hour = Number(match[1])
  const minute = match[2] !== undefined && /^\d/.test(match[2]) ? Number(match[2]) : 0
  const meridiem = /^(am|pm|sáng|chiều|tối)$/.test(match[3] || '') ? match[3] : (/^(am|pm)$/.test(match[2] || '') ? match[2] : '')
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    const pm = meridiem === 'pm' || meridiem === 'chiều' || meridiem === 'tối'
    hour = (hour % 12) + (pm ? 12 : 0)
  }
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** "15", "15 phút", "1,5" → số (phút). Âm hoặc không phải số → null. */
export function parseMinutes(value) {
  const raw = text(value).toLowerCase().replace(',', '.').replace(/\s*(phút|phut|p|min|minutes?)$/u, '')
  if (!/^\d+(\.\d+)?$/.test(raw)) return null
  const number = Number(raw)
  return number >= 0 && number <= 24 * 60 ? number : null
}

/** "6", "6.5", "6,5", "6h30", "6 giờ 30" → số giờ (0–24) hoặc null. */
export function parseHours(value) {
  const raw = text(value).toLowerCase().replace(/\s+/g, ' ')
  const hm = raw.match(/^(\d{1,2})\s*(?:h|g|giờ)\s*(\d{1,2})?$/u)
  if (hm) { const hours = Number(hm[1]) + (hm[2] ? Number(hm[2]) / 60 : 0); return hours <= 24 && (!hm[2] || Number(hm[2]) < 60) ? hours : null }
  const plain = raw.replace(',', '.').replace(/\s*(giờ|h|hours?)$/u, '')
  if (!/^\d+(\.\d+)?$/.test(plain)) return null
  const number = Number(plain)
  return number >= 0 && number <= 24 ? number : null
}

const frequency = value => {      // 0–3 (đã lưu thành giá trị của lựa chọn); rỗng KHÔNG được coi là 0
  if (text(value) === '') return null
  const number = Number(text(value))
  return Number.isInteger(number) && number >= 0 && number <= 3 ? number : null
}

/* ----------------------------------------------------------------------- PSQI */
const PSQI_FREQ_ITEMS = ['5a', '5b', '5c', '5d', '5e', '5f', '5g', '5h', '5i', '5j']
export const PSQI_KEYS = {
  required: ['psqi_bedtime', 'psqi_latency_min', 'psqi_waketime', 'psqi_sleep_hours',
    ...PSQI_FREQ_ITEMS.slice(0, 9).map(item => `psqi_${item}`), 'psqi_quality', 'psqi_medication', 'psqi_daytime_alert', 'psqi_enthusiasm'],
  optional: ['psqi_5j']      // "nguyên nhân khác": để trống được, tính là 0 (đúng hướng dẫn gốc)
}

/** Trả { status, score, min, max, components } theo Buysse 1989. `get(key)` đọc giá trị thô của mục. */
export function computePsqi(get) {
  const incomplete = reason => ({ status: 'incomplete', score: null, min: 0, max: 21, itemCount: PSQI_KEYS.required.length, reason })
  const bed = parseClock(get('psqi_bedtime')), wake = parseClock(get('psqi_waketime'))
  const latency = parseMinutes(get('psqi_latency_min')), slept = parseHours(get('psqi_sleep_hours'))
  if (bed === null || wake === null) return incomplete('Giờ đi ngủ hoặc giờ thức dậy thiếu/không đọc được (ví dụ 23:30)')
  if (latency === null) return incomplete('Thời gian vào giấc ngủ (phút) thiếu hoặc không đọc được')
  if (slept === null) return incomplete('Số giờ ngủ thiếu hoặc không đọc được')
  const freq = {}
  for (const item of PSQI_FREQ_ITEMS.slice(0, 9)) {
    freq[item] = frequency(get(`psqi_${item}`))
    if (freq[item] === null) return incomplete('Thiếu câu trả lời cho một câu về tần suất khó khăn khi ngủ')
  }
  freq['5j'] = get('psqi_5j') === undefined || text(get('psqi_5j')) === '' ? 0 : frequency(get('psqi_5j'))
  if (freq['5j'] === null) return incomplete('Câu trả lời tần suất của nguyên nhân khác không hợp lệ')
  const quality = frequency(get('psqi_quality')), medication = frequency(get('psqi_medication'))
  const alert = frequency(get('psqi_daytime_alert')), enthusiasm = frequency(get('psqi_enthusiasm'))
  if ([quality, medication, alert, enthusiasm].some(value => value === null)) return incomplete('Thiếu câu trả lời cho chất lượng giấc ngủ, thuốc ngủ hoặc ban ngày')

  // Thời gian nằm trên giường (qua nửa đêm). Bằng 0 hoặc chênh lệch bất hợp lý → không tính được hiệu suất.
  const inBedHours = (((wake - bed) % 1440) + 1440) % 1440 / 60
  if (inBedHours === 0) return incomplete('Giờ đi ngủ và giờ thức dậy trùng nhau nên không tính được thời gian nằm trên giường')

  const c1 = quality
  const latencyScore = latency <= 15 ? 0 : latency <= 30 ? 1 : latency <= 60 ? 2 : 3
  const c2 = [0, 1, 1, 2, 2, 3, 3][latencyScore + freq['5a']]
  const c3 = slept > 7 ? 0 : slept >= 6 ? 1 : slept >= 5 ? 2 : 3
  const efficiency = Math.min(100, slept / inBedHours * 100)
  const c4 = efficiency >= 85 ? 0 : efficiency >= 75 ? 1 : efficiency >= 65 ? 2 : 3
  const disturbances = PSQI_FREQ_ITEMS.slice(1).reduce((sum, item) => sum + freq[item], 0)
  const c5 = disturbances === 0 ? 0 : disturbances <= 9 ? 1 : disturbances <= 18 ? 2 : 3
  const c6 = medication
  const c7 = [0, 1, 1, 2, 2, 3, 3][alert + enthusiasm]
  const components = { c1, c2, c3, c4, c5, c6, c7 }
  const score = Object.values(components).reduce((sum, value) => sum + value, 0)
  return { status: 'scored', score, min: 0, max: 21, itemCount: PSQI_KEYS.required.length, reason: null, components, efficiency: Math.round(efficiency * 10) / 10 }
}

/* --------------------------------------------------------------------- HCL-32 */
export const HCL32_KEYS = { required: Array.from({ length: 32 }, (_, index) => `hcl_${index + 1}`), optional: [] }

/** Tổng số câu ĐÚNG (0–32). Cần đủ 32 mục trả lời đúng/sai. */
export function computeHcl32(get) {
  let total = 0
  for (const key of HCL32_KEYS.required) {
    const value = text(get(key)).toLowerCase()
    if (value !== 'true' && value !== 'false') {
      return { status: 'incomplete', score: null, min: 0, max: 32, itemCount: 32, reason: 'Cần trả lời đủ cả 32 nhận định (Đúng/Sai)' }
    }
    if (value === 'true') total++
  }
  return { status: 'scored', score: total, min: 0, max: 32, itemCount: 32, reason: null }
}

/* -------------------------------------------------------------------- danh mục */
export const INSTRUMENTS = {
  psqi: {
    id: 'psqi', name: 'Pittsburgh Sleep Quality Index (PSQI)', keys: PSQI_KEYS, range: [0, 21], compute: computePsqi,
    meaning: 'Điểm tổng 0–21; điểm càng cao thì chất lượng giấc ngủ càng kém.',
    publishedBands: PSQI_PUBLISHED                    // backend/config/psqi-bands.json
  },
  hcl32: {
    id: 'hcl32', name: 'Hypomania Checklist (HCL-32)', keys: HCL32_KEYS, range: [0, 32], compute: computeHcl32,
    meaning: 'Số nhận định được chọn ĐÚNG (0–32); điểm càng cao thì càng nhiều biểu hiện hưng phấn nhẹ.',
    publishedBands: { direction: 'higher_worse', cutoffs: [14, 21], labels: ['0–13 điểm', '14–20 điểm', '21–32 điểm'], note: '0–13: dưới ngưỡng sàng lọc dương tính; 14–20: dương tính sàng lọc (mức vừa); 21–32: dương tính sàng lọc (mức cao). Ngưỡng 14 do Angst và cộng sự (2005) đề xuất cho bản gốc; mốc 21 theo quyết định của chủ dự án (points-in-hcl-32.md). Bản tiếng Việt đã chỉnh lời một số mục nên cần được kiểm chứng trước khi dùng. Chỉ sàng lọc, không chẩn đoán.' }
  }
}

export const instrumentIds = Object.keys(INSTRUMENTS)

/** Nhận diện thang đo chuẩn từ `settings.key` của các câu hỏi (cần đủ mọi khóa bắt buộc). */
export function detectInstruments(questions) {
  const keys = new Set(questions.map(question => question.settings?.key).filter(Boolean))
  return instrumentIds.filter(id => INSTRUMENTS[id].keys.required.every(key => keys.has(key)))
}

/**
 * Ánh xạ key → question_id cho một thang đo; null nếu thiếu khóa bắt buộc.
 * Câu hỏi chọn một lưu NHÃN của lựa chọn (không phải giá trị), nên mỗi mục mang theo `choices` (nhãn → giá trị)
 * chụp tại thời điểm cấu hình. Đổi tên lựa chọn sau đó mà không lưu lại cấu hình sẽ khiến lần nộp đó KHÔNG được chấm
 * (an toàn, không chấm sai) thay vì cho điểm sai.
 */
export function mapInstrumentItems(instrumentId, questions) {
  const instrument = INSTRUMENTS[instrumentId]
  if (!instrument) return null
  const byKey = new Map(questions.filter(question => question.settings?.key).map(question => [question.settings.key, question.id]))
  if (!instrument.keys.required.every(key => byKey.has(key))) return null
  const optionsOf = new Map(questions.filter(question => question.settings?.key).map(question => [question.settings.key, question.options || []]))
  return [...instrument.keys.required, ...instrument.keys.optional].filter(key => byKey.has(key)).map(key => {
    const options = optionsOf.get(key)
    return options?.length ? { question_id: byKey.get(key), key, choices: Object.fromEntries(options.map(option => [option.label, option.value])) } : { question_id: byKey.get(key), key }
  })
}
