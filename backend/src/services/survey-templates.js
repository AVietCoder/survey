import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { INSTRUMENTS } from './tracking-instruments.js'
import { loadQuestions, newSlug, saveQuestions } from './surveys.js'

/**
 * Thư viện mẫu khảo sát dựng sẵn từ thang đo chuẩn. Mỗi câu hỏi mang `settings.key` để bộ chấm điểm
 * (tracking-instruments.js) ánh xạ đúng mục của thang đo. Nội dung theo hai tệp nguồn của dự án
 * (bản tiếng Việt); các trường định danh (trung tâm, số thứ tự) của HCL-32 được bỏ để giữ ẩn danh.
 */

const FREQUENCY = [
  { label: 'Không có trong tháng vừa qua', value: '0' }, { label: 'Ít hơn một lần một tuần', value: '1' },
  { label: 'Một đến hai lần một tuần', value: '2' }, { label: 'Từ ba lần trở lên một tuần', value: '3' }
]
const single = (key, text, options, { required = true } = {}) => ({ question_type: 'single', question_text: text, is_required: required, options, settings: { key } })
const freq = (key, text, required = true) => single(key, text, FREQUENCY, { required })
const text = (key, textLabel, { required = true, placeholder = '' } = {}) => ({ question_type: 'text', question_text: textLabel, is_required: required, options: [], settings: { key, ...(placeholder ? { placeholder } : {}) } })

const PSQI_QUESTIONS = [
  text('psqi_bedtime', '1. Trong tháng vừa qua, bạn thường đi ngủ vào mấy giờ? (ghi dạng giờ:phút theo đồng hồ 24 giờ, ví dụ 23:30)', { placeholder: '23:30' }),
  text('psqi_latency_min', '2. Trong tháng vừa qua, thời gian trung bình để bạn rơi vào giấc ngủ là bao lâu? (tính bằng phút, ví dụ 20)', { placeholder: '20' }),
  text('psqi_waketime', '3. Trong tháng vừa qua, bạn thường thức dậy lúc mấy giờ vào buổi sáng? (ghi dạng giờ:phút theo đồng hồ 24 giờ, ví dụ 06:30)', { placeholder: '06:30' }),
  text('psqi_sleep_hours', '4. Trong tháng vừa qua, tổng số giờ bạn đã ngủ mỗi đêm là bao nhiêu? (không nhất thiết bằng thời gian nằm trên giường, ví dụ 6.5)', { placeholder: '6.5' }),
  freq('psqi_5a', '5a. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Không thể ngủ trong 30 phút'),
  freq('psqi_5b', '5b. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Tỉnh giấc nửa đêm hoặc sáng sớm'),
  freq('psqi_5c', '5c. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Phải thức dậy để đi vệ sinh'),
  freq('psqi_5d', '5d. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Không thể thở thoải mái'),
  freq('psqi_5e', '5e. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Ho hoặc ngáy to'),
  freq('psqi_5f', '5f. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Cảm thấy quá lạnh'),
  freq('psqi_5g', '5g. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Cảm thấy quá nóng'),
  freq('psqi_5h', '5h. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Gặp ác mộng'),
  freq('psqi_5i', '5i. Trong tháng vừa qua, tần suất bạn gặp khó khăn khi ngủ: Thấy đau'),
  freq('psqi_5j', '5j. Nếu có nguyên nhân khác khiến bạn khó ngủ, tần suất trong tháng vừa qua (bỏ qua nếu không có)', false),
  single('psqi_quality', '6. Đánh giá chất lượng giấc ngủ tổng thể trong tháng vừa qua', [
    { label: 'Rất tốt', value: '0' }, { label: 'Tốt', value: '1' }, { label: 'Kém', value: '2' }, { label: 'Rất kém', value: '3' }]),
  freq('psqi_medication', '7. Tần suất sử dụng thuốc hỗ trợ giấc ngủ, dù được kê đơn hay mua không cần đơn, trong tháng vừa qua'),
  freq('psqi_daytime_alert', '8. Tần suất gặp khó khăn trong việc duy trì sự tỉnh táo khi lái xe, ăn uống hoặc tham gia các hoạt động xã hội trong tháng vừa qua'),
  single('psqi_enthusiasm', '9. Mức độ khó khăn đối với bạn trong việc duy trì đủ nhiệt huyết để hoàn thành công việc trong tháng vừa qua', [
    { label: 'Không có vấn đề gì', value: '0' }, { label: 'Một vấn đề rất nhỏ', value: '1' },
    { label: 'Có thể xem là một vấn đề tương đối', value: '2' }, { label: 'Một vấn đề rất lớn', value: '3' }]),
  // Các câu dưới đây KHÔNG tính vào điểm PSQI (thông tin bổ sung theo bản gốc)
  single('psqi_partner', '10. Bạn có ngủ chung với ai không (bạn đời/bạn ở cùng)? (không tính vào điểm)', [
    { label: 'Không có', value: '0' }, { label: 'Bạn đời/bạn ở cùng nhưng ở phòng khác', value: '1' },
    { label: 'Bạn đời ở chung phòng, khác giường', value: '2' }, { label: 'Bạn đời ngủ chung giường', value: '3' }], { required: false }),
  ...[['snore', 'Ngáy to'], ['apnea', 'Thở đứt quãng'], ['legs', 'Chân co giật hoặc giật mạnh trong lúc ngủ'], ['confusion', 'Cảm giác mất phương hướng hoặc lú lẫn trong khi ngủ'], ['restless', 'Những biểu hiện bồn chồn, không yên khác']]
    .map(([id, label]) => freq(`psqi_partner_${id}`, `Nếu có người ngủ chung, hãy hỏi họ trong tháng vừa qua bạn đã: ${label} (không tính vào điểm)`, false))
]

