# Kế hoạch Reward System: trạng thái, quyết định, lộ trình

Tách ra từ `CLAUDE.md` (nguyên tắc bất biến §2 và quy ước làm việc §4 vẫn nằm trong `CLAUDE.md`). Nguồn ưu tiên cao nhất: `docs/answer.md`.

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
| Game 3D voxel (`docs/world3d-plan.md`) | Giai đoạn 0 (nền tảng) xong ở code/test/Firefox; chờ kiểm tra Vercel và duyệt trước giai đoạn 1 |

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
