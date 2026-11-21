# brainst0rm Upgrade Progress

- **Current Phase:** Tài khoản học sinh (migration 019) + mini-game "Làng nhỏ" đã làm; chờ chạy migration 018, 019 và nhận danh sách lỗi UI trong error.md
- **Completed:**
  - [x] Response quality scoring, review states, and researcher-configured consistency checks
  - [x] Psychology analytics with descriptive statistics, group comparison, crosstab, correlation, reliability, and date filters
  - [x] Research projects, survey links, role-based collaborators, notes/activity, and pseudonymous participant codes
  - [x] CSV/XLSX exports and print-to-PDF report implementation
  - [x] Migrations 004 and 005 active; dataset version create/list verified through API and UI
  - [x] UI refresh (same palette/fonts): unified tokens, sidebar with user block, KPI cards with icons, centered empty states with CTAs, onboarding state, dashboard survey table with search and status counts, grouped builder library, sectioned analytics, custom checkbox/radio/range, success/error toasts, split-layout login, card-style public survey
  - [x] Fixed: date-filtered group/crosstab/correlation and Cronbach's alpha requests (missing `?`), empty response table on page 2+, stale builder question count, analytics empty-state link opening the wrong survey, export confirmation label
  - [x] Verified with real QA responses: analytics charts, review row editor, correlation/alpha with date filter, CSV download with SHA-256, report page
  - [x] Responsive check at 1440/820/390px: no horizontal page overflow on Dashboard, Builder, Analytics, Research, Login
  - [x] 23 backend tests, syntax checks, and `git diff --check` pass
  - [x] Progress Tracking (migration 006, mặc định tắt): hồ sơ ẩn danh bằng cookie/mã/liên kết khôi phục, nhiều assessment, lịch follow-up, lịch sử + so sánh baseline khi thang đo tương thích, consent có phiên bản, cấu hình owner, số liệu tổng hợp cho researcher; 79+ backend tests và hành trình trình duyệt thật trên backend thật với DB giả đều pass
  - [x] Admin: cấp/thu hồi admin trên UI, nhật ký hoạt động (migration 007), lọc/sắp xếp phía server cho bảng phản hồi và danh sách khảo sát admin; 98 backend tests pass
  - [x] Reward system giai đoạn 1: chia 3 mức điểm (migration 008), kết quả sau khi nộp bài kèm hộp hỗ trợ nhóm đỏ, số liệu tổng hợp theo mức; 118 backend tests pass
  - [x] Mức điểm 2–6 mức, thang chuẩn PSQI/HCL-32, thư viện mẫu khảo sát, mọi người xem khảo sát/nghiên cứu của nhau (chỉ đọc); 150 backend tests pass
  - [x] Reward system giai đoạn 2: nhiệm vụ data-driven, sổ điểm chỉ-ghi-thêm, trần ngày/tuần, trang học sinh và trang admin (migration 009); 178 backend tests pass
- **In Progress:**
  - [ ] Reward system giai đoạn 3A: chuỗi ngày và Thẻ nghỉ implemented (migration 010, service/API, admin config, student UI); test/QA pending
  - [ ] Migration 010 reported applied by user; verify student flow after task seed/configuration
  - [ ] Apply migration 011 manually to persist admin control for shared survey editing
  - [ ] Verify shared survey editing, audit logging, and admin off switch
  - [ ] Áp dụng migration 008 và 009 lên database thật, rồi nạp nhiệm vụ mẫu
  - [ ] Reward system stage 5-6: assent/guardian consent and control-group exports
  - [ ] Áp dụng migration 007 lên database thật
  - [ ] Áp dụng migration 006 lên database thật và kiểm thử Progress Tracking end-to-end với dữ liệu thật
  - [ ] Verify Owner/Researcher/Reviewer permissions with a second account
  - [ ] Visual check of Admin screens with an admin account (styles harmonized, not browser-verified)
- **Pending:**
  - [ ] Consent workflow; the application does not currently record consent or guardian verification
- **Last Updated:** 2026-11-20

- [x] Reward system stage 3B: migration 012 schema, inventory/equip APIs, student inventory UI, admin catalog CRUD, and audit log implemented; user reported migration 012 applied
- [x] Reward system stage 3C: pet preferences reused from migration 012, fixed species list, inline SVG companion, positive/neutral states, reduced-motion-aware breathing, and student selector
- [x] Reward system stage 3D: responsive student navigation, persisted in-app reminder preference, direct opt-in browser notification no more than once per local day
- [ ] Manually verify inventory, companion selection, three navigation breakpoints, safe-area padding, reduced motion, and notification opt-in

