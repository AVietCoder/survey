import { logActivity } from '../services/activity.js'
import { createSurveyFromTemplate, listTemplates } from '../services/survey-templates.js'
import { tracking } from './tracking.js'

export async function list(_req, res) {
  res.json({ templates: listTemplates() })
}

/** Tạo khảo sát (bản nháp) của chính người dùng từ mẫu dựng sẵn. */
export async function createSurvey(req, res) {
  const result = await createSurveyFromTemplate({ key: req.params.key, userId: req.user.id, trackingService: tracking })
  await logActivity(req, 'survey.create', { type: 'survey', id: result.survey.id, label: result.survey.title }, { template: req.params.key })
  res.status(201).json(result)
}
