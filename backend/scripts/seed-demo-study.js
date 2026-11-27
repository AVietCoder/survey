// Tạo một nghiên cứu THỬ đầy đủ để kiểm thử luồng học sinh trên hệ thống thật. Chạy lại an toàn (không tạo trùng).
//   node scripts/seed-demo-study.js --user <username> [--dry-run]
// Tạo: nghiên cứu + khảo sát PSQI đã xuất bản + liên kết + cấu hình theo dõi (đồng ý, 3 mức điểm THỬ, kênh hỗ trợ THỬ, bật thưởng)
// + nhiệm vụ mẫu tạm. KHÔNG tạo phản hồi giả. Cần migration 006, 008, 009 (và 018 để tạo hồ sơ theo dõi).
// Ngưỡng PSQI lấy từ backend/config/psqi-bands.json: hai ngưỡng đã xác nhận (đủ ba mức) nếu có, nếu chưa thì chỉ ngưỡng công bố
// (hai mức, không có nhóm vàng). Script không tự đặt ngưỡng.
import 'dotenv/config'
import { supabase, ok } from '../src/config/supabase.js'
import { createTrackingService } from '../src/services/tracking.js'
import { createRewardService } from '../src/services/reward.js'
import { PSQI_PUBLISHED, confirmedPsqiCutoffs } from '../src/services/psqi-bands.js'
import { SEED_TASKS } from '../src/services/reward-seed-tasks.js'
import { TEMPLATES, createSurveyFromTemplate } from '../src/services/survey-templates.js'
import { loadQuestions } from '../src/services/surveys.js'

function psqiBands(supportText) {
  const cutoffs = confirmedPsqiCutoffs()
  if (!cutoffs) return { enabled: true, direction: PSQI_PUBLISHED.direction, cutoffs: [...PSQI_PUBLISHED.cutoffs], labels: [...PSQI_PUBLISHED.labels], showToStudent: false, supportText }
  const [low, high] = cutoffs
  return { enabled: true, direction: 'higher_worse', cutoffs, labels: [`Điểm 0–${low - 1}`, `Điểm ${low}–${high - 1}`, `Điểm ${high} trở lên`], showToStudent: false, supportText }
}

const args = process.argv.slice(2)
const username = args.includes('--user') ? args[args.indexOf('--user') + 1] : undefined
const dry = args.includes('--dry-run')
if (!username) { console.error('Thiếu --user <username>'); process.exit(1) }
const user = ok(await supabase.from('users').select('id,username').ilike('username', username).maybeSingle())
if (!user) { console.error(`Không tìm thấy tài khoản "${username}"`); process.exit(1) }

const PROJECT_TITLE = 'Nghiên cứu thử: Giấc ngủ học sinh (DỮ LIỆU THỬ)'
const template = TEMPLATES.psqi
const say = text => console.log(dry ? `[dry-run] ${text}` : text)

const CONSENT = `Mình mời bạn lưu kết quả bài này vào một hồ sơ ẩn danh trên trình duyệt để xem sự thay đổi qua các lần làm. Hồ sơ không có tên, email hay số điện thoại; bạn có thể xóa bất cứ lúc nào. Kết quả chỉ là gợi ý tham khảo, không phải chẩn đoán. Đây là nghiên cứu THỬ NGHIỆM nội bộ.`
const SUPPORT = 'THỬ NGHIỆM: Phòng tư vấn học đường (thông tin ví dụ, hãy thay bằng kênh thật của trường trước khi dùng thật).'

let project = ok(await supabase.from('research_projects').select('id').eq('owner_id', user.id).eq('title', PROJECT_TITLE).maybeSingle())
if (project) say(`Nghiên cứu đã có: ${project.id}`)
else if (!dry) {
  project = ok(await supabase.from('research_projects').insert({
    owner_id: user.id, title: PROJECT_TITLE,
    description: 'Nghiên cứu mẫu để thử toàn bộ luồng: làm khảo sát, tạo hồ sơ theo dõi, tài khoản học sinh, nhiệm vụ và Làng nhỏ. Có thể xóa sau khi thử.'
  }).select('id').single())
  say(`Đã tạo nghiên cứu: ${project.id}`)
}

const tracking = createTrackingService(supabase)
let survey = ok(await supabase.from('surveys').select('*').eq('user_id', user.id).eq('title', template.title).maybeSingle())
if (survey) say(`Khảo sát PSQI đã có: ${survey.id} (${survey.status})`)
else if (!dry) {
  const result = await createSurveyFromTemplate({ key: 'psqi', userId: user.id, trackingService: tracking, status: 'published' })
  survey = result.survey
  say(`Đã tạo khảo sát PSQI đã xuất bản: ${survey.id}`)
}

if (survey && project && !dry) {
  const link = ok(await supabase.from('research_project_surveys').select('survey_id').eq('project_id', project.id).eq('survey_id', survey.id).maybeSingle())
  if (!link) {
    ok(await supabase.from('research_project_surveys').insert({ project_id: project.id, survey_id: survey.id, linked_by: user.id }))
    say('Đã liên kết khảo sát vào nghiên cứu')
  }
  if (survey.status !== 'published') { ok(await supabase.from('surveys').update({ status: 'published' }).eq('id', survey.id)); survey.status = 'published' }

  const existing = await tracking.getConfig(survey.id)
  if (existing?.enabled && existing?.rewards_enabled && existing?.bands?.enabled) say('Cấu hình theo dõi + thưởng đã bật sẵn, giữ nguyên')
  else {
    const questions = await loadQuestions(survey.id)
    await tracking.saveConfig({
      survey, userId: user.id, questions, body: {
        enabled: true, assessmentName: 'Pittsburgh Sleep Quality Index', scoreMeaning: 'Điểm tổng 0–21; điểm càng cao thì chất lượng giấc ngủ càng kém.',
        scoring: { method: 'instrument', instrument: 'psqi', version: '1' }, consentText: CONSENT, adultAttestation: false,
        schedule: { intervalDays: 14 }, rewardsEnabled: true,
        bands: psqiBands(SUPPORT)
      }
    })
    say(`Đã bật theo dõi + chia ${psqiBands('').cutoffs.length + 1} mức + kênh hỗ trợ (thử) + nhiệm vụ & điểm thưởng`)
  }
}

if (!dry) {
  const rewards = createRewardService(supabase)
  const have = new Set((await rewards.listTasks()).map(task => task.code))
  for (const task of SEED_TASKS) if (!have.has(task.code)) { await rewards.createTask(task, null); say(`Đã tạo nhiệm vụ mẫu: ${task.code}`) }
}

if (survey) console.log(`\nLink làm khảo sát: http://localhost:3000/#/s/${survey.public_slug}`)
