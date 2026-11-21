/**
 * Nhiệm vụ mẫu theo solution.md. TẤT CẢ đều là dữ liệu TẠM (is_placeholder = true): nội dung chính thức chưa được chốt,
 * không tự biến thành nội dung can thiệp. Điểm đặt bằng nhau (10) để không nhóm nào có động lực nhận nhiều hơn;
 * trần ngày/tuần dùng chung (reward_settings). Quản trị viên chỉnh/ẩn/thay trong trang quản trị.
 */
const self = (code, name, audience, description, instructions, extra = {}) => ({
  code, name, audience, description, instructions, points: 10, completion_type: 'self_report', is_placeholder: true, ...extra
})

export const SEED_TASKS = [
  self('Y-01', 'Chợp mắt trưa 20 phút', ['yellow'], 'Ngủ trưa ngắn 15–20 phút để tỉnh táo hơn mà không bị choáng khi dậy.', 'Chọn khung 11:00–14:00, bấm bắt đầu và nghỉ ngơi đủ thời gian.',
    { completion_type: 'timer', min_seconds: 1200, duration_minutes: 20, window_start: '11:00', window_end: '14:00', verification: 'Máy chủ đếm giờ', game: 'rest_timer' }),
  self('Y-02', 'Ngừng caffeine sớm', ['yellow'], 'Không dùng cà phê, trà đặc hay nước tăng lực trong ít nhất 8 giờ trước giờ ngủ.', 'Xác nhận khi bạn đã làm được.', { verification: 'Tự báo cáo' }),
  self('Y-03', 'Giảm sáng màn hình', ['yellow'], 'Bật lọc ánh sáng xanh hoặc hạ độ sáng dưới 30% trước giờ ngủ 45 phút.', 'Xác nhận khi bạn đã điều chỉnh.', { verification: 'Tự báo cáo' }),
  self('Y-04', 'Khung giờ vàng 90 phút', ['yellow'], 'Chọn một khung 90 phút để làm việc khó nhất, không làm nhiều việc cùng lúc.', 'Xác nhận khi bạn đã dành khung giờ đó.', { duration_minutes: 90, verification: 'Tự báo cáo' }),
  self('Y-05', 'Giờ thức dậy đều đặn', ['yellow'], 'Thức dậy trong khoảng ±30 phút quanh giờ cố định, kể cả cuối tuần.', 'Xác nhận vào buổi sáng.', { window_start: '04:00', window_end: '11:00', verification: 'Mốc thời gian xác nhận' }),
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