const HCL32_ITEMS = [
  'Tôi ít cần ngủ hơn', 'Tôi cảm thấy tràn đầy năng lượng và năng động hơn.', 'Tôi thấy tự tin hơn về bản thân', 'Tôi tận hưởng công việc của mình hơn',
  'Tôi trở nên hòa đồng hơn (gọi điện nhiều hơn, ra ngoài nhiều hơn)', 'Tôi muốn đi du lịch nhiều hơn', 'Tôi có xu hướng lái xe nhanh hơn hoặc chấp nhận nhiều rủi ro hơn khi lái xe',
  'Tôi tiêu tiền nhiều hơn bình thường/rất nhiều', 'Tôi có xu hướng hành động mạo hiểm hơn hoặc dễ đưa ra các quyết định vội vàng, liều lĩnh trong học tập và các hoạt động thường ngày mà ít cân nhắc hậu quả',
  'Tôi hoạt động thể chất nhiều hơn', 'Tôi lên kế hoạch cho nhiều hoạt động hoặc dự án hơn', 'Tôi có nhiều ý tưởng và sáng tạo hơn', 'Tôi ít nhút nhát hoặc ít dè dặt hơn',
  'Tôi mặc quần áo/trang điểm sặc sỡ và nổi bật hơn.', 'Tôi muốn gặp gỡ nhiều người hơn', 'Tôi cảm thấy nhạy cảm hơn về mặt cảm xúc và có nhu cầu kết nối tình cảm cao hơn bình thường',
  'Tôi có xu hướng cởi mở quá mức, thích thu hút sự chú ý hoặc chủ động bắt chuyện, tương tác xã hội nhiều hơn bình thường', 'Tôi nói nhiều hơn', 'Tôi nghĩ nhanh hơn',
  'Tôi “joke” hoặc chơi chữ nhiều hơn khi nói chuyện', 'Tôi dễ bị phân tâm hơn.', 'Tôi tham gia vào nhiều hoạt động mới.', 'Tôi suy nghĩ về nhiều thứ khác nhau trong thời gian ngắn.',
  'Tôi thực hiện mọi việc nhanh hơn và/hoặc dễ dàng hơn.', 'Tôi thiếu kiên nhẫn hơn và/hoặc dễ cáu kỉnh hơn.', 'Tôi có thể khiến người khác cảm thấy mệt mỏi hoặc khó chịu.',
  'Tôi thường xuyên vướng vào các cuộc tranh cãi hơn.', 'Tâm trạng của tôi hưng phấn hơn, lạc quan hơn.', 'Tôi uống nhiều cà phê hơn.', 'Tôi hút thuốc lá nhiều hơn.',
  'Tôi tiêu thụ nhiều đồ uống chứa chất kích thích tỉnh táo hơn (như cà phê, nước tăng lực, trà đặc, nước ngọt có ga...)',
  'Tôi sử dụng nhiều các loại thực phẩm bổ sung, viên uống hỗ trợ tỉnh táo/tập trung hoặc thuốc hỗ trợ giấc ngủ hơn bình thường'
]
const TRUE_FALSE = [{ label: 'Đúng', value: 'true' }, { label: 'Sai', value: 'false' }]
const IMPACT = [{ label: 'Tích cực VÀ tiêu cực', value: 'both' }, { label: 'Tích cực', value: 'positive' }, { label: 'Tiêu cực', value: 'negative' }]
const HCL32_QUESTIONS = [
  text('hcl_age', 'Tuổi của bạn (không bắt buộc)', { required: false }),
  single('hcl_gender', 'Giới tính (không bắt buộc)', [{ label: 'Nam', value: 'male' }, { label: 'Nữ', value: 'female' }], { required: false }),
  single('hcl_now', '1. Hiện tại bạn cảm thấy như thế nào so với thường ngày? (không tính vào điểm)', [
    'Tệ hơn thường ngày rất nhiều', 'Tệ hơn thường ngày', 'Có hơi tệ hơn thường ngày', 'Như mọi khi', 'Tốt hơn thường ngày một chút', 'Tốt hơn thường ngày', 'Rất tốt so với thường ngày'
  ].map((label, index) => ({ label, value: String(index) })), { required: false }),
  single('hcl_usual', '2. So với những người khác, mức độ hoạt động, năng lượng và tâm trạng thông thường của tôi… (không tính vào điểm)', [
    { label: '…luôn tương đối ổn định và cân bằng', value: 'stable' }, { label: '…nhìn chung cao hơn', value: 'higher' },
    { label: '…nhìn chung thấp hơn', value: 'lower' }, { label: '…thường có những giai đoạn lên xuống thất thường', value: 'fluctuating' }], { required: false }),
  ...HCL32_ITEMS.map((item, index) => single(`hcl_${index + 1}`, `3.${index + 1}. Hãy nhớ về một giai đoạn bạn cảm thấy “hưng phấn” hoặc “năng lượng tràn trề”. Trong trạng thái đó: ${item}`, TRUE_FALSE)),
  ...[['family', 'Đời sống gia đình'], ['social', 'Mối quan hệ xã hội'], ['work', 'Công việc'], ['leisure', 'Giải trí']]
    .map(([id, label]) => single(`hcl_impact_${id}`, `4. Tác động của những giai đoạn “hưng phấn” lên ${label.toLowerCase()} của bạn (không tính vào điểm)`, IMPACT, { required: false })),
  single('hcl_reaction', '5. Người thân thiết với bạn phản ứng hoặc nhận xét thế nào về những giai đoạn “hưng phấn” của bạn? (không tính vào điểm)', [
    'Tích cực (khích lệ/ủng hộ)', 'Trung lập', 'Tiêu cực (lo lắng, khó chịu, bực bội hoặc chỉ trích)', 'Vừa tích cực vừa tiêu cực', 'Không có phản ứng'
  ].map((label, index) => ({ label, value: String(index) })), { required: false }),
  single('hcl_duration', '6. Thời lượng thông thường của những giai đoạn “hưng phấn” (tính trung bình) (không tính vào điểm)', [
    '1 ngày', '2 - 3 ngày', '4 - 7 ngày', 'Hơn 1 tuần', 'Hơn 1 tháng', 'Không thể đánh giá/Không biết'
  ].map((label, index) => ({ label, value: String(index) })), { required: false }),
  single('hcl_past12', '7. Bạn có trải qua những giai đoạn “hưng phấn” như vậy trong 12 tháng qua không? (không tính vào điểm)', [{ label: 'Có', value: 'yes' }, { label: 'Không', value: 'no' }], { required: false }),
  text('hcl_days12', '8. Nếu có, ước tính tổng số ngày bạn ở trạng thái “cao” trong 12 tháng qua (không bắt buộc)', { required: false })
]

