import { HttpError } from '../middleware/auth.js'

export function getDateRange(query = {}) {
  const { from, to } = query
  for (const date of [from, to]) {
    if (date === undefined) continue
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new HttpError(400, 'Khoảng ngày không hợp lệ')
    const parsed = new Date(`${date}T00:00:00.000Z`)
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
      throw new HttpError(400, 'Khoảng ngày không hợp lệ')
  }
  if (from && to && from > to) throw new HttpError(400, 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
  return {
    from: from || '',
    to: to || '',
    start: from ? `${from}T00:00:00.000Z` : null,
    end: to ? new Date(Date.parse(`${to}T00:00:00.000Z`) + 86400000).toISOString() : null
  }
}

export function applyDateRange(query, range, column = 'submitted_at') {
  if (range.start) query = query.gte(column, range.start)
  if (range.end) query = query.lt(column, range.end)
  return query
}
