# Tiêu Chí Cho Một Website Đẹp — Hướng Dẫn Đầy Đủ

## 1. Mở đầu

Một website "đẹp" không chỉ là mỹ quan mà còn là sự kết hợp hài hòa giữa **thiết kế thị giác**, **trải nghiệm người dùng (UX)**, **nội dung** và **hiệu năng kỹ thuật**. Tài liệu này liệt kê đầy đủ các tiêu chí theo từng khía cạnh để bạn tự đánh giá hoặc xây dựng một website chất lượng cao.

---

## 2. Thiết kế thị giác (Visual Design)

### 2.1. Bố cục (Layout)

- **Grid system nhất quán**: sử dụng lưới 12 cột hoặc lưới tùy biến để căn chỉnh phần tử.
- **Khoảng trắng (whitespace) hợp lý**: không bị chật chội, không bị trống trải; nhịp thở của trang rõ ràng.
- **Phân cấp thị giác rõ ràng**: yếu tố quan trọng được nhấn mạnh bằng kích thước, màu sắc, vị trí.
- **Cân bằng & đối xứng**: bố cục cân đối hoặc cố ý lệch (asymmetry) nhưng vẫn có trọng tâm.
- **Khối nội dung không quá dài**: độ rộng cột chữ nên trong khoảng 45–75 ký tự mỗi dòng để dễ đọc.
- **Sticky header/footer hợp lý**: giữ điều hướng khi cuộn nhưng không che nội dung.
- **Breakpoint chuẩn**: phục vụ đầy đủ các kích thước màn hình (xem mục 5).

### 2.2. Màu sắc (Color)

- **Bảng màu giới hạn**: 1 màu chủ đạo (primary), 1 màu phụ (secondary), màu trung tính (đen/xám/trắng), tối đa 3–5 màu chính.
- **Tỷ lệ màu 60-30-10**: 60% màu nền, 30% màu phụ, 10% màu nhấn.
- **Tương phản đủ cao**: tuân thủ WCAG (tối thiểu 4.5:1 cho chữ thường, 3:1 cho chữ lớn).
- **Màu nhấn dùng có chủ đích**: CTA, điểm chạm quan trọng — không dùng màu nhấn tràn lan.
- **Nhất quán toàn site**: cùng một ý nghĩa màu xuyên suốt các trang.
- **Chế độ sáng/tối (nếu có)**: chuyển đổi mượt, không làm lóa mắt.

### 2.3. Typography (Chữ)

- **Font chữ phù hợp thương hiệu & nội dung**: tối đa 2–3 font (1 font chính + 1 font tiêu đề/hệ thống).
- **Thang cỡ chữ (type scale) có hệ thống**: ví dụ 1.125–1.333 (perfect fourth/fifth).
- **Line-height hợp lý**: 1.4–1.6 cho đoạn văn, 1.1–1.3 cho tiêu đề.
- **Font size cơ bản**: tối thiểu 16px cho nội dung chính.
- **Trọng lượng chữ (font-weight) đa dạng** nhưng không lạm dụng: regular, medium, semibold, bold.
- **Khoảng cách chữ (letter-spacing) tinh tế**: tăng nhẹ cho chữ in hoa, tiêu đề nhỏ.

### 2.4. Hình ảnh & đa phương tiện

- **Chất lượng cao, độ phân giải đủ lớn**, không vỡ, không pixel hóa.
- **Phong cách hình ảnh nhất quán**: cùng tông màu, cùng phong cách chụp/illustration.
- **Tối ưu kích thước**: dùng WebP/AVIF, nén tốt, responsive images (`srcset`).
- **Không dùng ảnh stock sáo rỗng** tràn lan; ảnh minh họa đúng ngữ cảnh.
- **Video/animation có mục đích**, tự động tắt tiếng, không tự phát gây khó chịu.
- **Alt text đầy đủ** cho ảnh (cả SEO lẫn accessibility).

### 2.5. Icon & minh họa

- Bộ icon thống nhất về phong cách (outline, filled, duotone...) và độ dày nét.
- Kích thước icon đồng nhất trong cùng ngữ cảnh.
- Dùng SVG thay vì icon font; màu icon hài hòa với palette.

---

