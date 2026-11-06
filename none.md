# brainst0rm — Survey Platform (MVP)

Frontend giữ nguyên giao diện gốc (HTML/CSS/JS thuần), backend Node.js + Express + Supabase PostgreSQL.
Express phục vụ luôn thư mục `frontend/` nên chỉ cần chạy **một** server.

## Chạy thử

1. Tạo project trên [supabase.com](https://supabase.com). Vào **SQL Editor** và chạy migration theo thứ tự: database mới chạy `backend/migrations/001_init.sql` đến `005_dataset_versions.sql`; database đã có thì chạy các migration còn thiếu. Migration 004 thêm quản lý nghiên cứu; migration 005 thêm metadata phiên bản dataset.
2. Cấu hình môi trường:
   ```bash
   cd backend
   cp .env.example .env     # điền SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, IP_SALT
   npm install
   npm run seed             # (tuỳ chọn) user demo / demo1234 + khảo sát mẫu + ~44 phản hồi
   npm start                # http://localhost:3000
   ```
3. Mở http://localhost:3000 → đăng ký hoặc đăng nhập `demo / demo1234`.
   Khảo sát mẫu công khai: http://localhost:3000/#/s/demo-remote

> `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng ở backend. Không đưa vào frontend, không commit `.env`.

## Cấu trúc
```
frontend/            index.html, css/, js/app.js (gọi /api/*)
backend/
  migrations/        schema nền, admin, response review, research management, dataset versions
  scripts/seed.js    dữ liệu mẫu
  src/
    config/          supabase client
    middleware/      requireAuth, requireAdmin (kiểm tra quyền từ database), errorHandler
    routes/          khai báo endpoint
    controllers/     auth, surveys, public, responses, analytics, research projects, admin
    services/        surveys, quality, research project access
    app.js
```

## API
| | |
|---|---|
| `POST /api/auth/register · login · logout`, `GET /api/auth/me` | Username + mật khẩu (bcrypt), phiên 7 ngày qua cookie httpOnly |
| `GET/POST /api/surveys`, `GET/PUT/DELETE /api/surveys/:id` | Chỉ thao tác trên khảo sát của chính user (lọc `user_id` ở mọi truy vấn) |
| `GET /api/public/surveys/:slug` | Lấy khảo sát đã xuất bản, không cần đăng nhập |
| `POST /api/public/surveys/:slug/start` | *(bổ sung)* ghi nhận lúc bắt đầu → tính completion rate và thời gian làm bài ở server |
| `POST /api/public/surveys/:slug/responses` | Gửi phản hồi `{ responseId, answers:[{question_id,value}] }` |
| `GET /api/responses/survey/:surveyId?page=1&status=needs_review` | Danh sách phản hồi đã hoàn tất, phân trang 25 mục; lọc tùy chọn theo trạng thái review |
| `PUT /api/responses/:responseId/review` | Researcher đánh giá với `{status:"needs_review|accepted|excluded", note:"..."}`; quyền kiểm tra theo chủ sở hữu khảo sát |
| `GET /api/analytics/overview` | Tổng quan các khảo sát của người dùng |
| `GET /api/analytics/survey/:surveyId?from=YYYY-MM-DD&to=YYYY-MM-DD` | Thống kê theo câu hỏi; khoảng ngày UTC tùy chọn |
| `POST /api/analytics/survey/:surveyId/reliability?from=...&to=...` | Cronbach’s alpha cho các câu Likert/rating được chọn; complete-case |
| `POST /api/analytics/survey/:surveyId/analysis?from=...&to=...` | So sánh nhóm theo câu single, cross-tab single×single hoặc Pearson r giữa câu số |
| `GET/POST /api/research/projects?page=1` | Liệt kê nghiên cứu được chia sẻ với user hoặc tạo nghiên cứu |
| `GET/PATCH /api/research/projects/:id` | Xem nghiên cứu hoặc cập nhật tiêu đề, mô tả và trạng thái |
| `/api/research/projects/:id/members` | Chủ nghiên cứu thêm/gỡ thành viên với vai trò `researcher` hoặc `reviewer` |
| `/api/research/projects/:id/surveys/:surveyId` | Liên kết/gỡ liên kết khảo sát; không xóa dữ liệu khảo sát |
| `GET/POST /api/research/projects/:id/participants` | Danh sách phân trang và tạo mã participant ngẫu nhiên; không lưu PII |
| `PATCH /api/research/projects/:id/participants/:participantId` | Cập nhật trạng thái participant thủ công |
| `GET /api/research/projects/:id/dataset-versions` | Owner/Researcher/Reviewer xem metadata phiên bản |
| `POST /api/research/projects/:id/dataset-versions` | Owner/Researcher chụp metadata và HMAC checksum của các khảo sát liên kết |
| `POST /api/research/projects/:id/notes` | Researcher/owner thêm ghi chú; reviewer chỉ đọc |
| `GET /api/research/surveys` | Khảo sát do user sở hữu hoặc được chia sẻ trong nghiên cứu |
| `GET /api/exports/survey/:surveyId.csv?from=...&to=...&reviewStatus=not_excluded` | CSV UTF-8; Owner/Researcher, tối đa 10.000 phản hồi/tệp, custom question IDs tùy chọn |
| `GET /api/exports/survey/:surveyId.xlsx?from=...&to=...&reviewStatus=not_excluded` | Excel `.xlsx` có hàng tiêu đề cố định và bộ lọc cột; cùng quyền, giới hạn và bộ lọc với CSV |
| `/api/admin/*` | Khu vực admin: quản lý tài khoản, khảo sát, câu hỏi và phản hồi; mọi endpoint đều kiểm tra `users.is_admin` ở database. Tổng quan trả về số liệu tổng hợp cùng 5 tài khoản mới và 5 khảo sát cập nhật gần nhất; danh sách quản trị được phân trang 50 mục/trang |

Các endpoint `/api/admin/*` cần đăng nhập và cờ admin; tài khoản thường nhận `403`. Trang quản trị hỗ trợ tạo/sửa/xóa tài khoản, chuyển chủ sở hữu và sửa/xóa khảo sát, xem/xóa phản hồi cùng nội dung câu trả lời. Để tránh tự cấp quyền, trạng thái `is_admin` chỉ được thay đổi trực tiếp trong database.

Quyền nghiên cứu được kiểm tra ở server: Owner quản lý thành viên; Researcher cập nhật nghiên cứu, liên kết khảo sát, ghi chú và đánh giá phản hồi; Reviewer chỉ đọc nghiên cứu, phân tích và phản hồi. Chia sẻ khảo sát không trao quyền chỉnh sửa/xóa khảo sát. Xóa tài khoản sở hữu nghiên cứu bị chặn để tránh mất quyền sở hữu/dữ liệu.

Participant code được tạo ngẫu nhiên theo từng nghiên cứu; trạng thái chỉ được researcher cập nhật thủ công. brainst0rm không lưu tên/email, không liên kết participant code với câu trả lời, và code vẫn là pseudonymous chứ không bảo đảm anonymous tuyệt đối nếu ghép dữ liệu ngoài hệ thống.

CSV/XLSX export mặc định bỏ phản hồi đã xác nhận không hợp lệ; chọn `reviewStatus=all` chỉ khi thật sự cần xuất cả nhóm này. File chứa survey ID/tiêu đề, thời điểm UTC, khoảng lọc, thời điểm xuất, số thứ tự dòng, trạng thái chất lượng/review và câu trả lời; không chứa response UUID, IP hash, answer hash, ghi chú review hoặc thông tin định danh người tham gia. CSV có UTF-8 BOM và neutralize ô công thức; XLSX ghi nội dung câu trả lời như text thay vì công thức. Response header `X-Content-SHA256` cho phép kiểm tra tính toàn vẹn từng tệp. Thời điểm và câu trả lời vẫn có thể nhận diện gián tiếp; export không đảm bảo ẩn danh tuyệt đối. Mỗi tệp giới hạn 10.000 phản hồi; lọc ngày/trạng thái để chia nhỏ.

Báo cáo PDF tổng hợp có thể mở từ Phân tích; nút **In / Lưu PDF** mở hộp thoại in của trình duyệt để người dùng chọn **Save as PDF**. Báo cáo dùng thống kê thực, ghi nguồn/khoảng lọc/thời điểm tạo và không đưa câu trả lời văn bản tự do vào bản in.

Phiên bản dataset chỉ lưu thời điểm, survey IDs, số lượng phản hồi/khảo sát và HMAC-SHA-256; không sao chép câu trả lời và không thể khôi phục dữ liệu cũ. Checksum bao gồm schema câu hỏi cùng các phản hồi đã hoàn tất, loại các phản hồi có trạng thái `excluded`; mỗi khảo sát chịu giới hạn 10.000 phản hồi như export. HMAC dùng `JWT_SECRET`, vì vậy cần giữ secret ổn định để so sánh checksum qua các lần chụp. Chạy `backend/migrations/005_dataset_versions.sql` trước khi sử dụng.

`PUT /api/surveys/:id` nhận `{title, description, status, settings, questions:[{id?, question_text, question_type, is_required, settings, options:[{label,value}]}]}`. Câu hỏi có `id` cũ được cập nhật tại chỗ nên **không mất câu trả lời** khi sửa khảo sát đã có phản hồi.

### Cấp quyền quản trị

Sau khi chạy migration `002_admin.sql`, hãy tự cấp quyền cho tài khoản mong muốn trong Supabase SQL Editor:

```sql
update public.users
set is_admin = true
where lower(username) = lower('ten_username_cua_ban');
```

Tài khoản mới mặc định không phải admin. Cột `is_admin` không thể thay đổi qua form đăng ký hoặc trang quản trị; chỉ chủ database cấp quyền. Đăng xuất rồi đăng nhập lại (hoặc tải lại ứng dụng) để làm mới trạng thái quyền.

## Chất lượng và researcher review (`services/quality.js`)
Mỗi tín hiệu trừ điểm từ 100: hoàn thành quá nhanh (35), trùng bộ đáp án (35), chọn cùng một đáp án ở mọi câu thang đo (30), câu trả lời không nhất quán theo cặp câu researcher cấu hình (30), gửi liên tục từ một thiết bị trong 10 phút (30), văn bản vô nghĩa (20), sai câu attention check (40).
- Điểm ≥ 75 → `normal`; < 75 → `suspicious`.
- `spam` chỉ khi có **từ 2 tín hiệu trở lên** và điểm < 45, nên không kết luận spam chỉ vì một yếu tố.
- `quality_status` chỉ là cờ sàng lọc. Researcher đánh giá riêng bằng `review_status`: `needs_review`, `accepted`, `excluded`; chỉ phản hồi đã xác nhận `excluded` mới bị loại khỏi thống kê câu hỏi.
- Phản hồi mới mặc định cần xem xét; attention check khả dụng cho câu hỏi single, Likert và rating. Researcher có thể thiết lập cặp câu cùng dạng mong đợi trùng/khác nhau để phát hiện câu trả lời không nhất quán; cặp thiếu dữ liệu, cấu hình mâu thuẫn hoặc không được cấu hình sẽ không bị suy diễn.
- IP được băm (SHA-256 + `IP_SALT`), không lưu IP gốc.
- Phân tích câu Likert/rating hiển thị mean, median, mode và độ lệch chuẩn mẫu; Cronbach’s alpha chỉ tính complete-case trên các item researcher chọn cùng thang đo.
- Chọn khoảng ngày lọc dữ liệu hoàn tất theo `submitted_at`; lượt bắt đầu và tỷ lệ hoàn tất nhóm được tính theo `started_at` để tránh tính sai khi phản hồi bắt đầu trước và nộp trong kỳ. Group comparison dùng câu single làm nhóm; cross-tab hiển thị số đếm và phần trăm theo hàng; Pearson r không hàm ý nhân quả.

## Kiểm tra nhanh
Đăng ký → đăng nhập → Tạo khảo sát mới → thêm câu hỏi, kéo thả, sửa thuộc tính (tự lưu) → Xuất bản → mở link công khai ở cửa sổ ẩn danh, làm và gửi → quay lại Phân tích xem phản hồi. Đăng ký user thứ hai: không thấy khảo sát của user đầu (API trả 404).

## Thay đổi so với đặc tả
- Bảng `responses` thêm `signals`, `ip_hash`, `answer_hash` phục vụ chấm chất lượng; migration `003_response_review.sql` bổ sung trạng thái, ghi chú và thời điểm/người đánh giá mà không xóa dữ liệu gốc.
- Migration `004_research_management.sql` thêm bảng nghiên cứu và cộng tác theo hướng additive; không xóa hay chuyển quyền sở hữu khảo sát hiện có.
- Thêm loại câu hỏi `single` (một lựa chọn) tách khỏi `mc` (nhiều lựa chọn), và `text`/`longtext`.
- Thêm endpoint `/public/surveys/:slug/start`.

## Nâng cấp sau này
Next.js: giữ nguyên `backend/`, bỏ đoạn `express.static` trong `app.js`, đặt `CORS_ORIGIN` và gọi API với `credentials: 'include'`. Chưa có (cố ý, theo MVP): đổi mật khẩu, CSRF token (cookie `sameSite=lax` đủ cho MVP), giới hạn số khảo sát mỗi user. API phản hồi hiện phân trang 25 mục/trang.
