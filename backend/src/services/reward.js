import { randomBytes } from 'node:crypto'
import { ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { describeWorld, findWorldItem, isGuardianAwake, isMapOpen } from './world3d-content.js'

/**
 * Reward system — giai đoạn 2: nhiệm vụ nạp từ dữ liệu, sổ điểm chỉ-ghi-thêm, trần điểm ngày/tuần.
 * Nguyên tắc (docs/answer.md): một trần chung cho mọi nhóm, không phạt khi bỏ lỡ, điểm đã nhận không thu hồi,
 * xác minh tối thiểu (tự báo cáo / đếm giờ phía máy chủ / số lượng ký tự), không lưu nội dung nhập.
 */

export const TIERS = ['green', 'yellow', 'red']
export const COMPLETION_TYPES = ['self_report', 'timer', 'count_chars', 'choice']
export const ITEM_KINDS = ['title', 'badge', 'sticker', 'theme', 'pet_item']
export const ITEM_ASSETS = ['star', 'leaf', 'moon', 'heart', 'sun']
export const PET_SPECIES = ['cat', 'bunny', 'fox', 'bear']
export const REWARD_GAMES = ['breathing', 'rest_timer', 'three_plans']
export const DEFAULT_SETTINGS = {
  unit_name: 'Sao', unit_icon: '⭐', daily_cap: 50, weekly_cap: 250, cycle_days: 14, timezone: 'Asia/Ho_Chi_Minh',
  rest_cards_per_week: 2, streak_enabled: false, world3d_enabled: false,
  group_labels: { green: 'Gói Duy trì', yellow: 'Gói Cân bằng', red: 'Gói Đồng hành' }
}
const MISSING = ['42P01', 'PGRST205', 'PGRST204']
const MAX_COUNT = 5000

/**
 * Nhân vật tùy chỉnh: chỉ lưu CHỈ SỐ của các bộ phận có sẵn (không chữ tự do, không ảnh). Mỗi chỉ số phải là số nguyên trong giới hạn.
 * Giới hạn khớp với bảng bộ phận trong frontend/js/village.js (AVATAR_PARTS).
 */
export const AVATAR_LIMITS = { skin: 5, hair: 7, style: 4, shirt: 8, hat: 4 }
/** Ba kiểu nhân vật có sẵn: mặc định (tùy chỉnh) và hai nhân vật dựng sẵn Emma/Tịnh. */
export const AVATAR_PRESETS = ['default', 'emma', 'tinh']
export const DEFAULT_AVATAR = Object.fromEntries(Object.keys(AVATAR_LIMITS).map(key => [key, 0]))
export function normalizeAvatar(input, { strict = false } = {}) {
  const out = { ...DEFAULT_AVATAR }
  // preset là tùy chọn: chỉ lưu khi là nhân vật dựng sẵn, để dữ liệu cũ không đổi hình dạng.
  if (input?.preset !== undefined && input.preset !== 'default') {
    if (AVATAR_PRESETS.includes(input.preset)) out.preset = input.preset
    else if (strict) throw new HttpError(400, 'Nhân vật không hợp lệ')
  }
  for (const [key, limit] of Object.entries(AVATAR_LIMITS)) {
    const value = input?.[key]
    if (value === undefined && !strict) continue
    if (!Number.isInteger(value) || value < 0 || value >= limit) {
      if (strict) throw new HttpError(400, 'Bộ phận nhân vật không hợp lệ')
      continue
    }
    out[key] = value
  }
  return out
}

export function rewardResult(result) {
  if (MISSING.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/009_reward_system.sql để kích hoạt hệ thống điểm thưởng')
  return ok(result)
}

function streakResult(result) {
  if (MISSING.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/010_reward_streaks.sql để kích hoạt chuỗi ngày và Thẻ nghỉ')
  return ok(result)
}

function itemResult(result) {
  if (MISSING.includes(result?.error?.code))
    throw new HttpError(503, 'Chạy backend/migrations/012_reward_inventory.sql để kích hoạt kho vật phẩm')
  return ok(result)
}

const SCHEDULE_COLUMNS = /survey_id|start_day|end_day/i
const scheduleMissing = result => ['PGRST204', '42703'].includes(result?.error?.code) && SCHEDULE_COLUMNS.test(result.error.message || '')
function scheduleResult(result) {
  if (scheduleMissing(result)) throw new HttpError(503, 'Chạy backend/migrations/021_survey_reward_tasks.sql để dùng nhiệm vụ riêng và lịch theo ngày')
  return taskGameResult(result)
}

function taskGameResult(result) {
  if (result?.error?.code === 'PGRST204' && /game/i.test(result.error.message || ''))
    throw new HttpError(503, 'Chạy backend/migrations/013_reward_task_games.sql để bật mini-game')
  return rewardResult(result)
}

async function taskMutation(run, row) {
  const result = await run(row)
  if (result?.error?.code === 'PGRST204' && /game/i.test(result.error.message || '') && !row.game) {
    const { game: _unused, ...legacyRow } = row
    return rewardResult(await run(legacyRow))
  }
  return scheduleResult(result)
}

const asDate = value => String(value).slice(0, 10)
const shiftDate = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Chuỗi hiện tại tính đến hôm nay; nếu hôm nay chưa có hoạt động thì giữ chuỗi đến hết hôm qua. */
export function computeStreak(completionDates = [], restDates = [], today) {
  const active = new Set([...completionDates, ...restDates].map(asDate))
  const sorted = [...active].sort()
  let best = 0, run = 0, previous = null
  for (const date of sorted) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  let anchor = active.has(today) ? today : shiftDate(today, -1)
  if (!active.has(anchor)) return { current: 0, best }
  let current = 0
  while (active.has(anchor)) { current++; anchor = shiftDate(anchor, -1) }
  return { current, best }
}

/* --------------------------------------------------------------------- thời gian */
/** Ngày và phút-trong-ngày theo múi giờ cố định (không phụ thuộc múi giờ máy chủ). */
export function localParts(date, timeZone = DEFAULT_SETTINGS.timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

/** Thứ Hai đầu tuần của một ngày địa phương 'YYYY-MM-DD'. */
export function weekStart(localDate) {
  const day = new Date(`${localDate}T00:00:00Z`)
  const offset = (day.getUTCDay() + 6) % 7
  day.setUTCDate(day.getUTCDate() - offset)
  return day.toISOString().slice(0, 10)
}

const toMinutes = value => { const [h, m] = String(value).split(':').map(Number); return h * 60 + m }
export const inWindow = (task, minutes) => {
  if (!task.window_start || !task.window_end) return true
  return minutes >= toMinutes(task.window_start) && minutes <= toMinutes(task.window_end)
}

/* ---------------------------------------------------------------------- nhóm */
/** Mức (band) → nhóm nhiệm vụ: ổn nhất = xanh, cần hỗ trợ nhiều nhất = đỏ, còn lại = vàng. */
export function tierOf(session) {
  const thresholds = session?.band_thresholds
  if (session?.band === null || session?.band === undefined || !Array.isArray(thresholds?.cutoffs)) return null
  const levels = thresholds.cutoffs.length + 1
  const severity = thresholds.direction === 'higher_worse' ? session.band : levels - 1 - session.band
  return severity === 0 ? 'green' : severity === levels - 1 ? 'red' : 'yellow'
}

/**
 * Nhóm hiện tại của hồ sơ. Nhóm giữ cố định trong một chu kỳ: phiên đánh giá mới chỉ thay nhóm khi đã qua
 * `cycleDays` kể từ phiên mốc (làm lại khảo sát sớm để đổi nhóm không có tác dụng). `sessions` đã sắp xếp tăng dần.
 */
export function currentGroup(sessions, cycleDays = DEFAULT_SETTINGS.cycle_days) {
  let anchor = null
  for (const session of sessions) {
    if (!tierOf(session)) continue
    if (!anchor || new Date(session.completed_at) - new Date(anchor.completed_at) >= cycleDays * 86400000) anchor = session
  }
  return anchor ? { tier: tierOf(anchor), session: anchor } : null
}

/** Ngày thứ N của chương trình: ngày 1 = ngày (giờ địa phương) của lần đánh giá xác định nhóm. Không bao giờ nhỏ hơn 1. */
export function programDay(startedAt, today, timeZone = DEFAULT_SETTINGS.timezone) {
  const first = localParts(new Date(startedAt), timeZone).date
  const diff = Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${first}T00:00:00Z`)) / 86400000)
  return Math.max(1, diff + 1)
}

export const inDays = (task, day) => (task.start_day == null || day >= task.start_day) && (task.end_day == null || day <= task.end_day)

/** Nhiệm vụ áp dụng cho một khảo sát: nếu khảo sát có nhiệm vụ riêng đang bật thì CHỈ dùng chúng, không trộn với bộ chung. */
export function taskPool(activeTasks, surveyId) {
  const own = activeTasks.filter(task => task.survey_id && task.survey_id === surveyId)
  return own.length ? own : activeTasks.filter(task => !task.survey_id)
}

/* ------------------------------------------------------------------ kiểm tra dữ liệu */
const text = (value, label, max, { required = false } = {}) => {
  const out = String(value ?? '').trim()
  if (required && !out) throw new HttpError(400, `${label} không được để trống`)
  if (out.length > max) throw new HttpError(400, `${label} không được vượt quá ${max} ký tự`)
  return out
}
const integer = (value, label, min, max) => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (!Number.isInteger(number) || number < min || number > max) throw new HttpError(400, `${label} phải là số nguyên từ ${min} đến ${max}`)
  return number
}
const optionalInteger = (value, label, min, max) => (value === null || value === undefined || value === '' ? null : integer(value, label, min, max))
const clock = (value, label) => {
  if (value === null || value === undefined || value === '') return null
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(String(value))) throw new HttpError(400, `${label} phải có dạng HH:MM (ví dụ 13:30)`)
  return String(value)
}

/** Làm sạch dữ liệu một nhiệm vụ (dùng cho tạo mới và sửa). `existing` cho phép gửi thiếu trường khi sửa. */
export function normalizeTask(input, existing = {}) {
  const merged = { ...existing, ...input }
  const code = text(merged.code, 'Mã nhiệm vụ', 24, { required: true })
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,23}$/.test(code)) throw new HttpError(400, 'Mã nhiệm vụ gồm chữ, số, gạch ngang hoặc gạch dưới (2–24 ký tự)')
  const audience = Array.isArray(merged.audience) ? [...new Set(merged.audience)] : []
  if (!audience.length || audience.some(tier => !TIERS.includes(tier))) throw new HttpError(400, 'Nhóm áp dụng phải gồm ít nhất một nhóm hợp lệ (xanh, vàng, đỏ)')
  const type = merged.completion_type ?? 'self_report'
  if (!COMPLETION_TYPES.includes(type)) throw new HttpError(400, 'Cách xác minh không hợp lệ')
  const row = {
    code, name: text(merged.name, 'Tên nhiệm vụ', 80, { required: true }), description: text(merged.description, 'Mô tả', 400),
    instructions: text(merged.instructions, 'Hướng dẫn', 800), points: integer(merged.points ?? 10, 'Điểm thưởng', 0, 50), audience,
    completion_type: type, min_seconds: null, min_count: null, choices: null,
    window_start: clock(merged.window_start, 'Giờ bắt đầu'), window_end: clock(merged.window_end, 'Giờ kết thúc'),
    times_per_day: integer(merged.times_per_day ?? 1, 'Số lần mỗi ngày', 1, 5),
    duration_minutes: optionalInteger(merged.duration_minutes, 'Thời gian thực hiện (phút)', 1, 240),
    verification: text(merged.verification, 'Mô tả xác minh', 200),
    is_active: merged.is_active !== false, is_placeholder: merged.is_placeholder !== false,
    sort_order: integer(merged.sort_order ?? 0, 'Thứ tự', -1000, 1000), game: merged.game || null
  }
  const startDay = optionalInteger(merged.start_day, 'Ngày bắt đầu', 1, 365), endDay = optionalInteger(merged.end_day, 'Ngày kết thúc', 1, 365)
  if (startDay !== null && endDay !== null && endDay < startDay) throw new HttpError(400, 'Ngày kết thúc phải từ ngày bắt đầu trở đi')
  if (startDay !== null || endDay !== null || 'start_day' in existing) { row.start_day = startDay; row.end_day = endDay }
  if (row.game && !REWARD_GAMES.includes(row.game)) throw new HttpError(400, 'Mini-game không hợp lệ')
  if ((row.game === 'breathing' || row.game === 'rest_timer') && type !== 'timer' || row.game === 'three_plans' && type !== 'count_chars')
    throw new HttpError(400, 'Mini-game không khớp với cách xác minh của nhiệm vụ')
  if (Boolean(row.window_start) !== Boolean(row.window_end)) throw new HttpError(400, 'Cần nhập cả giờ bắt đầu và giờ kết thúc, hoặc bỏ trống cả hai')
  if (row.window_start && toMinutes(row.window_start) >= toMinutes(row.window_end)) throw new HttpError(400, 'Giờ kết thúc phải sau giờ bắt đầu')
  if (type === 'timer') row.min_seconds = integer(merged.min_seconds, 'Thời gian tối thiểu (giây)', 1, 7200)
  if (type === 'count_chars') row.min_count = integer(merged.min_count, 'Số ký tự tối thiểu', 1, 2000)
  if (type === 'choice') {
    const choices = Array.isArray(merged.choices) ? merged.choices.map(item => String(item).trim()).filter(Boolean) : []
    if (choices.length < 2 || choices.length > 6 || choices.some(item => item.length > 40) || new Set(choices).size !== choices.length)
      throw new HttpError(400, 'Cần từ 2 đến 6 lựa chọn khác nhau, mỗi lựa chọn tối đa 40 ký tự')
    row.choices = choices
  }
  return row
}

export function normalizeItem(input, existing = {}) {
  const merged = { ...existing, ...input }
  const code = text(merged.code, 'Mã vật phẩm', 32, { required: true })
  if (!/^[a-z0-9][a-z0-9_-]{1,31}$/.test(code)) throw new HttpError(400, 'Mã vật phẩm dùng chữ thường, số, gạch ngang hoặc gạch dưới (2–32 ký tự)')
  if (!ITEM_KINDS.includes(merged.kind)) throw new HttpError(400, 'Loại vật phẩm không hợp lệ')
  if (!ITEM_ASSETS.includes(merged.asset_key)) throw new HttpError(400, 'Hình minh họa phải chọn từ SVG có sẵn')
  return {
    code, kind: merged.kind, name: text(merged.name, 'Tên vật phẩm', 80, { required: true }),
    description: text(merged.description, 'Mô tả vật phẩm', 300),
    unlock_stars: integer(merged.unlock_stars ?? 0, 'Sao cần để mở khóa', 0, 1000000),
    asset_key: merged.asset_key, is_active: merged.is_active !== false,
    is_placeholder: merged.is_placeholder !== false,
    sort_order: integer(merged.sort_order ?? 0, 'Thứ tự', -1000, 1000)
  }
}

export function normalizeSettings(input, existing = DEFAULT_SETTINGS) {
  const merged = { ...existing, ...input }
  const labels = { ...DEFAULT_SETTINGS.group_labels, ...(existing.group_labels || {}), ...(input?.group_labels || {}) }
  for (const tier of TIERS) labels[tier] = text(labels[tier], 'Tên gói', 40, { required: true })
  if (new Set(Object.values(labels).map(label => label.toLocaleLowerCase('vi'))).size !== 3) throw new HttpError(400, 'Ba tên gói phải khác nhau')
  const row = {
    unit_name: text(merged.unit_name, 'Tên đơn vị điểm', 20, { required: true }), unit_icon: text(merged.unit_icon, 'Biểu tượng', 8, { required: true }),
    daily_cap: integer(merged.daily_cap, 'Trần điểm mỗi ngày', 1, 1000), weekly_cap: integer(merged.weekly_cap, 'Trần điểm mỗi tuần', 1, 5000),
    cycle_days: integer(merged.cycle_days, 'Chu kỳ đánh giá (ngày)', 1, 365), group_labels: labels,
    rest_cards_per_week: integer(merged.rest_cards_per_week ?? 2, 'Số Thẻ nghỉ mỗi tuần', 0, 7),
    streak_enabled: merged.streak_enabled === true,
    world3d_enabled: merged.world3d_enabled === true
  }
  if (row.weekly_cap < row.daily_cap) throw new HttpError(400, 'Trần tuần không được nhỏ hơn trần ngày')
  return row
}

const WORLD_MIGRATION_HINT = 'Chạy backend/migrations/023_world3d.sql để bật thế giới 3D và sưu tầm'
const worldMissing = result => ['42P01', 'PGRST205'].includes(result?.error?.code) || result?.error?.code === 'PGRST204' && /world3d_enabled/i.test(result.error.message || '')
function worldResult(result) {
  if (worldMissing(result)) throw new HttpError(503, WORLD_MIGRATION_HINT)
  return rewardResult(result)
}

/* ---------------------------------------------------------------------- service */
export function createRewardService(db, { clock: now = () => new Date() } = {}) {
  const q = result => rewardResult(result)
  const allProfileRows = async (table, columns, mapResult = q, profileId) => {
    const rows = []
    for (let offset = 0; ; offset += 1000) {
      const page = mapResult(await db.from(table).select(columns).eq('profile_id', profileId).order('completed_at', { ascending: true }).range(offset, offset + 999))
      rows.push(...page)
      if (page.length < 1000) return rows
    }
  }

  async function getSettings() {
    const row = q(await db.from('reward_settings').select('*').eq('id', 'global').maybeSingle())
    return {
      ...DEFAULT_SETTINGS, ...(row || {}), streak_available: Object.hasOwn(row || {}, 'streak_enabled'), world3d_available: Object.hasOwn(row || {}, 'world3d_enabled'),
      group_labels: { ...DEFAULT_SETTINGS.group_labels, ...(row?.group_labels || {}) }
    }
  }

  async function saveSettings(input, userId) {
    const current = await getSettings()
    const normalized = normalizeSettings(input, current)
    const { rest_cards_per_week, streak_enabled, world3d_enabled, ...baseSettings } = normalized
    // Chỉ ghi cột của migration 023 khi người dùng gửi, để lưu cấu hình cũ không phụ thuộc migration mới
    const includesWorld = Object.hasOwn(input || {}, 'world3d_enabled')
    const includesStreakSettings = Object.hasOwn(input || {}, 'rest_cards_per_week') || Object.hasOwn(input || {}, 'streak_enabled')
    const row = {
      ...baseSettings,
      ...(includesStreakSettings ? { rest_cards_per_week, streak_enabled } : {}),
      ...(includesWorld ? { world3d_enabled } : {}),
      updated_by: userId, updated_at: now().toISOString()
    }
    const existing = q(await db.from('reward_settings').select('id').eq('id', 'global').maybeSingle())
    const write = existing ? await db.from('reward_settings').update(row).eq('id', 'global') : await db.from('reward_settings').insert({ id: 'global', ...row })
    if (includesWorld && worldMissing(write)) worldResult(write)
    if (includesStreakSettings) streakResult(write)
    else q(write)
    return getSettings()
  }

  /* ---- quản trị nhiệm vụ: thêm, sửa, ẩn (không xóa để giữ lịch sử điểm) */
  const listTasks = async ({ onlyActive = false } = {}) => {
    let query = db.from('reward_tasks').select('*').order('sort_order', { ascending: true }).order('code', { ascending: true })
    if (onlyActive) query = query.eq('is_active', true)
    return q(await query)
  }

  async function createTask(input, userId) {
    const row = normalizeTask(input)
    const taken = q(await db.from('reward_tasks').select('id').eq('code', row.code).maybeSingle())
    if (taken) throw new HttpError(409, 'Mã nhiệm vụ đã tồn tại')
    return taskMutation(values => db.from('reward_tasks').insert(values).select('*').single(), { ...row, created_by: userId })
  }

  async function updateTask(id, input) {
    const existing = q(await db.from('reward_tasks').select('*').eq('id', id).maybeSingle())
    if (!existing) throw new HttpError(404, 'Không tìm thấy nhiệm vụ')
    const row = normalizeTask({ ...input, code: existing.code }, existing)          // mã nhiệm vụ không đổi để lịch sử điểm nhất quán
    return taskMutation(values => db.from('reward_tasks').update(values).eq('id', id).select('*').single(), { ...row, updated_at: now().toISOString() })
  }

  /* ---- nhiệm vụ riêng của từng khảo sát (migration 021): mã do máy chủ sinh, không xóa chỉ ẩn */
  const sortSchedule = list => [...list].sort((a, b) => (a.start_day ?? 0) - (b.start_day ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.code).localeCompare(String(b.code)))

  async function listSurveyTasks(surveyId) {
    const probe = await db.from('reward_tasks').select('survey_id').limit(1)
    if (scheduleMissing(probe)) return { available: false, tasks: [] }
    const rows = q(await db.from('reward_tasks').select('*'))
    return { available: true, tasks: sortSchedule(rows.filter(task => task.survey_id === surveyId)) }
  }

  async function createSurveyTask(surveyId, input, userId) {
    const code = `S${randomBytes(3).toString('hex')}-${Math.floor(Math.random() * 90 + 10)}`
    const row = normalizeTask({ ...input, code, is_placeholder: input?.is_placeholder })
    return taskMutation(values => db.from('reward_tasks').insert(values).select('*').single(), { ...row, survey_id: surveyId, created_by: userId })
  }

  async function updateSurveyTask(surveyId, taskId, input) {
    const existing = q(await db.from('reward_tasks').select('*').eq('id', taskId).maybeSingle())
    if (!existing || existing.survey_id !== surveyId) throw new HttpError(404, 'Không tìm thấy nhiệm vụ của khảo sát này')
    const row = normalizeTask({ ...input, code: existing.code }, existing)
    return taskMutation(values => db.from('reward_tasks').update(values).eq('id', taskId).select('*').single(), { ...row, updated_at: now().toISOString() })
  }

  /* ---- kho vật phẩm: mở khóa theo Sao đã tích lũy, không tiêu điểm */
  const listItems = async ({ onlyActive = false } = {}) => {
    let query = db.from('reward_items').select('*').order('sort_order', { ascending: true }).order('code', { ascending: true })
    if (onlyActive) query = query.eq('is_active', true)
    return itemResult(await query)
  }

  async function createItem(input, userId) {
    const row = normalizeItem(input)
    const existing = itemResult(await db.from('reward_items').select('id').eq('code', row.code).maybeSingle())
    if (existing) throw new HttpError(409, 'Mã vật phẩm đã tồn tại')
    return itemResult(await db.from('reward_items').insert({ ...row, created_by: userId, updated_at: now().toISOString() }).select('*').single())
  }

  async function updateItem(id, input) {
    const existing = itemResult(await db.from('reward_items').select('*').eq('id', id).maybeSingle())
    if (!existing) throw new HttpError(404, 'Không tìm thấy vật phẩm')
    if (input.kind !== undefined && input.kind !== existing.kind) throw new HttpError(400, 'Không thể đổi loại vật phẩm sau khi tạo')
    const row = normalizeItem({ ...input, code: existing.code, kind: existing.kind }, existing)
    return itemResult(await db.from('reward_items').update({ ...row, updated_at: now().toISOString() }).eq('id', id).select('*').single())
  }

  async function inventory(profileId) {
    const settings = await getSettings()
    const group = await groupFor(profileId, settings)
    const completionRows = await allProfileRows('reward_completions', 'points', q, profileId)
    const balance = completionRows.reduce((total, row) => total + row.points, 0)
    const items = await listItems({ onlyActive: true })
    let unlocked = itemResult(await db.from('reward_unlocks').select('item_id').eq('profile_id', profileId))
    const unlockedIds = new Set(unlocked.map(row => row.item_id))

    if (group?.enabled) {
      const eligible = items.filter(item => item.unlock_stars <= balance && !unlockedIds.has(item.id))
      if (eligible.length) {
        const inserted = await db.from('reward_unlocks').insert(eligible.map(item => ({ profile_id: profileId, item_id: item.id, unlocked_at: now().toISOString() })))
        if (inserted.error && inserted.error.code !== '23505') itemResult(inserted)
        unlocked = itemResult(await db.from('reward_unlocks').select('item_id').eq('profile_id', profileId))
      }
    }

    const prefs = itemResult(await db.from('reward_profile_prefs').select('equipped,reminders_enabled').eq('profile_id', profileId).maybeSingle())
    const activeUnlocked = new Set(items.filter(item => unlocked.some(row => row.item_id === item.id)).map(item => item.code))
    const equipped = Object.fromEntries(Object.entries(prefs?.equipped || {}).filter(([kind, code]) => kind === 'avatar' ? false : kind === 'pet' ? PET_SPECIES.includes(code) : activeUnlocked.has(code)))
    return {
      enabled: Boolean(group?.enabled || unlocked.length), balance, unit: { name: settings.unit_name, icon: settings.unit_icon },
      items: items.map(item => ({
        code: item.code, kind: item.kind, name: item.name, description: item.description,
        unlockStars: item.unlock_stars, assetKey: item.asset_key, placeholder: item.is_placeholder,
        unlocked: unlocked.some(row => row.item_id === item.id),
        equipped: equipped[item.kind] === item.code
      })),
      equipped, pet: equipped.pet || 'cat', avatar: normalizeAvatar(prefs?.equipped?.avatar), remindersEnabled: prefs?.reminders_enabled !== false
    }
  }

  /**
   * Dữ liệu cho mini-game "Làng nhỏ": chỉ đọc sổ điểm (migration 009). Công trình mở theo TỔNG Sao đã nhận
   * (không tiêu Sao, không bao giờ mất), cùng số lần đã làm từng nhiệm vụ để gắn công trình với cơ chế tương ứng.
   */
  async function village(profileId) {
    const settings = await getSettings()
    const group = await groupFor(profileId, settings)
    const rows = await allProfileRows('reward_completions', 'task_code,points,local_date', q, profileId)
    const prefs = itemResult(await db.from('reward_profile_prefs').select('equipped').eq('profile_id', profileId).maybeSingle())
    const tasks = {}
    for (const row of rows) tasks[row.task_code] = (tasks[row.task_code] || 0) + 1
    return {
      enabled: Boolean(group?.enabled || rows.length),
      stars: rows.reduce((total, row) => total + row.points, 0), avatar: normalizeAvatar(prefs?.equipped?.avatar), pet: PET_SPECIES.includes(prefs?.equipped?.pet) ? prefs.equipped.pet : 'cat',
      completions: rows.length, activeDays: new Set(rows.map(row => row.local_date)).size, tasks,
      unit: { name: settings.unit_name, icon: settings.unit_icon }
    }
  }

  /* ---- thế giới 3D (migration 023): kho báu và kỷ vật chỉ để sưu tầm, không bao giờ liên quan đến Sao ---- */
  const readFound = async profileId => db.from('reward_world_items').select('item_key').eq('profile_id', profileId)

  async function world(profileId) {
    const settings = await getSettings()
    const progress = await village(profileId)
    const read = await readFound(profileId)
    const available = !worldMissing(read)
    const found = new Set(available ? rewardResult(read).map(row => row.item_key) : [])
    const enabled = settings.world3d_enabled === true
    return {
      enabled, collecting: available && enabled,
      stars: progress.stars, completions: progress.completions,
      maps: describeWorld(progress.stars, progress.completions, found)
    }
  }

  /** Ghi nhận một vật phẩm đã nhặt hoặc kỷ vật sau khi làm trùm dịu lại. Gửi lặp trả duplicate, không tạo thêm gì.
   *  Máy chủ không xác minh thao tác trong game (chỉ là đồ sưu tầm), nhưng vẫn kiểm tra điều kiện mở. */
  async function collect(profileId, key) {
    const found = new Set(worldResult(await readFound(profileId)).map(row => row.item_key))
    const settings = await getSettings()
    const group = await groupFor(profileId, settings)
    if (!group?.enabled) throw new HttpError(403, 'Hệ thống nhiệm vụ chưa được bật cho hồ sơ này')
    if (settings.world3d_enabled !== true) throw new HttpError(403, 'Thế giới 3D đang tắt')
    const entry = typeof key === 'string' ? findWorldItem(key) : null
    if (!entry) throw new HttpError(404, 'Không tìm thấy vật phẩm')
    const answer = duplicate => ({ duplicate, key, name: entry.kind === 'keepsake' ? entry.item.keepsake : entry.item.name, kind: entry.kind })
    if (found.has(key)) return answer(true)
    const progress = await village(profileId)
    if (!isMapOpen(entry.map, progress.stars, found)) throw new HttpError(409, 'Bản đồ này chưa mở')
    if (entry.kind === 'keepsake' && !isGuardianAwake(entry.map, progress.stars, progress.completions, found))
      throw new HttpError(409, `${entry.map.guardian.name} vẫn đang ngủ`)
    const inserted = await db.from('reward_world_items').insert({ profile_id: profileId, item_key: key, found_at: now().toISOString() })
    if (inserted.error?.code === '23505') return answer(true)
    worldResult(inserted)
    return answer(false)
  }

  async function equip(profileId, input = {}) {
    const itemCode = input.kind === 'avatar' ? undefined : input.itemCode
    let equipped
    const current = itemResult(await db.from('reward_profile_prefs').select('equipped').eq('profile_id', profileId).maybeSingle())
    const next = { ...(current?.equipped || {}) }
    if (itemCode === null) {
      if (input.kind !== 'pet' && !ITEM_KINDS.includes(input.kind)) throw new HttpError(400, 'Loại vật phẩm không hợp lệ')
      delete next[input.kind]
      equipped = next
    } else if (input.kind === 'avatar') {
      next.avatar = normalizeAvatar(input.avatar, { strict: true })
      equipped = next
    } else if (input.kind === 'pet') {
      if (!PET_SPECIES.includes(itemCode)) throw new HttpError(400, 'Loài thú cưng không hợp lệ')
      next.pet = itemCode
      equipped = next
    } else {
      if (typeof itemCode !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,31}$/.test(itemCode)) throw new HttpError(400, 'Mã vật phẩm không hợp lệ')
      const item = itemResult(await db.from('reward_items').select('id,code,kind').eq('code', itemCode).eq('is_active', true).maybeSingle())
      if (!item) throw new HttpError(404, 'Không tìm thấy vật phẩm đang hiển thị')
      const unlock = itemResult(await db.from('reward_unlocks').select('item_id').eq('profile_id', profileId).eq('item_id', item.id).maybeSingle())
      if (!unlock) throw new HttpError(409, 'Bạn cần mở khóa vật phẩm này trước khi trang bị')
      next[item.kind] = item.code
      equipped = next
    }
    const values = { equipped, updated_at: now().toISOString() }
    if (current) itemResult(await db.from('reward_profile_prefs').update(values).eq('profile_id', profileId))
    else {
      const inserted = await db.from('reward_profile_prefs').insert({ profile_id: profileId, reminders_enabled: true, ...values })
      if (inserted.error?.code === '23505') itemResult(await db.from('reward_profile_prefs').update(values).eq('profile_id', profileId))
      else itemResult(inserted)
    }
    return inventory(profileId)
  }

  async function setReminders(profileId, enabled) {
    if (typeof enabled !== 'boolean') throw new HttpError(400, 'Tùy chọn nhắc nhẹ phải là bật hoặc tắt')
    const current = itemResult(await db.from('reward_profile_prefs').select('equipped').eq('profile_id', profileId).maybeSingle())
    const values = { reminders_enabled: enabled, updated_at: now().toISOString() }
    if (current) itemResult(await db.from('reward_profile_prefs').update(values).eq('profile_id', profileId))
    else {
      const inserted = await db.from('reward_profile_prefs').insert({ profile_id: profileId, equipped: {}, ...values })
      if (inserted.error?.code === '23505') itemResult(await db.from('reward_profile_prefs').update(values).eq('profile_id', profileId))
      else itemResult(inserted)
    }
    return { remindersEnabled: enabled }
  }

  /* ---- người tham gia */
  async function groupFor(profileId, settings) {
    const sessions = q(await db.from('tracking_sessions').select('id,survey_id,band,band_thresholds,completed_at')
      .eq('profile_id', profileId).not('band', 'is', null).order('completed_at', { ascending: true }))
    const group = currentGroup(sessions, settings.cycle_days)
    if (!group) return null
    const config = q(await db.from('survey_tracking_configs').select('rewards_enabled,bands').eq('survey_id', group.session.survey_id).maybeSingle())
    // Kênh hỗ trợ do nhà nghiên cứu cấu hình (bắt buộc khi bật mức điểm); không bao giờ tự tạo thông tin liên hệ
    return { tier: group.tier, enabled: config?.rewards_enabled === true, surveyId: group.session.survey_id, startedAt: group.session.completed_at, support: config?.bands?.supportText || null }
  }

  async function totals(profileId, today) {
    const rows = q(await db.from('reward_completions').select('local_date,points').eq('profile_id', profileId))
    const week = weekStart(today)
    const sum = list => list.reduce((total, row) => total + row.points, 0)
    return {
      balance: sum(rows),
      day: sum(rows.filter(row => row.local_date === today)),
      week: sum(rows.filter(row => row.local_date >= week))
    }
  }

  const publicTask = (task, state) => ({
    code: task.code, name: task.name, description: task.description, instructions: task.instructions, points: task.points, game: task.game || null,
    completionType: task.completion_type, minSeconds: task.min_seconds, minCount: task.min_count, choices: task.choices,
    window: task.window_start ? { start: task.window_start, end: task.window_end } : null, timesPerDay: task.times_per_day,
    durationMinutes: task.duration_minutes, placeholder: task.is_placeholder, days: task.start_day || task.end_day ? { start: task.start_day ?? null, end: task.end_day ?? null } : null, ...state
  })

  /** Màn hình "hôm nay": nhóm, điểm, trần còn lại và danh sách nhiệm vụ. Không bao giờ phạt hay đếm số ngày bỏ lỡ. */
  async function today(profileId) {
    const settings = await getSettings()
    const unit = { name: settings.unit_name, icon: settings.unit_icon }
    const group = await groupFor(profileId, settings)
    const base = { unit, enabled: false, group: null, tasks: [] }
    if (!group || !group.enabled) return base
    const moment = localParts(now(), settings.timezone)
    let streak
    if (settings.streak_enabled === true) streak = await getStreak(profileId, moment.date, settings)
    const sums = await totals(profileId, moment.date)
    const done = q(await db.from('reward_completions').select('task_id,slot').eq('profile_id', profileId).eq('local_date', moment.date))
    const programDayNow = programDay(group.startedAt, moment.date, settings.timezone)
    const tasks = taskPool(await listTasks({ onlyActive: true }), group.surveyId).filter(task => task.audience.includes(group.tier) && inDays(task, programDayNow))
    return {
      programDay: programDayNow,
      unit, enabled: true, group: { tier: group.tier, label: settings.group_labels[group.tier] },
      ...(streak ? { streak } : {}),
      balance: sums.balance, support: group.support,
      day: { earned: sums.day, cap: settings.daily_cap, remaining: Math.max(0, settings.daily_cap - sums.day) },
      week: { earned: sums.week, cap: settings.weekly_cap, remaining: Math.max(0, settings.weekly_cap - sums.week) },
      localDate: moment.date,
      tasks: tasks.map(task => {
        const count = done.filter(row => row.task_id === task.id).length
        return publicTask(task, { doneToday: count, completed: count >= task.times_per_day, available: count < task.times_per_day && inWindow(task, moment.minutes) })
      })
    }
  }

  async function getStreak(profileId, today, settings) {
    const allDates = async (table, mapError = q) => {
      const rows = []
      for (let offset = 0; ; offset += 1000) {
        const page = mapError(await db.from(table).select('local_date').eq('profile_id', profileId).order('local_date', { ascending: true }).range(offset, offset + 999))
        rows.push(...page)
        if (page.length < 1000) return rows
      }
    }
    const cards = await allDates('reward_rest_cards', streakResult)
    const completions = await allDates('reward_completions')
    const start = weekStart(today), end = shiftDate(start, 6)
    const usedThisWeek = cards.filter(card => card.local_date >= start && card.local_date <= end).length
    return {
      ...computeStreak(completions.map(row => row.local_date), cards.map(row => row.local_date), today),
      restCardsLeft: Math.max(0, settings.rest_cards_per_week - usedThisWeek),
      restCardsPerWeek: settings.rest_cards_per_week
    }
  }

  async function useRestCard(profileId, requestedDate) {
    const settings = await getSettings()
    if (settings.streak_enabled !== true) throw new HttpError(409, 'Chuỗi ngày và Thẻ nghỉ hiện đang tắt')
    const group = await groupFor(profileId, settings)
    if (!group?.enabled) throw new HttpError(403, 'Hệ thống nhiệm vụ chưa được bật cho hồ sơ này')
    const today = localParts(now(), settings.timezone).date
    const target = requestedDate === undefined || requestedDate === null || requestedDate === '' ? today : String(requestedDate)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(target) || (target !== today && target !== shiftDate(today, -1)))
      throw new HttpError(400, 'Chỉ có thể dùng Thẻ nghỉ cho hôm nay hoặc hôm qua')
    const cards = streakResult(await db.from('reward_rest_cards').select('local_date').eq('profile_id', profileId))
    const targetWeek = weekStart(target), targetWeekEnd = shiftDate(targetWeek, 6)
    if (cards.filter(card => card.local_date >= targetWeek && card.local_date <= targetWeekEnd).length >= settings.rest_cards_per_week)
      throw new HttpError(409, 'Bạn đã dùng hết Thẻ nghỉ của tuần này')
    const inserted = await db.from('reward_rest_cards').insert({ profile_id: profileId, local_date: target }).select('id').single()
    if (inserted.error?.code === '23505') throw new HttpError(409, 'Thẻ nghỉ cho ngày này đã được dùng rồi')
    streakResult(inserted)
    return { localDate: target, streak: await getStreak(profileId, today, settings) }
  }

  async function resolveTask(profileId, code) {
    const settings = await getSettings()
    const group = await groupFor(profileId, settings)
    if (!group?.enabled) throw new HttpError(403, 'Hệ thống nhiệm vụ chưa được bật cho hồ sơ này')
    const moment = localParts(now(), settings.timezone)
    const task = taskPool(await listTasks({ onlyActive: true }), group.surveyId).find(item => item.code === String(code || ''))
    if (!task || !task.audience.includes(group.tier)) throw new HttpError(404, 'Không tìm thấy nhiệm vụ')
    if (!inDays(task, programDay(group.startedAt, moment.date, settings.timezone))) throw new HttpError(409, 'Nhiệm vụ này không nằm trong lịch của ngày hôm nay')
    return { settings, group, task, moment }
  }

  const assertWindow = (task, moment) => {
    if (!inWindow(task, moment.minutes)) throw new HttpError(409, `Nhiệm vụ này chỉ làm được trong khung giờ ${task.window_start}–${task.window_end}`)
  }

  async function start(profileId, code) {
    const { task, moment } = await resolveTask(profileId, code)
    if (task.completion_type !== 'timer') throw new HttpError(400, 'Nhiệm vụ này không cần bắt đầu đếm giờ')
    assertWindow(task, moment)
    const existing = q(await db.from('reward_task_starts').select('started_at').eq('profile_id', profileId).eq('task_id', task.id).maybeSingle())
    const startedAt = now().toISOString()
    if (existing) q(await db.from('reward_task_starts').update({ started_at: startedAt }).eq('profile_id', profileId).eq('task_id', task.id))
    else q(await db.from('reward_task_starts').insert({ profile_id: profileId, task_id: task.id, started_at: startedAt }))
    return { startedAt, minSeconds: task.min_seconds }
  }

  async function cancelStart(profileId, code) {
    const { task } = await resolveTask(profileId, code)
    if (task.completion_type !== 'timer' || task.game !== 'breathing')
      throw new HttpError(400, 'Chỉ có thể dừng bài thở theo cách này')
    q(await db.from('reward_task_starts').delete().eq('profile_id', profileId).eq('task_id', task.id))
    return { cancelled: true }
  }

  /** Ghi nhận hoàn thành. Idempotent: gửi lặp không cộng thêm điểm. Điểm thực nhận = min(điểm nhiệm vụ, phần còn lại của trần ngày/tuần). */
  async function complete(profileId, code, body = {}) {
    const { settings, group, task, moment } = await resolveTask(profileId, code)
    assertWindow(task, moment)
    const meta = {}
    if (task.completion_type === 'self_report') {
      if (body.confirmed !== true) throw new HttpError(400, 'Hãy xác nhận bạn đã thực hiện nhiệm vụ')
    } else if (task.completion_type === 'timer') {
      const started = q(await db.from('reward_task_starts').select('started_at').eq('profile_id', profileId).eq('task_id', task.id).maybeSingle())
      if (!started) throw new HttpError(409, 'Hãy bắt đầu nhiệm vụ trước khi hoàn thành')
      const elapsed = (now() - new Date(started.started_at)) / 1000
      if (elapsed < task.min_seconds) throw new HttpError(409, `Cần thực hiện đủ ${Math.ceil(task.min_seconds / 60)} phút (còn ${Math.ceil(task.min_seconds - elapsed)} giây)`)
    } else if (task.completion_type === 'count_chars') {
      const count = Number(body.count)
      if (!Number.isInteger(count) || count < task.min_count || count > MAX_COUNT) throw new HttpError(400, `Cần ít nhất ${task.min_count} ký tự`)
      meta.count = count          // chỉ lưu số lượng, không bao giờ lưu nội dung
    } else if (task.completion_type === 'choice') {
      if (!task.choices.includes(body.choice)) throw new HttpError(400, 'Lựa chọn không hợp lệ')
      meta.choice = body.choice
    }

    const todays = q(await db.from('reward_completions').select('id,slot,points').eq('profile_id', profileId).eq('task_id', task.id).eq('local_date', moment.date))
    const respond = (row, duplicate) => ({ duplicate, points: row.points, task: { code: task.code, name: task.name }, unit: { name: settings.unit_name, icon: settings.unit_icon } })
    if (todays.length >= task.times_per_day) return respond(todays.sort((a, b) => b.slot - a.slot)[0], true)

    const sums = await totals(profileId, moment.date)
    const awarded = Math.max(0, Math.min(task.points, settings.daily_cap - sums.day, settings.weekly_cap - sums.week))
    const slot = todays.length + 1
    const inserted = await db.from('reward_completions').insert({
      profile_id: profileId, task_id: task.id, task_code: task.code, local_date: moment.date, slot, points: awarded, base_points: task.points,
      group_tier: group.tier, meta, completed_at: now().toISOString()
    }).select('id,points').single()
    if (inserted.error?.code === '23505') {              // gửi song song: giữ bản đã ghi, không cộng lần hai
      const existing = q(await db.from('reward_completions').select('id,points').eq('profile_id', profileId).eq('task_id', task.id).eq('local_date', moment.date).eq('slot', slot).maybeSingle())
      return respond(existing, true)
    }
    const row = q(inserted)
    if (task.completion_type === 'timer') await db.from('reward_task_starts').delete().eq('profile_id', profileId).eq('task_id', task.id)
    return { ...respond(row, false), capped: awarded < task.points, balance: sums.balance + awarded }
  }

  return {
    getSettings, saveSettings, listTasks, createTask, updateTask, listSurveyTasks, createSurveyTask, updateSurveyTask, listItems, createItem, updateItem,
    today, start, cancelStart, complete, useRestCard, inventory, village, world, collect, equip, setReminders, groupFor
  }
}
