import { supabase } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { applyDateRange, getDateRange } from './date-range.js'
import { hashIp } from './quality.js'

const MISSING_TABLE = ['42P01', 'PGRST205', 'PGRST204']
const PAGE_SIZE = 50
const SECRET_KEY = /pass|token|secret|code|hash|cookie|key/i

export const ACTION_LABELS = {
  'auth.login': 'Đăng nhập',
  'auth.login_failed': 'Đăng nhập thất bại',
  'auth.logout': 'Đăng xuất',
  'auth.register': 'Đăng ký tài khoản',
  'user.create': 'Tạo tài khoản',
  'user.update': 'Sửa tài khoản',
  'user.delete': 'Xóa tài khoản',
  'user.grant_admin': 'Cấp quyền admin',
  'user.revoke_admin': 'Thu hồi quyền admin',
  'survey.create': 'Tạo khảo sát',
  'survey.update': 'Sửa khảo sát',
  'survey.publish': 'Xuất bản khảo sát',
  'survey.delete': 'Xóa khảo sát',
  'response.review': 'Đánh giá phản hồi',
  'response.delete': 'Xóa phản hồi',
  'export.csv': 'Xuất CSV',
  'export.xlsx': 'Xuất XLSX'
}

/** Bỏ khóa nhạy cảm, cắt chuỗi dài, giới hạn độ sâu để metadata luôn nhỏ và an toàn. */
export function cleanMetadata(input, depth = 0) {
  if (input === null || input === undefined) return input ?? null
  if (typeof input === 'string') return input.slice(0, 200)
  if (typeof input === 'number' || typeof input === 'boolean') return input
  if (depth >= 2) return null
  if (Array.isArray(input)) return input.slice(0, 20).map(item => cleanMetadata(item, depth + 1))
  if (typeof input === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(input).slice(0, 20)) {
      if (!SECRET_KEY.test(key)) out[key] = cleanMetadata(value, depth + 1)
    }
    return out
  }
  return null
}

/**
 * Ghi một dòng nhật ký. KHÔNG BAO GIỜ ném lỗi: lỗi ghi log không được làm hỏng thao tác chính.
 * `actor` mặc định lấy từ req.user; truyền tay khi chưa có phiên (đăng nhập).
 */
export async function logActivity(req, action, target = {}, metadata = {}, actor = req?.user) {
  try {
    const row = {
      actor_id: actor?.id ?? null,
      actor_name: actor?.username ? String(actor.username).slice(0, 60) : null,
      action,
      target_type: target.type ?? null,
      target_id: target.id ? String(target.id).slice(0, 80) : null,
      target_label: target.label ? String(target.label).slice(0, 200) : null,
      metadata: cleanMetadata(metadata) ?? {},
      ip_hash: req?.ip ? hashIp(req.ip) : null
    }
    const { error } = await supabase.from('activity_logs').insert(row)
    if (error && !MISSING_TABLE.includes(error.code)) console.warn('activity log failed:', error.message)
  } catch (error) {
    console.warn('activity log failed:', error?.message || error)
  }
}

export async function listActivity(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const range = getDateRange(query)
  const actor = String(query.actor || '').trim()
  const action = String(query.action || '').trim()
  if (action && !/^[a-z_]+(\.[a-z_]+)?$/.test(action)) throw new HttpError(400, 'Hành động không hợp lệ')
  if (actor && !/^[A-Za-z0-9_]{1,30}$/.test(actor)) throw new HttpError(400, 'Tên người thực hiện không hợp lệ')
  let request = supabase.from('activity_logs')
    .select('id,actor_id,actor_name,action,target_type,target_id,target_label,metadata,created_at', { count: 'exact' })
  request = applyDateRange(request, range, 'created_at')
  if (actor) request = request.ilike('actor_name', `${actor}%`)
  if (action) request = action.includes('.') ? request.eq('action', action) : request.ilike('action', `${action}.%`)
  const result = await request.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (MISSING_TABLE.includes(result.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/007_activity_logs.sql để kích hoạt nhật ký hoạt động')
  if (result.error) throw result.error
  return { logs: result.data, total: result.count, page, pageSize: PAGE_SIZE, labels: ACTION_LABELS }
}