## 3. Trải nghiệm ngườidùng (UX)

### 3.1. Khả năng sử dụng (Usability)

- **Điều hướng rõ ràng**: menu dễ tìm, cấu trúc không quá sâu (≤ 3 cấp).
- **Ngườidùng luôn biết mình đang ở đâu**: breadcrumb, trạng thái trang hiện tại trên menu.
- **CTA nổi bật & rõ ràng**: dùng từ hành động cụ thể ("Đăng ký ngay", "Mua hàng"), không dùng "Nhấp vào đây".
- **Form thân thiện**: label rõ ràng, validation realtime, báo lỗi dễ hiểu, hỗ trợ autofill.
- **Phản hồi tức thì (feedback)**: hover, active, loading, success, error state đầy đủ.
- **Tránh dead-end**: luôn có bước tiếp theo cho ngườidùng.

### 3.2. Nội dung (Content)

- **Tiêu đề hấp dẫn, đúng trọng tâm**: truyền tải giá trị trong 5 giây đầu.
- **Copy rõ ràng, súc tích**: nói lợi ích, không chỉ tính năng; viết cho ngườidùng.
- **Cấu trúc nội dung có logic**: từ tổng quan đến chi tiết, dễ scan (heading, bullet, highlight).
- **Nội dung đúng chính tả, không lỗi ngữ pháp**; thuật ngữ thống nhất.
- **Tone of voice nhất quán** với thương hiệu.
- **Đa ngôn ngữ (nếu cần)**: bản dịch chất lượng, không máy móc.

### 3.3. Luồng chuyển đổi (Conversion Flow)

- **Hành trình ngườidùng được thiết kế rõ**: landing → quan tâm → hành động.
- **Giảm ma sát (friction)**: ít bước nhất có thể, cho phép mua/check-out khách vãng lai.
- **Xây dựng niềm tin**: review, chứng nhận, logo đối tác, chính sách rõ ràng.
- **Hiệu ứng khan hiếm/urgency (nếu dùng)**: trung thực, không gây áp lực giả tạo.

---

## 4. Tương tác & Chuyển động (Interaction & Motion)

- **Animation có mục đích**: hướng sự chú ý, phản hồi hành động, kể chuyện — không chỉ để "cho đẹp".
- **Chuyển động mượt, tự nhiên**: easing hợp lý (ease-out cho xuất hiện), thờigian 150–500ms.
- **Vi tương tác (micro-interaction)**: nút bấm đàn hồi, toggle mượt, loading skeleton.
- **Hiệu ứng scroll (parallax, reveal) dùng tiết chế**, tắt trên thiết bị yếu hoặc khi ngườidùng bật "reduced motion".
- **Hover state phản hồi nhanh**, không trễ.
- **Tránh animation gây chóng mặt**: không lắc, không nhấp nháy liên tục.

---

## 5. Responsive & Đa thiết bị

- **Hoạt động hoàn hảo trên mọi kích thước**: mobile (≥ 320px), tablet, laptop, desktop, màn hình lớn.
- **Mobile-first**: ưu tiên thiết kế cho màn nhỏ rồi mở rộng.
- **Touch-friendly**: vùng chạm tối thiểu 44×44px, khoảng cách giữa các nút đủ lớn.
- **Không có scroll ngang bất ngờ**, không có nội dung bị cắt.
- **Ẩn/hiện nội dung hợp lý theo thiết bị**: menu hamburger trên mobile, đủ thông tin trên desktop.
- **Kiểm thử trên thiết bị thật**, không chỉ mô phỏng.

---

## 6. Hiệu năng & Kỹ thuật

### 6.1. Tốc độ tải

- **Core Web Vitits tốt**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **Tối ưu hình ảnh**: đúng định dạng, lazy loading, kích thước chính xác.
- **Giảm JS/CSS không dùng đến**: code splitting, tree shaking, minify.
- **Font loading tối ưu**: `font-display: swap`, subset font.
- **CDN & caching hợp lý**.
- **Trang phụ phải nhanh**: không chỉ trang chủ.

### 6.2. Kỹ thuật

