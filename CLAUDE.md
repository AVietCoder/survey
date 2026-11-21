# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Lệnh thường dùng

Tất cả chạy trong `backend/` (Node ≥ 22, ES modules). Không có bước build hay lint; frontend là JS/CSS thuần do Express phục vụ trực tiếp từ `frontend/`.

```bash
npm install
npm start                      # node src/app.js
npm run dev                    # node --watch src/app.js
npm test                       # toàn bộ test (node:test)
node --test test/score-bands.test.js                      # một file
node --test --test-name-pattern="PSQI" test/instruments-templates.test.js   # một nhóm test theo tên
npm run seed                   # dữ liệu demo (user demo / demo1234 + khảo sát + phản hồi)
node scripts/seed-templates.js --list-users               # liệt kê username (chỉ đọc)
node scripts/seed-templates.js --user <username> [--publish]   # tạo khảo sát mẫu PSQI/HCL-32 vào DB thật (không tạo trùng)
node scripts/seed-reward-tasks.js                         # nạp 13 nhiệm vụ mẫu TẠM (cần migration 009; không ghi đè bản admin đã sửa)
node scripts/seed-demo-study.js --user <username> [--dry-run]   # nghiên cứu THỬ đầy đủ (PSQI đã xuất bản + theo dõi + 3 mức thử + thưởng); chạy lại an toàn, không tạo phản hồi giả
```

