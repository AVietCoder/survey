# brainst0rm — Project Context

## 1. Project Overview
- **Mục tiêu:** Nền tảng khảo sát tâm lý và hành vi; tạo và xuất bản khảo sát, thu thập phản hồi, đánh giá chất lượng dữ liệu, phân tích và quản trị hệ thống.
- **Đối tượng:** Người tạo khảo sát, người trả lời khảo sát công khai và quản trị viên.
- **Định hướng:** Sản phẩm SaaS khảo sát gọn nhẹ, ưu tiên dữ liệu thực, quyền truy cập rõ ràng và không làm mất dữ liệu phản hồi khi chỉnh sửa câu hỏi.

## 2. Current Features
- **Completed:** Đăng ký/đăng nhập bằng username và mật khẩu; phiên qua cookie `httpOnly` 7 ngày.
- **Completed:** Tạo, chỉnh sửa, sắp xếp, xem trước và xuất bản khảo sát; khảo sát hỗ trợ 11 loại câu hỏi.
- **Completed:** Trả lời khảo sát công khai; phân tích phản hồi, hoàn thành, thời lượng, chất lượng và thống kê theo câu hỏi.
- **Completed:** Admin quản lý tài khoản, khảo sát, câu hỏi, chủ sở hữu và phản hồi; các danh sách phân trang 50 mục/trang.
- **Completed:** Admin overview có số liệu tổng hợp và tối đa 5 tài khoản mới + 5 khảo sát cập nhật gần nhất từ API.
- **Completed:** Gắn cờ phản hồi đáng ngờ/spam; IP được băm, không lưu IP gốc.
- **Completed (code + migration 003):** Researcher review với trạng thái cần xem xét/giữ lại/đã xác nhận không hợp lệ; cờ tự động không tự động loại phản hồi.
- **Completed (Phase 2 initial):** Mean, median, mode, sample standard deviation; complete-case Cronbach’s alpha; group means, crosstab và Pearson r; UTC date filters.
- **Completed:** Research Management có project, trạng thái, survey links, notes/activity, Owner/Researcher/Reviewer và participant codes ngẫu nhiên; trạng thái participant thủ công, không lưu PII/không gắn response. Migration 004 đã được xác nhận hoạt động qua Research API và dữ liệu nghiên cứu hiện có.
- **Completed (initial):** CSV/XLSX export theo ngày, trạng thái review và câu hỏi; mặc định loại phản hồi đã xác nhận không hợp lệ, chỉ Owner/Researcher có quyền tải; SHA-256 checksum. XLSX có header freeze/filter và giữ câu trả lời công thức như text.
- **Completed (initial):** Báo cáo PDF qua print/save-as-PDF từ trình duyệt, có nguồn, phạm vi ngày, timestamp, thống kê câu hỏi và chú giải phương pháp; không in câu trả lời tự do.
- **Completed:** Quality checks có thể cấu hình cặp câu trả lời cần giống/khác; cảnh báo là tín hiệu để researcher xem xét, không tự động loại phản hồi.
- **Completed:** Dataset versioning (migration 005 đã chạy, đã kiểm tra tạo/liệt kê) chỉ lưu thời điểm, survey IDs, số lượng và HMAC checksum; không sao chép hoặc khôi phục câu trả lời.
- **Completed (code, chưa áp migration 006 lên database thật):** Progress Tracking — người tham gia không cần tài khoản theo dõi điểm qua nhiều lần (cookie + mã khôi phục + liên kết khôi phục một lần), nhiều loại đánh giá riêng, lịch follow-up, lịch sử/so sánh với lần gần nhất và baseline chỉ khi thang đo tương thích, consent có phiên bản, cấu hình cho owner. **Mặc định TẮT** cho mọi khảo sát; không có cấu hình = hành vi cũ.
- **In Progress:** QA trên phản hồi hoàn tất thực, xác thực phân quyền bằng tài khoản thứ hai và kiểm tra tải file export thực tế.
- **Planned:** Consent workflow; đổi mật khẩu, CSRF token và giới hạn số khảo sát/user. Next.js là hướng nâng cấp tùy chọn.

