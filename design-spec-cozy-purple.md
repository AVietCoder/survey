# Design Spec — "Cozy Purple" (chunky, mềm, tông tím #5B4FD1)

> Tài liệu mô tả phong cách giao diện lấy cảm hứng từ ảnh tham khảo (app self-care dạng thú cưng: nền màu đặc, thẻ trắng bo góc rất lớn, nút "nổi khối" có cạnh dưới dày, font tròn đậm, minh hoạ phẳng dễ thương) — **đổi toàn bộ tông teal sang tím quanh `#5B4FD1`**.
> Trọng tâm: giao diện, font, khoảng cách, bố cục, responsive. Mọi giá trị đều có thể đưa thẳng vào CSS (mục 11).

---

## Mục lục

0. [Cách dùng & 20 quy tắc cốt lõi](#0-cách-dùng--20-quy-tắc-cốt-lõi)
1. [Phân tích ảnh tham khảo](#1-phân-tích-ảnh-tham-khảo)
2. [Design tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Spacing & layout](#4-spacing--layout)
5. [Responsive](#5-responsive)
6. [Components](#6-components)
7. [Icon & minh hoạ](#7-icon--minh-hoạ)
8. [Motion](#8-motion)
9. [Accessibility](#9-accessibility)
10. [Page templates](#10-page-templates)
11. [CSS khởi đầu](#11-css-khởi-đầu)
12. [HTML khung trang](#12-html-khung-trang-home)
13. [Checklist QA & Do / Don't](#13-checklist-qa--do--dont)
14. [Prompt mẫu cho AI/dev](#14-prompt-mẫu-cho-aidev)

---

## 0. Cách dùng & 20 quy tắc cốt lõi

Đưa file này cho dev hoặc công cụ AI (Cursor, Claude Code…) cùng ảnh tham khảo. Nếu hai thứ mâu thuẫn, **file này thắng** (vì đã đổi màu và sửa các chỗ tương phản chưa đạt).

**20 quy tắc cốt lõi**

1. **Nền trang = màu tím chủ đạo `#5B4FD1`** (phẳng, không gradient). Chữ trên nền tím luôn là trắng.
2. **Tỉ lệ màu 60 / 30 / 8 / 2:** 60% tím nền · 30% trắng (thẻ) · 8% vàng hổ phách (điểm nhấn) · 2% đỏ san hô / xanh lá (trạng thái).
3. **Thẻ trắng bo rất lớn: `28px`**. Bong bóng thoại `20px`, nút `14–16px`, huy hiệu/chip dạng viên thuốc (`999px`).
4. **Phong cách "chunky":** vật thể bấm được có **cạnh dưới dày 4px** (box-shadow cứng, không blur) và lún xuống 3px khi bấm.
5. **Không viền mảnh 1px quanh thẻ.** Phân cấp bằng khối màu + cạnh dưới dày, không bằng đường kẻ mảnh.
6. **Font tròn, đậm:** Nunito. Chữ trên nền tím tối thiểu weight **600**; tiêu đề **800**.
7. **Tiêu đề ngắn, chặt** (line-height 1.15–1.25). Vì tiếng Việt có dấu chồng, **không để line-height < 1.2**.
8. **Lề trang 16px (mobile)** → 24px (tablet) → 32px (desktop). Mọi khoảng cách là bội số của 4px.
9. **Nhịp dọc giữa các khối: 12 / 16 / 24 / 28px** (bảng ở mục 4.3), khối lớn cách nhau ≥ 24px.
10. **Mobile-first.** Mobile = đúng như ảnh (1 cột, thanh tab dưới). Tablet = thanh tab nổi dạng viên thuốc. Desktop = sidebar trái + cột giữa + cột phải.
11. **Điểm nhấn duy nhất là màu vàng** (`#FFB547`): tia sét, thanh tiến độ, huy hiệu ngày, cửa. Không dùng vàng làm màu chữ nhỏ trên nền tím (không đủ tương phản).
12. **Chữ phụ trên nền tím** dùng `rgba(255,255,255,.88)`, không thấp hơn (tương phản ≥ 4.5:1).
13. **Chữ trên thẻ trắng** là tím than `#221D57` (không dùng đen thuần `#000`).
14. **Bóng đổ luôn nhuốm tím** (`rgba(22,18,59,…)`), không dùng xám/đen trung tính.
15. **Vùng chạm tối thiểu 44×44px**; nút chính cao 48–52px.
16. **Minh hoạ phẳng, không viền**, màu giới hạn trong bảng màu (mục 2.1), luôn có bóng đáy hình elip dưới nhân vật.
17. **Một chuyển động nền duy nhất** (nhân vật "thở"); còn lại chỉ là phản hồi khi người dùng thao tác. Tôn trọng `prefers-reduced-motion`.
18. **Nhãn IN HOA chỉ dùng cho nhãn ngắn 1–2 từ** (ví dụ `CHALLENGE`, `THỬ THÁCH`) — vì in hoa tiếng Việt chồng dấu rất khó đọc.
19. **Không dùng px cho cỡ chữ** — dùng `rem` + `clamp()`.
20. **Kiểm thử với chuỗi tiếng Việt dài hơn 30%** và zoom 200% trước khi chốt giao diện.

---

## 1. Phân tích ảnh tham khảo

Ảnh gốc 1170 × 2404 px ≈ màn hình 390 × 801 CSS px ở độ phân giải ×3. Các số đo dưới đây **ước lượng** từ ảnh (làm tròn về bội số của 2–4px) và đã quy đổi sang CSS px.

### 1.1 Cấu trúc từ trên xuống

| # | Khối | Đặc điểm nhìn thấy | Số đo @390px (≈) |
|---|------|--------------------|------------------|
| 1 | **Cảnh minh hoạ (hero)** | Căn phòng áp mái: trần màu xám xanh, vệt sáng hình nón từ đèn treo, cửa sổ tròn có trăng, cửa cam, bếp lò + nồi, ổ rơm, nhân vật chính + bạn đồng hành nhỏ. Sàn là màu nền chính của trang. Tràn sát mép (full-bleed) | cao ~290px |
| 2 | **Thanh trên cùng** | Nút hamburger (3 thanh dày, đầu tròn) bên trái; avatar hai vòng tròn chồng nhau (viền trắng) bên phải; đè lên cảnh | cách mép trên ~20px, cách mép ngang ~13px |
| 3 | **Bong bóng thoại** | Thẻ trắng, góc bo lớn, chữ đậm giữa, **cạnh dưới dày hơi xám** | ~167 × 51px, bo ~20px, chữ ~18px / 800 |
| 4 | **Thẻ tiến độ ("5th Adventure")** | Khối **tối hơn nền một chút** (inset), tia sét vàng 3D bên trái, nhãn nhỏ, thanh tiến độ trắng dạng viên thuốc, phần fill vàng, số `0 / 15` căn giữa | cao ~70px, lề 16px, bo ~28px, thanh cao ~24px |
| 5 | **Tiêu đề mục** | Icon lịch + "55 goals left for today!" + 2 icon thao tác (bộ lọc, lưới) ở phải | chữ ~18px / 700, icon ~24px |
| 6 | **Thẻ nhiệm vụ (Challenge)** | Thẻ trắng bo lớn: bên trái minh hoạ tròn + huy hiệu vàng nghiêng "DAY 2"; giữa là nhãn in hoa màu nâu cam + tiêu đề đậm nhiều dòng; bên phải điểm thưởng "5 ⚡" + nút tích xanh nổi khối | cao ~144px, bo ~28px, tiêu đề ~16–17px / 700 / line-height ~1.2 |
| 7 | **Tiêu đề nhóm ("Start the day")** | Chữ trắng + mũi tên xổ xuống + đường kẻ mảnh mờ chạy dài + nút `+` tròn mờ | chữ ~18px, nút `+` ~20–28px |
| 8 | **Thanh tab dưới** | Dải sáng hơn nền, 6 mục (icon màu 36–40px + nhãn trắng ~14px), mục đang chọn có ô nền sáng bo góc, huy hiệu số / chấm đỏ ở icon | cao ~106px (gồm vùng an toàn), ô active ~64 × 64px |

### 1.2 Nhịp dọc (px, mobile)

```
hero (0–290)
  ↓ 8   bong bóng thoại (51)
  ↓ 12  thẻ tiến độ (70)
  ↓ 28  tiêu đề mục (≈ 28)
  ↓ 20  thẻ nhiệm vụ (144)
  ↓ 16  tiêu đề nhóm
  ↓ 24  thẻ tiếp theo …
lề ngang luôn 16px
```

### 1.3 "DNA" của phong cách (giữ khi đổi màu)

- **Khối đặc, mềm, nổi** thay vì phẳng–viền mảnh: nút/thẻ có cạnh dưới dày như đồ chơi.
- **Bo góc lớn đồng nhất** (24–28px) cho mọi thẻ lớn.
- **Chữ tròn, đậm, ít chữ** — mỗi thẻ chỉ có 1 câu chính.
- **Nền màu đặc + vài mảng tối/sáng hơn** (inset, thanh tab) tạo chiều sâu, không dùng gradient màu.
- **Minh hoạ ấm áp** chiếm 1/3 màn hình đầu tiên, đóng vai "mặt tiền" của sản phẩm.

---

## 2. Design tokens

### 2.1 Màu

#### a) Thang tím (brand) — tâm điểm `#5B4FD1` (HSL ≈ 246°, 59%, 56%)

| Token | Hex | Dùng cho | Tương phản với trắng |
|-------|-----|----------|----------------------|
| `--purple-50` | `#F4F3FF` | nền nút phụ, nền khối nhạt trong thẻ | 1.1 |
| `--purple-100` | `#E9E7FD` | nền skeleton, hover nhạt | 1.2 |
| `--purple-200` | `#D4D0FA` | **cạnh dưới nút/thẻ trắng**, viền input | 1.5 |
| `--purple-300` | `#B7B1F4` | icon trang trí, vệt sáng đèn | 2.0 |
| `--purple-400` | `#8E85E6` | icon phụ, track tắt của switch | 3.2 |
| **`--purple-500`** | **`#5B4FD1`** | **NỀN TRANG, nút chính, link** | **6.0** |
| `--purple-600` | `#4A3FB5` | hover/active nút chính, nền khối nhấn | 7.9 |
| `--purple-700` | `#3C3394` | trần cảnh minh hoạ, **cạnh dưới nút chính**, footer | 10.0 |
| `--purple-800` | `#2E2772` | kính cửa sổ cảnh, dark-mode surface | 12.7 |
| `--purple-900` | `#221D57` | **chữ chính trên nền trắng**, toast | 15.2 |
| `--purple-950` | `#16123B` | gốc của mọi bóng đổ & lớp phủ tối | 17.7 |

#### b) Bề mặt & lớp phủ (đã tính sẵn tương phản)

| Token | Giá trị | Hiển thị thực (trên nền `#5B4FD1`) | Ghi chú |
|-------|---------|-----------------------------------|---------|
| `--bg` | `#5B4FD1` | — | nền trang ("sàn") |
| `--surface` | `#FFFFFF` | — | thẻ, bong bóng, input |
| `--inset` | `rgba(22,18,59,.14)` | `#5146BC` | thẻ tiến độ, ô thống kê. Chữ trắng trên đó: **7.1:1** |
| `--nav-bg` | `rgba(22,18,59,.16)` | `#5045B9` | thanh tab. Chữ trắng: **7.3:1** |
| `--nav-active` | `rgba(255,255,255,.14)` | `#685FC3` trên thanh tab | ô tab đang chọn. Chữ trắng: **5.2:1** |
| `--line-on-brand` | `rgba(255,255,255,.28)` | — | đường kẻ phân nhóm |
| `--overlay` | `rgba(22,18,59,.55)` | — | nền mờ sau modal |

> **Khác ảnh gốc:** ảnh gốc làm thanh tab *sáng hơn* nền. Với tím, nền sáng lên (trắng 10–16%) cho chữ trắng chỉ đạt 4.3–4.9:1 và ô active còn thấp hơn. Vì vậy thanh tab được làm **tối hơn nền**, ô active **sáng hơn thanh tab** — vẫn giữ cảm giác "ô sáng nổi lên" nhưng đạt AA.

#### c) Chữ

| Token | Giá trị | Dùng cho | Tương phản |
|-------|---------|----------|------------|
| `--on-brand` | `#FFFFFF` | chữ trên nền tím | 6.0 (trên `#5B4FD1`) |
| `--on-brand-muted` | `rgba(255,255,255,.88)` | chữ phụ trên nền tím | 5.1 |
| `--text` | `#221D57` | chữ chính trên thẻ trắng | 15.2 |
| `--text-muted` | `#5A5880` | mô tả, meta trên thẻ trắng | 6.7 |
| `--text-faint` | `#8C8AAA` | **chỉ** placeholder/giá trị trang trí, không dùng cho thông tin quan trọng | ~3.2 |

#### d) Điểm nhấn & trạng thái

| Token | Hex | Dùng cho | Lưu ý |
|-------|-----|----------|-------|
| `--amber-300` | `#FFD166` | huy hiệu "DAY", mặt trăng, **vòng focus trên nền tím** | 4.2:1 trên `#5B4FD1` |
| `--amber-400` | `#FFB547` | tia sét, fill thanh tiến độ, nút accent, cửa | **chỉ cho icon/khối**, 3.4:1 trên tím — không dùng làm chữ nhỏ |
| `--amber-600` | `#D9820F` | cạnh dưới của vật thể vàng | — |
| `--amber-800` | `#92400E` | **nhãn in hoa trên thẻ trắng** (thay cho nâu cam ở ảnh) | 7.1:1 trên trắng |
| `--amber-ink` | `#3B2300` | chữ trên nền vàng | 8.4:1 trên `#FFB547` |
| `--coral-600` | `#D6293B` | huy hiệu thông báo, lỗi | chữ trắng trên đó 4.95:1 |
| `--green-500` | `#1F9D55` | **dấu tích** (icon, ≥ 3:1) | 3.5:1 trên trắng |
| `--green-700` | `#15803D` | chữ báo thành công | 5.0:1 trên trắng |
| `--green-100` / `--green-300` | `#E3F6EA` / `#9AD9B3` | nền / cạnh của nút tích khi hoàn thành | — |

#### e) Bảng màu cảnh minh hoạ (hero)

| Thành phần | Màu |
|------------|-----|
| Trần / tường | `#3C3394` (purple-700) |
| Nón sáng từ đèn | `#D4D0FA` → trong suốt (tam giác mềm, opacity .9 → .6) |
| Sàn | `#5B4FD1` (liền với nền trang) |
| Khung cửa sổ tròn | `#EEF0FF` |
| Kính cửa sổ | `#2E2772`, vệt phản chiếu chéo `#6A63BD` |
| Mặt trăng | `#FFD166` + vài chấm `#E8B94A` |
| Cửa ra vào | thân `#FFB547`, khung `#E9E7FD` |
| Tủ ngăn kéo | `#C9C4F7`, tay nắm `#8E85E6` |
| Ổ rơm | `#E0C050`, bóng `#B8962E` |
| Bếp lò | `#3B2F4A`, nồi `#C98B2B`, nước sốt `#B3261E` |
| Bóng đáy nhân vật | `rgba(22,18,59,.18)` elip |

#### f) Quy tắc phối

- **60 / 30 / 8 / 2** (mục 0, quy tắc 2).
- Mỗi màn hình chỉ có **một** cụm vàng nổi bật nhất (ví dụ thanh tiến độ). Đừng tô vàng mọi thứ.
- Đỏ san hô chỉ cho **huy hiệu số/chấm thông báo** và lỗi.
- Xanh lá chỉ cho **hoàn thành / thành công**.

### 2.2 Gradient

Gần như **không dùng gradient** (đúng tinh thần ảnh gốc). Ngoại lệ có chủ đích:

```css
--grad-light-cone: linear-gradient(180deg, rgba(212,208,250,.95) 0%, rgba(212,208,250,0) 100%); /* nón sáng đèn */
--grad-meter-fill: linear-gradient(180deg, #FFC866 0%, #FFB547 55%, #F5A02B 100%);               /* fill thanh tiến độ, tạo độ bóng nhẹ */
```

### 2.3 Bo góc

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--r-xs` | `8px` | checkbox, tag nhỏ |
| `--r-sm` | `10px` | huy hiệu "DAY", thumbnail nhỏ |
| `--r-md` | `14px` | **nút, nút tích**, ô tab active (16px) |
| `--r-lg` | `20px` | **bong bóng thoại**, input, toast |
| `--r-xl` | `28px` | **thẻ chính**, thẻ tiến độ |
| `--r-2xl` | `36px` | khung hero ở tablet/desktop, bottom sheet, section "xếp lớp" |
| `--r-pill` | `999px` | chip, thanh tiến độ, switch, huy hiệu số |

Quy tắc: **bo góc con ≤ bo góc cha − khoảng đệm** (ví dụ thẻ 28px, ảnh bên trong cách mép 16px → bo ≤ 12–14px).

### 2.4 Cạnh dưới dày & bóng đổ ("chunky")

```css
/* Cạnh dưới dày = box-shadow cứng, không blur */
--edge-white:   0 4px 0 0 #D4D0FA;                 /* nút/thẻ trắng trên nền tím */
--edge-brand:   0 4px 0 0 #3C3394;                 /* nút tím trên nền trắng */
--edge-amber:   0 4px 0 0 #D9820F;                 /* nút/khối vàng */
--edge-bubble:  0 3px 0 0 #D4D0FA;                 /* bong bóng thoại */
--edge-card:    0 3px 0 0 rgba(22,18,59,.14);      /* thẻ trắng (rất nhẹ) */

/* Bóng mềm — chỉ dùng cho lớp nổi (modal, toast, thanh tab nổi) */
--shadow-soft:  0 14px 28px -14px rgba(22,18,59,.45);
--shadow-pop:   0 24px 60px -12px rgba(22,18,59,.55);

/* Trạng thái nhấn: thân lún 3px, cạnh còn 1px */
--edge-pressed: 0 1px 0 0 currentColor; /* dùng biến cạnh tương ứng thay cho currentColor */
```

Ghép thẻ trắng: `box-shadow: var(--edge-card), var(--shadow-soft);`

### 2.5 Z-index

```
--z-base:0  --z-sticky:10  --z-nav:40  --z-sheet:60  --z-modal:70  --z-toast:80
```

### 2.6 Thời gian & easing

```
--t-press:120ms   --t-fast:160ms   --t-base:240ms   --t-enter:320ms   --t-meter:600ms
--ease:        cubic-bezier(.2,.8,.2,1)        /* mặc định */
--ease-bounce: cubic-bezier(.34,1.56,.64,1)    /* "pop" khi hoàn thành */
```

---

## 3. Typography

### 3.1 Font

**Họ chính (duy nhất): Nunito** — tròn, thân thiện, **có đủ bộ dấu tiếng Việt**, gần với phong cách font trong ảnh. Dùng 1 họ font để giao diện gọn; cá tính đến từ weight đậm và bo tròn.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,500;0,600;0,700;0,800;0,900;1,800&display=swap" rel="stylesheet">
```

```css
--font: "Nunito", ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

- **Phương án thay thế** nếu muốn nét vui hơn cho logo/tiêu đề lớn: `Baloo 2` (800) — chỉ dùng cho `display`/logo, thân bài vẫn Nunito.
- Chỉ tải weight cần dùng (500–900). `font-display: swap`. Self-host (woff2) cho bản production để tránh phụ thuộc bên thứ ba.

### 3.2 Thang chữ

Cột "Mobile → Desktop" là cỡ chữ ở 360px → 1280px, nội suy bằng `clamp()` (đã tính sẵn).

| Token | Mobile → Desktop | `clamp()` | Weight | Line-height | Letter-spacing | Dùng cho |
|-------|------------------|-----------|--------|-------------|----------------|----------|
| `--fs-display` | 34 → 60px | `clamp(2.125rem, 1.489rem + 2.826vw, 3.75rem)` | 800 | 1.12 | -0.02em | tiêu đề hero landing |
| `--fs-h1` | 28 → 44px | `clamp(1.75rem, 1.359rem + 1.739vw, 2.75rem)` | 800 | 1.18 | -0.015em | tiêu đề trang |
| `--fs-h2` | 22 → 32px | `clamp(1.375rem, 1.13rem + 1.087vw, 2rem)` | 800 | 1.22 | -0.01em | tiêu đề mục |
| `--fs-h3` | 17 → 20px | `clamp(1.0625rem, 0.9891rem + 0.3261vw, 1.25rem)` | 700 | 1.25 | 0 | **tiêu đề thẻ nhiệm vụ** |
| `--fs-lead` | 17 → 19px | `clamp(1.0625rem, 1.014rem + 0.2174vw, 1.1875rem)` | 600 | 1.5 | 0 | đoạn dẫn |
| `--fs-body` | 16px | `1rem` | 600 (nền tím) / 500–600 (nền trắng) | 1.5 | 0 | nội dung |
| `--fs-label` | 14 → 15px | `0.875rem` → `0.9375rem` (≥ 480px) | 700 | 1.3 | 0.01em | nhãn tab, nút nhỏ, tiêu đề nhóm |
| `--fs-caption` | 13px | `0.8125rem` | 700 | 1.35 | 0.02em | meta, chú thích |
| `--fs-overline` | 13px | `0.8125rem` | 800 | 1.2 | 0.06em | **chỉ** nhãn in hoa 1–2 từ (`CHALLENGE`) |
| `--fs-stat` | 18 → 28px | `clamp(1.125rem, 0.9rem + 0.9vw, 1.75rem)` | 800 | 1.1 | 0 | số `0 / 15`, điểm |

### 3.3 Quy tắc chữ

1. **Weight trên nền tím ≥ 600.** Chữ mảnh (400) trên nền tím bão hoà bị "rung" và khó đọc.
2. **Tiếng Việt:** `line-height` tiêu đề ≥ 1.18 để dấu của dòng trên không chạm dòng dưới; **không** đặt `overflow:hidden` + `line-height` chặt trên chữ có dấu (sẽ cắt dấu).
3. **Không in hoa cả câu.** In hoa chỉ cho overline 1–2 từ.
4. Số dùng `font-variant-numeric: tabular-nums` (điểm, thanh tiến độ, bộ đếm) để không nhảy chiều rộng.
5. Độ dài dòng: đoạn văn **45–70 ký tự** (`max-width: 62ch`); tiêu đề thẻ tối đa 4 dòng (`line-clamp: 4`) ở thẻ nhiệm vụ.
6. `text-wrap: balance` cho tiêu đề, `text-wrap: pretty` cho đoạn văn.
7. Căn lề: **trái** cho nội dung dài; **giữa** chỉ cho bong bóng thoại, số liệu, hero landing ngắn.
8. Chữ nghiêng đậm (`italic 800`) **chỉ** cho huy hiệu "DAY n" / nhãn thưởng.
9. Không underline trừ link trong đoạn văn (link: `--purple-500` trên trắng, `#fff` + underline 2px trên tím).
10. Cỡ chữ tối thiểu: 13px (caption), **14px** cho mọi chữ tương tác.

---

## 4. Spacing & layout

### 4.1 Thang khoảng cách (cơ sở 4px)

| Token | rem | px | Dùng cho |
|-------|-----|----|----------|
| `--space-1` | 0.25 | 4 | khe nhỏ giữa icon–chữ, cạnh dưới nút |
| `--space-2` | 0.5 | 8 | hero → bong bóng, khe trong cụm nhỏ |
| `--space-3` | 0.75 | 12 | bong bóng → thẻ tiến độ, khe giữa thẻ trong lưới chặt |
| `--space-4` | 1 | 16 | **lề trang (mobile)**, khe giữa thẻ, padding thẻ (mobile) |
| `--space-5` | 1.25 | 20 | tiêu đề mục → thẻ, padding thẻ (tablet) |
| `--space-6` | 1.5 | 24 | **khoảng cách giữa các nhóm**, padding thẻ (desktop), lề tablet |
| `--space-7` | 1.75 | 28 | thẻ tiến độ → tiêu đề mục |
| `--space-8` | 2 | 32 | lề desktop, khe cột |
| `--space-10` | 2.5 | 40 | giữa các section nhỏ |
| `--space-12` | 3 | 48 | giữa các section |
| `--space-16` | 4 | 64 | section landing (desktop) |
| `--space-20` | 5 | 80 | section lớn / footer |

Token co giãn:

```css
--gutter:  clamp(1rem, 0.6087rem + 1.739vw, 2rem);      /* 16 → 32px */
--section: clamp(2rem, 1.022rem + 4.348vw, 4.5rem);     /* 32 → 72px */
--card-pad: 1rem;                                       /* 16px; 20px ≥640; 24px ≥1024 */
--tap: 44px;  --tap-lg: 52px;
```

### 4.2 Padding trong thành phần

| Thành phần | Padding / kích thước |
|------------|----------------------|
| Thẻ nhiệm vụ | `16px` (≥640: `20px`; ≥1024: `24px`); cột minh hoạ 68px; khe cột `16px` |
| Thẻ tiến độ | `14px 16px` (≥640: `16px 20px`); khe icon–nội dung `12px` |
| Bong bóng thoại | `12px 24px`; rộng tối đa `min(80%, 320px)` |
| Nút lớn / vừa / nhỏ | cao `52 / 48 / 40px`; padding ngang `28 / 24 / 16px` |
| Input | cao `52px`; padding ngang `16px` |
| Thanh tab (mobile) | `8px` ngang, `8px` trên, `8px + safe-area` dưới; mỗi tab cao ≥ 64px |
| Modal / sheet | `24px` (≥768: `32px`) |
| Toast | `12px 16px` |

### 4.3 Nhịp dọc (mobile → desktop)

| Giữa | Mobile | ≥ 768 | ≥ 1024 |
|------|--------|-------|--------|
| Hero → bong bóng thoại | 8 | 12 | 16 |
| Bong bóng → thẻ tiến độ | 12 | 16 | 20 |
| Thẻ tiến độ → tiêu đề mục | 28 | 32 | 32 |
| Tiêu đề mục → thẻ đầu tiên | 20 | 20 | 24 |
| Thẻ → thẻ | 12–16 | 16 | 16–20 |
| Thẻ cuối nhóm → tiêu đề nhóm mới | 24 | 28 | 32 |
| Tiêu đề nhóm → thẻ đầu tiên | 12 | 12 | 16 |
| Cuối nội dung → mép dưới | chiều cao thanh tab + `env(safe-area-inset-bottom)` + 16 | 96 | 48 |

### 4.4 Container & lưới

```css
--container-app: 720px;      /* cột giữa của dashboard */
--container-rail: 360px;     /* cột phải */
--container-sidebar: 240px;  /* sidebar trái (88px khi thu gọn) */
--container-page: 1200px;    /* landing */
--container-wide: 1440px;    /* trần khung app trên màn rất rộng */
```

- **Lưới:** 4 cột (mobile) · 8 cột (tablet) · 12 cột (desktop); khe `16 / 24 / 32px`.
- Danh sách thẻ nhiệm vụ: 1 cột (mobile) → `repeat(auto-fill, minmax(300px, 1fr))` (tablet, tối đa 2 cột) → 1 cột trong cột giữa 720px (desktop) hoặc 2 cột nếu không có cột phải.
- **Luôn** đặt `min-width: 0` cho phần tử con của grid/flex chứa chữ để tiêu đề không làm tràn.

---

## 5. Responsive

### 5.1 Breakpoints (mobile-first, `min-width`)

| Tên | Từ | Thiết bị tiêu biểu | Thay đổi chính |
|-----|-----|--------------------|-----------------|
| base | 0 | 320–479 | 1 cột, đúng như ảnh; thanh tab dưới sát mép |
| `sm` | 480px | điện thoại lớn | nhãn tab 15px, padding thẻ 18px |
| `md` | 768px | tablet dọc | lề 24px, hero thành khung bo 36px, thanh tab nổi dạng viên thuốc, lưới thẻ 2 cột |
| `lg` | 1024px | tablet ngang / laptop | **3 vùng:** sidebar · nội dung · cột phải |
| `xl` | 1280px | desktop | sidebar mở rộng có nhãn, cột phải 360px |
| `2xl` | 1536px | màn lớn | khung app khoá ở 1440px, căn giữa |

Thiết kế & kiểm thử tại: **320, 360, 390, 430, 744, 820, 1024, 1280, 1440, 1920** và chế độ xoay ngang điện thoại.

### 5.2 Bố cục theo breakpoint

**Mobile (< 768px)** — đúng như ảnh

```
┌──────────────────────┐
│ ☰               ◖◗   │  ← thanh trên (đè lên hero)
│   [  hero scene  ]   │  ← full-bleed, cao clamp(280px, 74vw, 360px)
│     ( Bong bóng )    │
│ ┌──────────────────┐ │
│ │ ⚡ 5th Adventure │ │  ← thẻ tiến độ (inset)
│ └──────────────────┘ │
│ 📅 55 goals…   ⚙ ▦  │
│ ┌──────────────────┐ │
│ │ ◯ CHALLENGE ›   ✓│ │  ← thẻ nhiệm vụ
│ └──────────────────┘ │
│ Start the day ▾ ── ＋│
├──────────────────────┤
│ 🏠  📜  🛍  🌳  🎒  😶│  ← thanh tab cố định
└──────────────────────┘
```

**Tablet (768–1023px)**

```
┌────────────────────────────────────┐
│  ☰                            ◖◗   │
│  ┌──────────────────────────────┐  │
│  │        hero (bo 36px)        │  │  ← khung inset 24px, cao 360px
│  └──────────────────────────────┘  │
│        ( Bong bóng thoại )         │
│  ┌──────────────────────────────┐  │
│  │ ⚡ Thẻ tiến độ (rộng đủ)     │  │
│  └──────────────────────────────┘  │
│  Tiêu đề mục                  ⚙ ▦  │
│  ┌──────────────┐ ┌──────────────┐ │  ← lưới 2 cột
│  │  thẻ         │ │  thẻ         │ │
│  └──────────────┘ └──────────────┘ │
│        ╭──── thanh tab nổi ────╮   │  ← viên thuốc, rộng ≤ 560px
└────────────────────────────────────┘
```

**Desktop (≥ 1024px)**

```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌───────────────────────────┐ ┌─────────────────┐ │
│ │ Logo    │ │ Tiêu đề mục        ⚙  ▦  │ │ ┌─────────────┐ │ │
│ │ 🏠 Home │ │ ┌───────────────────────┐ │ │ │ hero scene  │ │ │  ← sticky top 24px
│ │ 📜 Quest│ │ │ thẻ nhiệm vụ          │ │ │ │ (4:5, bo 36)│ │ │
│ │ 🛍 Shop │ │ └───────────────────────┘ │ │ └─────────────┘ │ │
│ │ 🌳 Friend│ │ Start the day ▾ ──── ＋  │ │  ( Bong bóng )  │ │
│ │ 🎒 Bag  │ │ ┌───────────────────────┐ │ │ ┌─────────────┐ │ │
│ │ 😶 Profile││ │ thẻ nhiệm vụ          │ │ │ │ thẻ tiến độ │ │ │
│ └─────────┘ │ └───────────────────────┘ │ │ └─────────────┘ │ │
│  sidebar    └───────────────────────────┘ └─────────────────┘ │
│   240px          minmax(0, 720px)              360px          │
└───────────────────────────────────────────────────────────────┘
```

### 5.3 Quy tắc responsive chi tiết

**Cảnh minh hoạ (hero)**
- Là **SVG** với `viewBox`, `preserveAspectRatio="xMidYMax slice"`: nhân vật luôn neo đáy-giữa, hai bên bị cắt trước khi nhân vật bị cắt.
- **Vùng an toàn:** giữ nhân vật + bong bóng trong 70% chiều ngang ở giữa.
- Mobile: cao `clamp(17.5rem, 74vw, 22.5rem)` (≈ 290px tại 390px), full-bleed, không bo góc trên; đáy hero nối liền màu sàn = màu nền trang (không có đường nối).
- Tablet: khung bo `36px`, lề 24px. Desktop: `aspect-ratio: 4 / 5`, `position: sticky; top: 24px`.
- Màn thấp (`max-height: 520px`, xoay ngang điện thoại): hero cao tối đa `40dvh`, ẩn bong bóng thoại.

**Thanh tab → sidebar**
- Dưới 768px: cố định đáy, `grid` đều cột. **Tối đa 5–6 mục**; nhãn ≤ 8 ký tự.
- 768–1023px: nổi dạng viên thuốc, rộng `min(560px, 100% - 32px)`, cách đáy `16px + safe-area`, `backdrop-filter: blur(12px)`.
- ≥ 1024px: thành sidebar dính (`position: sticky; top: 24px`), mỗi mục nằm ngang (icon 32px + nhãn 16px/700), cao 56px, bo 16px.
- Luôn chừa chỗ cho thanh tab: `padding-bottom` của nội dung = chiều cao thanh + `env(safe-area-inset-bottom)` + 16px.

**Thẻ nhiệm vụ** (dùng **container query** để thích ứng theo chiều rộng thẻ, không theo màn hình)
- Thẻ ≥ 340px: 3 cột `[minh hoạ 68px] [nội dung 1fr] [thưởng + nút tích]`.
- Thẻ < 340px: 2 cột `[minh hoạ 56px] [nội dung]`, hàng thứ hai chứa thưởng + nút tích căn phải.
- Tiêu đề không cố định chiều cao; chỉ đặt `min-height` cho thẻ (112px).

**Chữ & khoảng cách co giãn**
- Dùng `clamp()` cho cỡ chữ (mục 3.2), `--gutter`, `--section`.
- Đừng ẩn nội dung ở mobile; sắp xếp lại thay vì cắt bỏ.

**Vùng an toàn & thiết bị**
```css
meta viewport: width=device-width, initial-scale=1, viewport-fit=cover
padding-bottom: calc(… + env(safe-area-inset-bottom));  /* thanh tab, toast, sheet */
padding-top: env(safe-area-inset-top);                  /* thanh trên đè hero */
height: 100dvh  (không dùng 100vh)                      /* tránh nhảy khi thanh địa chỉ co lại */
```

**Hình & media**
- Ảnh minh hoạ: `aspect-ratio` cố định, `object-fit: cover`, `width: 100%; height: auto`. Cung cấp `srcset` 1x/2x/3x hoặc SVG.
- Khi `hover: none` (cảm ứng) không hiển thị trạng thái hover; bọc style hover trong `@media (hover: hover)`.

**Kiểm tra bắt buộc**
- 320px: không tràn ngang; nút tích không bóp nội dung (đã có container query).
- Chữ dài hơn 30% (tiếng Việt thường dài hơn tiếng Anh): thẻ tự cao thêm, không cắt chữ.
- Zoom 200% và cỡ chữ hệ thống lớn: bố cục vẫn đọc được (cuộn dọc, không cuộn ngang).

---

## 6. Components

> Quy ước trạng thái: **default · hover (chỉ khi `hover:hover`) · active (nhấn) · focus-visible · disabled**. Mọi vật thể bấm được có cạnh dưới dày và lún 3px khi nhấn.

### 6.1 App shell

- Nền `--bg`, chữ `--on-brand`, `min-height: 100dvh`.
- Mobile: `header.topbar` (tuyệt đối đè hero) → `aside.rail` (hero + bong bóng + thẻ tiến độ) → `main` → `nav.tabbar` (cố định).
- Desktop: `grid-template-areas: "nav main rail"` (mục 11).

### 6.2 Thanh trên (top bar)

| Thuộc tính | Giá trị |
|------------|---------|
| Vị trí | `absolute; top: calc(12px + env(safe-area-inset-top)); left/right: 16px` |
| Nút hamburger | vùng chạm 44×44; icon 28×20: 3 thanh dày **4px**, đầu tròn, khe 4px, màu trắng |
| Avatar | 36px; hai vòng tròn chồng nhau lệch ~12px; viền trắng 2px; vòng sau tím nhạt `#B7B1F4`, vòng trước vàng `#FFD166` với mặt cười |
| Hover/active | nền `rgba(255,255,255,.14)` bo tròn; active lún 2px |
| Desktop | ẩn hamburger; avatar chuyển vào sidebar / góc cột phải |

### 6.3 Cảnh minh hoạ (hero)

- Cấu trúc lớp (dưới → trên): **sàn** → **tường/trần** → **nón sáng** → **đồ vật** (ổ rơm, tủ, bếp) → **cửa sổ & cửa** → **nhân vật + bóng đáy** → **đèn treo**.
- Ranh giới tường–sàn: đường **chéo nhẹ ~6°** từ trái-thấp lên phải-cao (đúng ảnh), thêm một dải sáng 1 lớp ngay trên sàn để tạo chiều sâu.
- Nhân vật chính cao ≈ 32% chiều cao hero; bạn đồng hành ≈ 14%.
- Cửa sổ tròn: đường kính ≈ 48% chiều cao hero, khung dày ~8px (`#EEF0FF`), 4 ô kính chéo.
- Màu: bảng 2.1(e). Không dùng viền đen; hình phẳng, chỉ thêm 1 mảng bóng/ánh sáng cho mỗi vật.
- `role="img"` + `aria-label` mô tả ngắn (ví dụ "Căn phòng ấm áp, nhân vật đang ăn kem").

### 6.4 Bong bóng thoại

| Thuộc tính | Giá trị |
|------------|---------|
| Nền / chữ | `#FFFFFF` / `--text` |
| Bo | `20px` |
| Padding | `12px 24px` |
| Chữ | 18px / 800 / căn giữa (`--fs-stat` nhỏ hoặc `--fs-lead` đậm) |
| Cạnh | `--edge-bubble` (3px `#D4D0FA`) |
| Vị trí | giữa, cách hero 8px; `max-width: min(80%, 320px)` |
| Đuôi (tuỳ chọn) | tam giác 12px hướng lên, cùng màu nền, cách giữa 0 |
| Nội dung | 1 câu ngắn (≤ 40 ký tự); đổi theo thời điểm trong ngày |

### 6.5 Thẻ tiến độ (inset)

- Nền `--inset` (`rgba(22,18,59,.14)`), bo `28px`, padding `14px 16px`, **không đổ bóng** (nó "lõm" xuống nền).
- Bố cục grid: `[icon 36px] [nội dung 1fr]`, khe 12px, căn giữa dọc.
- Icon: tia sét 3D vàng (`#FFB547`, cạnh `#D9820F`), nghiêng nhẹ -8°.
- Nhãn: 16px / 700 / trắng, cách thanh 6px.
- **Thanh tiến độ:** cao 24px, bo pill, track trắng; fill dùng `--grad-meter-fill` với một vệt sáng 2px ở trên (`inset 0 3px 0 rgba(255,255,255,.35)`); **luôn có độ rộng tối thiểu 28px** (kể cả 0%) để thấy "đầu fill" như ảnh.
- Số `0 / 15`: 18px / 800, căn giữa, **màu `#6B3F00`** (nâu đậm, 9:1 trên track trắng), `tabular-nums`.
- Animation fill: `width` 600ms `--ease`.
- A11y: `role="progressbar"`, `aria-valuemin/max/now`, `aria-label="Tiến độ chuyến phiêu lưu"`.

### 6.6 Tiêu đề mục (section header)

- Hàng flex, căn giữa dọc, `gap: 12px`, margin-top 28px.
- Icon trái 32px (trắng, nét 2.5px, đầu tròn) · tiêu đề `--fs-label` nâng lên 18px/800 trắng (`flex: 1; min-width: 0`) · 2 nút icon 44×44 (icon 24px).
- Khi nhiều chữ: cho phép xuống dòng, không cắt `…` (tiếng Việt dài).

### 6.7 Thẻ nhiệm vụ (challenge / task card)

**Giải phẫu**

```
┌──────────────────────────────────────────────┐  ← .card (trắng, bo 28, cạnh dưới 3px)
│ ┌─────┐  THỬ THÁCH ›              5 ⚡  [ ✓ ] │
│ │ img │  Mặc món đồ khiến bạn thấy             │
│ └─────┘  đúng là mình nhất, và cảm nhận…       │
│ [DAY 2]                                        │
└──────────────────────────────────────────────┘
```

| Phần | Thông số |
|------|----------|
| Thẻ | nền trắng, bo `28px`, padding `16px` (≥640: 20, ≥1024: 24), `min-height: 112px`, `--edge-card` + `--shadow-soft` |
| Minh hoạ | 68×68px tròn, nền `--purple-50`, viền 4px `#E0C050`-tông (tuỳ chủ đề); ảnh `object-fit: cover` |
| Huy hiệu "DAY n" | đè mép dưới minh hoạ (`bottom: -10px`, giữa), nền `--amber-300`, chữ `--amber-ink` **italic 800 14px**, padding `2px 12px`, bo `10px`, cạnh dưới 3px `--amber-600`; 2 chấm tròn nhỏ hai bên chữ (6px, `--amber-600`) |
| Nhãn (overline) | `--fs-overline`, in hoa, màu `--amber-800`, kèm chevron `›` 14px; là link tới trang chi tiết |
| Tiêu đề | `--fs-h3` (17px/700/1.25), màu `--text`, tối đa 4 dòng (`-webkit-line-clamp: 4`), `margin-top: 4px` |
| Điểm thưởng | số 18px/700 `--text-muted` + icon tia sét 16px vàng, khe 2px, `tabular-nums` |
| Nút tích | 44×40px, bo `14px`, nền `--purple-50`, cạnh dưới 4px `--purple-200`, dấu ✓ xanh `--green-500` nét 3px |
| Khe | minh hoạ ↔ nội dung 16px; nội dung ↔ cụm phải 12px; thưởng ↔ nút 12px |

**Trạng thái**
- *Hover* (chỉ chuột): thẻ nâng 2px (`translateY(-2px)`), nút tích sáng lên.
- *Nhấn nút tích:* lún 3px; khi hoàn thành → nền `--green-100`, cạnh `--green-300`, dấu ✓ phóng 1 → 1.15 → 1 (`--ease-bounce`, 320ms); tiêu đề thêm `text-decoration: line-through` màu `--text-muted` (không dùng chỉ màu để báo hoàn thành).
- *Focus-visible:* vòng 3px `--purple-500`, offset 3px (trên nền trắng).
- *Disabled:* opacity .55, không bóng.

### 6.8 Tiêu đề nhóm có thể thu gọn ("Start the day")

- Hàng flex, cao 44px, margin-top 24px, margin-bottom 12px.
- `button` chứa: chữ 18px/700 trắng + chevron 20px (xoay 180° khi thu gọn, 200ms) · `flex: 1` đường kẻ 1.5px `--line-on-brand` · nút `+` tròn 28px (vùng chạm 44px), nền `rgba(255,255,255,.18)`, icon trắng 18px.
- `aria-expanded`, `aria-controls` trỏ tới danh sách bên dưới. Thu gọn dùng `grid-template-rows: 1fr → 0fr` (không animate `height`).

### 6.9 Thanh tab (bottom nav)

| Thuộc tính | Mobile | Tablet | Desktop (sidebar) |
|------------|--------|--------|-------------------|
| Vị trí | cố định đáy, full-width | nổi, giữa, `bottom: 16px + safe-area` | dính trái `top: 24px` |
| Nền | `--nav-bg` + `backdrop-filter: blur(12px)` | như mobile + `--shadow-soft` | `--nav-bg`, bo `28px` |
| Padding | `8px 8px calc(8px + safe-area)` | `8px` | `12px` |
| Mục | cột đều; icon 36px trên, nhãn dưới | như mobile | ngang: icon 32 + nhãn 16px |
| Kích thước mục | cao ≥ 64px | 64px | cao 56px |
| Nhãn | 13px/700 trắng (≥480px: 14px) | 14px | 16px |
| Active | ô `--nav-active`, bo 16px, `aria-current="page"` | cùng | cùng |
| Huy hiệu số | tròn 20px, nền `--coral-600`, chữ trắng 12px/800, viền trắng 2px, lệch `top:-4px; right:-6px` | cùng | cùng |
| Chấm thông báo | tròn 14px `--coral-600`, viền trắng 2px | cùng | cùng |

- Icon tab màu 2 tông (vàng/kem/cam — tương tự ảnh) để nổi trên nền tím tối; giữ nét tròn, không viền đen.

### 6.10 Nút

| Biến thể | Nền | Chữ | Cạnh dưới | Dùng trên |
|----------|-----|-----|-----------|-----------|
| **Primary** | `--purple-500` | `#fff` | `--purple-700` | nền trắng |
| **On-brand** | `#fff` | `--purple-700` | `--purple-200` | nền tím |
| **Accent** | `--amber-400` | `--amber-ink` | `--amber-600` | điểm nhấn CTA (1 nút/màn) |
| **Secondary** | `--purple-50` | `--purple-700` | `--purple-200` | nền trắng |
| **Ghost** | trong suốt | `#fff` | không | nền tím (viền 2px `rgba(255,255,255,.45)`) |
| **Danger** | `--coral-600` | `#fff` | `#A81F2E` | hành động xoá |
| **Icon** | 44×44 tròn, nền `rgba(255,255,255,.14)` | `#fff` | không | thanh trên, tiêu đề mục |

Kích thước: **lg** cao 52px, chữ 17px, bo 16px · **md** cao 48px, chữ 16px, bo 14px · **sm** cao 40px, chữ 14px, bo 12px.
Chữ nút: 800, không in hoa. Khoảng cách icon–chữ 8px. Chừa **4px dưới** nút để cạnh dày không bị đè.
- *Hover:* `filter: brightness(1.04)`. *Active:* `translateY(3px)` + cạnh còn 1px. *Disabled:* nền `--purple-100`, chữ `--purple-400`, không cạnh, không nhấn.
- *Loading:* thay chữ bằng spinner 20px (giữ nguyên chiều rộng nút).

### 6.11 Form

| Thành phần | Thông số |
|------------|----------|
| Nhãn | 14px/700 `--on-brand` (trên tím) hoặc `--text` (trên trắng), cách input 6px |
| Input / select / textarea | cao 52px (textarea min 120px), bo `20px`, nền trắng, viền 2px `--purple-200`, chữ 16px/600 `--text`, placeholder `--text-faint` |
| Focus | viền `--purple-500` + vòng ngoài 3px `rgba(91,79,209,.28)` (trên tím: viền `--amber-300`) |
| Lỗi | viền `--coral-600`, thông báo 13px/700 `--coral-600` + icon (trên nền tím: đặt vào thẻ trắng nhỏ để đạt tương phản) |
| Gợi ý | 13px/600 `--text-muted` |
| Switch | 52×30px, thumb 24px trắng, tắt `--purple-400`, bật `--green-500`; thumb có cạnh dưới 2px |
| Checkbox / radio | 24px; bo 8px / tròn; viền 2px `--purple-300`; chọn → nền `--purple-500` + dấu ✓ trắng |
| Chip / filter | cao 36px, pill, padding `0 14px`; chưa chọn: nền `rgba(255,255,255,.16)` chữ trắng; chọn: nền trắng chữ `--purple-700` + cạnh 3px `--purple-200` |
| Segmented control | nền `--inset`, bo pill, padding 4px; mục chọn: trắng, chữ `--purple-700`, cạnh dưới 3px |

### 6.12 Bottom sheet / Modal

- Mobile: **bottom sheet**, nền trắng, bo trên `36px`, tay nắm 40×5px `--purple-200` cách đỉnh 8px, padding `24px`, `max-height: 90dvh` cuộn trong.
- ≥ 768px: **dialog** giữa màn hình, `max-width: 520px`, bo `36px`, padding `32px`.
- Overlay `--overlay` + `backdrop-filter: blur(2px)`. Khoá cuộn nền, trả focus về nút mở, `Esc` đóng, `role="dialog"` + `aria-modal="true"`.
- Hai nút cuối: nút chính bên phải/trên (mobile xếp dọc full-width, khe 12px).

### 6.13 Toast / thông báo

- Nền `--purple-900`, chữ trắng 15px/700, bo `20px`, padding `12px 16px`, icon vàng 20px bên trái, `--shadow-pop`.
- Vị trí: giữa, cách thanh tab `12px` (mobile) hoặc góc dưới phải (desktop). Tự đóng sau 4s (dừng khi hover/focus). `role="status"`.

### 6.14 Avatar, huy hiệu, tag

- Avatar: 32 / 40 / 56px tròn, viền trắng 2px; nhóm avatar chồng nhau lệch −12px.
- Tag trạng thái: cao 24px, pill, chữ 12px/800; nền nhạt + chữ đậm cùng tông (xanh: `--green-100`/`--green-700`; vàng: `--amber-300`/`--amber-ink`; tím: `--purple-100`/`--purple-700`).

### 6.15 Skeleton, trạng thái rỗng

- Skeleton trên tím: khối `rgba(255,255,255,.18)` bo cùng bán kính thẻ thật; trên trắng: `--purple-100`. Shimmer 1.4s (tắt khi reduce-motion).
- Trạng thái rỗng: minh hoạ 160px + 1 câu hướng dẫn hành động (sentence case) + 1 nút. Không xin lỗi, nói rõ phải làm gì.

### 6.16 Footer (website)

- Nền `--purple-900`, bo trên `36px`, padding `48px var(--gutter) calc(32px + env(safe-area-inset-bottom))`.
- Link cột: 16px/600 `--purple-200`, hover trắng; khe dọc 12px; chân trang 14px `--purple-300`.

---

## 7. Icon & minh hoạ

**Icon giao diện (hamburger, bộ lọc, lưới, +, ✓, chevron):**
- Nét 2.5–3px, **đầu và góc bo tròn**, lưới 24px (vùng chạm 44px). Màu trắng trên tím, `--purple-700` trên trắng.
- Gợi ý thư viện: Phosphor (Bold) hoặc Lucide `stroke-width: 2.5`; giữ **một** bộ duy nhất.

**Icon điều hướng & vật phẩm (tab, tia sét, túi, cây…):**
- Phong cách "sticker" phẳng 2 tông, **không viền đen**; thêm một mảng sáng nhỏ và cạnh dưới đậm hơn 2px để có cảm giác khối.
- Kích thước 36–40px (tab), 28–36px (tia sét trong thẻ), 16–20px (inline).

**Minh hoạ nhân vật / cảnh:**
- Hình khối đơn giản, góc bo, không viền; tối đa 5–6 màu mỗi vật; ánh sáng 1 hướng (trên-trái).
- Luôn có **bóng đáy elip** `rgba(22,18,59,.18)` dưới nhân vật.
- Biểu cảm đơn giản (mắt nhắm cười, má hồng nhạt `#F6A8B8`). Màu nhân vật xám-tím nhạt `#C9C6E3` để nổi trên sàn tím.
- Xuất SVG, tối ưu bằng SVGO; thay màu bằng CSS variables khi cần theo chủ đề sáng/tối.
- Ảnh chụp thật **không** dùng trong khung minh hoạ; nếu cần, bo `20px` và đặt trong thẻ trắng.

---

## 8. Motion

| Loại | Thông số |
|------|----------|
| **Nhấn** (nút, thẻ bấm được) | `translateY(3px)` trong 120ms `--ease`; cạnh 4px → 1px |
| **Hover** (chỉ chuột) | nâng `-2px`, 160ms |
| **Hoàn thành** | dấu ✓ pop 1 → 1.15 → 1, 320ms `--ease-bounce`; thanh tiến độ tăng 600ms; có thể thêm 5–8 hạt confetti vàng/trắng 600ms |
| **Mở/đóng** | sheet trượt lên 320ms, dialog scale .96 → 1 + fade 240ms; nhóm thu gọn 240ms |
| **Chuyển trang** | fade 160ms (không trượt cả trang) |
| **Chuyển động nền (duy nhất)** | nhân vật "thở": `scale(1) ↔ scale(1.02)` quanh đáy, 3.2s `ease-in-out` lặp; đèn lắc ±1.5° 6s có thể thêm nếu cần, **không hơn** |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
                           transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

Không dùng hiệu ứng fade-up cho từng section khi cuộn, không hover hiệu ứng cho mọi thẻ.

---

## 9. Accessibility

1. **Tương phản (đã kiểm tra):**
   - Trắng trên `#5B4FD1`: **6.0:1** ✔ · trắng trên `--inset`: 7.1 ✔ · trắng trên `--nav-bg`: 7.3 ✔ · trắng trên ô tab active: 5.2 ✔
   - `#221D57` trên trắng: 15.2 ✔ · `--text-muted` trên trắng: 6.7 ✔ · `--amber-800` trên trắng: 7.1 ✔
   - Chữ phụ trắng 88% trên tím: 5.1 ✔ (**không** dùng 70–80%: 3.8–4.5)
   - Vàng `#FFB547` trên tím: 3.4 → chỉ icon/khối ≥ 3:1, **không làm chữ nhỏ**. Chữ trên nền vàng dùng `--amber-ink` (8.4).
   - Chữ trắng trên san hô `#D6293B`: 4.95 ✔
2. **Vòng focus** luôn thấy rõ: trên nền tím `3px solid #FFD166` offset 3px; trên nền trắng `3px solid #5B4FD1` offset 3px. Không `outline: none` nếu không thay thế.
3. **Vùng chạm ≥ 44×44px**, khoảng cách giữa 2 vùng chạm ≥ 8px.
4. **Không chỉ dùng màu** để truyền nghĩa: hoàn thành = màu + dấu ✓ + gạch ngang; lỗi = màu + icon + chữ.
5. **Cấu trúc ngữ nghĩa:** `header`, `nav aria-label="Chính"`, `main`, `aside`; một `h1` mỗi trang; `aria-current="page"` cho tab hiện tại; nhãn cho nút chỉ có icon (`aria-label`).
6. `html lang="vi"`; đặt `lang="en"` cho đoạn tiếng Anh xen kẽ.
7. Hero là trang trí → `role="img"` + `aria-label` ngắn, hoặc `aria-hidden="true"` nếu trùng lặp nội dung.
8. Tôn trọng `prefers-reduced-motion`, `prefers-contrast: more` (tăng viền/cạnh thẻ lên 2px `--purple-300`), và cỡ chữ hệ thống (dùng rem).

---

## 10. Page templates

### A. Home / Dashboard (đúng ảnh tham khảo)

1. Hero + thanh trên → 2. Bong bóng thoại → 3. Thẻ tiến độ → 4. Tiêu đề mục + 2 nút thao tác → 5. Nhóm "Bắt đầu ngày mới" (thu gọn được) với danh sách thẻ nhiệm vụ → 6. Nhóm kế tiếp … → 7. Thanh tab / sidebar.

### B. Landing page (cùng token)

| Section | Bố cục | Ghi chú |
|---------|--------|---------|
| **Hero** | Mobile: cảnh minh hoạ ở trên, sau đó tiêu đề + mô tả + 1 nút accent. Desktop ≥1024: 2 cột (chữ trái 6/12, cảnh phải 6/12 trong khung bo 36px) | `display` 34 → 60px; 1 CTA chính (accent) + 1 ghost; nền `--bg` |
| **Tính năng** | 3 thẻ trắng (mobile 1 cột → md 2 → lg 3), mỗi thẻ: minh hoạ 96px + tiêu đề h3 + 2 dòng mô tả | cạnh dưới 3px, bo 28px, khe 16/24px |
| **Cách hoạt động** | 3 bước (đây là chuỗi thật nên được đánh số), thẻ nối bằng đường chấm trắng 28% | số bước trong ô tròn vàng 40px |
| **Cảm nhận người dùng** | thẻ trắng + avatar 40px + trích dẫn 17px/600 | cuộn ngang snap trên mobile (`scroll-snap-type: x mandatory`) |
| **Bảng giá** | 3 thẻ; thẻ giữa nổi bật: viền cạnh dưới `--amber-600`, huy hiệu "Phổ biến" | nút accent chỉ ở thẻ nổi bật |
| **FAQ** | danh sách accordion trong thẻ trắng, câu hỏi 17px/700, dấu +/− 28px | một thẻ nền trắng bo 28 chứa tất cả |
| **CTA cuối** | khối `--purple-700` bo 36px, tiêu đề trắng + nút accent | padding `var(--section)` |
| **Footer** | mục 6.16 | — |

**Xen kẽ section:** nền `--purple-500` ↔ `--purple-600`; chuyển tiếp bằng **mép bo trên 36px chồng lên** section trước (hiệu ứng "tờ giấy xếp lớp"), không dùng đường chéo/sóng. Padding dọc section `var(--section)`.

**Giọng văn:** thân thiện, câu ngắn, sentence case, động từ rõ (ví dụ "Bắt đầu hôm nay", "Đã hoàn thành!"). Mỗi thẻ chỉ một ý.

---

## 11. CSS khởi đầu

> Sao chép nguyên khối rồi mở rộng. Đã tính sẵn tương phản; thay ảnh/minh hoạ bằng tài sản của bạn.

```css
/* =========================================================
   1. TOKENS
   ========================================================= */
:root {
  color-scheme: light;

  /* Brand */
  --purple-50:#F4F3FF; --purple-100:#E9E7FD; --purple-200:#D4D0FA; --purple-300:#B7B1F4;
  --purple-400:#8E85E6; --purple-500:#5B4FD1; --purple-600:#4A3FB5; --purple-700:#3C3394;
  --purple-800:#2E2772; --purple-900:#221D57; --purple-950:#16123B;
  --brand: var(--purple-500);

  /* Surfaces */
  --bg: var(--brand);
  --surface: #FFFFFF;
  --surface-soft: var(--purple-50);
  --inset: rgba(22,18,59,.14);
  --nav-bg: rgba(22,18,59,.16);
  --nav-active: rgba(255,255,255,.14);
  --line-on-brand: rgba(255,255,255,.28);
  --overlay: rgba(22,18,59,.55);

  /* Text */
  --on-brand: #FFFFFF;
  --on-brand-muted: rgba(255,255,255,.88);
  --text: var(--purple-900);
  --text-muted: #5A5880;
  --text-faint: #8C8AAA;

  /* Accents */
  --amber-300:#FFD166; --amber-400:#FFB547; --amber-600:#D9820F; --amber-800:#92400E; --amber-ink:#3B2300;
  --coral-600:#D6293B;
  --green-100:#E3F6EA; --green-300:#9AD9B3; --green-500:#1F9D55; --green-700:#15803D;

  /* Focus */
  --focus: var(--amber-300);             /* trên nền tím */

  /* Radius */
  --r-xs:8px; --r-sm:10px; --r-md:14px; --r-lg:20px; --r-xl:28px; --r-2xl:36px; --r-pill:999px;

  /* Edges & shadows */
  --edge-white:  0 4px 0 0 var(--purple-200);
  --edge-brand:  0 4px 0 0 var(--purple-700);
  --edge-amber:  0 4px 0 0 var(--amber-600);
  --edge-bubble: 0 3px 0 0 var(--purple-200);
  --edge-card:   0 3px 0 0 rgba(22,18,59,.14);
  --shadow-soft: 0 14px 28px -14px rgba(22,18,59,.45);
  --shadow-pop:  0 24px 60px -12px rgba(22,18,59,.55);

  /* Gradients (dùng rất ít) */
  --grad-meter-fill: linear-gradient(180deg,#FFC866 0%,#FFB547 55%,#F5A02B 100%);

  /* Spacing */
  --space-1:.25rem; --space-2:.5rem; --space-3:.75rem; --space-4:1rem; --space-5:1.25rem;
  --space-6:1.5rem; --space-7:1.75rem; --space-8:2rem; --space-10:2.5rem; --space-12:3rem;
  --space-16:4rem; --space-20:5rem;
  --gutter:  clamp(1rem, .6087rem + 1.739vw, 2rem);
  --section: clamp(2rem, 1.022rem + 4.348vw, 4.5rem);
  --card-pad: 1rem;
  --tap: 44px;

  /* Layout */
  --container-app: 720px; --container-rail: 360px; --container-sidebar: 240px;
  --container-page: 1200px; --container-wide: 1440px;
  --nav-h: 72px;
  --hero-h: clamp(17.5rem, 74vw, 22.5rem);

  /* Type */
  --font: "Nunito", ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --fs-display: clamp(2.125rem, 1.489rem + 2.826vw, 3.75rem);
  --fs-h1: clamp(1.75rem, 1.359rem + 1.739vw, 2.75rem);
  --fs-h2: clamp(1.375rem, 1.13rem + 1.087vw, 2rem);
  --fs-h3: clamp(1.0625rem, .9891rem + .3261vw, 1.25rem);
  --fs-lead: clamp(1.0625rem, 1.014rem + .2174vw, 1.1875rem);
  --fs-body: 1rem;
  --fs-label: .875rem;
  --fs-caption: .8125rem;
  --fs-stat: clamp(1.125rem, .9rem + .9vw, 1.75rem);

  /* Motion */
  --t-press:120ms; --t-fast:160ms; --t-base:240ms; --t-enter:320ms; --t-meter:600ms;
  --ease: cubic-bezier(.2,.8,.2,1);
  --ease-bounce: cubic-bezier(.34,1.56,.64,1);

  /* Z */
  --z-sticky:10; --z-nav:40; --z-sheet:60; --z-modal:70; --z-toast:80;
}

/* =========================================================
   2. RESET & BASE
   ========================================================= */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; scroll-padding-top: 1rem; }
body {
  margin: 0; min-height: 100dvh;
  background: var(--bg); color: var(--on-brand);
  font: 600 var(--fs-body)/1.5 var(--font);
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
img, svg, video { display: block; max-width: 100%; height: auto; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
h1, h2, h3, p { margin: 0; }
h1, h2, h3 { text-wrap: balance; font-weight: 800; }
p { text-wrap: pretty; max-width: 62ch; }
a { color: inherit; }
ul { margin: 0; padding: 0; list-style: none; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: var(--r-sm); }
.surface :focus-visible, .card :focus-visible, .sheet :focus-visible { --focus: var(--purple-500); }
.num { font-variant-numeric: tabular-nums; }
.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* =========================================================
   3. LAYOUT (mobile-first)
   ========================================================= */
.app { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1fr); }
.rail { grid-area: rail; }
.main { grid-area: main; min-width: 0;
        padding-inline: var(--gutter);
        padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + var(--space-4)); }
.container { width: 100%; max-width: var(--container-page); margin-inline: auto; padding-inline: var(--gutter); }
.stack > * + * { margin-top: var(--space-4); }

@media (min-width: 768px) {
  :root { --card-pad: 1.25rem; --nav-h: 88px; }
  .main { padding-bottom: 6rem; }
}
@media (min-width: 1024px) {
  :root { --card-pad: 1.5rem; }
  .app {
    max-width: var(--container-wide); margin-inline: auto;
    padding: var(--space-6) var(--gutter);
    grid-template-columns: var(--container-sidebar) minmax(0, var(--container-app)) var(--container-rail);
    grid-template-areas: "nav main rail";
    column-gap: var(--space-8); justify-content: center; align-items: start;
  }
  .main { padding: 0; }
  .rail { position: sticky; top: var(--space-6); }
}

/* =========================================================
   4. HERO + TOP BAR + BUBBLE
   ========================================================= */
.hero { position: relative; height: var(--hero-h); overflow: hidden; background: var(--purple-700); }
.hero > svg { width: 100%; height: 100%; }           /* svg: preserveAspectRatio="xMidYMax slice" */
.topbar {
  position: absolute; z-index: var(--z-sticky); inset-inline: 0;
  top: calc(var(--space-3) + env(safe-area-inset-top));
  display: flex; justify-content: space-between; align-items: center;
  padding-inline: var(--space-4);
}
.icon-btn {
  display: inline-grid; place-items: center; width: var(--tap); height: var(--tap);
  border: 0; border-radius: var(--r-pill); background: transparent; color: #fff;
  transition: background var(--t-fast) var(--ease), transform var(--t-press) var(--ease);
}
.icon-btn:active { transform: translateY(2px); background: rgba(255,255,255,.14); }
@media (hover: hover) { .icon-btn:hover { background: rgba(255,255,255,.14); } }

.bubble {
  width: fit-content; max-width: min(80%, 320px);
  margin: var(--space-2) auto 0; padding: .75rem 1.5rem;
  background: var(--surface); color: var(--text);
  border-radius: var(--r-lg); box-shadow: var(--edge-bubble);
  font: 800 1.125rem/1.25 var(--font); text-align: center;
}

@media (min-width: 768px) {
  .rail__hero-wrap { padding: var(--space-6) var(--gutter) 0; }
  .hero { border-radius: var(--r-2xl); }
  .bubble { margin-top: var(--space-3); }
}
@media (min-width: 1024px) {
  .rail__hero-wrap { padding: 0; }
  .hero { height: auto; aspect-ratio: 4 / 5; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .hero { height: 40dvh; } .bubble { display: none; }
}

/* =========================================================
   5. STAT / PROGRESS (inset)
   ========================================================= */
.stat {
  display: grid; grid-template-columns: 36px minmax(0, 1fr); column-gap: var(--space-3); align-items: center;
  margin: var(--space-3) var(--gutter) 0; padding: .875rem 1rem;
  background: var(--inset); border-radius: var(--r-xl);
}
.stat__label { font: 700 1rem/1.3 var(--font); margin-bottom: 6px; }
.meter { position: relative; height: 24px; background: #fff; border-radius: var(--r-pill); overflow: hidden; }
.meter__fill {
  position: absolute; inset: 0 auto 0 0; min-width: 28px; width: var(--value, 0%);
  background: var(--grad-meter-fill); border-radius: var(--r-pill);
  box-shadow: inset 0 3px 0 rgba(255,255,255,.35);
  transition: width var(--t-meter) var(--ease);
}
.meter__text { position: relative; display: block; text-align: center; font: 800 1.125rem/24px var(--font); color: #6B3F00; }
@media (min-width: 768px) { .stat { padding: 1rem 1.25rem; } }
@media (min-width: 1024px) { .stat { margin: var(--space-5) 0 0; } }

/* =========================================================
   6. SECTION HEADER + GROUP DIVIDER
   ========================================================= */
.section-head { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-7); }
.section-head__title { flex: 1; min-width: 0; font-size: 1.125rem; line-height: 1.3; }
.group { margin-top: var(--space-6); }
.group__bar { display: flex; align-items: center; gap: var(--space-3); min-height: var(--tap); margin-bottom: var(--space-3); }
.group__toggle { display: inline-flex; align-items: center; gap: var(--space-1); background: none; border: 0; padding: 0; color: #fff; font: 700 1.125rem/1.3 var(--font); }
.group__toggle svg { transition: transform var(--t-base) var(--ease); }
.group__toggle[aria-expanded="false"] svg { transform: rotate(-90deg); }
.group__line { flex: 1; height: 1.5px; background: var(--line-on-brand); border-radius: 2px; }
.group__add { width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255,255,255,.18); color: #fff; }
.group__add::after { content: ""; position: absolute; inset: -8px; } /* mở rộng vùng chạm lên 44px */
.group__add { position: relative; }
.group__panel { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--t-base) var(--ease); }
.group__panel[hidden-state="true"] { grid-template-rows: 0fr; }
.group__panel > ul { overflow: hidden; min-height: 0; display: grid; gap: var(--space-4); }
@media (min-width: 768px) { .group__panel > ul { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); } .group { margin-top: 1.75rem; } }
@media (min-width: 1024px) { .group__panel > ul { grid-template-columns: 1fr; } .group { margin-top: var(--space-8); } }

/* =========================================================
   7. CARD + TASK
   ========================================================= */
.card {
  container-type: inline-size;
  background: var(--surface); color: var(--text);
  border-radius: var(--r-xl); padding: var(--card-pad);
  box-shadow: var(--edge-card), var(--shadow-soft);
}
.task {
  display: grid; align-items: center; min-height: 112px;
  grid-template-columns: 68px minmax(0, 1fr) auto;
  grid-template-areas: "media content action";
  column-gap: var(--space-4);
}
.task__media { grid-area: media; position: relative; width: 68px; aspect-ratio: 1; margin-bottom: 10px; }
.task__media img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: var(--purple-50); }
.task__badge {
  position: absolute; left: 50%; bottom: -10px; translate: -50% 0; white-space: nowrap;
  padding: 2px 12px; border-radius: var(--r-sm);
  background: var(--amber-300); color: var(--amber-ink); box-shadow: 0 3px 0 0 var(--amber-600);
  font: italic 800 .875rem/1.2 var(--font);
}
.task__content { grid-area: content; min-width: 0; }
.task__overline {
  display: inline-flex; align-items: center; gap: 2px; text-decoration: none;
  font: 800 var(--fs-caption)/1.2 var(--font); letter-spacing: .06em; text-transform: uppercase; color: var(--amber-800);
}
.task__title {
  margin-top: var(--space-1); font: 700 var(--fs-h3)/1.25 var(--font); color: var(--text);
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden;
  padding-block: 1px; /* chừa chỗ cho dấu tiếng Việt khi clamp */
}
.task__action { grid-area: action; display: flex; align-items: center; gap: var(--space-3); }
.task__reward { display: inline-flex; align-items: center; gap: 2px; font: 700 1.125rem/1 var(--font); color: var(--text-muted); font-variant-numeric: tabular-nums; }

.check {
  position: relative; width: 44px; height: 40px; display: grid; place-items: center;
  border: 0; border-radius: var(--r-md); background: var(--purple-50); color: var(--green-500);
  box-shadow: var(--edge-white);
  transition: transform var(--t-press) var(--ease), box-shadow var(--t-press) var(--ease), background var(--t-fast);
  margin-bottom: 4px;
}
.check::after { content: ""; position: absolute; inset: -2px; }
.check:active { transform: translateY(3px); box-shadow: 0 1px 0 0 var(--purple-200); }
.check[aria-pressed="true"] { background: var(--green-100); box-shadow: 0 4px 0 0 var(--green-300); }
.check[aria-pressed="true"] svg { animation: pop var(--t-enter) var(--ease-bounce); }
.task.is-done .task__title { text-decoration: line-through; color: var(--text-muted); }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
@media (hover: hover) { .check:hover { filter: brightness(.98); } .card--link:hover { transform: translateY(-2px); } }

/* Thẻ hẹp: chuyển hàng thưởng + nút tích xuống dưới */
@container (max-width: 340px) {
  .task { grid-template-columns: 56px minmax(0, 1fr); grid-template-areas: "media content" "action action"; row-gap: var(--space-3); }
  .task__media { width: 56px; }
  .task__action { justify-content: flex-end; }
}

/* =========================================================
   8. BUTTONS
   ========================================================= */
.btn {
  --btn-bg: var(--purple-500); --btn-fg: #fff; --btn-edge: var(--purple-700);
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 48px; padding: 0 1.5rem; margin-bottom: 4px;
  border: 0; border-radius: var(--r-md);
  background: var(--btn-bg); color: var(--btn-fg);
  font: 800 1rem/1 var(--font); text-decoration: none;
  box-shadow: 0 4px 0 0 var(--btn-edge);
  transition: transform var(--t-press) var(--ease), box-shadow var(--t-press) var(--ease), filter var(--t-fast);
}
.btn:active { transform: translateY(3px); box-shadow: 0 1px 0 0 var(--btn-edge); }
@media (hover: hover) { .btn:hover { filter: brightness(1.04); } }
.btn--lg { min-height: 52px; padding-inline: 1.75rem; font-size: 1.0625rem; border-radius: 16px; }
.btn--sm { min-height: 40px; padding-inline: 1rem; font-size: .875rem; border-radius: 12px; }
.btn--on-brand  { --btn-bg: #fff; --btn-fg: var(--purple-700); --btn-edge: var(--purple-200); }
.btn--accent    { --btn-bg: var(--amber-400); --btn-fg: var(--amber-ink); --btn-edge: var(--amber-600); }
.btn--secondary { --btn-bg: var(--purple-50); --btn-fg: var(--purple-700); --btn-edge: var(--purple-200); }
.btn--danger    { --btn-bg: var(--coral-600); --btn-edge: #A81F2E; }
.btn--ghost     { background: transparent; box-shadow: inset 0 0 0 2px rgba(255,255,255,.45); color: #fff; }
.btn--ghost:active { transform: translateY(2px); box-shadow: inset 0 0 0 2px rgba(255,255,255,.45); }
.btn[disabled] { --btn-bg: var(--purple-100); --btn-fg: var(--purple-400); box-shadow: none; pointer-events: none; }

/* =========================================================
   9. TAB BAR  →  floating pill  →  sidebar
   ========================================================= */
.tabbar {
  grid-area: nav; position: fixed; inset: auto 0 0 0; z-index: var(--z-nav);
  display: grid; grid-template-columns: repeat(var(--tabs, 5), minmax(0, 1fr)); gap: 4px;
  padding: .5rem .5rem calc(.5rem + env(safe-area-inset-bottom));
  background: var(--nav-bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
}
.tab {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  min-height: 64px; padding: 6px 4px; border-radius: 16px; color: #fff; text-decoration: none;
  font: 700 var(--fs-caption)/1.2 var(--font); text-align: center;
  transition: background var(--t-fast) var(--ease), transform var(--t-press) var(--ease);
}
.tab:active { transform: translateY(2px); }
.tab[aria-current="page"] { background: var(--nav-active); }
.tab__icon { width: 36px; height: 36px; }
.badge-count {
  position: absolute; top: 2px; right: calc(50% - 30px); min-width: 20px; height: 20px; padding: 0 5px;
  display: grid; place-items: center; border-radius: var(--r-pill);
  background: var(--coral-600); color: #fff; border: 2px solid #fff; font: 800 .75rem/1 var(--font);
}
.badge-dot { position: absolute; top: 4px; right: calc(50% - 26px); width: 14px; height: 14px; border-radius: 50%; background: var(--coral-600); border: 2px solid #fff; }
@media (min-width: 480px) { .tab { font-size: var(--fs-label); } }
@media (min-width: 768px) {
  .tabbar {
    left: 50%; right: auto; translate: -50% 0; width: min(560px, calc(100% - 2rem));
    bottom: calc(1rem + env(safe-area-inset-bottom)); padding: .5rem; border-radius: 28px; box-shadow: var(--shadow-soft);
  }
}
@media (min-width: 1024px) {
  .tabbar {
    position: sticky; inset: auto; top: var(--space-6); translate: none; width: auto; align-self: start;
    grid-template-columns: 1fr; padding: .75rem; border-radius: var(--r-xl); gap: 6px;
  }
  .tab { flex-direction: row; justify-content: flex-start; gap: var(--space-3); min-height: 56px; padding: .5rem .75rem; font-size: 1rem; text-align: left; }
  .tab__icon { width: 32px; height: 32px; }
  .badge-count, .badge-dot { position: static; margin-left: auto; border-color: transparent; }
}

/* =========================================================
   10. FORM
   ========================================================= */
.field { display: grid; gap: 6px; }
.field__label { font: 700 var(--fs-label)/1.3 var(--font); }
.input {
  width: 100%; height: 52px; padding: 0 1rem; background: #fff; color: var(--text);
  border: 2px solid var(--purple-200); border-radius: var(--r-lg); font: 600 1rem/1 var(--font);
}
.input::placeholder { color: var(--text-faint); }
.input:focus { outline: none; border-color: var(--purple-500); box-shadow: 0 0 0 3px rgba(91,79,209,.28); }
.input[aria-invalid="true"] { border-color: var(--coral-600); }
.chip { height: 36px; padding: 0 14px; border: 0; border-radius: var(--r-pill); background: rgba(255,255,255,.16); color: #fff; font: 700 var(--fs-label)/1 var(--font); }
.chip[aria-pressed="true"] { background: #fff; color: var(--purple-700); box-shadow: 0 3px 0 0 var(--purple-200); margin-bottom: 3px; }

/* =========================================================
   11. SHEET / TOAST
   ========================================================= */
.sheet {
  position: fixed; inset: auto 0 0 0; z-index: var(--z-sheet); max-height: 90dvh; overflow: auto;
  background: #fff; color: var(--text); border-radius: var(--r-2xl) var(--r-2xl) 0 0;
  padding: 1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom)); box-shadow: var(--shadow-pop);
}
.sheet::before { content: ""; display: block; width: 40px; height: 5px; margin: -8px auto 16px; border-radius: 3px; background: var(--purple-200); }
@media (min-width: 768px) {
  .sheet { inset: 50% auto auto 50%; translate: -50% -50%; width: min(520px, calc(100% - 2rem)); border-radius: var(--r-2xl); padding: 2rem; }
  .sheet::before { display: none; }
}
.toast {
  position: fixed; left: 50%; translate: -50% 0; z-index: var(--z-toast);
  bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + .75rem); max-width: calc(100% - 2rem);
  display: flex; align-items: center; gap: var(--space-3); padding: .75rem 1rem;
  background: var(--purple-900); color: #fff; border-radius: var(--r-lg); box-shadow: var(--shadow-pop);
  font: 700 .9375rem/1.3 var(--font);
}

/* =========================================================
   12. MOTION: nhân vật "thở" (chuyển động nền duy nhất)
   ========================================================= */
.hero__character { transform-origin: 50% 100%; animation: breathe 3.2s ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}

/* =========================================================
   13. DARK VARIANT (tuỳ chọn)
   ========================================================= */
@media (prefers-color-scheme: dark) {
  :root[data-theme="auto"] {
    --bg: var(--purple-950); --surface: var(--purple-800); --text: #F4F3FF; --text-muted: #C9C4F7;
    --inset: rgba(255,255,255,.06); --nav-bg: rgba(255,255,255,.06); --edge-card: 0 3px 0 0 rgba(0,0,0,.35);
    --edge-white: 0 4px 0 0 var(--purple-950); --edge-bubble: 0 3px 0 0 var(--purple-950);
  }
}
```

> **Lưu ý khi tự kiểm tra dark mode:** surface `#2E2772` với chữ `#F4F3FF` đạt ≈ 12:1; nhãn `--amber-800` cần đổi sang `--amber-300` trên surface tối.

---

## 12. HTML khung trang Home

```html
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#5B4FD1">
  <title>Hôm nay của bạn</title>
  <!-- Font: xem mục 3.1 -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="app" data-theme="auto">

  <!-- Cột phải (desktop) / phần đầu trang (mobile) -->
  <aside class="rail">
    <div class="rail__hero-wrap">
      <div class="hero">
        <header class="topbar">
          <button class="icon-btn" aria-label="Mở menu"><!-- svg hamburger 28×20 --></button>
          <button class="icon-btn" aria-label="Hồ sơ của bạn"><!-- avatar 36px --></button>
        </header>
        <svg role="img" aria-label="Căn phòng ấm áp với nhân vật đang ăn kem"
             viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice">
          <!-- lớp: sàn · tường · nón sáng · đồ vật · cửa · <g class="hero__character"> · đèn -->
        </svg>
      </div>
      <p class="bubble">Ôm bạn một cái thật chặt!</p>
    </div>

    <section class="stat" aria-label="Chuyến phiêu lưu">
      <svg class="stat__icon" width="36" height="36" aria-hidden="true"><!-- tia sét vàng --></svg>
      <div>
        <div class="stat__label">Chuyến phiêu lưu thứ 5</div>
        <div class="meter" role="progressbar" aria-label="Tiến độ chuyến phiêu lưu"
             aria-valuemin="0" aria-valuemax="15" aria-valuenow="0" style="--value:0%">
          <div class="meter__fill"></div>
          <span class="meter__text num">0 / 15</span>
        </div>
      </div>
    </section>
  </aside>

  <!-- Nội dung chính -->
  <main class="main">
    <div class="section-head">
      <svg width="32" height="32" aria-hidden="true"><!-- icon lịch --></svg>
      <h1 class="section-head__title">Hôm nay còn 55 việc nhỏ</h1>
      <button class="icon-btn" aria-label="Lọc"><!-- sliders --></button>
      <button class="icon-btn" aria-label="Đổi kiểu hiển thị"><!-- grid --></button>
    </div>

    <section class="group" aria-labelledby="g1">
      <div class="group__bar">
        <button class="group__toggle" id="g1" aria-expanded="true" aria-controls="g1-list">
          Bắt đầu ngày mới <svg width="20" height="20" aria-hidden="true"><!-- chevron --></svg>
        </button>
        <span class="group__line" aria-hidden="true"></span>
        <button class="group__add" aria-label="Thêm việc vào nhóm này"><!-- + --></button>
      </div>

      <div class="group__panel" id="g1-list">
        <ul>
          <li class="card">
            <article class="task">
              <div class="task__media">
                <img src="challenge-day2.svg" alt="" width="68" height="68">
                <span class="task__badge">DAY 2</span>
              </div>
              <div class="task__content">
                <a class="task__overline" href="/thu-thach/2">Thử thách <svg width="14" height="14" aria-hidden="true"></svg></a>
                <h2 class="task__title">Mặc món đồ khiến bạn thấy đúng là mình nhất, và cảm nhận xem thoải mái thế nào khi được là chính mình</h2>
              </div>
              <div class="task__action">
                <span class="task__reward num">5 <svg width="16" height="16" aria-hidden="true"></svg><span class="visually-hidden">điểm</span></span>
                <button class="check" aria-pressed="false" aria-label="Đánh dấu đã hoàn thành"><!-- ✓ --></button>
              </div>
            </article>
          </li>
        </ul>
      </div>
    </section>
  </main>

  <!-- Điều hướng -->
  <nav class="tabbar" aria-label="Chính" style="--tabs:6">
    <a class="tab" href="/" aria-current="page"><svg class="tab__icon" aria-hidden="true"></svg>Trang chủ</a>
    <a class="tab" href="/nhiem-vu"><svg class="tab__icon" aria-hidden="true"></svg>Nhiệm vụ</a>
    <a class="tab" href="/cua-hang"><svg class="tab__icon" aria-hidden="true"></svg>Cửa hàng<span class="badge-count">1</span></a>
    <a class="tab" href="/ban-be"><svg class="tab__icon" aria-hidden="true"></svg>Bạn bè<span class="badge-dot"></span></a>
    <a class="tab" href="/tui-do"><svg class="tab__icon" aria-hidden="true"></svg>Túi đồ</a>
    <a class="tab" href="/ho-so"><svg class="tab__icon" aria-hidden="true"></svg>Hồ sơ</a>
  </nav>
</div>
</body>
</html>
```

> Với 6 tab ở 320–360px, mỗi tab chỉ rộng ~50–58px: dùng nhãn ngắn (≤ 8 ký tự), hoặc gộp xuống 5 tab.

---

## 13. Checklist QA & Do / Don't

### Checklist trước khi bàn giao

**Hình thức**
- [ ] Nền trang đúng `#5B4FD1`; thẻ trắng bo 28px; bong bóng 20px; nút 14–16px.
- [ ] Nút/thẻ bấm được có cạnh dưới dày, lún 3px khi nhấn.
- [ ] Chỉ một cụm vàng nổi bật mỗi màn hình; đỏ chỉ ở huy hiệu/lỗi.
- [ ] Không có viền mảnh 1px quanh thẻ; bóng đều nhuốm tím.

**Chữ**
- [ ] Nunito, weight ≥ 600 trên nền tím; tiêu đề 800.
- [ ] Không tiêu đề nào có line-height < 1.18; không cắt dấu tiếng Việt.
- [ ] Nhãn in hoa chỉ 1–2 từ; số dùng `tabular-nums`.

**Khoảng cách & responsive**
- [ ] Mọi khoảng cách là bội số của 4px; lề 16 / 24 / 32px.
- [ ] Không tràn ngang ở 320px; thanh tab không che nội dung cuối; `100dvh`, `safe-area` đã xử lý.
- [ ] Thẻ nhiệm vụ đổi bố cục theo container query ở < 340px.
- [ ] Hero giữ nhân vật trong vùng an toàn ở mọi tỉ lệ.

**Tiếp cận**
- [ ] Tương phản đạt AA (mục 9); vùng chạm ≥ 44px; focus rõ.
- [ ] `prefers-reduced-motion` được tôn trọng.
- [ ] Hoàn thành/lỗi không chỉ dựa vào màu.

### Do

- Dùng tím làm "sàn" và để thẻ trắng nổi lên; dùng vàng một lần, đúng chỗ.
- Giữ bán kính bo đồng nhất theo cấp (xs → 2xl).
- Rút gọn chữ: mỗi thẻ một ý, tiêu đề ≤ 4 dòng.
- Thêm chút "đồ chơi": cạnh dày, pop khi hoàn thành, nhân vật thở.

### Don't

- Không dùng đen thuần, xám trung tính, hoặc bóng đen `rgba(0,0,0,…)`.
- Không dùng gradient làm nền hay "wash" trang trí; không glassmorphism nặng (ngoài thanh tab).
- Không dùng chữ vàng nhỏ trên nền tím; không dùng chữ trắng < 85% opacity.
- Không trộn nhiều bán kính bo trong cùng một thẻ (ví dụ ảnh 4px trong thẻ 28px).
- Không in hoa cả tiêu đề tiếng Việt; không thêm nhãn nhỏ phía trên mọi tiêu đề.
- Không animation fade-up từng section hoặc hover hiệu ứng cho mọi thẻ.

---

## 14. Prompt mẫu cho AI/dev

```text
Hãy xây dựng giao diện web theo file design-spec-cozy-purple.md đính kèm và ảnh tham khảo.

Yêu cầu bắt buộc:
- Nền trang #5B4FD1, thẻ trắng bo 28px, nút và thẻ bấm được có cạnh dưới dày 4px (box-shadow cứng) và lún 3px khi nhấn.
- Font Nunito (500–900, có subset tiếng Việt), cỡ chữ co giãn bằng clamp() như mục 3.2, line-height tiêu đề ≥ 1.18.
- Mobile-first: <768px một cột + thanh tab cố định dưới; 768–1023px thanh tab nổi dạng viên thuốc, lưới thẻ 2 cột;
  ≥1024px chia sidebar | nội dung (tối đa 720px) | cột phải 360px có hero sticky.
- Thẻ nhiệm vụ dùng container query để đổi bố cục khi thẻ hẹp hơn 340px.
- Khoảng cách theo thang 4px (mục 4); lề 16/24/32px; nhịp dọc theo bảng 4.3.
- Đáp ứng WCAG AA, vòng focus rõ, vùng chạm ≥ 44px, tôn trọng prefers-reduced-motion.
- Xuất HTML + CSS thuần (không framework) sử dụng đúng các CSS variables ở mục 11.

Bắt đầu bằng trang Home (mục 12), sau đó mở rộng sang các trang khác dùng chung token.
```

---

*Phiên bản 1.0 — tông tím `#5B4FD1`. Các số đo ảnh gốc là ước lượng; khi có bản thiết kế chính thức, ưu tiên số đo trong Figma và cập nhật lại mục 1.*