- Cần `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `IP_SALT`. Tùy chọn: `TRACKING_TOKEN_SECRET` (mặc định dùng `JWT_SECRET`; đổi khóa làm mất mọi cookie/mã khôi phục), `ALLOW_REGISTRATION=true` (mặc định **tắt** đăng ký công khai, admin tạo tài khoản).
- Migration là SQL thuần trong `backend/migrations/` (001 → 013, 018, 019, 020; 014–017 dành cho lộ trình giai đoạn 5–8), **chạy tay** trong Supabase SQL Editor, chỉ thêm mới, không sửa file đã áp dụng. Migration chưa chạy thì tính năng tương ứng trả HTTP 503 kèm gợi ý, phần còn lại vẫn chạy.
- `backend/.env.example` đang được git theo dõi và có vẻ chứa giá trị thật: không in ra, nên xoay khóa và thay bằng placeholder.

## Kiến trúc

**Một tiến trình Express** (`backend/src/app.js`) phục vụ cả API `/api/*` lẫn thư mục `frontend/` (SPA, định tuyến bằng URL hash, JS thuần, không framework). `routes/index.js` là nơi duy nhất khai báo route và middleware quyền; controller mỏng, nghiệp vụ nằm ở `services/`.

**Database**: Supabase, backend luôn dùng `service_role`; mọi bảng bật RLS **không có policy** và `revoke` quyền `anon/authenticated`. Mọi kiểm tra quyền nằm ở code backend, không ở RLS.

**Phân quyền xem/sửa** (`services/research-projects.js`): `getSurveyAccess` / `getProjectAccess` nhận danh sách vai trò. Mặc định `READ_ROLES = owner, researcher, reviewer, viewer`; viewer = mọi tài khoản đã đăng nhập, chỉ đọc qua các helper này. Mọi thao tác ghi/xuất file/review truyền danh sách vai trò tường minh không có `viewer`. Ngoại lệ tạm thời: `surveys.update` còn kiểm tra cờ toàn cục `app_settings.shared_survey_editing`, mặc định bật; không mở quyền xóa, review, export hoặc cấu hình tracking. `canReview` ở controller phải tính theo `owner|researcher`, không phải "khác reviewer".

**Progress Tracking** (người tham gia không cần tài khoản): `services/tracking.js` là factory `createTrackingService(db, {clock})` nhận DB qua tham số để test bằng DB giả; `controllers/tracking.js` giữ instance qua `useTrackingService`. Danh tính = hồ sơ ẩn danh + credential (cookie `bs_track`, mã khôi phục, liên kết khôi phục một lần), chỉ lưu HMAC-SHA256. Mặc định **tắt** cho mọi khảo sát (bảng `survey_tracking_configs`). Gồm: `tracking-scoring.js` (chấm điểm, dấu vân tay thang đo, chia 2–6 mức), `tracking-instruments.js` (PSQI, HCL-32 theo `settings.key` của câu hỏi), `tracking-schedule.js`, `tracking-history.js`, `tracking-credentials.js`.

**Chia mức điểm** (`bands`, migration 008): n-1 điểm cắt tăng dần, điểm cắt = điểm *đầu tiên* của vùng cao hơn; tính **ngay lúc nộp bài** trong `controllers/public.js` (không cần hồ sơ), hộp hỗ trợ luôn hiện ở mức cần hỗ trợ nhiều nhất. Mức chỉ để gợi ý, không phải chẩn đoán; ngưỡng do nhà nghiên cứu nhập, hệ thống không tự suy ra.

**Mẫu khảo sát** (`services/survey-templates.js`): PSQI và HCL-32 dựng sẵn; `createSurveyFromTemplate` dùng chung cho API (`POST /api/templates/:key/survey`) và script seed.

**Nhật ký hoạt động** (`services/activity.js`, migration 007): `logActivity` **không bao giờ ném lỗi**, không lưu mật khẩu/token, IP chỉ băm. Chỉ admin xem (`/api/admin/activity`).

**Frontend**: `index.html` nạp `style.css` (layout cũ) → `cozy.css` (theme "Cozy Purple" ghi đè) → `tracking.css` (tiền tố `.tk-`); `ui.js` → `tracking.js` → `app.js` (thứ tự bắt buộc). Giao diện người tham gia (`#/s/<slug>`, `#/track…`) không cần đăng nhập.

## Những cạm bẫy đã gặp

- **DB thật có thể lệch file migration**: `add column if not exists` không đổi kiểu/ràng buộc của cột đã có. Đã gặp: `tracking_sessions.band` là `text` (bản 008 cũ) nên lưu band = 2 bị 23514 → HTTP 500 khi bấm "Tạo hồ sơ theo dõi". Migration `018_fix_tracking_band_check.sql` đổi sang `smallint` 0–5 (người dùng chạy tay); `attachSession` trong `services/tracking.js` có fallback lưu phiên không kèm band khi gặp 23514 liên quan band. Fake DB không có ràng buộc nên test không bắt được lỗi dạng này: khi nghi ngờ, chẩn đoán bằng script đọc/tự dọn dẹp trên DB thật rồi xóa script.
- **Học sinh không có nhiệm vụ = không có mức điểm**: nhóm lấy từ `tracking_sessions.band`; phiên `incomplete` (score null) thì band null → `today()` trả `enabled:false`. Nguyên nhân đã gặp ở PSQI: giờ đi ngủ/thức dậy là ô văn bản, học sinh gõ "3" hoặc bỏ trống nên không chấm được. Đã sửa: `parseClock` nhận giờ tròn ("3" → 03:00, đồng hồ 24 giờ), câu hỏi ghi rõ định dạng, ô nhập hiển thị `placeholder` của câu hỏi. Chẩn đoán bằng cách chạy `computeScore` trên câu trả lời đã lưu. Phiên đã lưu không chấm lại; học sinh làm lại khảo sát.
- **Server cũ sau khi sửa backend**: `npm start` không tự nạp lại code. Frontend (file tĩnh) thì mới ngay nhưng API vẫn cũ → lỗi khó hiểu (đã gặp: lưu nhân vật báo lỗi vì server cũ chưa có `equip {kind:'avatar'}`). Kiểm tra nhanh: `/api/public/default-survey` trả 404 = server cũ. Sau khi sửa backend phải khởi động lại server (hoặc dùng `npm run dev`).
- **Bạn đồng hành trong làng** vẽ theo `equipped.pet` (`companion()` trong village.js, 4 loài cat/bunny/fox/bear, màu khớp pet.js); panel Nhân vật đổi ngay trong cảnh, lỗi thì trả lại loài cũ.
- **Quy ước phiên làm việc**: sau mỗi lần làm xong, cập nhật `CLAUDE.md` và graphify (`graphify-out/`).

- Câu hỏi **chọn một** lưu **nhãn** của lựa chọn, không phải `value`. Chấm điểm thang chuẩn phải ánh xạ nhãn → giá trị (`choices` chụp trong cấu hình); đổi tên lựa chọn mà không lưu lại cấu hình làm lần nộp đó không được chấm (an toàn).
- `api()` trong `app.js` đăng xuất người dùng khi gặp 401; trang người tham gia dùng `tapi()` riêng trong `tracking.js`.
- Khi vá `app.js` bằng `String.prototype.replace`, `$$` trong chuỗi thay thế bị biến thành `$` (làm hỏng `$$('…')`). Dùng `split().join()` hoặc công cụ Edit.
- Test dùng `test/helpers/fake-db.js` (một phần nhỏ API supabase-js, có unique/cascade/`failWhen`); mở rộng nó khi code mới dùng thêm toán tử truy vấn. Fake DB **không có default cột** (vd `status`, `updated_at`): đặt giá trị tường minh khi insert.
- Kiểm tra giao diện phải xem ảnh render thật; ở mobile so `scrollWidth` với đúng 390, không dùng `innerWidth` (Chrome mở rộng layout khi tràn).
- Câu trả lời học sinh và dữ liệu nhạy cảm: không lưu chữ tự do không cần thiết (R-01 chỉ lưu loại hành động; R-05 chỉ đếm ký tự ở trình duyệt).

## Kế hoạch Reward System (đọc kỹ trước khi làm tiếp)

Tài liệu nguồn: `docs/answer.md` (quyết định của chủ dự án, **ưu tiên cao nhất**), `docs/reward-system-open-decisions.md` (câu hỏi gốc), `solution.md` (nhiệm vụ gốc, nội dung chưa chốt). Nếu code và tài liệu này mâu thuẫn với `answer.md`, theo `answer.md` và báo lại cho người dùng.

### 1. Trạng thái hiện tại

| Hạng mục | Trạng thái |
| :-- | :-- |
| Chia mức điểm 2–6 mức, tính lúc nộp bài, hộp hỗ trợ | Xong (migration 008) |
| Thang chuẩn PSQI / HCL-32, thư viện mẫu, seed | Xong (không cần migration mới) |
| Nhiệm vụ data-driven + sổ điểm + trần + trang học sinh + trang admin | Xong ở code/test/trình duyệt (migration 009) |
| Chuỗi ngày và Thẻ nghỉ | Đã triển khai ở code (migration 010); người dùng báo đã chạy, **chưa chạy test/QA** |
| Sửa khảo sát dùng chung tạm thời, công tắc admin | Đã triển khai ở code (migration 011); mặc định bật, cần chạy migration và kiểm thử |
| Mini-games | **Pending migration 013 and manual verification** (stage 4) |
| Assent + đồng ý phụ huynh cấu hình được | **Chưa làm** (giai đoạn 5) |
| Nhóm đối chứng, xuất dữ liệu theo nhóm | **Chưa làm** (giai đoạn 6) |
| Chính sách lưu trữ / xóa dữ liệu | **Chưa làm** (giai đoạn 7) |
| Mức điểm cho từng phản hồi trong Phân tích | **Chưa làm** (giai đoạn 8) |

Migration `006`–`009` chưa xác nhận đã chạy trên Supabase thật (006 nhiều khả năng đã chạy); người dùng báo đã chạy `010`. Migration `011` cần chạy thủ công. Không tự chạy migration lên DB thật.

Các file của module (đã có):
- `backend/migrations/009_reward_system.sql` — `reward_settings` (một dòng `global`), `reward_tasks`, `reward_task_starts`, `reward_completions`, cột `survey_tracking_configs.rewards_enabled`.
- `backend/src/services/reward.js` — hàm thuần (`localParts`, `weekStart`, `inWindow`, `tierOf`, `currentGroup`, `normalizeTask`, `normalizeSettings`) và factory `createRewardService(db, {clock})` với `today`, `start`, `complete`, `listTasks`, `createTask`, `updateTask`, `getSettings`, `saveSettings`.
- `backend/src/controllers/rewards.js` — `reward` (singleton), `useRewardService` (chỉ cho test), handler học sinh và admin.
- `backend/src/services/reward-seed-tasks.js`, `backend/scripts/seed-reward-tasks.js` — 13 nhiệm vụ mẫu **tạm** (điểm bằng nhau).
- `backend/test/reward.test.js` — 28 test (service, HTTP, múi giờ, trần, chống cộng trùng).
- `frontend/js/tracking.js` — `tasksView`, `wireTasks`, `taskCard` (trang `#/track/tasks`); công tắc `#tk-rewards-on` trong `renderConfig`.
- `frontend/js/app.js` — `adminRewardsView`, `taskDialog` (trang `#/admin/rewards`).
- `frontend/css/tracking.css` (lớp `.tk-task`, `.tk-wallet`, `.tk-meter`…) và cuối `frontend/css/cozy.css` (lớp `.reward-form`, `.task-dialog`).

Giai đoạn 3A đã thêm `backend/migrations/010_reward_streaks.sql`, `computeStreak()` và `useRestCard()` trong `reward.js`, endpoint `POST /api/track/rewards/rest-card`, cấu hình chuỗi/Thẻ nghỉ ở admin và hiển thị ở trang nhiệm vụ. `streak_enabled` trong code mặc định false để hệ thống cũ không truy vấn bảng mới; migration 010 đặt mặc định true. Chưa chạy test hoặc kiểm tra trình duyệt cho giai đoạn này.

Quyền sửa khảo sát dùng chung là ngoại lệ **tạm thời** theo yêu cầu chủ dự án: mọi tài khoản đăng nhập có thể sửa tiêu đề, mô tả, câu hỏi và trạng thái khảo sát của nhau; xóa, review phản hồi, xuất dữ liệu và cấu hình theo dõi vẫn giữ quyền riêng. Mặc định bật cả khi migration 011 chưa chạy; sau migration, admin quản lý tại `#/admin/settings`. Mọi sửa khảo sát được ghi activity log.

API hiện có:
- Học sinh (cookie `bs_track`, qua `requireTracker`): `GET /api/track/rewards/today`, `POST /api/track/rewards/tasks/:code/start`, `POST /api/track/rewards/tasks/:code/complete` (body theo loại: `{confirmed:true}` | `{count}` | `{choice}` | `{}` cho timer).
- Học sinh (khi bật chuỗi): `POST /api/track/rewards/rest-card` (body `{localDate}` tùy chọn, chỉ hôm nay/hôm qua).
- Tài khoản đăng nhập: có thể sửa khảo sát của người khác khi `app_settings.shared_survey_editing=true`; admin bật/tắt qua `GET|PUT /api/admin/settings/shared-editing`.
- Admin (`requireAdmin`): `GET|PUT /api/admin/rewards/settings`, `GET|POST /api/admin/rewards/tasks`, `PUT /api/admin/rewards/tasks/:id`. Mọi thay đổi ghi vào nhật ký (`reward.settings`, `reward.task_create`, `reward.task_update`).

### 2. Nguyên tắc bất biến (vi phạm là lỗi)

1. Không biến sức khỏe tinh thần thành cuộc thi tích điểm; **một trần điểm chung** cho mọi nhóm; không thưởng nhiều hơn cho kết quả khảo sát tiêu cực hơn; không thưởng theo mức cải thiện điểm khảo sát.
2. Không phạt, không trừ điểm, không thông báo gây tội lỗi khi bỏ lỡ; điểm đã nhận không thu hồi; thú cưng **không bao giờ** biểu hiện buồn bã, thất vọng, trách móc; chuỗi ngày chỉ khích lệ và gián đoạn không xóa tiến trình.
3. Không thu thập vượt nhu cầu: không theo dõi ứng dụng khác, không quyền dữ liệu điện thoại, không camera/ảnh/micro, không lưu chữ tự do học sinh nhập (R-01 chỉ lưu nhãn lựa chọn; R-05 chỉ lưu số ký tự; đếm ký tự làm ở trình duyệt).
4. Không hiển thị nhãn xanh/vàng/đỏ cho học sinh theo mặc định; chỉ hiện tên gói thân thiện (mặc định **Gói Duy trì / Gói Cân bằng / Gói Đồng hành**, sửa được trong admin). Không dùng màu hoặc lời lẽ mang tính đánh giá tốt/xấu.
5. **Không tự đặt** ngưỡng cắt, thời hạn lưu trữ, thông tin liên hệ hỗ trợ, nội dung đồng ý, nhiệm vụ chính thức. **Không tự thêm** câu hỏi về ý định tự làm hại bản thân.
6. Phần thưởng MVP chỉ **kỹ thuật số**. Không viết logic đổi quà thật (chỉ để chỗ trong schema).
7. Mức điểm và nhóm chỉ là gợi ý nhiệm vụ / sàng lọc theo công cụ nghiên cứu, **không phải chẩn đoán**; không hứa ẩn danh tuyệt đối.
8. Mọi cấu hình nghiên cứu phải lưu lại để tái lập (phiên bản, mã băm, ngưỡng đã dùng). Không sửa nội dung đồng ý đã được dùng.
9. Mọi thứ **module hóa, mặc định tắt**, không ảnh hưởng Progress Tracking, khảo sát, phân tích và chức năng cũ; thiếu migration thì trả HTTP 503 kèm gợi ý, phần còn lại vẫn chạy.

### 3. Quyết định đã chốt

| Chủ đề | Quyết định |
| :-- | :-- |
| Đơn vị điểm | Hiển thị **Sao ⭐**; mã nội bộ `TVT`; tên/biểu tượng đổi được trong admin, không ảnh hưởng lịch sử |
| Trần điểm | 50/ngày, 250/tuần, cấu hình trong admin; mỗi nhiệm vụ 1 lần/ngày (trừ khi `times_per_day` khác); vượt trần vẫn ghi nhận hoàn thành với 0 điểm |
| Múi giờ, chuỗi | `Asia/Ho_Chi_Minh`, ngày mới 00:00, cuối tuần/ngày lễ như ngày thường, có Thẻ nghỉ do học sinh tự dùng, không xóa tiến trình khi gián đoạn |
| Nhóm | Dựa trên kết quả đánh giá, **giữ cố định một chu kỳ** (mặc định 14 ngày, `reward_settings.cycle_days`), chỉ đổi khi có kỳ đánh giá lại hợp lệ; mỗi lần đánh giá là một phiên riêng |
| Xác minh | Tự báo cáo được chấp nhận; xác minh tối thiểu: đếm giờ phía máy chủ, mốc thời gian/khung giờ, đếm ký tự ở trình duyệt; y-03, y-04 tự báo cáo; R-01 chỉ ghi loại hành động |
| Nhiệm vụ | Data-driven, thêm/sửa/ẩn/thay trong admin; bộ mẫu đánh dấu **tạm** (`is_placeholder`); không tự biến thành nội dung chính thức |
| Nhóm đối chứng | Hỗ trợ: bật/tắt thưởng theo khảo sát hoặc nhóm nghiên cứu, phân bổ theo thiết kế được duyệt, ghi nhận nhóm, xuất dữ liệu; **học sinh không tự chọn** |
| Hỗ trợ nhóm đỏ | Khu "Bạn cần người đồng hành?" luôn tìm thấy được, không khóa sau khi làm nhiệm vụ; bắt buộc có kênh hỗ trợ trước khi công bố khảo sát bật mức điểm |
| Đồng ý | Học sinh dưới 18 **không mặc định** tự đồng ý: hỗ trợ assent + phụ huynh/người giám hộ + cấu hình miễn/thay đổi theo hội đồng đạo đức; lưu phiên bản, thời điểm, mã băm |
| Nhắc nhở | Nhẹ nhàng, hiện khi mở ứng dụng, bật/tắt được, có thể nhắc cục bộ trên thiết bị, không bắt buộc email/số điện thoại |
| Lưu trữ | Tối thiểu hóa dữ liệu; tách định danh khỏi dữ liệu khảo sát khi có thể; thời hạn **do nhóm nghiên cứu/đơn vị có thẩm quyền quyết định**, không tự đặt |
| Quà thật | Chưa triển khai ở bản đầu; chỉ phần thưởng số (danh hiệu, huy hiệu, sticker, giao diện, vật phẩm thú cưng, nội dung mở khóa) |

### 4. Quy ước làm việc cho mọi AI tham gia

Làm đúng thứ tự cho **mỗi giai đoạn**:
1. Đọc `docs/answer.md`, mục "Nguyên tắc bất biến" ở trên và code của giai đoạn trước (`reward.js` là mẫu).
2. Viết **migration mới, chỉ thêm** (`010_…`, `011_…`…): `create table if not exists` / `add column if not exists`, bật RLS **không policy**, `revoke all … from anon, authenticated`. Không sửa migration đã có. Cột mới đọc/ghi chỉ khi người dùng gửi (xem cách `rewards_enabled`, `bands` được ghi có điều kiện) để tính năng cũ không phụ thuộc migration mới.
3. Logic nghiệp vụ trong **service factory nhận `db` và `clock`** (không import `supabase` trực tiếp trong service); controller mỏng; route khai báo ở `routes/index.js`; lỗi thiếu bảng → `HttpError(503)` kèm tên migration (mẫu `rewardResult`/`trackingResult`).
4. Validate đầu vào ở service (mẫu `normalizeTask`, `normalizeSettings`); thông báo lỗi tiếng Việt cụ thể.
5. Chống cộng trùng/gửi lặp bằng **khóa duy nhất ở DB**, không chỉ kiểm tra ở code.
6. Test: hàm thuần + service trên `fake-db` với đồng hồ giả + HTTP; mở rộng `fake-db.js` khi cần toán tử mới; luôn có test cho đường lỗi, thiếu migration, và "tính năng tắt = hành vi cũ". Chạy `npm test` (trong `backend/`) và giữ toàn bộ xanh.
7. Giao diện: dùng token Cozy Purple (`--brand-*`, `--amber-*`, `--r-*`…), tuân thủ design spec (§6.7 thẻ nhiệm vụ, §7 sticker, §8 chuyển động, §9 trợ năng: chạm ≥44px, không truyền đạt bằng màu đơn thuần, có `aria-label`, tôn trọng `prefers-reduced-motion`). Trang học sinh dùng `tapi()` (không dùng `api()`).
8. **Kiểm tra trên trình duyệt thật** (headless Chrome + backend thật + DB giả) ở 1440 / 820 / 390 px; xem ảnh render; mobile so `scrollWidth` với đúng 390. Chạy lại hành trình theo dõi tiến triển và kiểm tra hồi quy cũ.
9. Cập nhật `CLAUDE.md` (mục trạng thái ở trên), `none.md` (tài liệu người dùng) và `UPGRADE_PROGRESS.md`. Không commit nếu người dùng chưa yêu cầu. Không ghi vào Supabase thật nếu chưa được phép; script seed phải **chạy lại an toàn** và không ghi đè chỉnh sửa của admin.
10. Báo cáo cuối bằng tiếng Việt: đã làm gì, file nào, test nào chạy và kết quả thật, điều chưa kiểm chứng, việc người dùng cần làm (chạy migration, quyết định).

### 5. Lộ trình chi tiết

#### Giai đoạn 3A — Chuỗi ngày và Thẻ nghỉ (migration `010`) — Đã triển khai, người dùng báo đã chạy
- **Mục tiêu**: khích lệ quay lại mà không gây áp lực. Chuỗi = số ngày liên tiếp (giờ VN) có ít nhất một nhiệm vụ hoàn thành (kể cả hoàn thành 0 điểm vì trần).
- **Dữ liệu**: bảng `reward_rest_cards(id, profile_id, local_date, created_at, unique(profile_id, local_date))`; `reward_settings` thêm `rest_cards_per_week smallint default 2 check (0..7)` và `streak_enabled boolean default true`.
- **Quy tắc**: Thẻ nghỉ do **học sinh chủ động** dùng cho một ngày (hôm nay hoặc hôm qua), ngày dùng thẻ **không phá chuỗi và không cộng điểm**; chuỗi tính từ sổ điểm + thẻ nghỉ (không lưu đếm sẵn để tránh lệch); gián đoạn chỉ đưa chuỗi về 0 hiển thị, **không** xóa điểm/vật phẩm; không bao giờ hiển thị "bạn đã mất chuỗi".
- **Service** (`reward.js` hoặc `reward-streak.js` thuần): `computeStreak(completionDates, restDates, today)`; `useRestCard(profileId)`; `today()` trả thêm `streak: {current, best, restCardsLeft}`.
- **API**: `POST /api/track/rewards/rest-card`.
- **Test bắt buộc**: chuỗi qua nửa đêm giờ VN, cuối tuần, thẻ nghỉ không phá chuỗi, giới hạn thẻ/tuần, dùng thẻ hai lần cùng ngày bị chặn (23505), `streak_enabled=false` ẩn hoàn toàn, không có đường nào trừ điểm.

#### Giai đoạn 3B — Danh mục vật phẩm mở khóa (migration `012`)
- **Mục tiêu**: danh hiệu, huy hiệu, sticker, giao diện, vật phẩm thú cưng — **data-driven** như nhiệm vụ, không hard-code.
- **Dữ liệu**: `reward_items(id, code unique, kind in ('title','badge','sticker','theme','pet_item'), name, description, unlock_stars int default 0, asset_key text, is_active, is_placeholder, sort_order)`; `reward_unlocks(profile_id, item_id, unlocked_at, unique(profile_id,item_id))`; `reward_profile_prefs(profile_id pk, equipped jsonb, reminders_enabled boolean default true)`.
- **Quy tắc (đề xuất, cần xác nhận với người dùng nếu đổi)**: mở khóa theo **tổng Sao tích lũy** (không *tiêu* Sao, không có "mất đồ"), mở khóa tự động khi đạt ngưỡng và idempotent; chỉ mục đã mở mới trang bị được; `asset_key` trỏ tới SVG nội tuyến có sẵn trong code, **không tải ảnh ngoài**; không có vật phẩm "hiếm"/ngẫu nhiên kiểu loot box.
- **API**: `GET /api/track/rewards/inventory`, `POST /api/track/rewards/equip` (`{itemCode}`/`{kind, itemCode:null}` để gỡ); admin: `GET|POST|PUT /api/admin/rewards/items`.
- **UI**: tab "Kho đồ" (sticker/huy hiệu/danh hiệu/giao diện), trang bị ngay; admin thêm/sửa/ẩn vật phẩm trong `#/admin/rewards` (thêm khối riêng).
- **Test bắt buộc**: mở khóa idempotent khi gọi song song, không mở khi chưa đủ Sao, không trừ Sao khi mở/trang bị, vật phẩm ẩn không trang bị được, thiếu migration → 503.

#### Giai đoạn 3C — Thú cưng (không cần migration mới, dùng `reward_profile_prefs`)
- **Mục tiêu**: bạn đồng hành dễ thương theo phong cách app chăm sóc bản thân trong `design-spec-cozy-purple.md` (§7: SVG phẳng hai tông, không viền đen, bóng elip dưới chân, má hồng `#F6A8B8`; một chuyển động nền duy nhất là "thở").
- **Quy tắc**: chỉ các trạng thái **tích cực hoặc trung tính** (vui, thoải mái, ngủ ngon, vẫy chào khi quay lại). Không có trạng thái buồn/đói/ốm/nhớ bạn. Khi quay lại sau nhiều ngày chỉ chào ấm áp. Tên thú cưng chọn từ **danh sách có sẵn** (không cho học sinh gõ tự do, tránh nội dung không kiểm duyệt). Vật phẩm trang trí lấy từ `reward_items(kind='pet_item')`.
- **UI**: component SVG nội tuyến trong `frontend/js/pet.js` (file mới, nạp trước `tracking.js` trong `index.html`), CSS trong `tracking.css`; hoạt ảnh chỉ trong `@media (prefers-reduced-motion: no-preference)`.
- **Test**: kiểm tra bằng trình duyệt (render ở 390px, reduced-motion tắt hoạt ảnh); test thuần cho hàm chọn trạng thái thú cưng (đảm bảo không bao giờ trả trạng thái tiêu cực với mọi đầu vào).

#### Giai đoạn 3D — Khung điều hướng học sinh và nhắc nhẹ
- **Mục tiêu**: thanh tab dưới cho khu học sinh (Nhiệm vụ · Thú cưng · Kho đồ · Tiến triển) theo mẫu `cozy.css` (thanh tab cố định đáy <768px, viên thuốc 768–1023px) và design spec; hiện `safe-area-inset-bottom`.
- **Nhắc nhẹ**: chỉ hiện lời nhắc khi học sinh mở ứng dụng ("Hôm nay bạn muốn làm việc nhỏ nào?"); công tắc bật/tắt lưu ở `reward_profile_prefs.reminders_enabled`; **không** gửi email/SMS, **không** thu thập liên hệ; nhắc cục bộ trên thiết bị (Notification API) chỉ khi học sinh tự bật, và không có nội dung gây tội lỗi.
- **Test**: trình duyệt ở 3 kích thước; công tắc tắt nhắc nhở thì không hiện gì.

#### Giai đoạn 4 — Mini-game gắn nhiệm vụ (dùng lại `start`/`complete`, chỉ thêm một cột nhỏ)
- **Mục tiêu**: trải nghiệm kiểu Duolingo/Blooket vừa phải (dễ chơi, thưởng đều, không ép), **không đổi quy tắc tính điểm**.
- **Danh sách**: (1) **Thở theo vòng tròn 3 phút** cho R-03 (`completion_type=timer`; vòng tròn phình/xẹp theo nhịp "hít 2 lần mũi + thở ra dài"; thoát giữa chừng thì nhiệm vụ không hoàn thành nhưng không phạt; đếm giờ vẫn do **máy chủ** kiểm); (2) **Hẹn giờ chợp mắt** cho Y-01 (timer 20 phút trong khung 11:00–14:00); (3) **Xếp 3 việc ngày mai** cho R-05 (`count_chars`; chỉ gửi số ký tự); (4) có thể thêm mini-game ngắn khác nhưng phải gắn với một nhiệm vụ thật và theo nguyên tắc bất biến.
- **Quy tắc**: không rút thưởng ngẫu nhiên, không bảng xếp hạng so sánh học sinh, không đếm ngược gây căng thẳng; hiệu ứng hoàn thành theo design spec §8 (check pop 320ms, thanh tiến độ 600ms, tối đa 5–8 hạt confetti 600ms, tôn trọng reduced-motion).
- **Implementation:** `frontend/js/games.js` renders the allowlisted games; migration `013_reward_task_games.sql` adds the nullable checked `reward_tasks.game` field. The later roadmap migrations are 014-017.
- **Test**: hàm thuần cho nhịp thở/đếm giờ; trình duyệt: không tràn ngang 390px, thoát giữa chừng không ghi điểm, hoàn thành ghi đúng một lần.

#### Giai đoạn 5 — Assent và đồng ý phụ huynh cấu hình được (migration `014`)
- **Mục tiêu**: thay tuyên bố "từ 18 tuổi" cứng bằng quy trình phù hợp học sinh chưa thành niên.
- **Dữ liệu**: `survey_tracking_configs` thêm `consent_mode text default 'adult_self' check in ('adult_self','assent_guardian','waived_by_ethics')`, `assent_text`, `guardian_text`, `ethics_reference text` (số/ghi chú phê duyệt, **do người có thẩm quyền nhập**, không tự điền); `tracking_consents` thêm `consent_kind in ('adult','assent','guardian')`, `guardian_confirmed boolean`.
- **Quy tắc**: `adult_self` giữ **nguyên hành vi hiện tại** (tương thích ngược, `adult_attestation`); `assent_guardian` yêu cầu học sinh xác nhận *assent* và xác nhận đã có sự đồng ý của phụ huynh/người giám hộ (nhà trường/nghiên cứu thu bản giấy ngoài hệ thống; hệ thống chỉ ghi nhận xác nhận, **không** tự xác minh); `waived_by_ethics` chỉ bật được khi `ethics_reference` có nội dung và hiển thị rõ cho nhà nghiên cứu; mã băm `consentHash` phải bao gồm chế độ và mọi văn bản; đổi nội dung → tăng phiên bản, người đã đồng ý bị hỏi lại; **không cho sửa văn bản đã được dùng** (tạo phiên bản mới thay vì sửa tại chỗ).
- **UI**: mục "Đồng ý của người tham gia" trong `renderConfig` (chọn chế độ, văn bản, tham chiếu phê duyệt); `consentForm` của học sinh hiển thị đúng ô xác nhận theo chế độ.
- **Test**: ma trận chế độ × xác nhận thiếu/đủ; `adult_self` giống hệt hành vi cũ (chạy lại test tracking hiện có); băm đổi khi đổi chế độ; không bật `waived_by_ethics` khi thiếu tham chiếu.

#### Giai đoạn 6 — Nhóm đối chứng và xuất dữ liệu (migration `015`)
- **Dữ liệu**: `survey_tracking_configs` thêm `reward_arm_mode text default 'all_on' check in ('all_on','all_off','randomized')`, `reward_arm_ratio smallint default 50 check (1..99)`; bảng bất biến `reward_arm_assignments(profile_id, survey_id, arm in ('reward','control'), assigned_at, unique(profile_id, survey_id))`.
- **Quy tắc**: phân bổ **một lần, bất biến**, xác định bằng băm (`HMAC(secret, profile_id|survey_id)`) theo tỷ lệ cấu hình, **học sinh không chọn và không thấy** mình ở nhóm nào; nhóm đối chứng vẫn thấy khu hỗ trợ và vẫn được làm khảo sát/đánh giá lại, chỉ không có phần nhiệm vụ/điểm; đổi chế độ không đổi nhóm đã phân bổ; `reward_arm_mode='all_off'` = tắt thưởng cho khảo sát đó.
- **Xuất dữ liệu**: `GET /api/tracking/surveys/:id/reward-export` (owner/researcher): chỉ số **tổng hợp theo nhóm** (số hồ sơ, số lần hoàn thành, trung bình Sao) áp ngưỡng `MIN_GROUP_SIZE=5` (ẩn ô nhỏ), CSV theo mẫu `csv-export.js`, **không** có định danh hồ sơ.
- **Test**: phân bổ ổn định và xấp xỉ tỷ lệ, không đổi khi cấu hình đổi, ẩn ô nhỏ, quyền (viewer 404).

#### Giai đoạn 7 — Lưu trữ và xóa dữ liệu (migration `016`)
- **Quy tắc**: không tự đặt thời hạn. Thêm `reward_settings.retention_days integer null` (null = chưa có chính sách, **không xóa gì**) và `retention_policy_note text`.
- **Việc làm**: (a) giữ và hoàn thiện "Xóa hồ sơ" của học sinh (đã cascade `reward_*`; có test); (b) trang giải thích rõ dữ liệu nào xóa ngay, dữ liệu nào (phản hồi khảo sát đã ẩn danh) được giữ do nghĩa vụ nghiên cứu; (c) script `scripts/purge-expired.js --dry-run|--apply` chỉ chạy khi `retention_days` đã được người có thẩm quyền đặt, mặc định dry-run, ghi nhật ký; (d) tách định danh khỏi dữ liệu khảo sát (hiện tại hồ sơ chỉ chứa UUID ngẫu nhiên, giữ nguyên).
- **Test**: `retention_days=null` không xóa gì; dry-run không ghi; apply chỉ xóa bản ghi quá hạn và ghi nhật ký.

#### Giai đoạn 8 — Mức điểm cho từng phản hồi trong Phân tích (migration `017`)
- **Dữ liệu**: `responses` thêm `band smallint null` và `band_label text null` (chụp nhãn tại thời điểm chấm); điền trong `controllers/public.js` khi `bandForSubmit` có kết quả (không cần hồ sơ).
- **Quy tắc**: chỉ nhà nghiên cứu xem; hiển thị là *tín hiệu sàng lọc*, không chẩn đoán; số liệu tổng hợp áp `MIN_GROUP_SIZE`; không đưa vào file xuất nếu chưa được người dùng chấp thuận.
- **UI/API**: cột "Mức điểm" và bộ lọc theo mức trong bảng phản hồi (`responses.listBySurvey` thêm `band` vào whitelist lọc/sắp xếp theo mẫu `quality`/`sort`); thẻ phân bố mức cho **mọi** người làm bài (không chỉ người có hồ sơ).
- **Test**: lọc/sắp xếp đúng, tham số sai → 400, khảo sát không bật mức → cột trống, phản hồi cũ (band null) không lỗi.

### 6. Việc cần người có thẩm quyền quyết định (AI **không** tự làm)

- Ngưỡng cắt cho từng thang và nguồn công cụ chuẩn hóa; xác nhận ngưỡng cho bản tiếng Việt đã chỉnh lời và cho học sinh.
- Kênh hỗ trợ thật của trường (tên phòng, người phụ trách, địa chỉ/liên hệ).
- Phê duyệt của nhà trường và hội đồng đạo đức; nội dung đồng ý/assent/phụ huynh; có miễn hay thay đổi yêu cầu đồng ý không.
- Thời hạn lưu trữ và quy trình xử lý yêu cầu xóa dữ liệu.
- Nhiệm vụ chính thức của từng nhóm (xanh/vàng/đỏ) và cách kiểm chứng chính thức; có giữ điểm bằng nhau giữa các nhiệm vụ không.
- Quy tắc mở khóa vật phẩm (theo tổng Sao tích lũy là đề xuất) và danh sách tên thú cưng, danh hiệu.
- Thiết kế nhóm đối chứng (tỷ lệ, đơn vị phân bổ: khảo sát hay lớp).
- Nếu sau này muốn có câu hỏi về ý định tự làm hại bản thân: chỉ khi có công cụ phù hợp và quy trình chuyển tiếp được phê duyệt.

### 7. Checklist trước khi báo hoàn thành một giai đoạn

- [ ] Migration mới chỉ thêm, có RLS + `revoke`, mặc định tắt; nêu rõ người dùng phải chạy số nào.
- [ ] Không phụ thuộc migration mới khi tính năng không bật (thử bằng `failWhen(... 'PGRST205')` trong test).
- [ ] `npm test` toàn bộ xanh (ghi số test thực tế); thêm test cho mọi quy tắc ở phần "Quy tắc" của giai đoạn.
- [ ] Hành trình trình duyệt thật + xem ảnh ở 1440/820/390px, 0 lỗi JS/API; hồi quy theo dõi tiến triển và trang cũ vẫn qua.
- [ ] Rà lại 9 nguyên tắc bất biến (đặc biệt: không phạt, không nhãn đánh giá, không lưu nội dung nhập, không hứa ẩn danh tuyệt đối).
- [ ] Cập nhật `CLAUDE.md`, `none.md`, `UPGRADE_PROGRESS.md`; không commit nếu chưa được yêu cầu; dọn server/Chrome tạm.



#### Reward inventory stage 3B (migration 012) - implemented; user reported migration applied

- New migration: `backend/migrations/012_reward_inventory.sql`; run manually after 011. Never edit an applied migration.
- Tables: `reward_items`, `reward_unlocks`, and `reward_profile_prefs`; RLS is enabled and direct anon/authenticated access is revoked.
- `backend/src/services/reward.js` manages the catalog, idempotent unlocks based on cumulative stars, inventory, and equip rules. Student APIs: `GET /api/track/rewards/inventory`, `POST /api/track/rewards/equip`; admin APIs: `GET|POST /api/admin/rewards/items`, `PUT /api/admin/rewards/items/:id`.
- Student page: `#/track/inventory`; admin catalog management: `#/admin/rewards` (create, edit, hide, and show). Inline SVG uses an allowlist. The catalog starts empty so admins can add approved content.
- Changed modules: `backend/migrations/012_reward_inventory.sql`, `backend/src/services/reward.js`, `backend/src/controllers/rewards.js`, `backend/src/routes/index.js`, `backend/src/services/activity.js`, `frontend/js/tracking.js`, `frontend/js/app.js`, `frontend/css/tracking.css`.
- No tests or browser checks were run for stage 3B. User reported migration 012 applied; manual browser verification remains pending.

#### Companion pet stage 3C - implemented; manual verification pending

- No migration is needed. The selected companion is stored in `reward_profile_prefs.equipped.pet`; the server accepts only the fixed species `cat`, `bunny`, `fox`, and `bear`. The companion defaults to `cat`.
- Student page: `#/track/pet`; companion shortcut is on the tracking dashboard, and reward tabs link to the companion, tasks, and inventory.
- `frontend/js/pet.js` renders local inline SVG companions with a small pre-approved species list and positive/neutral greetings only. Its only background movement is gentle breathing under `prefers-reduced-motion: no-preference`; no free-text pet names or care schedule are used. An equipped `pet_item` appears as decoration.
- `POST /api/track/rewards/equip` accepts `{kind:'pet',itemCode:<species>}` or `{kind:'pet',itemCode:null}`. This shares the existing profile preferences table and tracker authorization.
- `reward_profile_prefs.reminders_enabled` is changed through tracker-only `PUT /api/track/rewards/reminders` with `{enabled:boolean}`. The in-app reminder appears only on the tracking dashboard when enabled. A browser notification is optional, requested only by a direct student click, limited to once per local device day, and never runs in the background; no email/SMS or contact data is used.
- The student nav is rendered in `frontend/js/tracking.js` for all `#/track` routes and styled in `frontend/css/tracking.css`: fixed bottom under 768px with safe-area padding, floating pill at 768-1023px, and a sticky vertical sidebar at 1024px+. It links to progress, pet, tasks, and inventory.
- No tests or browser checks were run. Stage 3D is implemented; manual responsive and opt-in verification remains pending. Stage 4 mini-game code is implemented; apply migration 013 and manually verify.


#### Tài khoản học sinh (migration 019) - đã làm, chờ chạy migration

- Theo quyết định của chủ dự án (2026-11-20): học sinh đăng nhập bằng **tên đăng nhập + mật khẩu** (không email/SĐT). Bảng `tracking_accounts(profile_id unique, username unique ^[a-z0-9_]{3,30}$, password_hash bcrypt)`; xóa hồ sơ thì xóa tài khoản (cascade).
- Tài khoản chỉ tạo được khi **đã có hồ sơ** (sau khảo sát + đồng ý), nên không tạo hồ sơ trước khi đồng ý. Mã khôi phục vẫn giữ làm dự phòng.
- Service `services/tracking-accounts.js` (factory nhận `db`, `mintCredential`); controller `accounts` trong `controllers/tracking.js` (`useTrackingService(service, db)` thay cả hai trong test). API: `POST /api/track/account/login` (công khai, giới hạn tần suất), `GET|POST /api/track/account`, `PUT /api/track/account/password` (cần cookie). Thiếu 019 → đọc trả `available:false`, ghi trả 503.
- UI: `#/track/login` (khung `frame(..., { bare: true })` không có thanh tab), form tạo tài khoản sau khi lưu kết quả và ở trang Tiến độ, link "Khu học sinh" trên trang đăng nhập chính. Mọi 401 ở trang học sinh chuyển về `loginView()`.
- Test: `test/tracking-accounts.test.js`.
- Form đồng ý của khảo sát có thêm khối **tùy chọn** "Tạo tài khoản đăng nhập" (`#track-user`/`#track-pass`): enroll xong mới gọi `POST /track/account`; lỗi tạo tài khoản không làm mất hồ sơ (hiện toast, form tạo tài khoản vẫn còn ở trang Tiến độ). Chưa chạy kiểm tra trình duyệt cho khối này.

#### Game một màn hình thống nhất (2026-11-21) - đã làm

- Chủ dự án yêu cầu game như trò chơi thật (tham khảo Rise of Kingdoms): **một giao diện chơi**, thế giới ở giữa, HUD, nhấn vào nhân vật/công trình để tương tác, mọi chức năng mở bằng panel trong game. **Cấm** chia tab Nhân vật/Công trình/Việc hôm nay, cấm chuyển trang, cấm giao diện kiểu dashboard.
- `gameView(open, arg)` + `renderGame` + `openPanel(kind)` trong `frontend/js/tracking.js`; CSS riêng `frontend/css/game.css` (tiền tố `.gw-`, nạp sau tracking.css). Màn hình game chiếm toàn bộ viewport (`app bare gw-app`), KHÔNG dùng `frame()`.
- Thế giới: `Village.scene(state, { interactive: true })` thêm `role=button`/`tabindex`/`data-building`/`data-hero`/`data-pet-sprite`, `preserveAspectRatio="xMidYMax slice"`; kéo chuột để xem, chạm thì cuộn ngang tự nhiên (`.gw-world` cuộn ngang, trang không tràn). Mobile dùng `aspect-ratio:1.85` để cắt bớt trời.
- HUD: chân dung + cấp làng (`Village.levelOf` = số công trình, chỉ hiển thị), thanh tiến độ tới công trình kế tiếp, Sao/công trình/chuỗi, nút hỗ trợ (luôn có khi khảo sát có kênh hỗ trợ), cài đặt, thoát. Theo dõi "Việc hôm nay" ở góc trái; thanh hành động: Nhiệm vụ · Túi đồ · Nhân vật · Sổ làng.
- Panel: `quests` (dùng `tasksBody` + `wireTasks(data, refresh, root)`), `building` (giải thích + việc liên quan làm ngay tại chỗ, nền đất chưa mở hiện tiến độ), `hero` (tùy chỉnh, nhân vật trong làng đổi ngay), `bag` (vật phẩm, trang bị/gỡ), `codex`, `support`, `settings` (lời nhắc + thông báo thiết bị). Esc đóng panel; `frame()` gỡ `document.onkeydown` khi rời game.
- Đã xóa trang riêng `tasksView`, `petView`, `inventoryView`; `#/track/tasks|pet|inventory` mở thẳng panel tương ứng trong game. Điều hướng trang học sinh ngoài game còn: Tiến độ · Vào game.
- Researcher dashboard: căn đều chiều cao ô lọc (`.survey-filters`, `.response-card .review-tools` = 48px), lưới lọc phản hồi 4 cột, ẩn thanh admin trống trên mobile. Chưa đổi bố cục lớn các trang khác (đã chụp kiểm tra: không tràn ngang ở 390).

#### Nâng cấp khảo sát + game (2026-11-20, theo tieu-chi-giao-dien-game.md) - đã làm, chờ chạy migration 020

- **Khảo sát**: không tự chuyển câu sau khi chọn (chỉ khi bấm Tiếp tục); sửa lỗi "Quay lại" không khôi phục đáp án (restore chạy sau wire); câu hỏi giờ giấc (key kết thúc bằng `bedtime`/`waketime` hoặc `settings.input='time'`) dùng bộ chọn giờ/phút + "Bây giờ" + gợi ý nhanh, ghi `HH:MM` vào cùng ô nhập nên `collect()`/`parseClock` không đổi. Tín hiệu chất lượng (too_fast, straight-lining…) là cờ nhà nghiên cứu xem, không chặn hay bắt người tham gia chờ: giữ nguyên. Khảo sát có thể đăng nhập tài khoản học sinh ngay ở màn hình hoàn thành để gắn kết quả vào hồ sơ cũ (`/track/enroll` cùng `responseId`, trong 2 giờ).
- **Cổng game**: `requireStudentAccount` (controllers/tracking.js) chặn mọi `/api/track/rewards/*` nếu hồ sơ không có `tracking_accounts` (403, `code: student_account_required`); thiếu 019 → 503. KHÔNG chặn `/me`, `/assessments`, `/credentials`, `/account*`, `/signout`, `/profile`: người chỉ có mã định danh vẫn khảo sát và xem tiến triển. Frontend: `lockedView()` (tạo tài khoản tại chỗ), thẻ "Game" ở trang Tiến độ.
- **Khảo sát mặc định (migration 020)**: bảng `survey_votes(admin_id pk, survey_id)`; mỗi admin một phiếu đổi được; chỉ khảo sát đã xuất bản được tính; nhiều phiếu nhất thắng, hòa → nhận phiếu sớm nhất → theo id; không có phiếu → không có mặc định. `GET /api/public/default-survey` (công khai, chỉ slug/title/description); admin: `GET|PUT|DELETE /api/admin/survey-votes`, trang `#/admin/vote`. Trang chủ `#/` khi CHƯA đăng nhập hiển thị đúng một khảo sát đó (`surveyView(slug,null,{home:true})`); người đã đăng nhập vẫn vào bảng điều khiển. Đăng nhập nhà nghiên cứu: `#/login`. Tôi hiểu "không hiển thị danh sách nhiều khảo sát" là phía người tham gia.
- **Game "Làng nhỏ" là một màn hình**: HUD + cảnh pixel + 3 tab trong game (Việc hôm nay = `tasksBody()` dùng lại `wireTasks(data, refresh)`; Nhân vật; Công trình). Nhân vật tùy chỉnh: chỉ số bộ phận (`AVATAR_LIMITS` trong reward.js khớp `AVATAR_PARTS` trong village.js), lưu ở `reward_profile_prefs.equipped.avatar` qua `equip {kind:'avatar', avatar}`, validate nghiêm ngặt; bộ lọc `inventory()` không được xóa `avatar`. Điều hướng học sinh còn 4 mục: Tiến độ, Game, Kho đồ, Thú cưng; `#/track/tasks` chuyển vào tab Việc hôm nay. Không thêm nguồn Sao mới (Sao chỉ từ nhiệm vụ).
- Công cụ kiểm tra trình duyệt: script CDP ở scratchpad (Chrome headless qua `--remote-debugging-port`, `Runtime.evaluate`, `Page.captureScreenshot`) + harness tạm `backend/_harness.mjs` (đã xóa; dựng lại từ `test/helpers/fake-db.js`, cần hàng `tracking_accounts` thì game mới mở).
- Chưa làm: viết lại toàn bộ giao diện bảng điều khiển nhà nghiên cứu (chỉ tinh chỉnh khảo sát, màn hình hoàn thành, game); câu hỏi theo dõi sau nhiệm vụ kiểu "có thấy tỉnh táo hơn không" (cần quyết định về dữ liệu thu thập).

#### Mini-game "Làng nhỏ" - đã làm

- `frontend/js/village.js` (nạp sau `games.js`, trước `tracking.js`): pixel art SVG nội tuyến, 11 công trình mở theo **tổng Sao đã nhận** (không tiêu, không mất, không ngẫu nhiên), nhân vật + mèo chỉ vui, ngày/đêm theo giờ máy, hoạt ảnh chỉ khi `prefers-reduced-motion: no-preference`. Ngưỡng mở là **bản thử nghiệm** cần người có thẩm quyền xác nhận.
- `MECHANISMS` diễn giải cơ chế sinh học từ `solution.md` cho từng mã nhiệm vụ; hiện ở thẻ công trình và mục "Vì sao việc này có ích?" trên thẻ nhiệm vụ. Không phải chẩn đoán.
- API chỉ đọc `GET /api/track/rewards/village` (`reward.village()`, chỉ cần migration 009). Lưu ý: nhóm (và do đó nhiệm vụ) cần `tracking_sessions.band` không null, nên DB thật **phải chạy 018** thì nhiệm vụ mới mở cho học sinh mới.
- Kiểm tra trình duyệt: Chrome headless có bề rộng cửa sổ tối thiểu ~500px nên ảnh 390px trông bị cắt; đo tràn ngang bằng iframe 390px (`scrollWidth`).

#### Reward mini-games stage 4 (migration 013) - implemented; migration and manual verification pending

- Migration: `backend/migrations/013_reward_task_games.sql` adds nullable `reward_tasks.game` with a strict allowlist and matching completion-type constraint. It attaches games only to known placeholder seed rows R-03, Y-01, and R-05. Apply manually after migration 012. The planned migrations shift: assent 014, control-group exports 015, retention 016, per-response bands 017.
- Admin chooses an allowlisted game in the task editor. Service validation requires timer for `breathing` and `rest_timer`, and count_chars for `three_plans`. When 013 is absent, ordinary task edits without a game retain compatibility; assigning a game returns a migration hint.
- Student games reuse existing start/complete endpoints and scoring. R-03 uses a breathing circle with no breath holds and an explicit stop action that deletes its server timer start; Y-01 uses the existing server-timed rest flow; R-05 has three browser-only text fields and sends only the combined character count. No user text is stored or sent.
- Standard participant flow: create a research project, link a survey, configure tracking/bands/rewards from that linked survey's `#/tracking/:surveyId` page, and publish the survey. After submission, the participant can explicitly agree to create the anonymous tracker profile; only then does the completion screen offer `#/track/tasks` when rewards are enabled. The game profile is not created before completion or consent.
- Completion confetti uses 5-8 decorative pieces for 600ms and is disabled under reduced motion. There is no leaderboard, random prize, penalty, or change to points.
- Files: `backend/migrations/013_reward_task_games.sql`, `backend/src/services/reward.js`, `backend/src/services/reward-seed-tasks.js`, `frontend/js/games.js`, `frontend/js/tracking.js`, `frontend/js/app.js`, `frontend/index.html`, `frontend/css/tracking.css`. No tests or browser checks were run.
