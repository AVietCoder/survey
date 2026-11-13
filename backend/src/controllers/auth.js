import bcrypt from 'bcrypt'
import { supabase, ok } from '../config/supabase.js'
import { HttpError, signToken, cookieOpts } from '../middleware/auth.js'
import { logActivity } from '../services/activity.js'
import jwt from 'jsonwebtoken'

const pub = u => ({ id: u.id, username: u.username, is_admin: Boolean(u.is_admin) })

export async function register(req, res) {
  // Đăng ký công khai đã tắt: tài khoản do admin tạo. Đặt ALLOW_REGISTRATION=true để bật lại.
  if (process.env.ALLOW_REGISTRATION !== 'true') throw new HttpError(403, 'Đăng ký tài khoản đã bị tắt. Vui lòng liên hệ quản trị viên để được cấp tài khoản.')
  const username = String(req.body.username || '').trim(), password = String(req.body.password || '')
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new HttpError(400, 'Username gồm 3–30 ký tự: chữ, số hoặc gạch dưới')
  if (password.length < 8 || password.length > 72) throw new HttpError(400, 'Mật khẩu cần từ 8 đến 72 ký tự')
  const taken = ok(await supabase.from('users').select('id').ilike('username', username).maybeSingle())
  if (taken) throw new HttpError(409, 'Username đã tồn tại')
  const user = ok(await supabase.from('users').insert({ username, password_hash: await bcrypt.hash(password, 10) }).select('id, username, is_admin').single())
  await logActivity(req, 'auth.register', { type: 'user', id: user.id, label: user.username }, {}, user)
  res.cookie('token', signToken(user), cookieOpts()).status(201).json({ user: pub(user) })
}

export async function login(req, res) {
  const username = String(req.body.username || '').trim(), password = String(req.body.password || '')
  const user = ok(await supabase.from('users').select('*').ilike('username', username).maybeSingle())
  const good = user && await bcrypt.compare(password, user.password_hash)
  if (!good) {
    await logActivity(req, 'auth.login_failed', { type: 'user', label: username.slice(0, 60) }, {}, null)
    throw new HttpError(401, 'Sai username hoặc mật khẩu')
  }
  await logActivity(req, 'auth.login', { type: 'user', id: user.id, label: user.username }, {}, user)
  res.cookie('token', signToken(user), cookieOpts()).json({ user: pub(user) })
}

export async function logout(req, res) {
  try {
    const p = jwt.verify(req.cookies?.token || '', process.env.JWT_SECRET)
    await logActivity(req, 'auth.logout', { type: 'user', id: p.id, label: p.username }, {}, { id: p.id, username: p.username })
  } catch { /* chưa đăng nhập: không cần ghi */ }
  res.clearCookie('token', cookieOpts()).json({ ok: true })
}

export async function me(req, res) {
  const user = ok(await supabase.from('users').select('id, username, is_admin').eq('id', req.user.id).maybeSingle())
  if (!user) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ')
  res.json({ user })
}
