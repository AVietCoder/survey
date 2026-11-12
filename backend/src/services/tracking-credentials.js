import { createHmac, randomBytes, randomInt } from 'node:crypto'
import { HttpError } from '../middleware/auth.js'

/**
 * Credential theo dõi: token ngẫu nhiên mạnh, chỉ lưu HMAC-SHA-256 (không lưu token gốc),
 * có hạn dùng và có thể thu hồi. Không dùng participant code của Research Management.
 */
export const COOKIE_NAME = 'bs_track'
const DAY = 24 * 60 * 60 * 1000
export const TTL = {
  cookie: 365 * DAY,
  recovery_code: 730 * DAY,
  recovery_link: 30 * DAY   // dùng một lần
}
export const KINDS = Object.keys(TTL)

// Bảng chữ cái không gồm ký tự dễ nhầm (0/O, 1/I/L) để mã khôi phục dễ chép tay
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_GROUPS = 4, GROUP_LENGTH = 4   // 16 ký tự × log2(31) ≈ 79 bit

export const newToken = () => randomBytes(32).toString('base64url')   // 256 bit

export function newRecoveryCode() {
  const groups = []
  for (let g = 0; g < CODE_GROUPS; g++) {
    let part = ''
    for (let i = 0; i < GROUP_LENGTH; i++) part += ALPHABET[randomInt(ALPHABET.length)]
    groups.push(part)
  }
  return groups.join('-')
}

/** Chuẩn hóa mã người dùng nhập (bỏ khoảng trắng, đổi hoa, thêm dấu gạch nếu thiếu). Trả null nếu sai định dạng. */
export function normalizeRecoveryCode(input) {
  const raw = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (raw.length !== CODE_GROUPS * GROUP_LENGTH) return null
  if ([...raw].some(char => !ALPHABET.includes(char))) return null
  return raw.match(new RegExp(`.{${GROUP_LENGTH}}`, 'g')).join('-')
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

/** Nhận diện đầu vào là mã khôi phục, token liên kết (có thể dán cả URL) hay không hợp lệ. */
export function parseCredentialInput(input) {
  const text = String(input || '').trim()
  if (!text || text.length > 400) return null
  const fromLink = text.match(/#\/track\/recover\/([A-Za-z0-9_-]{43})(?:[/?#]|$)/)
  if (fromLink) return { kind: 'recovery_link', value: fromLink[1] }
  if (TOKEN_PATTERN.test(text)) return { kind: 'recovery_link', value: text }
  const code = normalizeRecoveryCode(text)
  return code ? { kind: 'recovery_code', value: code } : null
}

export function tokenSecret() {
  const secret = process.env.TRACKING_TOKEN_SECRET || process.env.JWT_SECRET
  if (!secret) throw new HttpError(503, 'Cấu hình TRACKING_TOKEN_SECRET (hoặc JWT_SECRET) trước khi dùng tính năng theo dõi')
  return secret
}

export const hashToken = (token, secret = tokenSecret()) =>
  createHmac('sha256', secret).update(`brainst0rm:tracking-credential-v1:${token}`).digest('hex')

export const expiryFor = (kind, now = new Date()) => new Date(now.getTime() + TTL[kind]).toISOString()

/** Credential còn dùng được? (chưa thu hồi, chưa hết hạn, liên kết dùng một lần chưa dùng) */
export function isUsable(credential, now = new Date()) {
  if (!credential || credential.revoked_at) return false
  if (new Date(credential.expires_at).getTime() <= new Date(now).getTime()) return false
  if (credential.kind === 'recovery_link' && credential.used_at) return false
  return true
}

/** Nhãn thiết bị thô (trình duyệt · hệ điều hành) để người dùng nhận ra thiết bị khi thu hồi — không lưu UA đầy đủ. */
export function deviceLabel(userAgent) {
  const ua = String(userAgent || '')
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'thiết bị khác'
  return `${browser} · ${os}`
}
