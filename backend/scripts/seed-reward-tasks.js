// Nạp nhiệm vụ mẫu (TẠM) vào hệ thống thật. Chạy lại an toàn: bỏ qua nhiệm vụ đã có cùng mã, không ghi đè chỉnh sửa của admin.
//   node scripts/seed-reward-tasks.js
// Cần migration 009. Nhiệm vụ nào cũng is_placeholder = true; ẩn/sửa trong trang quản trị.
import 'dotenv/config'
import { createRewardService } from '../src/services/reward.js'
import { SEED_TASKS } from '../src/services/reward-seed-tasks.js'
import { supabase } from '../src/config/supabase.js'

const service = createRewardService(supabase)
const existing = new Set((await service.listTasks()).map(task => task.code))
for (const task of SEED_TASKS) {
  if (existing.has(task.code)) { console.log(`Bỏ qua (đã có): ${task.code}`); continue }
  await service.createTask(task, null)
  console.log(`Đã tạo: ${task.code} ${task.name}`)
}
