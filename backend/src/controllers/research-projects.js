import { randomBytes } from 'node:crypto'
import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import {
  getProjectAccess, PROJECT_ROLES, PROJECT_STATUSES, recordProjectActivity, UUID
} from '../services/research-projects.js'
import { loadSurveyExport } from '../services/survey-export.js'
import {
  DATASET_CHECKSUM_ALGORITHM, DATASET_DEFINITION, fingerprintDataset
} from '../services/dataset-versions.js'

const PAGE_SIZE = 25
const pageNumber = value => Math.max(1, Number.parseInt(value, 10) || 1)
const PARTICIPANT_STATUSES = ['registered', 'active', 'completed', 'withdrawn']
const VERSION_PAGE_SIZE = 20

function datasetVersionResult(result) {
  if (['42P01', 'PGRST205'].includes(result.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/005_dataset_versions.sql để kích hoạt phiên bản dataset')
  return ok(result)
}

export async function listAccessibleSurveys(req, res) {
  const [owned, memberships] = await Promise.all([
    supabase.from('surveys').select('id,title,status,updated_at').eq('user_id', req.user.id),
    supabase.from('research_project_members').select('project_id').eq('user_id', req.user.id)
  ])
  const projectIds = ok(memberships).map(member => member.project_id)
  const links = projectIds.length
    ? ok(await supabase.from('research_project_surveys').select('survey_id').in('project_id', projectIds))
    : []
  const sharedIds = [...new Set(links.map(link => link.survey_id))]
  const shared = sharedIds.length
    ? ok(await supabase.from('surveys').select('id,title,status,updated_at').in('id', sharedIds))
    : []
  const surveys = [...new Map([...ok(owned), ...shared].map(survey => [survey.id, survey])).values()]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  res.json({ surveys })
}

export async function list(req, res) {
  const page = pageNumber(req.query.page)
  const limit = PAGE_SIZE
  const end = page * limit - 1
  const [ownedResult, memberResult] = await Promise.all([
    supabase.from('research_projects').select('id,owner_id,title,description,status,created_at,updated_at', { count: 'exact' })
      .eq('owner_id', req.user.id).order('updated_at', { ascending: false }).range(0, end),
    supabase.from('research_project_members')
      .select('project:research_projects!inner(id,owner_id,title,description,status,created_at,updated_at)', { count: 'exact' })
      .eq('user_id', req.user.id).order('updated_at', { foreignTable: 'project', ascending: false }).range(0, end)
  ])
  const owned = ok(ownedResult)
  const memberships = ok(memberResult).map(row => row.project).filter(Boolean)
  const projects = [...new Map([...owned, ...memberships].map(project => [project.id, project])).values()]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  const selected = projects.slice((page - 1) * limit, page * limit)
  const selectedIds = selected.map(project => project.id)
  const links = selectedIds.length
    ? ok(await supabase.from('research_project_surveys').select('project_id').in('project_id', selectedIds))
    : []
  const surveyCounts = links.reduce((counts, row) => {
    counts[row.project_id] = (counts[row.project_id] || 0) + 1
    return counts
  }, {})
  res.json({
    projects: selected.map(project => ({ ...project, role: project.owner_id === req.user.id ? 'owner' : 'member', surveyCount: surveyCounts[project.id] || 0 })),
    page, pageSize: limit, total: (ownedResult.count || 0) + (memberResult.count || 0)
  })
}

export async function create(req, res) {
  const title = String(req.body.title || '').trim()
  const description = String(req.body.description || '').trim()
  if (!title || title.length > 200) throw new HttpError(400, 'Tên nghiên cứu cần từ 1 đến 200 ký tự')
  if (description.length > 2000) throw new HttpError(400, 'Mô tả không được vượt quá 2000 ký tự')
  const project = ok(await supabase.from('research_projects').insert({
    owner_id: req.user.id, title, description
  }).select('*').single())
  await recordProjectActivity(project.id, req.user.id, 'project_created')
  res.status(201).json({ project: { ...project, role: 'owner', surveyCount: 0 } })
}

export async function get(req, res) {
  const { project, role } = await getProjectAccess(req.params.id, req.user.id)
  const [linkRows, members, notes, activity] = await Promise.all([
    supabase.from('research_project_surveys').select('survey_id,created_at').eq('project_id', project.id).order('created_at', { ascending: false }),
    supabase.from('research_project_members').select('user_id,role,created_at').eq('project_id', project.id).order('created_at'),
    supabase.from('research_project_notes').select('id,author_id,body,created_at').eq('project_id', project.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('research_project_activity').select('id,actor_id,action,details,created_at').eq('project_id', project.id).order('created_at', { ascending: false }).limit(30)
  ])
  const links = ok(linkRows)
  const surveyIds = links.map(link => link.survey_id)
  const [surveysResult, participantCountResult, responseCountResult] = await Promise.all([
    surveyIds.length
      ? supabase.from('surveys').select('id,title,status,updated_at').in('id', surveyIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('research_project_participants').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
    surveyIds.length
      ? supabase.from('responses').select('id', { count: 'exact', head: true })
        .in('survey_id', surveyIds).not('submitted_at', 'is', null)
      : Promise.resolve({ count: 0, error: null })
  ])
  const surveys = ok(surveysResult)
  if (participantCountResult.error) throw participantCountResult.error
  if (responseCountResult.error) throw responseCountResult.error
  const userIds = [...new Set([...ok(members).map(member => member.user_id), ...ok(notes).map(note => note.author_id), ...ok(activity).map(event => event.actor_id)].filter(Boolean))]
  const users = userIds.length ? ok(await supabase.from('users').select('id,username').in('id', userIds)) : []
  const usernames = Object.fromEntries(users.map(user => [user.id, user.username]))
  res.json({
    project: {
      ...project, role, participantCount: participantCountResult.count || 0,
      completedResponseCount: responseCountResult.count || 0,
      surveys: links.map(link => ({ ...surveys.find(survey => survey.id === link.survey_id), linkedAt: link.created_at })).filter(survey => survey.id),
      members: ok(members).map(member => ({ ...member, username: usernames[member.user_id] || 'Tài khoản không còn tồn tại' })),
      notes: ok(notes).map(note => ({ ...note, username: usernames[note.author_id] || null })),
      activity: ok(activity).map(event => ({ ...event, username: usernames[event.actor_id] || null }))
    }
  })
}

export async function listDatasetVersions(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id)
  const page = pageNumber(req.query.page)
  const result = await supabase.from('research_project_dataset_versions')
    .select('id,checksum,checksum_algorithm,dataset_definition,response_count,survey_count,survey_ids,captured_at', { count: 'exact' })
    .eq('project_id', project.id).order('captured_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * VERSION_PAGE_SIZE, page * VERSION_PAGE_SIZE - 1)
  const versions = datasetVersionResult(result)
  res.json({ versions, page, pageSize: VERSION_PAGE_SIZE, total: result.count || 0 })
}

export async function createDatasetVersion(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  if (!process.env.JWT_SECRET) throw new HttpError(503, 'Cấu hình JWT_SECRET trước khi tạo phiên bản dataset')

  const links = ok(await supabase.from('research_project_surveys')
    .select('survey_id').eq('project_id', project.id))
  const surveyIds = [...new Set(links.map(link => link.survey_id))].sort()
  if (!surveyIds.length) throw new HttpError(400, 'Liên kết ít nhất một khảo sát trước khi tạo phiên bản dataset')

  const capturedAt = new Date().toISOString()
  const surveyExports = []
  for (const surveyId of surveyIds) {
    surveyExports.push(await loadSurveyExport(
      surveyId, req.user.id, { reviewStatus: 'not_excluded' }, { asOf: capturedAt }
    ))
  }
  const fingerprint = fingerprintDataset(surveyExports, process.env.JWT_SECRET)
  const version = datasetVersionResult(await supabase.from('research_project_dataset_versions').insert({
    project_id: project.id,
    created_by: req.user.id,
    checksum: fingerprint.checksum,
    checksum_algorithm: DATASET_CHECKSUM_ALGORITHM,
    dataset_definition: DATASET_DEFINITION,
    response_count: fingerprint.responseCount,
    survey_count: fingerprint.surveyCount,
    survey_ids: fingerprint.surveyIds,
    captured_at: capturedAt
  }).select('id,checksum,checksum_algorithm,dataset_definition,response_count,survey_count,survey_ids,captured_at').single())

  await recordProjectActivity(project.id, req.user.id, 'dataset_version_created', {
    versionId: version.id, responseCount: version.response_count, surveyCount: version.survey_count
  })
  res.status(201).json({ version })
}

export async function listParticipants(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id)
  const page = pageNumber(req.query.page)
  const result = await supabase.from('research_project_participants')
    .select('id,participant_code,status,created_at,updated_at', { count: 'exact' })
    .eq('project_id', project.id).order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const participants = ok(result)
  res.json({ participants, page, pageSize: PAGE_SIZE, total: result.count || 0 })
}

export async function addParticipant(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  const participantCode = `P-${randomBytes(8).toString('hex').toUpperCase()}`
  const participant = ok(await supabase.from('research_project_participants').insert({
    project_id: project.id, participant_code: participantCode, created_by: req.user.id
  }).select('id,participant_code,status,created_at,updated_at').single())
  await recordProjectActivity(project.id, req.user.id, 'participant_added', { participantCode })
  res.status(201).json({ participant })
}

export async function updateParticipant(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  if (!UUID.test(req.params.participantId || '')) throw new HttpError(404, 'Không tìm thấy participant')
  const status = req.body.status
  if (!PARTICIPANT_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái participant không hợp lệ')
  const participant = ok(await supabase.from('research_project_participants')
    .update({ status }).eq('project_id', project.id).eq('id', req.params.participantId)
    .select('id,participant_code,status,created_at,updated_at').maybeSingle())
  if (!participant) throw new HttpError(404, 'Không tìm thấy participant')
  await recordProjectActivity(project.id, req.user.id, 'participant_status_updated', {
    participantCode: participant.participant_code, status
  })
  res.json({ participant })
}

export async function update(req, res) {
  const { project, role } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  const patch = {}
  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim()
    if (!title || title.length > 200) throw new HttpError(400, 'Tên nghiên cứu cần từ 1 đến 200 ký tự')
    patch.title = title
  }
  if (req.body.description !== undefined) {
    const description = String(req.body.description).trim()
    if (description.length > 2000) throw new HttpError(400, 'Mô tả không được vượt quá 2000 ký tự')
    patch.description = description
  }
  if (req.body.status !== undefined) {
    if (!PROJECT_STATUSES.includes(req.body.status)) throw new HttpError(400, 'Trạng thái nghiên cứu không hợp lệ')
    patch.status = req.body.status
  }
  if (!Object.keys(patch).length) throw new HttpError(400, 'Không có thông tin cần cập nhật')
  const updated = ok(await supabase.from('research_projects').update(patch).eq('id', project.id).select('*').single())
  await recordProjectActivity(project.id, req.user.id, 'project_updated', { fields: Object.keys(patch), role })
  res.json({ project: { ...updated, role } })
}

export async function addMember(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner'])
  const username = String(req.body.username || '').trim()
  const role = req.body.role
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new HttpError(400, 'Username không hợp lệ')
  if (!PROJECT_ROLES.includes(role)) throw new HttpError(400, 'Vai trò không hợp lệ')
  const user = ok(await supabase.from('users').select('id,username').eq('username', username).maybeSingle())
  if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản')
  if (user.id === project.owner_id) throw new HttpError(400, 'Chủ nghiên cứu không cần được thêm làm thành viên')
  ok(await supabase.from('research_project_members').insert({
    project_id: project.id, user_id: user.id, role, added_by: req.user.id
  }))
  await recordProjectActivity(project.id, req.user.id, 'member_added', { username: user.username, role })
  res.status(201).json({ member: { user_id: user.id, username: user.username, role } })
}

export async function removeMember(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner'])
  if (!UUID.test(req.params.userId || '')) throw new HttpError(404, 'Không tìm thấy thành viên')
  const member = ok(await supabase.from('research_project_members').select('role')
    .eq('project_id', project.id).eq('user_id', req.params.userId).maybeSingle())
  if (!member) throw new HttpError(404, 'Không tìm thấy thành viên')
  const user = ok(await supabase.from('users').select('username').eq('id', req.params.userId).maybeSingle())
  ok(await supabase.from('research_project_members').delete().eq('project_id', project.id).eq('user_id', req.params.userId))
  await recordProjectActivity(project.id, req.user.id, 'member_removed', { username: user?.username || null, role: member.role })
  res.json({ ok: true })
}

export async function linkSurvey(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  if (!UUID.test(req.params.surveyId || '')) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const survey = ok(await supabase.from('surveys').select('id,title').eq('id', req.params.surveyId).eq('user_id', req.user.id).maybeSingle())
  if (!survey) throw new HttpError(404, 'Chỉ có thể liên kết khảo sát do bạn sở hữu')
  ok(await supabase.from('research_project_surveys').insert({
    project_id: project.id, survey_id: survey.id, linked_by: req.user.id
  }))
  await recordProjectActivity(project.id, req.user.id, 'survey_linked', { surveyId: survey.id, title: survey.title })
  res.status(201).json({ survey })
}

export async function unlinkSurvey(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  if (!UUID.test(req.params.surveyId || '')) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const link = ok(await supabase.from('research_project_surveys').select('survey_id')
    .eq('project_id', project.id).eq('survey_id', req.params.surveyId).maybeSingle())
  if (!link) throw new HttpError(404, 'Khảo sát chưa được liên kết')
  ok(await supabase.from('research_project_surveys').delete().eq('project_id', project.id).eq('survey_id', link.survey_id))
  await recordProjectActivity(project.id, req.user.id, 'survey_unlinked', { surveyId: link.survey_id })
  res.json({ ok: true })
}

export async function addNote(req, res) {
  const { project } = await getProjectAccess(req.params.id, req.user.id, ['owner', 'researcher'])
  const body = String(req.body.body || '').trim()
  if (!body || body.length > 5000) throw new HttpError(400, 'Ghi chú cần từ 1 đến 5000 ký tự')
  const note = ok(await supabase.from('research_project_notes').insert({
    project_id: project.id, author_id: req.user.id, body
  }).select('id,author_id,body,created_at').single())
  await recordProjectActivity(project.id, req.user.id, 'note_added', { noteId: note.id })
  res.status(201).json({ note: { ...note, username: req.user.username } })
}
