// Cập nhật 5 nhiệm vụ nhóm vàng (Y-01…Y-05, bỏ nhãn mẫu) theo task-for-yellow-one.md và trần ngày 85 Sao vào hệ thống thật.
//   node scripts/apply-yellow-tasks.js            # chỉ xem sẽ thay đổi gì (mặc định, không ghi)
//   node scripts/apply-yellow-tasks.js --apply    # ghi vào database
// Chạy lại an toàn: tạo nhiệm vụ còn thiếu; chỉ cập nhật dòng vẫn đúng bản mẫu cũ. Dòng quản trị viên đã sửa thì
// được liệt kê và GIỮ NGUYÊN. Trần ngày chỉ đổi khi còn là 50; trần tuần giữ nguyên. Không đụng nhiệm vụ riêng của khảo sát,
// nhóm đỏ hay nhóm xanh. Cần migration 009 và 013.
import 'dotenv/config'
import { supabase } from '../src/config/supabase.js'
import { createRewardService } from '../src/services/reward.js'
import { planDailyCap, planYellowUpdate } from '../src/services/yellow-tasks.js'

const apply = process.argv.includes('--apply')
const service = createRewardService(supabase)
const existing = await service.listTasks()
const plan = planYellowUpdate(existing)

for (const item of plan) {
  if (item.action === 'create') console.log(`${item.task.code}: TẠO MỚI "${item.task.name}" (+${item.task.points})`)
  else if (item.action === 'update') console.log(`${item.task.code}: cập nhật "${item.current.name}" → "${item.task.name}" (+${item.current.points} → +${item.task.points})`)
  else if (item.action === 'same') console.log(`${item.task.code}: đã đúng, bỏ qua`)
  else console.log(`${item.task.code}: GIỮ NGUYÊN vì đã được sửa (khác bản mẫu cũ ở: ${item.edited.join(', ')})`)
  if (!apply) continue
  if (item.action === 'create') await service.createTask(item.task, null)
  if (item.action === 'update') await service.updateTask(item.current.id, item.task)
}

const settings = await service.getSettings()
const cap = planDailyCap(settings)
if (cap.action === 'update') console.log(`Trần ngày: ${cap.current} → ${cap.next} (trần tuần giữ ${settings.weekly_cap})`)
else console.log(cap.action === 'same' ? `Trần ngày: đã là ${settings.daily_cap}, bỏ qua` : `Trần ngày: GIỮ NGUYÊN ${cap.current} vì khác mức cũ 50; đổi ở #/admin/rewards nếu cần`)
if (apply && cap.action === 'update') await service.saveSettings({ daily_cap: cap.next }, null)

const own = existing.filter(task => task.survey_id && task.is_active)
if (own.length) console.log(`\nLưu ý: ${new Set(own.map(task => task.survey_id)).size} khảo sát có nhiệm vụ riêng đang bật; học sinh của các khảo sát đó KHÔNG thấy bộ chung này.`)
console.log(apply ? '\nĐã ghi xong.' : '\nChưa ghi gì. Thêm --apply để thực hiện.')
