import bcrypt from 'bcrypt'
import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { listActivity, logActivity } from '../services/activity.js'
import { applyDateRange, getDateRange } from '../services/date-range.js'
import { loadQuestions, newSlug, saveQuestions, withQuestions } from '../services/surveys.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STATUSES = ['draft', 'published', 'archived']
const PAGE_SIZE = 50
const pageNumber = value => Math.max(1, Number.parseInt(value, 10) || 1)
const validId = id => {
  if (!UUID.test(id || '')) throw new HttpError(404, 'Không tìm thấy dữ liệu')
}
const cleanUsername = value => {
  const username = String(value || '').trim()
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new HttpError(400, 'Username gồm 3–30 ký tự: chữ, số hoặc gạch dưới')
  return username
}
const cleanPassword = value => {
  const password = String(value || '')
  if (password.length < 8 || password.length > 72) throw new HttpError(400, 'Mật khẩu cần từ 8 đến 72 ký tự')
  return password
}

export async function overview(_req, res) {
  const tables = ['users', 'surveys', 'responses']
  const [counts, userResult, surveyResult] = await Promise.all([
    Promise.all(tables.map(table => supabase.from(table).select('id', { count: 'exact', head: true }))),
    supabase.from('users').select('id,username,created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('surveys').select('id,user_id,title,updated_at').order('updated_at', { ascending: false }).limit(5)
  ])
  counts.forEach(({ error }) => { if (error) throw error })
  const recentUsers = ok(userResult)
  const recentSurveys = ok(surveyResult)
  const ownerIds = [...new Set(recentSurveys.map(survey => survey.user_id))]
  const owners = ownerIds.length
    ? ok(await supabase.from('users').select('id,username').in('id', ownerIds))
    : []
  const ownerNames = Object.fromEntries(owners.map(owner => [owner.id, owner.username]))
  res.json({
    users: counts[0].count,
    surveys: counts[1].count,
    responses: counts[2].count,
    recentUsers,
    recentSurveys: recentSurveys.map(survey => ({ ...survey, owner: ownerNames[survey.user_id] || 'Không rõ' }))
  })
}

export async function listUsers(req, res) {
  const page = pageNumber(req.query.page)
  const { data, count, error } = await supabase.from('users')
    .select('id,username,is_admin,created_at', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw error
  res.json({ users: data, page, pageSize: PAGE_SIZE, total: count })
}

export async function searchUsers(req, res) {
  const query = String(req.query.q || '').trim()
  if (query.length < 2 || !/^[A-Za-z0-9_]{2,30}$/.test(query)) return res.json({ users: [] })
  const users = ok(await supabase.from('users').select('id,username').ilike('username', `${query}%`)
    .order('username').limit(PAGE_SIZE))
  res.json({ users })
}

export async function createUser(req, res) {
  const username = cleanUsername(req.body.username)
  const password = cleanPassword(req.body.password)
  const taken = ok(await supabase.from('users').select('id').ilike('username', username).maybeSingle())
  if (taken) throw new HttpError(409, 'Username đã tồn tại')
  const user = ok(await supabase.from('users').insert({
    username, password_hash: await bcrypt.hash(password, 10)
  }).select('id,username,is_admin,created_at').single())
  await logActivity(req, 'user.create', { type: 'user', id: user.id, label: user.username })
  res.status(201).json({ user })
}

export async function updateUser(req, res) {
  validId(req.params.id)
  const patch = {}
  if (req.body.username !== undefined) patch.username = cleanUsername(req.body.username)
  if (req.body.password) patch.password_hash = await bcrypt.hash(cleanPassword(req.body.password), 10)
  let adminChange = null
  if (req.body.is_admin !== undefined) {
    if (typeof req.body.is_admin !== 'boolean') throw new HttpError(400, 'Quyền admin không hợp lệ')
    const target = ok(await supabase.from('users').select('id,is_admin').eq('id', req.params.id).maybeSingle())
    if (!target) throw new HttpError(404, 'Không tìm thấy tài khoản')
    if (Boolean(target.is_admin) !== req.body.is_admin) {
      if (!req.body.is_admin) {
        if (req.params.id === req.user.id) throw new HttpError(400, 'Không thể tự thu hồi quyền admin của chính mình')
        const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_admin', true)
        if (error) throw error
        if (count <= 1) throw new HttpError(400, 'Không thể thu hồi quyền của quản trị viên cuối cùng')
      }
      patch.is_admin = req.body.is_admin
      adminChange = req.body.is_admin ? 'user.grant_admin' : 'user.revoke_admin'
    }
  }
  if (!Object.keys(patch).length) {
    if (req.body.is_admin !== undefined) {
      const same = ok(await supabase.from('users').select('id,username,is_admin,created_at').eq('id', req.params.id).maybeSingle())
      return res.json({ user: same })
    }
    throw new HttpError(400, 'Không có thông tin cần cập nhật')
  }
  const user = ok(await supabase.from('users').update(patch).eq('id', req.params.id)
    .select('id,username,is_admin,created_at').maybeSingle())
  if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản')
  const target = { type: 'user', id: user.id, label: user.username }
  if (adminChange) await logActivity(req, adminChange, target)
  const fields = ['username', 'password_hash'].filter(key => key in patch).map(key => key === 'password_hash' ? 'password' : key)
  if (fields.length) await logActivity(req, 'user.update', target, { fields })
  res.json({ user })
}

export async function removeUser(req, res) {
  validId(req.params.id)
  if (req.params.id === req.user.id) throw new HttpError(400, 'Không thể xóa tài khoản đang đăng nhập')
  const target = ok(await supabase.from('users').select('id,is_admin').eq('id', req.params.id).maybeSingle())
  if (!target) throw new HttpError(404, 'Không tìm thấy tài khoản')
  if (target.is_admin) {
    const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_admin', true)
    if (error) throw error
    if (count <= 1) throw new HttpError(400, 'Không thể xóa quản trị viên cuối cùng')
  }
  const { count: ownedProjects, error: projectError } = await supabase.from('research_projects')
    .select('id', { count: 'exact', head: true }).eq('owner_id', req.params.id)
  if (projectError) throw projectError
  if (ownedProjects) throw new HttpError(409, 'Không thể xóa tài khoản đang sở hữu nghiên cứu; hãy chuyển giao hoặc lưu trữ nghiên cứu trước')
  const removed = ok(await supabase.from('users').select('username').eq('id', req.params.id).maybeSingle())
  ok(await supabase.from('users').delete().eq('id', req.params.id))
  await logActivity(req, 'user.delete', { type: 'user', id: req.params.id, label: removed?.username })
  res.json({ ok: true })
}

export async function listSurveys(req, res) {
  const page = pageNumber(req.query.page)
  const range = getDateRange(req.query)
  const status = String(req.query.status || '')
  const text = String(req.query.q || '').trim().replace(/[%,()*]/g, ' ').slice(0, 80)
  if (status && !STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ')
  let request = supabase.from('surveys')
    .select('id,user_id,title,description,status,public_slug,created_at,updated_at', { count: 'exact' })
  request = applyDateRange(request, range, 'updated_at')
  if (status) request = request.eq('status', status)
  if (text) request = request.ilike('title', `%${text}%`)
  const listed = await request.order('updated_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (listed.error) throw listed.error
  const surveys = listed.data
  const count = listed.count
  const ids = surveys.map(s => s.id)
  const userIds = [...new Set(surveys.map(s => s.user_id))]
  const users = userIds.length
    ? await supabase.from('users').select('id,username').in('id', userIds)
    : { data: [], error: null }
  if (users.error) throw users.error
  const responseCounts = await Promise.all(ids.map(async id => {
    const { count, error } = await supabase.from('responses').select('id', { count: 'exact', head: true })
      .eq('survey_id', id).not('submitted_at', 'is', null)
    if (error) throw error
    return [id, count]
  }))
  const names = Object.fromEntries(users.data.map(u => [u.id, u.username]))
  const counts = Object.fromEntries(responseCounts)
  res.json({ surveys: surveys.map(s => ({
    ...s, owner: names[s.user_id] || 'Không rõ',
    response_count: counts[s.id] || 0
  })), page, pageSize: PAGE_SIZE, total: count })
}

export async function getSurvey(req, res) {
  validId(req.params.id)
  const survey = ok(await supabase.from('surveys').select('*').eq('id', req.params.id).maybeSingle())
  if (!survey) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const user = ok(await supabase.from('users').select('username').eq('id', survey.user_id).maybeSingle())
  res.json({ survey: { ...(await withQuestions(survey)), owner: user?.username || 'Không rõ' } })
}

export async function createSurvey(req, res) {
  const userId = String(req.body.user_id || '')
  validId(userId)
  const owner = ok(await supabase.from('users').select('id').eq('id', userId).maybeSingle())
  if (!owner) throw new HttpError(404, 'Không tìm thấy tài khoản sở hữu')
  const survey = ok(await supabase.from('surveys').insert({
    user_id: userId,
    title: String(req.body.title || 'Khảo sát chưa đặt tên').trim().slice(0, 200) || 'Khảo sát chưa đặt tên',
    description: String(req.body.description || '').slice(0, 1000),
    public_slug: newSlug()
  }).select('*').single())
  if (Array.isArray(req.body.questions)) await saveQuestions(survey.id, req.body.questions)
  await logActivity(req, 'survey.create', { type: 'survey', id: survey.id, label: survey.title }, { by: 'admin', owner: userId })
  res.status(201).json({ survey: await withQuestions(survey) })
}

export async function updateSurvey(req, res) {
  validId(req.params.id)
  const current = ok(await supabase.from('surveys').select('*').eq('id', req.params.id).maybeSingle())
  if (!current) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const body = req.body, patch = {}
  if (body.title !== undefined) patch.title = String(body.title).trim().slice(0, 200) || 'Khảo sát chưa đặt tên'
  if (body.description !== undefined) patch.description = String(body.description).slice(0, 1000)
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw new HttpError(400, 'Trạng thái không hợp lệ')
    patch.status = body.status
  }
  if (body.user_id !== undefined) {
    validId(body.user_id)
    const owner = ok(await supabase.from('users').select('id').eq('id', body.user_id).maybeSingle())
    if (!owner) throw new HttpError(404, 'Không tìm thấy tài khoản sở hữu')
    patch.user_id = body.user_id
  }
  if ((body.status ?? current.status) === 'published') {
    const questionCount = Array.isArray(body.questions) ? body.questions.length : (await loadQuestions(current.id)).length
    if (!questionCount) throw new HttpError(400, 'Cần ít nhất 1 câu hỏi để xuất bản')
  }
  if (Array.isArray(body.questions)) await saveQuestions(current.id, body.questions)
  const survey = Object.keys(patch).length
    ? ok(await supabase.from('surveys').update(patch).eq('id', current.id).select('*').single())
    : current
  const user = ok(await supabase.from('users').select('username').eq('id', survey.user_id).maybeSingle())
  const fields = [...Object.keys(patch), ...(Array.isArray(body.questions) ? ['questions'] : [])]
  if (fields.length) await logActivity(req, patch.status === 'published' && current.status !== 'published' ? 'survey.publish' : 'survey.update', { type: 'survey', id: current.id, label: survey.title }, { by: 'admin', fields })
  res.json({ survey: { ...(await withQuestions(survey)), owner: user?.username || 'Không rõ' } })
}

export async function removeSurvey(req, res) {
  validId(req.params.id)
  const survey = ok(await supabase.from('surveys').select('id,title').eq('id', req.params.id).maybeSingle())
  if (!survey) throw new HttpError(404, 'Không tìm thấy khảo sát')
  ok(await supabase.from('surveys').delete().eq('id', req.params.id))
  await logActivity(req, 'survey.delete', { type: 'survey', id: req.params.id, label: survey.title }, { by: 'admin' })
  res.json({ ok: true })
}

export async function listResponses(req, res) {
  validId(req.params.id)
  const survey = ok(await supabase.from('surveys').select('id').eq('id', req.params.id).maybeSingle())
  if (!survey) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const page = pageNumber(req.query.page)
  const { data: responses, count, error } = await supabase.from('responses')
    .select('id,started_at,submitted_at,duration_seconds,quality_status,quality_score,answers(id,question_id,answer_value,questions(question_text,question_type))', { count: 'exact' })
    .eq('survey_id', survey.id).order('submitted_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw error
  res.json({ responses, page, pageSize: PAGE_SIZE, total: count })
}

export async function removeResponse(req, res) {
  validId(req.params.id)
  const response = ok(await supabase.from('responses').select('id').eq('id', req.params.id).maybeSingle())
  if (!response) throw new HttpError(404, 'Không tìm thấy phản hồi')
  ok(await supabase.from('responses').delete().eq('id', req.params.id))
  await logActivity(req, 'response.delete', { type: 'response', id: req.params.id }, { by: 'admin' })
  res.json({ ok: true })
}

export async function activity(req, res) {
  res.json(await listActivity(req.query))
}