- **Semantic HTML5** đúng chuẩn (`header`, `nav`, `main`, `article`, `footer`).
- **URL thân thiện**: ngắn gọn, có nghĩa, dùng dấu gạch ngang.
- **SEO kỹ thuật**: meta title/description, Open Graph, schema markup, sitemap, robots.txt.
- **HTTPS bắt buộc**, chứng chỉ hợp lệ.
- **Tương thích trình duyệt**: Chrome, Safari, Firefox, Edge — các phiên bản gần nhất.
- **Không có lỗi console**, không có link hỏng (404).

---

## 7. Khả năng tiếp cận (Accessibility — a11y)

- **Tuân thủ WCAG 2.1/2.2 cấp độ AA**.
- **Tất cả nội dung truy cập được bằng bàn phím**: tab order hợp lý, focus visible.
- **Thẻ ARIA đúng cách**; không lạm dụng ARIA khi HTML thuần đã đủ.
- **Màu sắc không phải cách duy nhất truyền thông tin** (có icon/chữ kèm theo).
- **Hỗ trợ trình đọc màn hình**: alt text, label form, heading logic.
- **Tôn trọng `prefers-reduced-motion`**.
- **Form có label rõ ràng**, lỗi được thông báo cho screen reader.

---

## 8. Độ tin cậy & An toàn

- **Bảo mật dữ liệu ngườidùng**: mã hóa, tuân thủ GDPR/PCI-DSS khi liên quan thanh toán.
- **Chính sách bảo mật & điều khoản** dễ tìm, dễ hiểu.
- **Thông tin liên hệ đầy đủ**: địa chỉ, hotline, email, mạng xã hội.
- **Website hoạt động ổn định**: uptime cao, có trang 404/500 thiết kế đẹp.
- **Cập nhật nội dung thường xuyên**: không để thông tin cũ, lỗi thờigian.

---

## 9. Yếu tố thương hiệu (Branding)

- **Logo đặt đúng chuẩn**: vị trí góc trái trên, có không gian thở, link về trang chủ.
- **Bộ nhận diện nhất quán**: màu sắc, font, giọng điệu, phong cách hình ảnh khớp với thương hiệu offline.
- **Câu chuyện thương hiệu rõ ràng**: khác biệt so với đối thủ là gì, vì sao khách hàng nên chọn bạn.
- **Personality thể hiện qua thiết kế**: sang trọng, trẻ trung, chuyên nghiệp, thân thiện...

---

## 10. Checklist đánh giá nhanh

| #  | Tiêu chí                                          | Đạt? |
| -- | --------------------------------------------------- | ------ |
| 1  | Bố cục rõ ràng, khoảng trắng hợp lý         | ☐     |
| 2  | Bảng màu ≤ 5 màu, tương phản ≥ 4.5:1        | ☐     |
| 3  | Tối đa 2 font, thang cỡ chữ có hệ thống      | ☐     |
| 4  | Ảnh chất lượng, đã tối ưu, có alt text     | ☐     |
| 5  | CTA nổi bật, dùng động từ hành động        | ☐     |
| 6  | Animation có mục đích, không quá 500ms        | ☐     |
| 7  | Responsive hoàn hảo từ 320px trở lên           | ☐     |
| 8  | LCP < 2.5s, CLS < 0.1                               | ☐     |
| 9  | Điều hướng bằng bàn phím được             | ☐     |
| 10 | HTTPS, không lỗi console, không link hỏng       | ☐     |
| 11 | Meta/OG/schema đầy đủ                           | ☐     |
| 12 | Nội dung không lỗi, cập nhật, tone nhất quán | ☐     |
| 13 | Thông tin liên hệ & chính sách dễ tìm        | ☐     |
| 14 | Bộ nhận diện thương hiệu nhất quán          | ☐     |

---

## 11. Công cụ kiểm tra gợi ý

- **Hiệu năng**: Google PageSpeed Insights, Lighthouse, GTmetrix, WebPageTest
- **Accessibility**: WAVE, axe DevTools, Lighthouse a11y audit, Axe browser extension
- **SEO**: Google Search Console, Ahrefs/SEMrush, Screaming Frog
- **Responsive**: Chrome DevTools Device Toolbar, BrowserStack
- **Thiết kế**: Figma (design system), Contrast checker (WebAIM)

---

*Cập nhật lần cuối: 2026-11-18*
