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
- Migration là SQL thuần trong `backend/migrations/` (001 → 013, 018, 019, 020, 021; 014–017 dành cho lộ trình giai đoạn 5–8), **chạy tay** trong Supabase SQL Editor, chỉ thêm mới, không sửa file đã áp dụng. Migration chưa chạy thì tính năng tương ứng trả HTTP 503 kèm gợi ý, phần còn lại vẫn chạy.
- `backend/.env.example` đang được git theo dõi và có vẻ chứa giá trị thật: không in ra, nên xoay khóa và thay bằng placeholder.

## Kiến trúc

**Một tiến trình Express** (`backend/src/app.js`) phục vụ cả API `/api/*` lẫn thư mục `frontend/` (SPA, định tuyến bằng URL hash, JS thuần, không framework). `routes/index.js` là nơi duy nhất khai báo route và middleware quyền; controller mỏng, nghiệp vụ nằm ở `services/`.

**Database**: Supabase, backend luôn dùng `service_role`; mọi bảng bật RLS **không có policy** và `revoke` quyền `anon/authenticated`. Mọi kiểm tra quyền nằm ở code backend, không ở RLS.

**Phân quyền xem/sửa** (`services/research-projects.js`): `getSurveyAccess` / `getProjectAccess` nhận danh sách vai trò. Mặc định `READ_ROLES = owner, researcher, reviewer, viewer`; viewer = mọi tài khoản đã đăng nhập, chỉ đọc qua các helper này. Mọi thao tác ghi/xuất file/review truyền danh sách vai trò tường minh không có `viewer`. Ngoại lệ tạm thời: `surveys.update` còn kiểm tra cờ toàn cục `app_settings.shared_survey_editing`, mặc định bật; không mở quyền xóa, review, export hoặc cấu hình tracking. `canReview` ở controller phải tính theo `owner|researcher`, không phải "khác reviewer".

**Progress Tracking** (người tham gia không cần tài khoản): `services/tracking.js` là factory `createTrackingService(db, {clock})` nhận DB qua tham số để test bằng DB giả; `controllers/tracking.js` giữ instance qua `useTrackingService`. Danh tính = hồ sơ ẩn danh + credential (cookie `bs_track`, mã khôi phục, liên kết khôi phục một lần), chỉ lưu HMAC-SHA256. Mặc định **tắt** cho mọi khảo sát (bảng `survey_tracking_configs`). Gồm: `tracking-scoring.js` (chấm điểm, dấu vân tay thang đo, chia 2–6 mức), `tracking-instruments.js` (PSQI, HCL-32 theo `settings.key` của câu hỏi), `tracking-schedule.js`, `tracking-history.js`, `tracking-credentials.js`.

**Chia mức điểm** (`bands`, migration 008): n-1 điểm cắt tăng dần, điểm cắt = điểm *đầu tiên* của vùng cao hơn; tính **ngay lúc nộp bài** trong `controllers/public.js` (không cần hồ sơ), hộp hỗ trợ luôn hiện ở mức cần hỗ trợ nhiều nhất. Mức chỉ để gợi ý, không phải chẩn đoán; ngưỡng do nhà nghiên cứu nhập, hệ thống không tự suy ra.

**Mẫu khảo sát** (`services/survey-templates.js`): PSQI và HCL-32 dựng sẵn; `createSurveyFromTemplate` dùng chung cho API (`POST /api/templates/:key/survey`) và script seed.

**Nhật ký hoạt động** (`services/activity.js`, migration 007): `logActivity` **không bao giờ ném lỗi**, không lưu mật khẩu/token, IP chỉ băm. Chỉ admin xem (`/api/admin/activity`).

**Frontend**: `index.html` nạp `style.css` (layout cũ) → `cozy.css` (theme "Cozy Purple" ghi đè) → `components.css` (lớp component dùng chung) → `tracking.css` (tiền tố `.tk-`) → `game.css`; `ui.js` → `components.js` → `pet.js` → `games.js` → `village.js` → `tracking.js` → `app.js` (thứ tự bắt buộc). Giao diện người tham gia (`#/s/<slug>`, `#/track…`) không cần đăng nhập.

## Những cạm bẫy đã gặp