## 3. UI/UX
- Giao diện tiếng Việt, HTML/CSS/JavaScript thuần. **Theme hiện hành: "Cozy Purple"** theo `design-spec-cozy-purple.md` — nền tím `#5B4FD1`, thẻ trắng bo 28px, nút/thẻ "chunky" có cạnh dưới dày, điểm nhấn là vàng hổ phách của spec, nâng nhẹ cho tươi hơn (`#FFBE40`).
- Theme nằm ở `frontend/css/cozy.css`, nạp **sau** `style.css` (lớp cũ giữ layout, lớp mới thay "da"); bỏ thẻ `<link>` tới `cozy.css` trong `index.html` để quay lại giao diện cũ. Token mới (`--brand-*` là thang tím; `--amber-*` là vàng điểm nhấn; `--edge-*`, `--r-*`) ánh xạ ngược vào token cũ (`--iris`, `--ink`, `--card`…).
- Màu phụ (cuối `cozy.css`, mục 21): mint, san hô, xanh dương, lilac đi cùng vàng — chỉ cho chi tiết nhỏ (icon, huy hiệu, vạch đầu thẻ, thanh biểu đồ). Vàng giữ cho nút CTA chính và trạng thái "Bản nháp"; chữ luôn là tím than.
- Điều hướng: sidebar nổi ≥1024px; thanh tab nổi dạng viên thuốc 768–1023px; thanh tab cố định đáy <768px (chỉ CSS, không đổi DOM).
- Thương hiệu hiện tại là **brainst0rm**; font **Nunito** (500–900) cho toàn bộ giao diện.
- Admin có sidebar nhóm theo khu vực, thu gọn trên desktop, menu mobile, breadcrumb, topbar tìm kiếm, thông tin quản trị viên và footer.
- Tổng quan dùng số liệu backend thật; activity feed và quick links không thay bằng dữ liệu giả.
- Trang tài khoản, khảo sát và phản hồi có tìm kiếm/lọc; bảng có sắp xếp, ẩn/hiện cột, chọn hàng và bulk delete có xác nhận. Có loading, empty/error states và dialog chỉnh sửa tài khoản.
- Admin hỗ trợ responsive tới viewport hẹp; đã kiểm tra tìm kiếm, lọc, cột, chọn hàng, dialog, menu mobile và tràn ngang trên trình duyệt.
- Research/Analytics có empty states riêng cho dữ liệu chưa có; bộ chọn được chuẩn hóa và layout mobile được kiểm tra không tràn ngang.
- Thanh lọc Analytics đã được gom thành toolbar đồng bộ, căn cùng chiều cao; export, collaborator form và participant table được chỉnh lại để cân đối trong panel và viewport hẹp.
- Browser QA responsive đã bao gồm Dashboard, Builder, Analytics, Research list/detail, Report và Admin users/surveys; các màn hình mobile đã kiểm tra không tràn ngang.

## 4. Tech Stack
- **Frontend:** HTML, CSS, JavaScript thuần; ứng dụng một trang định tuyến bằng URL hash.
- **Backend:** Node.js ES modules, Express 4; Express phục vụ thư mục `frontend/`.
- **Database:** Supabase PostgreSQL, truy cập qua `@supabase/supabase-js`; schema được quản lý bằng SQL migrations.
- **Auth/security:** bcrypt, JWT trong cookie `httpOnly`; `requireAuth` / `requireAdmin`; rate limiting cho một số endpoint.
- Không có framework frontend hoặc thư viện UI riêng.