export const TEMPLATES = {
  psqi: {
    key: 'psqi', instrument: 'psqi', title: 'Pittsburgh Sleep Quality Index (PSQI)',
    description: 'Đánh giá chất lượng giấc ngủ trong tháng vừa qua. Hướng dẫn: trả lời dựa trên thói quen ngủ thông thường trong những tháng vừa qua, phản ánh phần lớn ngày và đêm.',
    questions: PSQI_QUESTIONS,
    notes: 'Điểm tổng 0–21 từ 7 thành phần (chất lượng chủ quan, độ trễ vào giấc, thời lượng, hiệu suất giấc ngủ, rối loạn giấc ngủ, thuốc ngủ, rối loạn ban ngày). Chỉ sàng lọc, không chẩn đoán.'
  },
  hcl32: {
    key: 'hcl32', instrument: 'hcl32', title: 'The London Psychiatry Centre HCL-32 (bảng kiểm tra triệu chứng hưng cảm nhẹ)',
    description: 'Vào những thời điểm khác nhau trong cuộc đời, mỗi người đều có những giai đoạn “thăng” hoặc “trầm”. Bộ câu hỏi này đánh giá các đặc điểm của giai đoạn “thăng” hoặc “hưng phấn”. Bạn có thể bỏ qua nếu không muốn trả lời.',
    questions: HCL32_QUESTIONS,
    notes: 'Điểm là số nhận định được chọn ĐÚNG (0–32). Chỉ sàng lọc, không chẩn đoán.'
  }
}

