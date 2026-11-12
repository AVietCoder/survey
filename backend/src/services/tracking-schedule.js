import { HttpError } from '../middleware/auth.js'

/**
 * Lịch theo dõi — được tính từ cấu hình của researcher và lần đo gần nhất, không hardcode ở frontend.
 * Không khóa khảo sát: người tham gia có thể làm sớm hoặc muộn; trạng thái chỉ mang tính thông tin.
 */
const DAY = 24 * 60 * 60 * 1000

export const DEFAULT_SCHEDULE = { intervalDays: null, upcomingDays: 3, graceDays: 7, maxSessions: null }

const intOrNull = (value, name, min, max, fallback) => {
  if (value === undefined || value === '') return fallback
  if (value === null) return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) throw new HttpError(400, `${name} phải là số nguyên từ ${min} đến ${max}`)
  return number
}

export function normalizeSchedule(input = {}) {
  const intervalDays = intOrNull(input.intervalDays, 'Khoảng cách giữa các lần đo', 1, 365, null)
  return {
    intervalDays,
    upcomingDays: intOrNull(input.upcomingDays, 'Số ngày nhắc trước hạn', 0, 60, DEFAULT_SCHEDULE.upcomingDays) ?? 0,
    graceDays: intOrNull(input.graceDays, 'Số ngày chờ trước khi coi là quá hạn', 0, 90, DEFAULT_SCHEDULE.graceDays) ?? 0,
    maxSessions: intOrNull(input.maxSessions, 'Số lần đo tối đa', 1, 200, null)
  }
}

/**
 * @returns { status, nextDueAt, daysUntilDue }
 * status: unscheduled | completed | upcoming | due_soon | due | overdue
 */
export function scheduleStatus({ sessionCount, lastCompletedAt, schedule, now = new Date() }) {
  const config = { ...DEFAULT_SCHEDULE, ...(schedule || {}) }
  if (config.maxSessions && sessionCount >= config.maxSessions) return { status: 'completed', nextDueAt: null, daysUntilDue: null }
  if (!config.intervalDays || !lastCompletedAt) return { status: 'unscheduled', nextDueAt: null, daysUntilDue: null }
  const due = new Date(new Date(lastCompletedAt).getTime() + config.intervalDays * DAY)
  const msUntilDue = due.getTime() - new Date(now).getTime()
  const daysUntilDue = Math.ceil(msUntilDue / DAY)
  let status
  if (msUntilDue > config.upcomingDays * DAY) status = 'upcoming'
  else if (msUntilDue > 0) status = 'due_soon'
  else if (-msUntilDue <= config.graceDays * DAY) status = 'due'
  else status = 'overdue'
  return { status, nextDueAt: due.toISOString(), daysUntilDue }
}