- [x] Reward system stage 4: allowlisted task games, admin assignment, breathing/rest timer interfaces, explicit server-side cancellation for an aborted breathing session, privacy-preserving three-plan form, existing server-side verification and scoring, reduced-motion-aware completion effects
- [x] Connected the study workflow: linked surveys expose their tracking/reward settings; after survey submission and participant consent, the completion page links to the game tasks when enabled
- [ ] Apply migration 013 in Supabase after 012; assign games to approved tasks and verify with a student profile
- [ ] Manually check 320/390px layout, server timer enforcement after reload, breathing cancel invalidates the server timer, R-05 sends only a character count, and reduced-motion behavior
- [ ] Continue with assent/guardian consent (migration 014), then control-group assignments and exports (migration 015)

- [x] Sửa lỗi 500 khi tạo hồ sơ theo dõi: DB thật có `tracking_sessions.band` kiểu text; migration 018 đổi sang smallint, code có fallback lưu phiên không kèm mức
- [x] Tài khoản học sinh (migration 019): tên đăng nhập + mật khẩu gắn với hồ sơ ẩn danh, trang `#/track/login`, tạo tài khoản sau khi đồng ý hoặc ở trang Tiến độ, đổi mật khẩu, đăng xuất; lối vào "Khu học sinh" trên trang đăng nhập; 6 test mới
- [x] Mini-game "Làng nhỏ" (`#/track/village`, `frontend/js/village.js`): làng pixel SVG, 11 công trình mở theo tổng Sao (không tiêu, không mất), nhân vật + mèo luôn vui, ngày/đêm theo giờ máy, mỗi công trình giải thích cơ chế sinh học theo solution.md; thẻ nhiệm vụ có mục "Vì sao việc này có ích?"; API `GET /api/track/rewards/village`
- [x] 184/184 backend tests pass; chụp ảnh trình duyệt thật (backend thật + DB giả) trang làng, nhiệm vụ, đăng nhập học sinh, đăng nhập chính
- [ ] Chạy migration 018 và 019 trên Supabase; người có thẩm quyền xác nhận ngưỡng mở công trình (đang là bản thử nghiệm)
- [ ] Sửa các lỗi giao diện người dùng liệt kê trong error.md

- [x] Script `backend/scripts/seed-demo-study.js`: tạo nghiên cứu thử + liên kết khảo sát PSQI đã xuất bản + bật theo dõi/3 mức (thử)/thưởng; đã chạy với tài khoản trviet (nghiên cứu 1817be89…, khảo sát slug gcdtsgy5); ngưỡng 11 và kênh hỗ trợ là THỬ, cần thay trước khi dùng thật
- [x] Sửa: học sinh không thấy nhiệm vụ vì PSQI không chấm được (giờ đi ngủ/thức dậy gõ sai định dạng hoặc bỏ trống); parseClock nhận giờ tròn, hiển thị placeholder, câu hỏi giờ đi ngủ bắt buộc; 184 test pass
- [x] Form đồng ý có ô tạo tài khoản đăng nhập tùy chọn (tạo cùng lúc với hồ sơ); chưa kiểm tra trình duyệt

- [x] Khảo sát: không tự chuyển câu, bộ chọn giờ/phút, sửa lỗi Quay lại mất đáp án, đăng nhập tài khoản học sinh ngay ở màn hình hoàn thành
- [x] Cổng game theo tài khoản học sinh (403/503), trang khóa tạo tài khoản tại chỗ; người chỉ có mã vẫn khảo sát + theo dõi
- [x] Khảo sát mặc định theo bình chọn admin (migration 020, `#/admin/vote`, trang chủ một khảo sát); 4 test mới
- [x] Game Làng nhỏ một màn hình: việc hôm nay + nhân vật tùy chỉnh (avatar) + công trình; 190/190 backend tests pass; ảnh trình duyệt 1440/820/390
- [ ] Chạy migration 020 (đúng project jfhxgtciiuxbmsyoxinc); bình chọn một khảo sát mặc định ở `#/admin/vote`
- [ ] Chưa làm: viết lại toàn bộ giao diện dashboard nhà nghiên cứu; câu hỏi theo dõi sau nhiệm vụ

- [x] Game một màn hình thống nhất: thế giới tương tác (bấm công trình/nhân vật/thú cưng), HUD (cấp, Sao, công trình, chuỗi, hỗ trợ), panel Nhiệm vụ/Túi đồ/Nhân vật/Sổ làng/Cài đặt trong game, không tab, không chuyển trang; kiểm tra trình duyệt 1440/820/390 không tràn ngang, 0 lỗi console
- [x] Researcher dashboard: căn đều hàng lọc, lưới lọc phản hồi 4 cột, sửa khoảng trống thanh admin trên mobile; 190/190 tests pass
- [x] Sửa game: lỗi khi lưu nhân vật (server cũ chưa khởi động lại), bạn đồng hành hiện đúng loài trong làng, thông báo không che panel; 190/190 tests pass
