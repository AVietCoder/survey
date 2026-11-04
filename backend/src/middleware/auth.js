import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const cookieOpts = () => ({
  httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000
})
export const signToken = u => jwt.sign({ id: u.id, username: u.username }, process.env.JWT_SECRET, { expiresIn: '7d' })

export function requireAuth(req, _res, next) {
  try {
    const p = jwt.verify(req.cookies?.token || '', process.env.JWT_SECRET)
    req.user = { id: p.id, username: p.username }
    next()
  } catch { next(new HttpError(401, 'Chưa đăng nhập')) }
}
export function requireAdmin(req, res, next) {
  supabase.from('users').select('is_admin').eq('id', req.user.id).maybeSingle()
    .then(({ data, error }) => {
      if (error) return next(error)
      if (!data) return next(new HttpError(401, 'Phiên đăng nhập không hợp lệ'))
      if (!data.is_admin) return res.status(403).json({ error: 'Bạn không có quyền truy cập khu vực quản trị' })
      next()
    })
    .catch(next)
}
export function errorHandler(err, _req, res, _next) {
  if (err.code === '23505') return res.status(409).json({ error: 'Dữ liệu đã tồn tại' })
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 500 ? 'Lỗi máy chủ' : err.message })
}
