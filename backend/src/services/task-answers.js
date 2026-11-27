/* Câu trả lời nhiệm vụ Y-01 và Y-02 cho nhà nghiên cứu (chỉ đọc). Không đọc tên đăng nhập hay thông tin cá nhân:
   người tham gia được thay bằng mã giả danh tính từ khóa bí mật, riêng cho từng khảo sát và không lưu ở đâu. */
import { createHmac } from 'node:crypto'
import { ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { currentGroup, localParts, DEFAULT_SETTINGS } from './reward.js'

export const ANSWER_TASKS = Object.freeze({
  'Y-01': { name: "Power Nap 20'", question: 'Sau khi nghỉ, bạn thấy thế nào? (không bắt buộc)', answers: ['Tỉnh táo hơn rồi ✨', 'Chưa thấy khác lắm 🌙'] },
  'Y-02': { name: 'Caffeine Curfew', question: 'Tối qua bạn mất khoảng bao lâu để chìm vào giấc ngủ?', answers: ['Dưới 15 phút', '15–30 phút', '30–60 phút', 'Hơn 60 phút'] }
})
export const ANSWER_HEADERS = ['Mã người tham gia', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Câu hỏi', 'Câu trả lời', 'Ngày (giờ VN)', 'Giờ (giờ VN)', 'Thời điểm trả lời (ISO)']
const MISSING = ['42P01', 'PGRST205', 'PGRST204']
const PAGE = 1000
export const MAX_ROWS = 20000

const read = result => {
  if (MISSING.includes(result?.error?.code)) throw new HttpError(503, 'Chạy backend/migrations/009_reward_system.sql để xem câu trả lời nhiệm vụ')
  return ok(result)
}
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value)

export function parseFilter(query = {}) {
  const task = query.task ? String(query.task) : ''
  if (task && !ANSWER_TASKS[task]) throw new HttpError(400, 'Chỉ có dữ liệu của nhiệm vụ Y-01 và Y-02')
  const from = query.from ? String(query.from) : '', to = query.to ? String(query.to) : ''
  for (const value of [from, to]) if (value && !isDate(value)) throw new HttpError(400, 'Ngày lọc không hợp lệ')
  if (from && to && from > to) throw new HttpError(400, 'Ngày bắt đầu phải trước ngày kết thúc')
  return { task, from, to }
}

export function createTaskAnswerService(db, { secret = () => process.env.TRACKING_TOKEN_SECRET || process.env.JWT_SECRET } = {}) {
  const pseudonym = (surveyId, profileId) => `P-${createHmac('sha256', secret()).update(`task-answers:${surveyId}:${profileId}`).digest('hex').slice(0, 10)}`

  async function paged(build) {
    const rows = []
    for (let offset = 0; ; offset += PAGE) {
      const page = read(await build().range(offset, offset + PAGE - 1))
      rows.push(...page)
      if (page.length < PAGE) return rows
      if (rows.length >= MAX_ROWS * 5) throw new HttpError(413, 'Dữ liệu quá lớn, hãy lọc theo khoảng ngày')
    }
  }

  /** Bản ghi cũ không kèm mã khảo sát: dựng lại khảo sát quyết định nhóm tại đúng thời điểm hoàn thành. */
  async function legacySurveys(rows, cycleDays) {
    const profiles = [...new Set(rows.map(row => row.profile_id))]
    const sessions = []
    for (let i = 0; i < profiles.length; i += 200) {
      const slice = profiles.slice(i, i + 200)
      sessions.push(...await paged(() => db.from('tracking_sessions').select('profile_id,survey_id,band,band_thresholds,completed_at').in('profile_id', slice).order('completed_at', { ascending: true })))
    }
    return row => currentGroup(sessions.filter(item => item.profile_id === row.profile_id && item.band !== null && new Date(item.completed_at) <= new Date(row.completed_at)), cycleDays)?.session.survey_id
  }

  async function list(surveyId, filter = {}) {
    const { task, from, to } = parseFilter(filter)
    const settings = read(await db.from('reward_settings').select('cycle_days,timezone').eq('id', 'global').maybeSingle())
    const timezone = settings?.timezone || DEFAULT_SETTINGS.timezone
    const completions = await paged(() => {
      let query = db.from('reward_completions').select('id,profile_id,task_code,local_date,meta,completed_at').in('task_code', task ? [task] : Object.keys(ANSWER_TASKS))
      if (from) query = query.gte('local_date', from)
      if (to) query = query.lte('local_date', to)
      return query.order('completed_at', { ascending: true }).order('id', { ascending: true })
    })
    const unmarked = completions.filter(row => !row.meta?.survey)
    const lookup = unmarked.length ? await legacySurveys(unmarked, settings?.cycle_days || DEFAULT_SETTINGS.cycle_days) : () => undefined
    const mine = completions.filter(row => (row.meta?.survey || lookup(row)) === surveyId)
    if (mine.length > MAX_ROWS) throw new HttpError(413, `Có hơn ${MAX_ROWS} bản ghi, hãy lọc theo khoảng ngày`)
    return mine.map(row => {
      const minutes = localParts(new Date(row.completed_at), timezone).minutes
      return {
        participant: pseudonym(surveyId, row.profile_id), task: row.task_code, taskName: ANSWER_TASKS[row.task_code].name,
        question: ANSWER_TASKS[row.task_code].question, answer: row.meta?.choice ?? '', date: row.local_date,
        time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, answeredAt: new Date(row.completed_at).toISOString()
      }
    })
  }

  /** Số lượt theo từng câu trả lời (kể cả bỏ qua), cho phần tóm tắt trên giao diện. */
  function summarize(rows) {
    return Object.entries(ANSWER_TASKS).map(([code, info]) => {
      const own = rows.filter(row => row.task === code)
      const labels = [...new Set([...info.answers, ...own.map(row => row.answer).filter(Boolean)])]
      return {
        task: code, name: info.name, question: info.question, total: own.length, participants: new Set(own.map(row => row.participant)).size,
        answers: [...labels.map(label => ({ label, count: own.filter(row => row.answer === label).length })), { label: 'Không trả lời', count: own.filter(row => !row.answer).length }]
      }
    })
  }

  const toRecord = row => Object.fromEntries(ANSWER_HEADERS.map((header, i) => [header, [row.participant, row.task, row.taskName, row.question, row.answer, row.date, row.time, row.answeredAt][i]]))

  return { list, summarize, toRecord }
}
