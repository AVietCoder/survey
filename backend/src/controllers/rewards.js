import { supabase } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { createRewardService } from '../services/reward.js'
import { logActivity } from '../services/activity.js'
import { resolveSurveyAccess, canEditConfig } from './tracking.js'

export let reward = createRewardService(supabase)
/** Chỉ dùng trong test: thay service bằng bản chạy trên DB giả/đồng hồ giả. */
export function useRewardService(service) { reward = service }

const noStore = res => res.set('Cache-Control', 'no-store')

/* ----------------------------------------------------------- người tham gia (cookie) */
export async function today(req, res) {
  noStore(res)
  res.json(await reward.today(req.tracker.profileId))
}
export async function start(req, res) {
  noStore(res)
  res.json(await reward.start(req.tracker.profileId, req.params.code))
}
export async function cancelStart(req, res) {
  noStore(res)
  res.json(await reward.cancelStart(req.tracker.profileId, req.params.code))
}
export async function complete(req, res) {
  noStore(res)
  res.json(await reward.complete(req.tracker.profileId, req.params.code, req.body || {}))
}
export async function useRestCard(req, res) {
  noStore(res)
  res.json(await reward.useRestCard(req.tracker.profileId, req.body?.localDate))
}
export async function inventory(req, res) {
  noStore(res)
  res.json(await reward.inventory(req.tracker.profileId))
}
export async function village(req, res) {
  noStore(res)
  res.json(await reward.village(req.tracker.profileId))
}
export async function equip(req, res) {
  noStore(res)
  res.json(await reward.equip(req.tracker.profileId, req.body || {}))
}
export async function setReminders(req, res) {
  noStore(res)
  res.json(await reward.setReminders(req.tracker.profileId, req.body?.enabled))
}

/* ----------------------------------------------------------------- quản trị (admin) */
export async function adminSettings(_req, res) { res.json({ settings: await reward.getSettings() }) }
export async function adminSaveSettings(req, res) {
  const settings = await reward.saveSettings(req.body || {}, req.user.id)
  await logActivity(req, 'reward.settings', { type: 'reward_settings', id: 'global' }, { fields: Object.keys(req.body || {}) })
  res.json({ settings })
}
export async function adminTasks(_req, res) { res.json({ tasks: (await reward.listTasks()).filter(task => !task.survey_id) }) }   // nhiệm vụ riêng của khảo sát quản lý ở trang theo dõi
export async function adminCreateTask(req, res) {
  const task = await reward.createTask(req.body || {}, req.user.id)
  await logActivity(req, 'reward.task_create', { type: 'reward_task', id: task.id, label: task.code })
  res.status(201).json({ task })
}
export async function adminUpdateTask(req, res) {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id || '')) throw new HttpError(404, 'Không tìm thấy nhiệm vụ')
  const task = await reward.updateTask(req.params.id, req.body || {})
  await logActivity(req, 'reward.task_update', { type: 'reward_task', id: task.id, label: task.code }, { fields: Object.keys(req.body || {}), active: task.is_active })
  res.json({ task })
}
export async function adminItems(_req, res) { res.json({ items: await reward.listItems() }) }
export async function adminCreateItem(req, res) {
  const item = await reward.createItem(req.body || {}, req.user.id)
  await logActivity(req, 'reward.item_create', { type: 'reward_item', id: item.id, label: item.code })
  res.status(201).json({ item })
}
export async function adminUpdateItem(req, res) {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id || '')) throw new HttpError(404, 'Không tìm thấy vật phẩm')
  const item = await reward.updateItem(req.params.id, req.body || {})
  await logActivity(req, 'reward.item_update', { type: 'reward_item', id: item.id, label: item.code }, { fields: Object.keys(req.body || {}), active: item.is_active })
  res.json({ item })
}

/* ---- nhiệm vụ riêng của khảo sát + lịch theo ngày (migration 021). Chỉ chủ sở hữu khảo sát được ghi, như cấu hình theo dõi. */
export async function surveyTasks(req, res) {
  const { survey, role } = await resolveSurveyAccess(req.params.surveyId, req.user)
  const listed = await reward.listSurveyTasks(survey.id)
  const settings = await reward.getSettings()
  res.json({ ...listed, role, canEdit: canEditConfig(role), cycleDays: settings.cycle_days, groupLabels: settings.group_labels, unit: { name: settings.unit_name, icon: settings.unit_icon } })
}
async function ownedSurvey(req) {
  const { survey, role } = await resolveSurveyAccess(req.params.surveyId, req.user)
  if (!canEditConfig(role)) throw new HttpError(403, 'Chỉ chủ sở hữu khảo sát mới được thay đổi nhiệm vụ')
  return survey
}
export async function createSurveyTask(req, res) {
  const survey = await ownedSurvey(req)
  const task = await reward.createSurveyTask(survey.id, req.body || {}, req.user.id)
  await logActivity(req, 'reward.survey_task_create', { type: 'survey', id: survey.id, label: survey.title }, { task: task.code })
  res.status(201).json({ task })
}
export async function updateSurveyTask(req, res) {
  const survey = await ownedSurvey(req)
  if (!/^[0-9a-f-]{36}$/i.test(req.params.taskId || '')) throw new HttpError(404, 'Không tìm thấy nhiệm vụ')
  const task = await reward.updateSurveyTask(survey.id, req.params.taskId, req.body || {})
  await logActivity(req, 'reward.survey_task_update', { type: 'survey', id: survey.id, label: survey.title }, { task: task.code, fields: Object.keys(req.body || {}), active: task.is_active })
  res.json({ task })
}

/* ---- thế giới 3D: đọc trạng thái và ghi nhận vật phẩm sưu tầm (migration 023) */
export async function world(req, res) { noStore(res).json(await reward.world(req.tracker.profileId)) }
export async function collectWorld(req, res) { noStore(res).json(await reward.collect(req.tracker.profileId, req.body?.key)) }
