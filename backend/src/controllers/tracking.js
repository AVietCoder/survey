import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { getSurveyAccess, UUID } from '../services/research-projects.js'
import { loadQuestions } from '../services/surveys.js'
import { createTrackingService } from '../services/tracking.js'
import { psqiStudyStatus } from '../services/psqi-bands.js'
import { createTrackingAccountService } from '../services/tracking-accounts.js'
import { COOKIE_NAME, TTL, deviceLabel } from '../services/tracking-credentials.js'

export let tracking = createTrackingService(supabase)
// mintCredential đi qua `tracking` hiện hành để test thay service vẫn dùng chung DB giả
const makeAccounts = db => createTrackingAccountService(db, { mintCredential: (...args) => tracking.mintCredential(...args) })
export let accounts = makeAccounts(supabase)
/** Chỉ dùng trong test: thay service bằng bản chạy trên DB giả. */
export function useTrackingService(service, db) { tracking = service; if (db) accounts = makeAccounts(db) }

const cookieOptions = () => ({
  httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL.cookie
})
const setTrackingCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions())
const clearTrackingCookie = res => {
  const { maxAge, ...options } = cookieOptions()      // clearCookie không nhận maxAge
  res.clearCookie(COOKIE_NAME, options)
}
const label = req => deviceLabel(req.get('user-agent'))
// Dữ liệu cá nhân của người tham gia không được cache ở trình duyệt/proxy
const noStore = res => res.set('Cache-Control', 'no-store')

/* ====================================================== người tham gia (cookie) */
/** Yêu cầu hồ sơ theo dõi hợp lệ. Cookie sai/hết hạn bị xóa để không gửi đi lại. */
export async function requireTracker(req, res, next) {
  try {
    const auth = await tracking.authenticate(req.cookies?.[COOKIE_NAME])
    if (!auth) {
      if (req.cookies?.[COOKIE_NAME]) clearTrackingCookie(res)
      throw new HttpError(401, 'Chưa có hồ sơ theo dõi trên trình duyệt này')
    }
    req.tracker = auth
    next()
  } catch (error) { next(error) }
}

export async function context(req, res) {
  noStore(res)
  res.json(await tracking.publicContext(req.params.slug, req.cookies?.[COOKIE_NAME]))
}

export async function enroll(req, res) {
  noStore(res)
  const result = await tracking.enroll({
    slug: req.body?.slug, responseId: req.body?.responseId, consent: req.body?.consent,
    cookieToken: req.cookies?.[COOKIE_NAME], label: label(req)
  })
  if (result.cookieToken) setTrackingCookie(res, result.cookieToken)
  res.status(result.isNew ? 201 : 200).json({
    isNew: result.isNew, session: result.session,
    recoveryCode: result.recoveryCode || null          // chỉ trả đúng một lần, khi tạo hồ sơ mới
  })
}

export async function recover(req, res) {
  noStore(res)
  const result = await tracking.recover(req.body?.credential, label(req))
  setTrackingCookie(res, result.cookieToken)
  res.json({ ok: true })
}

/**
 * Cổng vào game: chỉ hồ sơ có TÀI KHOẢN HỌC SINH mới được dùng nhiệm vụ/điểm/làng nhỏ.
 * Người chỉ có mã định danh/cookie vẫn làm khảo sát và xem tiến triển, nhưng không vào được game.
 * Đặt SAU requireTracker; không dùng cho /me, /assessments, /credentials, /account*, /signout, /profile.
 */
export async function requireStudentAccount(req, res, next) {
  try {
    const { available, account } = await accounts.getAccount(req.tracker.profileId)
    if (!available) throw new HttpError(503, 'Chạy backend/migrations/019_tracking_accounts.sql để bật tài khoản học sinh (cần để vào game)')
    if (!account) return res.status(403).json({ error: 'Game chỉ dành cho học sinh có tài khoản. Hãy tạo tên đăng nhập và mật khẩu để vào game; bạn vẫn xem được tiến triển như bình thường.', code: 'student_account_required' })
    next()
  } catch (error) { next(error) }
}

