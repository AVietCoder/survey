import { supabase } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { createRewardService } from '../services/reward.js'
import { logActivity } from '../services/activity.js'

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
export async function adminTasks(_req, res) { res.json({ tasks: await reward.listTasks() }) }
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
