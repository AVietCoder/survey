import bcrypt from 'bcrypt'
import { supabase, ok } from '../config/supabase.js'
import { HttpError, signToken, cookieOpts } from '../middleware/auth.js'

const pub = u => ({ id: u.id, username: u.username })

export async function register(req, res) {
  const username = String(req.body.username || '').trim(), password = String(req.body.password || '')
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new HttpError(400, 'Username gồm 3–30 ký tự: chữ, số hoặc gạch dưới')
  if (password.length < 8 || password.length > 72) throw new HttpError(400, 'Mật khẩu cần từ 8 đến 72 ký tự')
  const taken = ok(await supabase.from('users').select('id').ilike('username', username).maybeSingle())
  if (taken) throw new HttpError(409, 'Username đã tồn tại')
  const user = ok(await supabase.from('users').insert({ username, password_hash: await bcrypt.hash(password, 10) }).select('id, username').single())
  res.cookie('token', signToken(user), cookieOpts()).status(201).json({ user: pub(user) })
}

export async function login(req, res) {
  const username = String(req.body.username || '').trim(), password = String(req.body.password || '')
  const user = ok(await supabase.from('users').select('*').ilike('username', username).maybeSingle())
  const good = user && await bcrypt.compare(password, user.password_hash)
  if (!good) throw new HttpError(401, 'Sai username hoặc mật khẩu')
  res.cookie('token', signToken(user), cookieOpts()).json({ user: pub(user) })
}

export const logout = (_req, res) => res.clearCookie('token', cookieOpts()).json({ ok: true })

export async function me(req, res) {
  const user = ok(await supabase.from('users').select('id, username').eq('id', req.user.id).maybeSingle())
  if (!user) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ')
  res.json({ user })
}