- **DB thật có thể lệch file migration**: `add column if not exists` không đổi kiểu/ràng buộc của cột đã có. Đã gặp: `tracking_sessions.band` là `text` (bản 008 cũ) nên lưu band = 2 bị 23514 → HTTP 500 khi bấm "Tạo hồ sơ theo dõi". Migration `018_fix_tracking_band_check.sql` đổi sang `smallint` 0–5 (người dùng chạy tay); `attachSession` trong `services/tracking.js` có fallback lưu phiên không kèm band khi gặp 23514 liên quan band. Fake DB không có ràng buộc nên test không bắt được lỗi dạng này: khi nghi ngờ, chẩn đoán bằng script đọc/tự dọn dẹp trên DB thật rồi xóa script.
- **Học sinh không có nhiệm vụ = không có mức điểm**: nhóm lấy từ `tracking_sessions.band`; phiên `incomplete` (score null) thì band null → `today()` trả `enabled:false`. Nguyên nhân đã gặp ở PSQI: giờ đi ngủ/thức dậy là ô văn bản, học sinh gõ "3" hoặc bỏ trống nên không chấm được. Đã sửa: `parseClock` nhận giờ tròn ("3" → 03:00, đồng hồ 24 giờ), câu hỏi ghi rõ định dạng, ô nhập hiển thị `placeholder` của câu hỏi. Chẩn đoán bằng cách chạy `computeScore` trên câu trả lời đã lưu. Phiên đã lưu không chấm lại; học sinh làm lại khảo sát.
- **Server cũ sau khi sửa backend**: `npm start` không tự nạp lại code. Frontend (file tĩnh) thì mới ngay nhưng API vẫn cũ → lỗi khó hiểu (đã gặp: lưu nhân vật báo lỗi vì server cũ chưa có `equip {kind:'avatar'}`). Kiểm tra nhanh: `/api/public/default-survey` trả 404 = server cũ. Sau khi sửa backend phải khởi động lại server (hoặc dùng `npm run dev`).
- **Bạn đồng hành trong làng** vẽ theo `equipped.pet` (`companion()` trong village.js, 4 loài cat/bunny/fox/bear, màu khớp pet.js); panel Nhân vật đổi ngay trong cảnh, lỗi thì trả lại loài cũ.
- **Quy ước phiên làm việc**: sau mỗi lần làm xong, ghi một mục ngắn vào `docs/implementation-log.md` (chỉ sửa `CLAUDE.md` khi có quy tắc hoặc cạm bẫy lâu dài mới) rồi cập nhật graphify (`graphify-out/`).

- Câu hỏi **chọn một** lưu **nhãn** của lựa chọn, không phải `value`. Chấm điểm thang chuẩn phải ánh xạ nhãn → giá trị (`choices` chụp trong cấu hình); đổi tên lựa chọn mà không lưu lại cấu hình làm lần nộp đó không được chấm (an toàn).
- `api()` trong `app.js` đăng xuất người dùng khi gặp 401; trang người tham gia dùng `tapi()` riêng trong `tracking.js`.
- Khi vá `app.js` bằng `String.prototype.replace`, `$$` trong chuỗi thay thế bị biến thành `$` (làm hỏng `$$('…')`). Dùng `split().join()` hoặc công cụ Edit.
- Test dùng `test/helpers/fake-db.js` (một phần nhỏ API supabase-js, có unique/cascade/`failWhen`); mở rộng nó khi code mới dùng thêm toán tử truy vấn. Fake DB **không có default cột** (vd `status`, `updated_at`): đặt giá trị tường minh khi insert.
- Kiểm tra giao diện phải xem ảnh render thật; ở mobile so `scrollWidth` với đúng 390, không dùng `innerWidth` (Chrome mở rộng layout khi tràn).
- Câu trả lời học sinh và dữ liệu nhạy cảm: không lưu chữ tự do không cần thiết (R-01 chỉ lưu loại hành động; R-05 chỉ đếm ký tự ở trình duyệt).

## Kế hoạch Reward System (đọc kỹ trước khi làm tiếp)

Tài liệu nguồn: `docs/answer.md` (quyết định của chủ dự án, **ưu tiên cao nhất**), `docs/reward-system-open-decisions.md` (câu hỏi gốc), `solution.md` (nhiệm vụ gốc, nội dung chưa chốt). Nếu code và tài liệu này mâu thuẫn với `answer.md`, theo `answer.md` và báo lại cho người dùng.


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
9. Ghi mục ngắn vào `docs/implementation-log.md`, cập nhật bảng trạng thái trong `docs/reward-roadmap.md` (và `CLAUDE.md` chỉ khi có quy tắc lâu dài); `none.md`/`UPGRADE_PROGRESS.md` chỉ khi người dùng yêu cầu. Không commit nếu người dùng chưa yêu cầu. Không ghi vào Supabase thật nếu chưa được phép; script seed phải **chạy lại an toàn** và không ghi đè chỉnh sửa của admin.
10. Báo cáo cuối bằng tiếng Việt: đã làm gì, file nào, test nào chạy và kết quả thật, điều chưa kiểm chứng, việc người dùng cần làm (chạy migration, quyết định).


### Nơi tra cứu phần còn lại

- `docs/reward-roadmap.md`: bảng trạng thái, API hiện có, quyết định đã chốt (§3), lộ trình giai đoạn 3A–8 (§5), việc cần người có thẩm quyền quyết định (§6), checklist hoàn thành giai đoạn (§7). **Đọc trước khi bắt đầu một giai đoạn mới.**
- `docs/implementation-log.md`: nhật ký từng lần làm (file, migration, cách kiểm tra, điều chưa kiểm chứng). Thêm mục mới ở cuối sau mỗi việc.
- `docs/answer.md` vẫn là nguồn quyết định ưu tiên cao nhất; nếu mâu thuẫn với các file trên, theo `answer.md` và báo lại cho người dùng.
