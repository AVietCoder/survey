import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const PROJECT_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived']
export const PROJECT_ROLES = ['researcher', 'reviewer']

export async function getProjectAccess(projectId, userId, allowedRoles = ['owner', 'researcher', 'reviewer']) {
  if (!UUID.test(projectId || '')) throw new HttpError(404, 'Không tìm thấy nghiên cứu')
  const project = ok(await supabase.from('research_projects').select('*').eq('id', projectId).maybeSingle())
  if (!project) throw new HttpError(404, 'Không tìm thấy nghiên cứu')
  if (project.owner_id === userId && allowedRoles.includes('owner')) return { project, role: 'owner' }
  const member = ok(await supabase.from('research_project_members').select('role')
    .eq('project_id', projectId).eq('user_id', userId).maybeSingle())
  if (!member || !allowedRoles.includes(member.role)) throw new HttpError(404, 'Không tìm thấy nghiên cứu')
  return { project, role: member.role }
}

export async function getSurveyAccess(surveyId, userId, allowedRoles = ['owner', 'researcher', 'reviewer']) {
  if (!UUID.test(surveyId || '')) throw new HttpError(404, 'Không tìm thấy khảo sát')
  const survey = ok(await supabase.from('surveys').select('*').eq('id', surveyId).maybeSingle())
  if (!survey) throw new HttpError(404, 'Không tìm thấy khảo sát')
  if (survey.user_id === userId && allowedRoles.includes('owner')) return { survey, role: 'owner' }
  const links = ok(await supabase.from('research_project_surveys').select('project_id').eq('survey_id', surveyId))
  for (const link of links) {
    try {
      const access = await getProjectAccess(link.project_id, userId, allowedRoles)
      return { survey, role: access.role, project: access.project }
    } catch (error) {
      if (error.status !== 404) throw error
    }
  }
  throw new HttpError(404, 'Không tìm thấy khảo sát')
}

export async function recordProjectActivity(projectId, actorId, action, details = {}) {
  ok(await supabase.from('research_project_activity').insert({
    project_id: projectId, actor_id: actorId, action, details
  }))
}

export { UUID }
