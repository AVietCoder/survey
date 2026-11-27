/**
 * Nhóm vàng (Y-01…Y-05): nội dung và điểm theo task-for-yellow-one.md, chủ dự án xác nhận là chính thức (is_placeholder = false).
 * Nhóm đỏ và xanh: vẫn là bản mẫu TẠM (is_placeholder = true, 10 điểm) cho đến khi được duyệt.
 * Trần ngày/tuần dùng chung (reward_settings). Quản trị viên chỉnh/ẩn/thay trong trang quản trị.
 */
const self = (code, name, audience, description, instructions, extra = {}) => ({
  code, name, audience, description, instructions, points: 10, completion_type: 'self_report', is_placeholder: true, ...extra
})

export const SEED_TASKS = [
  // Y-01…Y-05: tên, hành động và điểm theo task-for-yellow-one.md (quyết định của chủ dự án, 2026-11-27)
  self('Y-01', "Power Nap 20'", ['yellow'], 'Chợp mắt trưa đúng 15–20 phút (không quá 30 phút) trong khoảng 11:00–14:00.', 'Bấm bắt đầu trong khung 11:00–14:00 và nghỉ đủ 20 phút. Xong rồi bạn có thể kể mình thấy thế nào.',
    { is_placeholder: false, points: 15, completion_type: 'timer', min_seconds: 1200, duration_minutes: 20, window_start: '11:00', window_end: '14:00', choices: ['Tỉnh táo hơn rồi ✨', 'Chưa thấy khác lắm 🌙'], verification: 'Máy chủ đếm giờ; câu hỏi sau khi nghỉ không bắt buộc', game: 'rest_timer' }),
  self('Y-02', 'Caffeine Curfew', ['yellow'], 'Ngừng hoàn toàn cà phê, trà đặc, nước tăng lực ít nhất 8 tiếng trước giờ dự định ngủ.', 'Sáng hôm sau, nếu hôm qua bạn đã ngừng đúng giờ: tối qua bạn mất khoảng bao lâu để chìm vào giấc ngủ?',
    { is_placeholder: false, points: 15, completion_type: 'choice', choices: ['Dưới 15 phút', '15–30 phút', '30–60 phút', 'Hơn 60 phút'], window_start: '04:00', window_end: '12:00', verification: 'Hỏi lại vào buổi sáng, chỉ lưu khoảng thời gian đã chọn' }),
  self('Y-03', 'Screen Dimming', ['yellow'], 'Bật lọc ánh sáng xanh hoặc hạ độ sáng thiết bị điện tử xuống dưới 30% trước giờ ngủ 45 phút.', 'Xác nhận khi bạn đã điều chỉnh.', { is_placeholder: false, points: 20, verification: 'Tự báo cáo' }),
  self('Y-04', 'Peak Block Lock', ['yellow'], 'Chọn 1 khung giờ vàng (90 phút) trong ngày để giải quyết việc khó nhất, không làm đa nhiệm (multitask).', 'Xác nhận khi bạn đã dành trọn khung giờ đó.', { is_placeholder: false, points: 15, duration_minutes: 90, verification: 'Tự báo cáo' }),
  self('Y-05', 'Anchor Wake-up', ['yellow'], 'Thức dậy trong biên độ ±30 phút so với giờ dậy cố định (kể cả cuối tuần).', 'Bấm xác nhận ngay sau khi dậy; hệ thống ghi lại thời điểm bạn xác nhận.', { is_placeholder: false, points: 20, window_start: '04:00', window_end: '11:00', verification: 'Mốc thời gian xác nhận' }),
  self('R-01', 'Bớt một việc hôm nay', ['red'], 'Hoãn, nhờ giúp hoặc tạm dừng một việc không gấp để nhẹ gánh hơn.', 'Chọn cách bạn đã làm. Hệ thống chỉ lưu loại lựa chọn, không lưu nội dung.',
    { completion_type: 'choice', choices: ['Hoãn một việc', 'Nhờ người giúp', 'Tạm dừng một hoạt động'], verification: 'Chỉ ghi loại lựa chọn' }),
  self('R-02', 'Tắt thông báo buổi tối', ['red'], 'Ngắt thông báo công việc, câu lạc bộ, nhóm học sau 22:30.', 'Xác nhận khi bạn đã tắt.', { window_start: '22:30', window_end: '23:59', verification: 'Tự báo cáo trong khung giờ' }),
  self('R-03', 'Thở hạ nhiệt 3 phút', ['red'], 'Hít sâu hai nhịp qua mũi, thở ra chậm qua miệng, lặp lại trong 3 phút.', 'Bấm bắt đầu và giữ nguyên màn hình cho đến khi đủ 3 phút.',
    { completion_type: 'timer', min_seconds: 180, duration_minutes: 3, verification: 'Máy chủ đếm giờ', game: 'breathing' }),
  self('R-04', 'Ngủ thêm một chút', ['red'], 'Ngủ thêm 45–60 phút so với tuần trước.', 'Xác nhận vào buổi sáng.', { window_start: '05:00', window_end: '12:00', verification: 'Tự báo cáo' }),
  self('R-05', 'Ghi 3 việc ngày mai', ['red'], 'Viết nhanh ra giấy 3 việc cần làm ngày mai trước khi lên giường.', 'Ghi ra giấy hoặc gõ vào ô; hệ thống chỉ đếm số ký tự, không đọc và không lưu nội dung.',
    { completion_type: 'count_chars', min_count: 12, verification: 'Chỉ đếm ký tự', game: 'three_plans' }),
  self('G-01', 'Giữ giờ ngủ quen thuộc', ['green'], 'Đi ngủ và thức dậy gần giờ quen thuộc của bạn.', 'Xác nhận khi bạn đã làm.', { verification: 'Tự báo cáo (nhiệm vụ mẫu tạm)' }),
  self('G-02', 'Nghỉ mắt 20 giây', ['green'], 'Nhìn xa 20 giây sau khi học một lúc.', 'Bấm bắt đầu và nhìn ra xa cho đến khi đủ 20 giây.',
    { completion_type: 'timer', min_seconds: 20, duration_minutes: 1, verification: 'Máy chủ đếm giờ (nhiệm vụ mẫu tạm)' }),
  self('G-03', 'Hít thở chậm 1 phút', ['green'], 'Hít vào chậm, thở ra chậm trong 1 phút.', 'Bấm bắt đầu và thở đều cho đến khi đủ 1 phút.',
    { completion_type: 'timer', min_seconds: 60, duration_minutes: 1, verification: 'Máy chủ đếm giờ (nhiệm vụ mẫu tạm)' })
].map((task, index) => ({ sort_order: index, ...task }))
