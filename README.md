# Lumen — Survey Platform (MVP)

Frontend giữ nguyên giao diện gốc (HTML/CSS/JS thuần), backend Node.js + Express + Supabase PostgreSQL.
Express phục vụ luôn thư mục `frontend/` nên chỉ cần chạy **một** server.

## Chạy thử

1. Tạo project trên [supabase.com](https://supabase.com). Vào **SQL Editor** và chạy migration theo thứ tự: database mới chạy `backend/migrations/001_init.sql` rồi `backend/migrations/002_admin.sql`; database đã có thì chỉ cần chạy `002_admin.sql`.
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
  migrations/        001_init.sql, 002_admin.sql
  scripts/seed.js    dữ liệu mẫu
  src/
    config/          supabase client
    middleware/      requireAuth, requireAdmin (kiểm tra quyền từ database), errorHandler
    routes/          khai báo endpoint
    controllers/     auth, surveys, public, responses, analytics, admin
    services/        surveys (lưu câu hỏi), quality (chấm chất lượng)
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
| `GET /api/responses/survey/:surveyId` | Danh sách phản hồi + trạng thái chất lượng |
| `GET /api/analytics/overview · /survey/:surveyId` | Tổng quan và thống kê từng câu hỏi |
| `/api/admin/*` | Khu vực admin: quản lý tài khoản, khảo sát, câu hỏi và phản hồi; mọi endpoint đều kiểm tra `users.is_admin` ở database. Danh sách tài khoản, khảo sát, phản hồi được phân trang 50 mục/trang |

Các endpoint `/api/admin/*` cần đăng nhập và cờ admin; tài khoản thường nhận `403`. Trang quản trị hỗ trợ tạo/sửa/xóa tài khoản, chuyển chủ sở hữu và sửa/xóa khảo sát, xem/xóa phản hồi cùng nội dung câu trả lời. Để tránh tự cấp quyền, trạng thái `is_admin` chỉ được thay đổi trực tiếp trong database.

`PUT /api/surveys/:id` nhận `{title, description, status, settings, questions:[{id?, question_text, question_type, is_required, settings, options:[{label,value}]}]}`. Câu hỏi có `id` cũ được cập nhật tại chỗ nên **không mất câu trả lời** khi sửa khảo sát đã có phản hồi.

### Cấp quyền quản trị

Sau khi chạy migration `002_admin.sql`, hãy tự cấp quyền cho tài khoản mong muốn trong Supabase SQL Editor:

```sql
update public.users
set is_admin = true
where lower(username) = lower('ten_username_cua_ban');
```

Tài khoản mới mặc định không phải admin. Cột `is_admin` không thể thay đổi qua form đăng ký hoặc trang quản trị; chỉ chủ database cấp quyền. Đăng xuất rồi đăng nhập lại (hoặc tải lại ứng dụng) để làm mới trạng thái quyền.

## Nhận diện phản hồi đáng ngờ (`services/quality.js`)
Mỗi tín hiệu trừ điểm từ 100: hoàn thành quá nhanh (35), trùng bộ đáp án (35), chọn cùng một đáp án ở mọi câu thang đo (30), gửi liên tục từ một thiết bị trong 10 phút (30), văn bản vô nghĩa (20).
- Điểm ≥ 75 → `normal`; < 75 → `suspicious`.
- `spam` chỉ khi có **từ 2 tín hiệu trở lên** và điểm < 45, nên không kết luận spam chỉ vì một yếu tố.
- Phản hồi `spam` bị loại khỏi thống kê từng câu hỏi nhưng vẫn hiện trong danh sách để chủ khảo sát xem xét.
- IP được băm (SHA-256 + `IP_SALT`), không lưu IP gốc.

## Kiểm tra nhanh
Đăng ký → đăng nhập → Tạo khảo sát mới → thêm câu hỏi, kéo thả, sửa thuộc tính (tự lưu) → Xuất bản → mở link công khai ở cửa sổ ẩn danh, làm và gửi → quay lại Phân tích xem phản hồi. Đăng ký user thứ hai: không thấy khảo sát của user đầu (API trả 404).

## Thay đổi so với đặc tả
- Bảng `responses` thêm `signals`, `ip_hash`, `answer_hash` phục vụ chấm chất lượng.
- Thêm loại câu hỏi `single` (một lựa chọn) tách khỏi `mc` (nhiều lựa chọn), và `text`/`longtext`.
- Thêm endpoint `/public/surveys/:slug/start`.

## Nâng cấp sau này
Next.js: giữ nguyên `backend/`, bỏ đoạn `express.static` trong `app.js`, đặt `CORS_ORIGIN` và gọi API với `credentials: 'include'`. Chưa có (cố ý, theo MVP): đổi mật khẩu, CSRF token (cookie `sameSite=lax` đủ cho MVP), phân trang phản hồi (hiện 200 mới nhất), giới hạn số khảo sát mỗi user.