export const listTemplates = () => Object.values(TEMPLATES).map(template => ({
  key: template.key, title: template.title, description: template.description, notes: template.notes,
  questionCount: template.questions.length, instrument: INSTRUMENTS[template.instrument].name,
  publishedBands: INSTRUMENTS[template.instrument].publishedBands
}))

/**
 * Tạo khảo sát (bản nháp) từ mẫu cho một tài khoản, kèm cấu hình chấm điểm Progress Tracking ở trạng thái TẮT
 * (nếu migration 006 chưa chạy thì bỏ qua và báo `trackingConfigured: false`).
 * `trackingService` truyền vào để dùng được cả trong controller lẫn script seed.
 */
export async function createSurveyFromTemplate({ key, userId, trackingService, status = 'draft' }) {
  const template = TEMPLATES[key]
  if (!template) throw new HttpError(404, 'Không tìm thấy mẫu khảo sát')
  const survey = ok(await supabase.from('surveys').insert({
    user_id: userId, title: template.title, description: template.description, public_slug: newSlug(), status: 'draft'
  }).select('*').single())
  try {
    await saveQuestions(survey.id, template.questions)
    if (status === 'published') ok(await supabase.from('surveys').update({ status: 'published' }).eq('id', survey.id))
  } catch (error) {
    await supabase.from('surveys').delete().eq('id', survey.id)     // không để lại khảo sát dở dang
    throw error
  }
  let trackingConfigured = false, trackingHint = null
  if (trackingService) {
    try {
      const questions = await loadQuestions(survey.id)
      await trackingService.saveConfig({
        survey, userId, questions, body: {
          enabled: false, assessmentName: INSTRUMENTS[template.instrument].name.replace(/ \(.*\)$/, ''),
          scoreMeaning: INSTRUMENTS[template.instrument].meaning, scoring: { method: 'instrument', instrument: template.instrument, version: '1' }
        }
      })
      trackingConfigured = true
    } catch (error) {
      if (error.status !== 503) throw error
      trackingHint = error.message
    }
  }
  return { survey: { ...survey, status }, trackingConfigured, trackingHint }
}