/* ---------- tài khoản học sinh (migration 019) ---------- */
export async function accountLogin(req, res) {
  noStore(res)
  const result = await accounts.login({ username: req.body?.username, password: req.body?.password }, label(req))
  setTrackingCookie(res, result.cookieToken)
  res.json({ ok: true })
}
export async function getAccount(req, res) {
  noStore(res)
  res.json(await accounts.getAccount(req.tracker.profileId))
}
export async function createAccount(req, res) {
  noStore(res)
  res.status(201).json({ account: await accounts.createAccount(req.tracker.profileId, { username: req.body?.username, password: req.body?.password }) })
}
export async function changeAccountPassword(req, res) {
  noStore(res)
  await accounts.changePassword(req.tracker.profileId, { currentPassword: req.body?.currentPassword, newPassword: req.body?.newPassword })
  res.json({ ok: true })
}

export async function me(req, res) {
  noStore(res)
  res.json(await tracking.overview(req.tracker.profileId))
}

export async function assessment(req, res) {
  noStore(res)
  res.json({ assessment: await tracking.assessmentDetail(req.tracker.profileId, String(req.params.ref || '')) })
}

export async function credentials(req, res) {
  noStore(res)
  res.json({ credentials: await tracking.listCredentials(req.tracker.profileId, req.tracker.credentialId) })
}

export async function newRecoveryCode(req, res) {
  noStore(res)
  const { token } = await tracking.replaceRecoveryCode(req.tracker.profileId)
  res.status(201).json({ recoveryCode: token })
}

export async function newRecoveryLink(req, res) {
  noStore(res)
  const { token, credential } = await tracking.createRecoveryLink(req.tracker.profileId)
  res.status(201).json({ token, expiresAt: credential.expires_at })      // frontend ghép thành liên kết với origin hiện tại
}

export async function revokeCredential(req, res) {
  await tracking.revokeCredential(req.tracker.profileId, req.params.credentialId)
  if (req.params.credentialId === req.tracker.credentialId) clearTrackingCookie(res)
  res.json({ ok: true })
}

export async function signOut(req, res) {
  await tracking.revokeCredential(req.tracker.profileId, req.tracker.credentialId)
  clearTrackingCookie(res)
  res.json({ ok: true })
}

export async function deleteProfile(req, res) {
  await tracking.deleteProfile(req.tracker.profileId)
  clearTrackingCookie(res)
  res.json({ ok: true })
}

/* ==================================================== researcher / owner / admin */
/** Owner, Researcher, Reviewer theo quyền khảo sát hiện có; Admin chỉ được đọc. */
export async function resolveSurveyAccess(surveyId, user, { getAccess = getSurveyAccess, db = supabase } = {}) {
  try {
    const access = await getAccess(surveyId, user.id)
    return { survey: access.survey, role: access.role }
  } catch (error) {
    if (error.status !== 404 || !UUID.test(surveyId || '')) throw error
    const account = ok(await db.from('users').select('is_admin').eq('id', user.id).maybeSingle())
    if (!account?.is_admin) throw error
    const survey = ok(await db.from('surveys').select('*').eq('id', surveyId).maybeSingle())
    if (!survey) throw error
    return { survey, role: 'admin' }
  }
}
/** Chỉ chủ sở hữu khảo sát được đổi cấu hình theo dõi (ảnh hưởng trực tiếp tới người tham gia). */
export const canEditConfig = role => role === 'owner'
const surveyAccess = (surveyId, user) => resolveSurveyAccess(surveyId, user)

export async function getConfig(req, res) {
  const { survey, role } = await surveyAccess(req.params.surveyId, req.user)
  const questions = await loadQuestions(survey.id)
  const config = await tracking.getConfig(survey.id)
  res.json({
    survey: { id: survey.id, title: survey.title, status: survey.status },
    role, canEdit: canEditConfig(role), config: tracking.serializeConfig(config, questions), psqiThresholds: psqiStudyStatus(),
    scorableQuestions: tracking.scorableQuestions(questions)
  })
}

export async function putConfig(req, res) {
  const { survey, role } = await surveyAccess(req.params.surveyId, req.user)
  if (!canEditConfig(role)) throw new HttpError(403, 'Chỉ chủ sở hữu khảo sát mới được thay đổi cấu hình theo dõi')
  const questions = await loadQuestions(survey.id)
  const saved = await tracking.saveConfig({ survey, userId: req.user.id, body: req.body || {}, questions })
  res.json({ config: tracking.serializeConfig(saved, questions) })
}

export async function getSummary(req, res) {
  const { survey } = await surveyAccess(req.params.surveyId, req.user)
  const config = await tracking.getConfig(survey.id)
  if (!config) return res.json({ summary: null })
  res.json({ summary: await tracking.researcherSummary(survey, config) })
}
