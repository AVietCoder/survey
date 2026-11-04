import jwt from 'jsonwebtoken'

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
export function errorHandler(err, _req, res, _next) {
  if (err.code === '23505') return res.status(409).json({ error: 'Dữ liệu đã tồn tại' })
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 500 ? 'Lỗi máy chủ' : err.message })
}
