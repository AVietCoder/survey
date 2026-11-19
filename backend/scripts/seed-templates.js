// Đưa các khảo sát mẫu (PSQI, HCL-32) vào hệ thống thật dưới MỘT tài khoản chỉ định.
//   node scripts/seed-templates.js --list-users              (chỉ liệt kê username, không ghi gì)
//   node scripts/seed-templates.js --user <username>         (tạo bản nháp; bỏ qua mẫu đã có cùng tiêu đề)
//   node scripts/seed-templates.js --user <username> --publish
// An toàn khi chạy lại: không tạo trùng. Cấu hình chấm điểm cần migration 006 (và 008 cho mức điểm); thiếu thì chỉ tạo khảo sát.
import 'dotenv/config'
import { supabase, ok } from '../src/config/supabase.js'
import { createTrackingService } from '../src/services/tracking.js'
import { TEMPLATES, createSurveyFromTemplate } from '../src/services/survey-templates.js'

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const valueOf = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined }

if (flag('--list-users')) {
  const users = ok(await supabase.from('users').select('username,is_admin,created_at').order('created_at'))
  for (const user of users) console.log(`${user.username}${user.is_admin ? '  (admin)' : ''}`)
  process.exit(0)
}

const username = valueOf('--user')
if (!username) { console.error('Thiếu --user <username>. Dùng --list-users để xem tài khoản.'); process.exit(1) }
const user = ok(await supabase.from('users').select('id,username').ilike('username', username).maybeSingle())
if (!user) { console.error(`Không tìm thấy tài khoản "${username}".`); process.exit(1) }

const service = createTrackingService(supabase)
for (const template of Object.values(TEMPLATES)) {
  const existing = ok(await supabase.from('surveys').select('id').eq('user_id', user.id).eq('title', template.title).maybeSingle())
  if (existing) { console.log(`Bỏ qua (đã có): ${template.title}`); continue }
  const result = await createSurveyFromTemplate({ key: template.key, userId: user.id, trackingService: service, status: flag('--publish') ? 'published' : 'draft' })
  console.log(`Đã tạo: ${template.title}`)
  console.log(`  id: ${result.survey.id}  trạng thái: ${result.survey.status}  link: /#/s/${result.survey.public_slug}`)
  console.log(`  cấu hình chấm điểm: ${result.trackingConfigured ? 'đã tạo (đang tắt theo dõi)' : 'CHƯA tạo — ' + result.trackingHint}`)
}
