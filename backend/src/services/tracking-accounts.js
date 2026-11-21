import bcrypt from 'bcrypt'
import { ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

/**
 * Tài khoản học sinh: tên đăng nhập + mật khẩu gắn với một hồ sơ theo dõi ẩn danh (migration 019).
 * Không có email/số điện thoại. Tài khoản chỉ tạo được khi đã có hồ sơ (sau khảo sát + đồng ý),
 * nên không tạo hồ sơ trước khi người tham gia đồng ý.
 */
const MISSING = ['42P01', 'PGRST205', 'PGRST204']
const USERNAME = /^[a-z0-9_]{3,30}$/
// So sánh với một hash giả khi không có tài khoản để thời gian phản hồi không lộ tên nào tồn tại
let dummyHash = null
const getDummyHash = rounds => (dummyHash ||= bcrypt.hashSync('brainst0rm-no-account', rounds))

function accountResult(result) {
  if (MISSING.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/019_tracking_accounts.sql để bật tài khoản học sinh')
  if (result?.error?.code === '23505') throw new HttpError(409, 'Tên đăng nhập đã có người dùng hoặc hồ sơ này đã có tài khoản')
  return ok(result)
}

export const normalizeUsername = value => String(value ?? '').trim().toLowerCase()

function validate(username, password) {
  if (!USERNAME.test(username)) throw new HttpError(400, 'Tên đăng nhập gồm 3–30 ký tự: chữ thường không dấu, số hoặc gạch dưới')
  checkPassword(password)
}
function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) throw new HttpError(400, 'Mật khẩu cần từ 8 đến 72 ký tự')
}

export function createTrackingAccountService(db, { clock = () => new Date(), mintCredential, rounds = 10 } = {}) {
  const q = accountResult

  async function getAccount(profileId) {
    const result = await db.from('tracking_accounts').select('username,created_at,last_login_at').eq('profile_id', profileId).maybeSingle()
    if (MISSING.includes(result.error?.code)) return { available: false, account: null }
    const row = q(result)
    return { available: true, account: row ? { username: row.username, createdAt: row.created_at, lastLoginAt: row.last_login_at } : null }
  }

  async function createAccount(profileId, { username, password } = {}) {
    const name = normalizeUsername(username)
    validate(name, password)
    const existing = q(await db.from('tracking_accounts').select('id').eq('profile_id', profileId).maybeSingle())
    if (existing) throw new HttpError(409, 'Hồ sơ này đã có tài khoản')
    const taken = q(await db.from('tracking_accounts').select('id').eq('username', name).maybeSingle())
    if (taken) throw new HttpError(409, 'Tên đăng nhập đã có người dùng')
    const row = q(await db.from('tracking_accounts').insert({
      profile_id: profileId, username: name, password_hash: await bcrypt.hash(password, rounds), last_login_at: null
    }).select('username,created_at').single())
    return { username: row.username, createdAt: row.created_at }
  }

  async function login({ username, password } = {}, label = '') {
    const name = normalizeUsername(username)
    const fail = () => new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu')
    if (!name || typeof password !== 'string' || !password) throw fail()
    const row = USERNAME.test(name) ? q(await db.from('tracking_accounts').select('id,profile_id,password_hash').eq('username', name).maybeSingle()) : null
    const good = await bcrypt.compare(password.slice(0, 72), row?.password_hash || getDummyHash(rounds))
    if (!row || !good) throw fail()
    const stamp = clock().toISOString()
    const { token } = await mintCredential(row.profile_id, 'cookie', label)
    q(await db.from('tracking_accounts').update({ last_login_at: stamp }).eq('id', row.id))
    await db.from('tracking_profiles').update({ last_seen_at: stamp }).eq('id', row.profile_id)
    return { profileId: row.profile_id, cookieToken: token }
  }

  async function changePassword(profileId, { currentPassword, newPassword } = {}) {
    checkPassword(newPassword)
    const row = q(await db.from('tracking_accounts').select('id,password_hash').eq('profile_id', profileId).maybeSingle())
    if (!row) throw new HttpError(404, 'Hồ sơ này chưa có tài khoản')
    if (typeof currentPassword !== 'string' || !await bcrypt.compare(currentPassword.slice(0, 72), row.password_hash))
      throw new HttpError(400, 'Mật khẩu hiện tại không đúng')
    q(await db.from('tracking_accounts').update({ password_hash: await bcrypt.hash(newPassword, rounds) }).eq('id', row.id))
  }

  return { getAccount, createAccount, login, changePassword }
}
