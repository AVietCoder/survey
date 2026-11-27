/* Kế hoạch cập nhật nhiệm vụ nhóm vàng và trần điểm ngày trên hệ thống đã nạp bản cũ. Hàm thuần để kiểm thử được;
   script scripts/apply-yellow-tasks.js thực hiện. Không bao giờ ghi đè nội dung quản trị viên đã sửa. */
import { SEED_TASKS } from './reward-seed-tasks.js'

/** Bản mẫu đầu (trước 2026-11-27). */
export const OLD_YELLOW = Object.freeze({
  'Y-01': { name: 'Chợp mắt trưa 20 phút', description: 'Ngủ trưa ngắn 15–20 phút để tỉnh táo hơn mà không bị choáng khi dậy.', instructions: 'Chọn khung 11:00–14:00, bấm bắt đầu và nghỉ ngơi đủ thời gian.', points: 10, completion_type: 'timer', window_start: '11:00', window_end: '14:00' },
  'Y-02': { name: 'Ngừng caffeine sớm', description: 'Không dùng cà phê, trà đặc hay nước tăng lực trong ít nhất 8 giờ trước giờ ngủ.', instructions: 'Xác nhận khi bạn đã làm được.', points: 10, completion_type: 'self_report', window_start: null, window_end: null },
  'Y-03': { name: 'Giảm sáng màn hình', description: 'Bật lọc ánh sáng xanh hoặc hạ độ sáng dưới 30% trước giờ ngủ 45 phút.', instructions: 'Xác nhận khi bạn đã điều chỉnh.', points: 10, completion_type: 'self_report', window_start: null, window_end: null },
  'Y-04': { name: 'Khung giờ vàng 90 phút', description: 'Chọn một khung 90 phút để làm việc khó nhất, không làm nhiều việc cùng lúc.', instructions: 'Xác nhận khi bạn đã dành khung giờ đó.', points: 10, completion_type: 'self_report', window_start: null, window_end: null },
  'Y-05': { name: 'Giờ thức dậy đều đặn', description: 'Thức dậy trong khoảng ±30 phút quanh giờ cố định, kể cả cuối tuần.', instructions: 'Xác nhận vào buổi sáng.', points: 10, completion_type: 'self_report', window_start: '04:00', window_end: '11:00' }
})

const COMPARED = ['name', 'description', 'instructions', 'points', 'completion_type', 'window_start', 'window_end']
const content = task => Object.fromEntries(COMPARED.map(key => [key, task[key] ?? null]))
const same = (row, reference) => Object.keys(reference).filter(key => (row[key] ?? null) !== (reference[key] ?? null))

/** Mọi bản mà chính dự án từng nạp: chỉ những dòng còn đúng một trong các bản này mới được thay. */
function previousVersions(task) {
  const versions = [OLD_YELLOW[task.code]]
  // bản nạp ngày 2026-11-27: Y-01 còn ghi 12h30–14h00 trong mô tả
  if (task.code === 'Y-01') versions.push({ ...content(task), description: task.description.replace('11:00–14:00', '12h30–14h00') })
  return versions
}

export function planYellowUpdate(existing) {
  return SEED_TASKS.filter(task => OLD_YELLOW[task.code]).map(task => {
    const current = existing.find(row => row.code === task.code && !row.survey_id)
    if (!current) return { action: 'create', task }
    const upToDate = !same(current, content(task)).length && JSON.stringify(current.choices ?? null) === JSON.stringify(task.choices ?? null)
    const ours = upToDate || previousVersions(task).some(version => !same(current, version).length)
    if (!ours) return { action: 'keep', task, current, edited: same(current, OLD_YELLOW[task.code]) }
    if (upToDate && current.is_placeholder === false) return { action: 'same', task, current }
    // giữ trạng thái ẩn/hiện và thứ tự quản trị viên đang dùng; bỏ nhãn "nhiệm vụ mẫu"
    return { action: 'update', current, task: { ...task, is_active: current.is_active, sort_order: current.sort_order } }
  })
}

/** Trần ngày 85 = tổng điểm năm nhiệm vụ vàng. Chỉ đổi khi vẫn là mức cũ 50; mức admin tự đặt được giữ. Trần tuần không đổi. */
export const DAILY_CAP = 85
export function planDailyCap(settings) {
  if (settings.daily_cap === DAILY_CAP) return { action: 'same' }
  if (settings.daily_cap !== 50) return { action: 'keep', current: settings.daily_cap }
  return { action: 'update', current: 50, next: DAILY_CAP }
}
