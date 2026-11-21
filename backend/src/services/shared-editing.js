import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

const MISSING = ['42P01', 'PGRST205', 'PGRST204']

/** Temporary default is ON until migration 011 creates the admin-controlled setting. */
export async function getSharedSurveyEditing(db = supabase) {
  const result = await db.from('app_settings').select('shared_survey_editing').eq('id', 'global').maybeSingle()
  if (MISSING.includes(result?.error?.code)) return { enabled: true, configurable: false }
  const row = ok(result)
  return { enabled: row?.shared_survey_editing !== false, configurable: true }
}

export async function saveSharedSurveyEditing(enabled, userId, db = supabase) {
  if (typeof enabled !== 'boolean') throw new HttpError(400, 'Trạng thái quyền chỉnh sửa phải là bật hoặc tắt')
  const current = await db.from('app_settings').select('id').eq('id', 'global').maybeSingle()
  if (MISSING.includes(current?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/011_shared_survey_editing.sql để quản lý quyền chỉnh sửa trong admin')
  const row = ok(current)
  const values = { shared_survey_editing: enabled, updated_by: userId, updated_at: new Date().toISOString() }
  const result = row
    ? await db.from('app_settings').update(values).eq('id', 'global')
    : await db.from('app_settings').insert({ id: 'global', ...values })
  if (MISSING.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/011_shared_survey_editing.sql để quản lý quyền chỉnh sửa trong admin')
  ok(result)
  return getSharedSurveyEditing(db)
}