## 5. Project Structure
- `frontend/index.html` — trang HTML gốc.
- `frontend/css/style.css` — design tokens, component styles và responsive rules.
- `frontend/js/app.js` — routing, UI, gọi API và tương tác frontend.
- `backend/src/app.js` — khởi tạo Express và phục vụ frontend.
- `backend/src/routes/index.js` — khai báo API và middleware quyền truy cập.
- `backend/src/controllers/` — xử lý auth, khảo sát, phản hồi, analytics và admin.
- `backend/src/services/` — nghiệp vụ lưu câu hỏi và đánh giá chất lượng phản hồi.
- `backend/src/controllers/research-projects.js`, `backend/src/services/research-projects.js` — project APIs và access control cộng tác.
- `backend/src/controllers/exports.js`, `backend/src/services/survey-export.js` — CSV/XLSX response export, authorization, filtering, paging và SHA-256 checksum.
- `backend/src/services/csv-export.js`, `backend/src/services/xlsx-export.js` — CSV encoding/safety và workbook XLSX.
- `backend/src/middleware/auth.js` — xác thực và kiểm tra quyền.
- `backend/migrations/001_init.sql`–`006_progress_tracking.sql` — schema nền, quyền admin, researcher review, quản lý nghiên cứu, metadata dataset versions và theo dõi tiến triển.
- `backend/src/controllers/tracking.js`, `backend/src/services/tracking*.js` — Progress Tracking: `tracking.js` (nghiệp vụ, nhận DB qua tham số), `tracking-scoring.js` (chấm điểm, dấu vân tay thang đo, giải thích không tương thích), `tracking-schedule.js`, `tracking-credentials.js` (token, mã khôi phục, HMAC), `tracking-history.js` (lịch sử + so sánh). `frontend/js/tracking.js` + `frontend/css/tracking.css` là giao diện người tham gia (`#/track…`) và cấu hình researcher (`#/tracking/<surveyId>`).
- `backend/test/tracking-*.test.js`, `backend/test/helpers/fake-db.js` — test logic thuần, service, HTTP, phân quyền và pipeline nộp phản hồi thật trên DB giả trong bộ nhớ.
- `backend/scripts/seed.js` — seed dữ liệu demo tùy chọn.
- `backend/test/analytics.test.js` — test thống kê mô tả và Cronbach’s alpha bằng Node test runner.
- `backend/test/dataset-versions.test.js` — test HMAC checksum ổn định, phát hiện thay đổi dữ liệu/schema và yêu cầu secret ổn định.

## 6. Current Progress
- **Completed:** MVP hoạt động qua một server; các luồng khảo sát và quản trị chính đã có backend/API.
- **Completed:** Admin UI đã được nâng cấp về điều hướng, overview, quản lý dữ liệu, responsive và trạng thái tương tác.
- **Completed:** Đổi nhận diện repository sang brainst0rm trong giao diện, metadata và tài liệu.
- **Validation gần nhất:** 23 backend tests và `git diff --check` pass; JavaScript syntax checks và runtime dependency audit trước đó cũng pass (0 vulnerabilities). Browser QA xác nhận các màn hình chính không tràn ngang ở mobile 390px. Chưa xác minh tải export/review/versioning trên phản hồi hoàn tất thực.
- **In Progress:** Áp dụng migration 005 và kiểm tra API/UI dataset versioning; hoàn thiện QA tích hợp trên dữ liệu thật có sẵn, role access bằng tài khoản thứ hai và CSV/XLSX/PDF khi có phản hồi hoàn tất.
- **Known limitations:** Tài khoản hiện tại không có phản hồi hoàn tất để kiểm tra export/review/statistics end-to-end. Chưa xác minh collaboration bằng tài khoản thứ hai. Researcher có thể truy cập phân tích/phản hồi khảo sát được liên kết; Reviewer chỉ đọc. Participant codes không liên kết với responses; xóa user sở hữu nghiên cứu bị chặn để tránh mất quyền sở hữu. Dataset versioning cần migration 005 và chỉ lưu metadata/checksum, không thể khôi phục câu trả lời.

- **Progress Tracking — giới hạn đã biết:** chưa xác minh tuổi/đồng ý của người giám hộ (chỉ tự khai báo 18+); nội dung đồng ý mẫu cần rà soát đạo đức/pháp lý; chưa gửi nhắc lịch (không lưu thông tin liên hệ); một trình duyệt dùng một hồ sơ; giao diện chế độ chỉ-xem của Researcher/Reviewer/Admin mới được kiểm tra bằng test phân quyền, chưa kiểm tra bằng trình duyệt với tài khoản thật.

