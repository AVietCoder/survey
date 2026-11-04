// Tạo dữ liệu mẫu: user demo / demo1234 + 1 khảo sát đã xuất bản + ~40 phản hồi (có cả phản hồi đáng ngờ)
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { supabase, ok } from '../src/config/supabase.js'
import { saveQuestions, loadQuestions } from '../src/services/surveys.js'
import { evaluate } from '../src/services/quality.js'

const L = a => a.map(label => ({ label, value: label }))
const pick = a => a[Math.floor(Math.random() * a.length)]
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

let user = ok(await supabase.from('users').select('id').ilike('username', 'demo').maybeSingle())
if (!user) user = ok(await supabase.from('users').insert({ username: 'demo', password_hash: await bcrypt.hash('demo1234', 10) }).select('id').single())

const old = ok(await supabase.from('surveys').select('id').eq('public_slug', 'demo-remote').maybeSingle())
if (old) ok(await supabase.from('surveys').delete().eq('id', old.id))
const survey = ok(await supabase.from('surveys').insert({
  user_id: user.id, title: 'Cảm nhận về công việc từ xa', description: 'Khảo sát mẫu · khoảng 3 phút',
  status: 'published', public_slug: 'demo-remote'
}).select('*').single())

await saveQuestions(survey.id, [
  { question_text: 'Tôi cảm thấy được chủ động trong cách mình làm việc.', question_type: 'likert', settings: { lo: 'Hoàn toàn không đồng ý', hi: 'Hoàn toàn đồng ý' } },
  { question_text: 'Khung cảnh nào giúp bạn tập trung nhất?', question_type: 'image', options: L(['Rừng sớm', 'Phố đêm', 'Bãi biển']) },
  { question_text: 'Hôm nay bạn căng thẳng đến mức nào?', question_type: 'slider', settings: { lo: 'Bình tĩnh', hi: 'Rất căng thẳng' } },
  { question_text: 'Điều gì quan trọng nhất khi làm việc?', question_type: 'rank', options: L(['Tự do sắp xếp thời gian', 'Đồng nghiệp tốt', 'Mục đích rõ ràng', 'Thu nhập ổn định']) },
  { question_text: 'Văn hóa nhóm của bạn như thế nào?', question_type: 'sd', settings: { pairs: [['Yên tĩnh', 'Ồn ào'], ['Linh hoạt', 'Cứng nhắc'], ['Gắn kết', 'Cô lập']] } },
  { question_text: 'Một điều nhỏ sẽ cải thiện ngày làm việc của bạn?', question_type: 'longtext', is_required: false }
])
const qs = await loadQuestions(survey.id)
const [likert, image, slider, rank, sd, text] = qs
const texts = ['Có thêm giờ không họp', 'Cà phê ngon hơn', 'Phòng làm việc yên tĩnh', 'Ít thông báo chat hơn', 'Được nghỉ giữa giờ']

for (let i = 0; i < 44; i++) {
  const bad = i % 11 === 0                      // ~9% phản hồi “đáng ngờ”
  const days = rnd(0, 13), submitted = new Date(Date.now() - days * 864e5 - rnd(0, 80000) * 1000)
  const duration = bad ? rnd(9, 22) : rnd(110, 380)
  const started = new Date(submitted - duration * 1000)
  const v = bad ? 3 : null
  const answers = [
    { question_id: likert.id, value: v ?? rnd(2, 5) },
    { question_id: image.id, value: pick(image.options).label },
    { question_id: slider.id, value: bad ? 50 : rnd(10, 90) },
    { question_id: rank.id, value: rank.options.map(o => o.label).sort(() => Math.random() - .5) },
    { question_id: sd.id, value: Object.fromEntries(sd.settings.pairs.map(p => [p.join('|'), v ?? rnd(1, 5)])) }
  ]
  if (bad) answers.push({ question_id: text.id, value: 'asdfasdf' }); else if (Math.random() > .35) answers.push({ question_id: text.id, value: pick(texts) })
  const r = ok(await supabase.from('responses').insert({ survey_id: survey.id, started_at: started.toISOString(), ip_hash: 'seed' + i }).select('id').single())
  const q = await evaluate({ surveyId: survey.id, responseId: r.id, questions: qs, answers, duration, ipHash: 'seed' + i })
  ok(await supabase.from('answers').insert(answers.map(a => ({ response_id: r.id, question_id: a.question_id, answer_value: a.value }))))
  ok(await supabase.from('responses').update({ submitted_at: submitted.toISOString(), duration_seconds: duration, quality_status: q.status, quality_score: q.score, signals: q.signals, answer_hash: q.answerHash }).eq('id', r.id))
}
// vài lượt bắt đầu nhưng bỏ dở → completion rate thực tế
for (let i = 0; i < 8; i++) ok(await supabase.from('responses').insert({ survey_id: survey.id, ip_hash: 'drop' + i, started_at: new Date(Date.now() - rnd(1, 9) * 864e5).toISOString() }))
console.log('✔ Seed xong. Đăng nhập: demo / demo1234 · Link công khai: /#/s/demo-remote')
