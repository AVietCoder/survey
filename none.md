# brainst0rm — Survey Platform (MVP)

Frontend giữ nguyên giao diện gốc (HTML/CSS/JS thuần), backend Node.js + Express + Supabase PostgreSQL.
Express phục vụ luôn thư mục `frontend/` nên chỉ cần chạy **một** server.

## Chạy thử

1. Tạo project trên [supabase.com](https://supabase.com). Vào **SQL Editor** và chạy migration theo thứ tự: database mới chạy `backend/migrations/001_init.sql` đến `006_progress_tracking.sql`; database đã có thì chạy các migration còn thiếu. Migration 004 thêm quản lý nghiên cứu; migration 005 thêm metadata phiên bản dataset; migration 006 thêm theo dõi tiến triển (xem mục riêng bên dưới, mặc định TẮT); migration 007 thêm nhật ký hoạt động cho admin (bảng `activity_logs`); migration 008 thêm chia mức điểm (2–6 mức) cho theo dõi tiến triển (cần 006).
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

Quyền nghiên cứu được kiểm tra ở server: Owner quản lý thành viên; Researcher cập nhật nghiên cứu, liên kết khảo sát, ghi chú và đánh giá phản hồi; Reviewer chỉ đọc nghiên cứu, phân tích và phản hồi. Quyền sửa khảo sát của tài khoản khác được điều khiển riêng bằng công tắc tạm thời trong cài đặt admin; quyền đó không cấp quyền chỉnh sửa nghiên cứu hoặc xóa khảo sát. Xóa tài khoản sở hữu nghiên cứu bị chặn để tránh mất quyền sở hữu/dữ liệu.

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

## Theo dõi tiến triển (Progress Tracking)

Cho phép người tham gia **không cần tài khoản** theo dõi điểm của cùng một khảo sát qua nhiều lần, xem lịch sử, biểu đồ và so sánh với lần gần nhất / lần đầu (baseline). **Mặc định TẮT**: khảo sát chỉ dùng tính năng khi owner bật trong trang cấu hình; khảo sát cũ hoạt động y như trước, kể cả khi chưa chạy migration 006.

### Bật cho một khảo sát (owner)
1. Chạy `backend/migrations/006_progress_tracking.sql` trong Supabase SQL Editor. Không sửa bảng cũ; chỉ thêm 5 bảng, bật RLS không policy và thu hồi quyền `anon`/`authenticated`.
2. Trong **Trình tạo** hoặc **Phân tích** bấm **Theo dõi** → trang `#/tracking/<surveyId>`.
3. Điền: tên + mã loại đánh giá, cách tính điểm (tổng hoặc trung bình các câu Likert/đánh giá sao hoặc thanh trượt cùng thang, có thể đảo chiều), phiên bản thang điểm, lịch (khoảng cách giữa các lần, ngày nhắc trước hạn, thời gian chờ trước khi quá hạn, số lần tối đa), nội dung đồng ý, rồi bật.
4. Chỉ **owner** được sửa cấu hình. Researcher và Reviewer (theo quyền khảo sát hiện có) và Admin chỉ xem cấu hình và số liệu tổng hợp.

Biến môi trường tùy chọn: `TRACKING_TOKEN_SECRET` (khóa HMAC cho credential theo dõi; nếu thiếu dùng `JWT_SECRET`). **Giữ ổn định**: đổi khóa sẽ làm mọi cookie và mã khôi phục hiện có mất hiệu lực.

### Luồng người tham gia
- **Sau khi hoàn thành** khảo sát có bật theo dõi, người tham gia được mời tạo hồ sơ: đọc nội dung đồng ý (có phiên bản), tự xác nhận từ 18 tuổi (nếu owner yêu cầu) và đồng ý. Hệ thống tạo hồ sơ ẩn danh, đặt cookie `bs_track` (httpOnly, SameSite=Lax, Secure khi production, 365 ngày) và hiển thị **mã khôi phục một lần**.
- **Quay lại**: lần sau cùng trình duyệt, intro khảo sát hiện ô "Lưu kết quả lần này"; kết quả được gắn ngay khi nộp. Mất cookie hoặc đổi thiết bị: `#/track/recover` bằng mã khôi phục hoặc liên kết khôi phục (dùng một lần, 30 ngày).
- **Dashboard** `#/track`: mỗi loại đánh giá có lịch sử, biểu đồ và lịch riêng, không bao giờ gộp điểm khác loại. Quản lý thiết bị, tạo mã/liên kết mới, thu hồi, đăng xuất và **xóa hồ sơ** (xóa lần đo; phản hồi gửi cho researcher vẫn giữ ở dạng ẩn danh).

### Quy tắc so sánh (không kết luận quá mức)
- Chỉ so sánh các lần đo cùng **chủ khảo sát + mã loại** và cùng **dấu vân tay thang đo** (cách tính, số câu, khoảng giá trị, câu đảo chiều, phiên bản). Khác một yếu tố: hiển thị lý do bằng tiếng Việt và không tính toán.
- Thiếu hoặc ngoài thang ở bất kỳ câu nào → lần đo không có điểm (không ước lượng). Phản hồi bị researcher đánh dấu `excluded` không dùng để so sánh (không nêu lý do cho người tham gia).
- Kết quả chỉ là chênh lệch số học ("cao hơn/thấp hơn X điểm") kèm mô tả ý nghĩa điểm do researcher viết. **Không** có ngưỡng, nhãn tốt/xấu, chẩn đoán hay khuyến nghị lâm sàng.

### Lịch theo dõi
Tính từ cấu hình và lần đo gần nhất: `upcoming` (chưa đến hạn), `due_soon`, `due`, `overdue`, `completed` (đủ số lần), `unscheduled`. Chỉ là thông tin: khảo sát không bị khóa, người tham gia làm sớm hoặc muộn được. Hệ thống **không** gửi email/tin nhắn nhắc lịch (không lưu thông tin liên hệ).

### Bảo mật và quyền riêng tư
- Credential là token ngẫu nhiên 256-bit (cookie, liên kết) hoặc mã 16 ký tự (~79 bit); chỉ lưu **HMAC-SHA-256**, có hạn dùng, thu hồi được. Không dùng participant code của Research Management. Rate limit: recover 10, enroll 20, tạo credential 10 yêu cầu / 15 phút / IP. Lỗi khôi phục luôn cùng một thông điệp.
- Session chỉ **tham chiếu** `responses` (unique `response_id`, nên một phản hồi tối đa một session), không sao chép câu trả lời. Gắn muộn chỉ trong 2 giờ sau khi nộp.
- Mọi truy vấn của người tham gia lọc theo hồ sơ từ cookie; ID trong URL không cho phép xem dữ liệu người khác. Researcher chỉ thấy số liệu tổng hợp (không có định danh hồ sơ); điểm trung bình theo lần bị ẩn khi dưới 5 người.
- Consent lưu phiên bản và SHA-256 của nội dung đã hiển thị. Sửa nội dung → tăng phiên bản → người tham gia được hỏi lại trước lần lưu tiếp theo.
- **Chưa có / cần chủ sản phẩm xác nhận trước khi dùng thật**: xác minh tuổi hoặc đồng ý của người giám hộ (hiện chỉ tự khai báo 18+), phê duyệt đạo đức/pháp lý cho nội dung đồng ý (mẫu trong giao diện chỉ để tham khảo), chính sách lưu trữ và xóa theo yêu cầu phía researcher.

### API
| | |
|---|---|
| `GET /api/track/context/:slug` | Công khai: khảo sát có bật theo dõi không, nội dung đồng ý, trạng thái hồ sơ/đồng ý của chính trình duyệt này |
| `POST /api/track/enroll` | `{slug, responseId, consent}` tạo/gắn hồ sơ cho một phản hồi vừa hoàn tất; trả mã khôi phục một lần |
| `POST /api/track/recover` | `{credential}` mã hoặc liên kết khôi phục → đặt cookie mới |
| `GET /api/track/me`, `GET /api/track/assessments/:ref` | Tổng quan và chi tiết (lịch sử, so sánh, biểu đồ, lịch); cần cookie hồ sơ |
| `GET/POST/DELETE /api/track/credentials…`, `POST /api/track/signout`, `DELETE /api/track/profile` | Quản lý thiết bị, mã/liên kết khôi phục, đăng xuất, xóa hồ sơ |
| `POST /api/public/surveys/:slug/responses` | Thêm tùy chọn `track: true` để gắn session ngay khi nộp (cần cookie hợp lệ và đã đồng ý bản hiện tại); trả thêm `responseId` và `tracking.status`. Lỗi tracking không bao giờ làm hỏng việc nộp phản hồi |
| `GET/PUT /api/tracking/surveys/:surveyId/config` | Đọc cấu hình (Owner/Researcher/Reviewer/Admin) hoặc ghi (chỉ Owner) |
| `GET /api/tracking/surveys/:surveyId/summary` | Số liệu tổng hợp cho researcher |

Giới hạn hiện tại: một trình duyệt dùng một hồ sơ cho mọi khảo sát có bật theo dõi (qua cookie); một hồ sơ nhiều thiết bị cần khôi phục bằng mã. Gắn kết quả trong tab ẩn danh hoặc sau khi xóa cookie cần mã khôi phục để nối lại.

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


## Quản trị, nhật ký hoạt động và bảng phản hồi

- **Cấp/thu hồi admin**: trong Quản trị → Tài khoản → Chỉnh sửa có công tắc "Quyền quản trị viên". Không thể tự thu hồi quyền của chính mình hoặc của admin cuối cùng; mọi thay đổi được ghi vào nhật ký.
- **Nhật ký hoạt động** (Quản trị → Nhật ký, chỉ admin): đăng nhập/đăng xuất/đăng ký, tạo-sửa-xóa tài khoản, cấp/thu hồi admin, tạo/xuất bản/xóa khảo sát, đánh giá/xóa phản hồi, xuất CSV/XLSX. Lọc theo người thực hiện, nhóm hành động, khoảng ngày; phân trang 50 dòng. Không lưu mật khẩu, token hay mã khôi phục; IP chỉ lưu dạng băm. Ghi log lỗi không bao giờ làm hỏng thao tác chính. Cần chạy `backend/migrations/007_activity_logs.sql`; khi chưa chạy, trang Nhật ký hiển thị gợi ý (HTTP 503) và phần còn lại vẫn hoạt động.
- **Bảng phản hồi (Phân tích)**: lọc phía server theo trạng thái review, cờ tự động, khoảng ngày, khoảng điểm chất lượng (0–100), sắp xếp theo thời điểm/thời gian/điểm. Ô "Tìm kiếm trong trang" vẫn chỉ lọc trên trang đang hiển thị.
- **Danh sách khảo sát của admin**: thêm lọc theo ngày cập nhật (`?from=&to=`), `status`, `q` ở API.

## Chia mức điểm (2–6 mức) — giai đoạn 1 của hệ thống điểm thưởng

- Cấu hình ở trang "Theo dõi" của khảo sát, mục **Chia 3 mức điểm** (tùy chọn, mặc định tắt). Nhà nghiên cứu chọn hướng điểm (cao là tốt hơn hay cần hỗ trợ nhiều hơn), hai điểm cắt, tên 3 gói, có hiện tên gói cho người làm khảo sát hay không, và **kênh hỗ trợ cho nhóm đỏ (bắt buộc)**.
- Hai điểm cắt tăng dần; điểm cắt là điểm **đầu tiên** của vùng cao hơn. Hệ thống kiểm tra ngưỡng nằm trong khoảng điểm đạt được và chỉ phân mức khi đủ câu trả lời.
- Mức được tính **ngay lúc nộp bài**, không cần tạo hồ sơ theo dõi. Nhóm đỏ luôn thấy hộp "Cần người lắng nghe?" kể cả khi tên gói bị ẩn. Mức và ngưỡng đã dùng được lưu cố định trên từng phiên đã lưu.
- Nhà nghiên cứu chỉ thấy số lượng theo mức dạng tổng hợp, ẩn khi dưới 5 người, và chỉ gồm các lần đo đã lưu vào hồ sơ theo dõi.
- **Mức chỉ để gợi ý gói nhiệm vụ, không phải chẩn đoán.** Ngưỡng phải lấy từ công cụ đã được chuẩn hóa; hệ thống không tự suy ra.
- Cần chạy `backend/migrations/008_score_bands.sql` (sau 006). Khảo sát không dùng tính năng này không phụ thuộc migration 008.
- Bộ câu hỏi cần chốt trước các giai đoạn sau: `docs/reward-system-open-decisions.md` (và bản `.html`).

### Số mức, thang chuẩn và mẫu khảo sát

- Số mức từ **2 đến 6**; n-1 điểm cắt tăng dần, mỗi điểm cắt là điểm đầu tiên của vùng cao hơn. Tông màu đi từ ổn nhất đến cần hỗ trợ nhiều nhất; hộp hỗ trợ luôn hiện ở mức cần hỗ trợ nhiều nhất.
- **Thang chuẩn** (Cách tính → "Thang chuẩn"): PSQI (7 thành phần, 0–21; ngưỡng công bố >5, người trưởng thành) và HCL-32 (đếm câu ĐÚNG, 0–32; ngưỡng công bố ≥14 cho bản gốc, bản tiếng Việt đã chỉnh lời nên cần kiểm chứng lại). Nút "Điền ngưỡng đã công bố" chỉ điền gợi ý; nhà nghiên cứu vẫn quyết định. Chỉ sàng lọc, không chẩn đoán. Thiếu hoặc không đọc được bất kỳ mục bắt buộc nào thì không chấm.
- **Tạo từ mẫu**: Tổng quan → "Tạo từ mẫu" tạo bản nháp của chính bạn kèm cấu hình chấm điểm (đang tắt). Bỏ trường định danh (trung tâm, số thứ tự) của HCL-32 để giữ ẩn danh. Đưa mẫu vào hệ thống thật: `node scripts/seed-templates.js --user <username>` (`--list-users` để xem tài khoản).
- Câu hỏi chọn một lưu **nhãn** của lựa chọn; cấu hình chấm điểm chụp ánh xạ nhãn → giá trị. Đổi tên lựa chọn rồi không lưu lại cấu hình sẽ khiến lần nộp đó không được chấm (an toàn, không chấm sai).

### Mọi người xem khảo sát và nghiên cứu của nhau

- Mọi tài khoản đã đăng nhập xem được khảo sát (danh sách, câu hỏi qua xem trước), nghiên cứu, phản hồi và phân tích của nhau. Công tắc sửa khảo sát dùng chung được mô tả bên dưới; nghiên cứu, phản hồi, review, export và dataset vẫn theo quyền hiện có.
- Qua vai trò `viewer`, người dùng chỉ đọc các tài nguyên nghiên cứu; các API ghi dựa trên vai trò vẫn yêu cầu quyền tường minh.
- Tổng quan mặc định hiện "Tất cả" (có nút "Của tôi"). Lưu ý riêng tư: phản hồi của người tham gia cũng hiển thị cho mọi tài khoản.

## Nhiệm vụ và điểm thưởng (giai đoạn 2)

- **Cần chạy** `backend/migrations/009_reward_system.sql` (sau 006 và 008), rồi `node scripts/seed-reward-tasks.js` để nạp 13 nhiệm vụ mẫu **tạm** (đều đánh dấu "Tạm", điểm bằng nhau). Mặc định **tắt**.
- **Bật cho một khảo sát**: Theo dõi → Chia mức điểm → "Bật nhiệm vụ hằng ngày và điểm thưởng". Cần đã bật chia mức và có kênh hỗ trợ.
- **Học sinh** (đã lưu kết quả vào hồ sơ theo dõi) vào `#/track/tasks`: thấy nhiệm vụ theo nhóm, ví Sao, thanh trần ngày/tuần và hộp "Bạn cần người đồng hành?". Không phạt, không đếm ngày bỏ lỡ; điểm đã nhận luôn được giữ.
- **Quy tắc**: một trần chung (mặc định 50/ngày, 250/tuần, chỉnh được); mỗi nhiệm vụ một lần/ngày (khóa duy nhất trong DB, gửi lặp không cộng thêm); vượt trần thì vẫn ghi nhận hoàn thành với 0 điểm; múi giờ Asia/Ho_Chi_Minh; nhóm giữ cố định trong một chu kỳ (mặc định 14 ngày) nên làm lại khảo sát sớm không đổi nhóm.
- **Xác minh tối thiểu**: tự báo cáo, đếm giờ phía máy chủ, đếm ký tự (không gửi/lưu nội dung), chọn loại hành động (chỉ lưu nhãn lựa chọn).
- **Quản trị** (`#/admin/rewards`): tên và biểu tượng đơn vị điểm (hiển thị "Sao ⭐", mã nội bộ TVT), trần điểm, chu kỳ, tên gói theo nhóm, thêm/sửa/ẩn nhiệm vụ (không xóa để giữ lịch sử). Mã nhiệm vụ không đổi được sau khi tạo.
- Reward stages 3B-4 are implemented in code; migration 013 and manual verification for mini-games remain pending. Other pending roadmap items: assent/guardian consent, control group and exports, profile deletion request.

### Chuỗi ngày và Thẻ nghỉ (giai đoạn 3A)

- **Migration**: sau `009_reward_system.sql`, chạy `backend/migrations/010_reward_streaks.sql` trong Supabase SQL Editor. Không tự chạy migration lên database thật.
- Chuỗi tính theo ngày Việt Nam có ít nhất một nhiệm vụ hoàn thành; hoàn thành 0 Sao do chạm trần vẫn tính. Nếu hôm nay chưa có hoạt động, chuỗi vẫn tính đến hôm qua.
- Thẻ nghỉ do học sinh chủ động dùng cho hôm nay hoặc hôm qua, tối đa theo cấu hình mỗi tuần (mặc định 2). Thẻ nghỉ không cộng điểm; một ngày chỉ dùng được một thẻ.
- Trang `#/track/tasks` hiển thị chuỗi hiện tại, chuỗi dài nhất và số thẻ còn lại. Admin có thể bật/tắt tính năng và đặt số thẻ mỗi tuần.
- Thẻ nghỉ và chuỗi chỉ mang tính khích lệ. Ngày gián đoạn không xóa điểm, vật phẩm hay tiến trình; giao diện không thông báo mất chuỗi.
- **Chưa kiểm thử** migration 010, API và giao diện trình duyệt.

## Quyền chỉnh sửa khảo sát dùng chung (tạm thời)

- Mặc định, mọi tài khoản đã đăng nhập có thể mở và chỉnh sửa tiêu đề, mô tả, câu hỏi, trạng thái của khảo sát do tài khoản khác tạo. Mọi thao tác sửa được ghi vào nhật ký hoạt động.
- Tài khoản không sở hữu khảo sát **không thể xóa** khảo sát đó. Quyền đánh giá phản hồi, xuất dữ liệu và đổi cấu hình theo dõi không mở rộng theo cài đặt này.
- Chạy `backend/migrations/011_shared_survey_editing.sql` để lưu và quản lý cài đặt lâu dài. Admin bật/tắt tại `#/admin/settings`.
- Khi tắt, khảo sát của tài khoản khác trở về chế độ chỉ xem/xem trước; quyền sở hữu và dữ liệu không đổi.



## Reward inventory stage 3B

- Migration 012 (`backend/migrations/012_reward_inventory.sql`) was reported applied by the user.
- Admin manages the catalog at `#/admin/rewards`: create, edit, hide, and show items. New items default to placeholder; the catalog starts empty until approved content is added.
- Students see the Inventory tab at `#/track/inventory`. Items unlock from cumulative stars; equipping does not spend stars and requires an unlock.
- APIs: student `GET /api/track/rewards/inventory`, `POST /api/track/rewards/equip`; admin `GET|POST /api/admin/rewards/items`, `PUT /api/admin/rewards/items/:id`.
- New tables: `reward_items`, `reward_unlocks`, `reward_profile_prefs`. Manual browser verification remains pending.

## Companion pet stage 3C

- No migration is needed. The chosen species is saved in `reward_profile_prefs.equipped.pet`; the backend accepts only `cat`, `bunny`, `fox`, or `bear`. Default species: cat.
- Student page: `#/track/pet`, also linked from the tracking dashboard and reward tabs. Species names are fixed; students cannot enter free text.
- `frontend/js/pet.js` draws inline SVG. The companion can show an equipped `pet_item` decoration. Mood copy stays positive or neutral; only a gentle breathing animation runs when reduced motion is not requested.
- The existing student API `POST /api/track/rewards/equip` stores the companion selection with kind `pet`. No notifications or care schedule are introduced.
- Browser verification at mobile width and with reduced motion remains pending.

## Student navigation and gentle reminders stage 3D

- No migration is needed. The student navigation links to progress, pet, tasks, and inventory: fixed bottom on mobile with safe-area padding, floating pill on tablet, sticky vertical nav on desktop.
- `reward_profile_prefs.reminders_enabled` is managed by tracker-only `PUT /api/track/rewards/reminders` with `{enabled:boolean}`. The gentle in-app prompt appears only when opening the progress dashboard and when enabled.
- Browser notifications are a separate direct opt-in: the student must press the enable button and accept the browser permission. If granted, at most one local notification appears per device-local day when the student opens the app. There is no background schedule, email/SMS, or collected contact information.
- Browser checks for the three responsive breakpoints, safe-area padding, persisted preference, and notification opt-in remain pending.


## Reward mini-games stage 4

- Apply `backend/migrations/013_reward_task_games.sql` manually after migration 012. It adds the allowlisted `reward_tasks.game` column and tags only matching placeholder seed tasks. Future planned migrations shift: assent 014, control group 015.
- Admin selects a game in the task editor: R-03 breathing circle, Y-01 server-timed rest timer, R-05 three-plan form. All use existing server completion and points.
- Standard setup: create a research project and link the survey, then open that survey's tracking settings (`#/tracking/<surveyId>`) to enable tracking, score bands, and rewards. After a participant submits the survey, they can consent to create an anonymous profile; if rewards are enabled, the completion screen links to `#/track/tasks`.
- R-05 text remains in the page only; only a combined character count is sent. Breathing guidance has no breath hold. Reduced-motion preference disables breathing and confetti animation.
- R-03 has a stop action that clears its server-side timer start; Y-01 continues while the student puts the device down.
- No random prizes, leaderboard, penalty, or changes to scoring. Migration and browser verification remain pending.