## 7. Next Steps
- **P1 — In Progress:** Chạy migration 005 và kiểm thử tạo/liệt kê dataset version.
- **P2 — In Progress:** Kiểm thử quyền Owner/Researcher/Reviewer bằng tài khoản thứ hai và review/analytics/export với phản hồi hoàn tất thực.
- **P1 — Cần làm:** Chạy migration 006 trên Supabase thật rồi kiểm thử Progress Tracking với dữ liệu thật (tạo cấu hình, hoàn thành khảo sát, đăng ký, khôi phục, so sánh).
- **P3 — Một phần:** Progress Tracking đã ghi nhận consent có phiên bản cho riêng tính năng theo dõi; vẫn chưa có consent workflow chung cho khảo sát và chưa xác minh đồng ý của người giám hộ.

## 8. Important Notes
- Giữ nguyên framework/kiến trúc hiện tại trừ khi có quyết định rõ ràng; không thay đổi API, database, auth hoặc authorization ngoài phạm vi đã thống nhất.
- Không cấp quyền admin qua form hoặc API quản trị: `is_admin` chỉ được chủ database thay đổi trực tiếp.
- Tất cả endpoint `/api/admin/*` yêu cầu đăng nhập và quyền admin; tiếp tục áp dụng `requireAuth` và `requireAdmin`.
- Khi sửa khảo sát đã có phản hồi, cập nhật câu hỏi hiện có theo ID để bảo toàn câu trả lời.
- Không dùng dữ liệu giả thay số liệu, biểu đồ hoặc hoạt động. Chỉ hiển thị những gì API/backend thực sự cung cấp.
- Migration `004_research_management.sql` là additive, không xóa dữ liệu; đã xác nhận Research Management hoạt động trên database hiện tại. Nghiên cứu giữ `owner_id`; thành viên không thay đổi quyền sở hữu khảo sát khi liên kết.
- Participant codes là pseudonymous, không liên kết với response; không lưu thông tin định danh người tham gia trong participant records hoặc Research Notes.
- CSV/XLSX mặc định loại responses được xác nhận `excluded`; chỉ Owner/Researcher được xuất, response UUID và network hashes không xuất. CSV có UTF-8 BOM; cả hai định dạng có ngày UTC, survey source/export timestamp và SHA-256 response header. XLSX ghi câu trả lời formula-like dưới dạng text.
- PDF hiện được tạo qua print-to-PDF của trình duyệt, không phải PDF binary do server tạo; không bao gồm free-text answers để giảm rủi ro lộ dữ liệu nhạy cảm.
- Dataset versions chỉ ghi metadata và HMAC-SHA-256 của responses hoàn tất chưa bị loại; không thể khôi phục dữ liệu. Checksum dùng `JWT_SECRET`, cần giữ ổn định qua các lần chụp; mỗi survey có giới hạn 10.000 phản hồi.
- brainst0rm chưa xác minh đồng ý của người giám hộ; nhóm nghiên cứu cần xử lý quy trình consent ngoài hệ thống. Ngoại lệ: Progress Tracking tự ghi nhận đồng ý của người tham gia (phiên bản + SHA-256 nội dung hiển thị) trước khi tạo hồ sơ theo dõi.
- Progress Tracking: session chỉ tham chiếu `responses` (không sao chép câu trả lời); credential chỉ lưu HMAC; researcher không bao giờ thấy định danh hồ sơ; không diễn giải điểm thành tốt/xấu hay chẩn đoán. `TRACKING_TOKEN_SECRET` (hoặc `JWT_SECRET`) phải ổn định. Không sửa tay các bảng `tracking_*` và không public chúng qua RLS.
- Giữ ngôn ngữ thiết kế Cozy Purple (mục 3) khi thêm màn hình mới — dùng token trong `cozy.css`, không hardcode màu; ưu tiên responsive, keyboard/focus visibility, trạng thái loading/lỗi/rỗng và xác nhận trước thao tác phá hủy.
- Bí mật cấu hình (`SUPABASE_SERVICE_ROLE_KEY`, JWT secret, IP salt) chỉ đặt ở backend environment; không đưa vào frontend hoặc commit.
