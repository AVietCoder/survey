/* brainst0rm — mini-game "Làng nhỏ" (pixel art SVG nội tuyến, không tải ảnh ngoài).
   Quy tắc (nguyên tắc bất biến):
   - Công trình mở theo TỔNG Sao đã nhận. Không tiêu Sao, không bao giờ mất, không có gì hư hỏng hay héo úa.
   - Không ngẫu nhiên, không bảng xếp hạng, không đếm ngược, nhân vật chỉ có trạng thái vui/thư giãn.
   - Ngưỡng mở khóa và nội dung là dữ liệu TẠM (đề xuất), cần người có thẩm quyền xác nhận.
   - Phần "Vì sao?" là kiến thức phổ thông về giấc ngủ (theo solution.md), không phải chẩn đoán hay lời khuyên y khoa. */
(() => {
  'use strict'

  /* ---------- cơ chế của từng nhiệm vụ (diễn giải dễ hiểu từ solution.md) ---------- */
  const MECHANISMS = {
    'Y-01': 'Khi thức lâu, não tích dần một chất tên là adenosine khiến mình buồn ngủ. Chợp mắt 15–20 phút giúp dọn bớt adenosine trước khi rơi vào giấc ngủ sâu, nên dậy tỉnh táo mà không bị choáng (sleep inertia).',
    'Y-02': 'Caffeine "chiếm chỗ" của adenosine trong não nên mình không thấy buồn ngủ, và tác dụng này kéo dài nhiều giờ. Ngừng caffeine khoảng 8 tiếng trước giờ ngủ giúp vào giấc nhanh hơn.',
    'Y-03': 'Mắt có những tế bào rất nhạy với ánh sáng xanh (ipRGC). Ánh sáng mạnh buổi tối báo cho não rằng "vẫn là ban ngày" và làm chậm melatonin, chất giúp buồn ngủ tự nhiên. Giảm sáng màn hình giúp melatonin lên đúng nhịp.',
    'Y-04': 'Dồn việc khó vào một khung tập trung 90 phút, không làm nhiều việc cùng lúc, giúp làm nhanh và hiệu quả hơn, nên đỡ phải thức khuya bù giờ.',
    'Y-05': 'Não có một "đồng hồ trung tâm" (nhân trên chéo thị, SCN). Dậy giờ đều đặn, kể cả cuối tuần, giữ đồng hồ này ổn định và tránh "lệch múi giờ xã hội" (social jetlag).',
    'R-01': 'Bớt đi một việc không gấp giúp giảm gánh nặng cho não (cognitive load), để đầu óc có chỗ nghỉ ngơi thay vì luôn ở trạng thái gồng mình.',
    'R-02': 'Thông báo liên tục buổi tối kích thích hệ thống dopamine, khiến não khó "tắt máy". Ngắt thông báo sau 22:30 cho não tín hiệu rằng đã đến giờ nghỉ.',
    'R-03': 'Hít hai nhịp liền qua mũi rồi thở ra thật chậm (physiological sigh) kích thích dây thần kinh phế vị, làm nhịp tim chậm lại và đưa cơ thể sang chế độ nghỉ ngơi.',
    'R-04': 'Ngủ thêm 45–60 phút giúp có thêm giấc ngủ REM và ngủ sâu, là lúc vùng não phía trước trán (giúp tập trung, kiểm soát cảm xúc) được phục hồi.',
    'R-05': 'Viết ra 3 việc ngày mai giúp não không phải cố "ghi nhớ hộ" khi nằm chờ ngủ, nên bớt trằn trọc và vào giấc nhanh hơn.',
    'G-01': 'Đi ngủ và thức dậy gần giờ quen thuộc giúp đồng hồ sinh học chạy đều.',
    'G-02': 'Nhìn xa 20 giây giúp các cơ điều tiết của mắt được thả lỏng sau khi nhìn gần lâu.',
    'G-03': 'Thở ra chậm hơn hít vào giúp cơ thể chuyển sang trạng thái thư giãn.'
  }

  /* ---------- bảng màu pixel ---------- */
  const C = {
    grass: '#9ED39A', grassDk: '#7BBE7A', grassLt: '#BFE6B4', soil: '#C9A27E', soilDk: '#A9835F',
    wood: '#B98563', woodDk: '#8E6248', roof: '#8B7CF6', roofDk: '#6D5DD3', roof2: '#F59E8B', roof2Dk: '#D97B69',
    wall: '#FFF6E8', wallDk: '#EADBC4', glass: '#BFE3FF', glassNight: '#FFE08A', water: '#8FD3F4', waterDk: '#6BB8E0',
    leaf: '#6FBF73', leafDk: '#4F9F58', flowerA: '#F6A8B8', flowerB: '#FFD36E', flowerC: '#C4B5FD', stone: '#CFC8D8', stoneDk: '#A9A1B8',
    skin: '#F7D2B6', hair: '#5B4636', shirt: '#8B7CF6', pants: '#4C4F7A', cheek: '#F6A8B8', ink: '#3A3550', white: '#FFFFFF', gold: '#FFD36E'
  }
  const r = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`
  /** Mái tam giác bậc thang (pixel), đỉnh ở giữa. */
  function roof(x, y, w, h, fill, dark) {
    let out = ''
    for (let i = 0; i < h; i++) {
      const inset = Math.round((h - 1 - i) * (w / 2) / h)
      out += r(x + inset, y + i, w - inset * 2, 1, i === h - 1 ? dark : fill)
    }
    return out
  }

  /* ---------- sprite từng công trình: [rộng, cao, svg] trong hệ tọa độ cục bộ ---------- */
  const SPRITES = {
    tent: () => [20, 15, roof(0, 1, 20, 12, C.roof2, C.roof2Dk) + r(8, 7, 4, 6, C.ink) + r(9, 0, 2, 2, C.woodDk) + r(0, 13, 20, 2, C.soilDk)],
    garden: () => [24, 10, r(0, 6, 24, 4, C.soil) + r(0, 9, 24, 1, C.soilDk) +
      [2, 7, 12, 17, 21].map((x, i) => r(x, 3, 1, 3, C.leafDk) + r(x - 1, 1, 3, 2, [C.flowerA, C.flowerB, C.flowerC, C.flowerA, C.flowerB][i]) + r(x, 1, 1, 1, C.white)).join('')],
    hammock: () => [26, 22, r(1, 4, 3, 18, C.woodDk) + r(22, 4, 3, 18, C.woodDk) + r(0, 0, 8, 6, C.leaf) + r(18, 0, 8, 6, C.leaf) + r(1, 1, 3, 2, C.leafDk) +
      r(4, 11, 3, 1, C.wall) + r(6, 12, 14, 2, C.flowerC) + r(8, 14, 10, 1, C.roofDk) + r(19, 11, 3, 1, C.wall)],
    teahouse: () => [24, 22, roof(0, 0, 24, 9, C.leaf, C.leafDk) + r(2, 9, 20, 13, C.wall) + r(2, 21, 20, 1, C.wallDk) + r(10, 14, 5, 8, C.wood) +
      r(4, 12, 4, 4, C.glass) + r(17, 12, 4, 4, C.glass) + r(5, 18, 3, 2, C.white) + r(8, 18, 1, 1, C.white) + r(6, 17, 1, 1, C.leafDk)],
    lantern: () => [12, 24, r(5, 6, 2, 18, C.ink) + r(2, 22, 8, 2, C.stoneDk) + r(3, 0, 6, 2, C.roofDk) + r(2, 2, 8, 6, C.gold, ' class="vl-glow"') + r(3, 3, 6, 4, '#FFF1B8') + r(3, 8, 6, 1, C.roofDk)],
    clocktower: () => [16, 32, roof(0, 0, 16, 7, C.roof, C.roofDk) + r(2, 7, 12, 25, C.stone) + r(2, 31, 12, 1, C.stoneDk) + r(4, 10, 8, 8, C.white) + r(7, 11, 2, 4, C.ink) + r(8, 14, 3, 1, C.ink) + r(6, 24, 4, 8, C.wood)],
    library: () => [28, 24, roof(0, 0, 28, 9, C.roof, C.roofDk) + r(2, 9, 24, 15, C.wall) + r(2, 23, 24, 1, C.wallDk) + r(12, 15, 5, 9, C.wood) +
      [4, 20].map(x => r(x, 12, 5, 5, C.glass) + r(x + 2, 12, 1, 5, C.wallDk)).join('') + r(19, 18, 6, 1, C.roof2) + r(19, 19, 6, 1, C.flowerB) + r(19, 20, 6, 1, C.leaf)],
    pond: () => [30, 12, r(3, 2, 24, 9, C.stone) + r(1, 4, 28, 5, C.stone) + r(4, 3, 22, 7, C.water) + r(2, 5, 26, 3, C.water) + r(7, 5, 6, 1, C.white, ' class="vl-ripple"') + r(18, 7, 4, 1, C.waterDk) + r(22, 3, 3, 2, C.leaf) + r(23, 2, 1, 1, C.flowerA)],
    observatory: () => [22, 26, r(4, 0, 14, 2, C.roofDk) + r(2, 2, 18, 8, C.roof) + r(13, 3, 6, 2, C.ink) + r(17, 1, 3, 2, C.stoneDk) + r(3, 10, 16, 16, C.stone) + r(3, 25, 16, 1, C.stoneDk) + r(9, 18, 4, 8, C.wood) + r(5, 13, 3, 3, C.glassNight)],
    cloudhouse: () => [30, 26, r(4, 18, 22, 6, C.white) + r(1, 20, 28, 5, C.white) + r(8, 16, 14, 3, C.white) + r(2, 24, 26, 2, '#E9E4FF') +
      roof(6, 0, 18, 7, C.flowerC, C.roofDk) + r(8, 7, 14, 10, C.wall) + r(13, 11, 4, 6, C.wood) + r(9, 9, 3, 3, C.glass) + r(18, 9, 3, 3, C.glass)],
    bigtree: () => [28, 34, r(12, 18, 5, 16, C.woodDk) + r(10, 31, 9, 3, C.woodDk) + r(4, 4, 20, 14, C.leaf) + r(1, 8, 26, 8, C.leaf) + r(7, 0, 14, 6, C.leaf) +
      r(5, 15, 18, 3, C.leafDk) + [6, 13, 20, 9, 17].map((x, i) => r(x, [7, 3, 9, 12, 13][i], 2, 2, [C.flowerA, C.flowerB, C.flowerC, C.flowerB, C.flowerA][i])).join('')]
  }

  /* ---------- công trình: ngưỡng TẠM theo tổng Sao (không tiêu Sao) ---------- */
  const BUILDINGS = [
    { key: 'tent', name: 'Lều khởi đầu', stars: 0, at: [86, 70], tasks: [], about: 'Mọi ngôi làng đều bắt đầu từ một chiếc lều nhỏ. Mỗi việc tốt cho giấc ngủ bạn làm sẽ giúp làng lớn thêm một chút.' },
    { key: 'garden', name: 'Vườn hoa', stars: 10, at: [112, 80], tasks: ['G-01', 'G-02', 'G-03'], about: 'Những thói quen nhỏ, đều đặn giống như tưới hoa mỗi ngày.' },
    { key: 'hammock', name: 'Võng ngủ trưa', stars: 30, at: [14, 98], tasks: ['Y-01'], about: MECHANISMS['Y-01'] },
    { key: 'teahouse', name: 'Quán trà thảo mộc', stars: 60, at: [44, 78], tasks: ['Y-02'], about: MECHANISMS['Y-02'] },
    { key: 'lantern', name: 'Đèn lồng ánh ấm', stars: 100, at: [74, 100], tasks: ['Y-03'], about: MECHANISMS['Y-03'] },
    { key: 'clocktower', name: 'Tháp đồng hồ', stars: 150, at: [150, 80], tasks: ['Y-05'], about: MECHANISMS['Y-05'] },
    { key: 'library', name: 'Thư viện tập trung', stars: 210, at: [8, 78], tasks: ['Y-04', 'R-05'], about: `${MECHANISMS['Y-04']} ${MECHANISMS['R-05']}` },
    { key: 'pond', name: 'Hồ thở', stars: 280, at: [124, 108], tasks: ['R-03'], about: MECHANISMS['R-03'] },
    { key: 'observatory', name: 'Đài ngắm sao', stars: 360, at: [166, 102], tasks: ['R-02'], about: MECHANISMS['R-02'] },
    { key: 'cloudhouse', name: 'Nhà mây', stars: 450, at: [156, 32], tasks: ['R-04'], about: MECHANISMS['R-04'] },
    { key: 'bigtree', name: 'Cây cổ thụ', stars: 550, at: [40, 104], tasks: ['R-01'], about: MECHANISMS['R-01'] }
  ]

  /* ---------- nhân vật tùy chỉnh (pixel, luôn vui vẻ) ----------
     Chỉ số bộ phận phải khớp AVATAR_LIMITS trong backend/src/services/reward.js. Không có chữ tự do hay ảnh. */
  const AVATAR_PARTS = {
    skin: { label: 'Màu da', colors: ['#FCE0C8', '#F7D2B6', '#E8B48A', '#C68B5E', '#8D5A3B'] },
    hair: { label: 'Màu tóc', colors: ['#5B4636', '#2B2433', '#C9772B', '#E8C26B', '#8B5CF6', '#E86E8F', '#9AA5B1'] },
    style: { label: 'Kiểu tóc', names: ['Tóc ngắn', 'Tóc dài', 'Búi tóc', 'Tóc xoăn'] },
    shirt: { label: 'Màu áo', colors: ['#8B7CF6', '#F59E8B', '#6FBF73', '#5BB5E8', '#FFD36E', '#E86E8F', '#4C4F7A', '#FFFFFF'] },
    hat: { label: 'Phụ kiện', names: ['Không đội', 'Mũ len', 'Mũ lưỡi trai', 'Vòng hoa'] }
  }
  const DEFAULT_AVATAR = { skin: 1, hair: 0, style: 0, shirt: 0, hat: 0 }
  function cleanAvatar(input) {
    const out = { ...DEFAULT_AVATAR }
    for (const key of Object.keys(AVATAR_PARTS)) {
      const limit = (AVATAR_PARTS[key].colors || AVATAR_PARTS[key].names).length
      if (Number.isInteger(input?.[key]) && input[key] >= 0 && input[key] < limit) out[key] = input[key]
    }
    return out
  }
  /** Phần thân nhân vật trong hệ tọa độ 12x17 (có thể vẽ lên phía trên y = 0 cho búi tóc/mũ). */
  function heroBody(avatar) {
    const a = cleanAvatar(avatar), skin = AVATAR_PARTS.skin.colors[a.skin], hair = AVATAR_PARTS.hair.colors[a.hair], shirt = AVATAR_PARTS.shirt.colors[a.shirt]
    const hairBack = a.style === 1 ? r(1, 3, 10, 8, hair) : ''
    const hairTop = [
      r(3, 0, 6, 2, hair) + r(2, 1, 8, 2, hair) + r(2, 3, 1, 2, hair) + r(9, 3, 1, 2, hair),
      r(3, 0, 6, 2, hair) + r(2, 1, 8, 2, hair) + r(1, 3, 2, 7, hair) + r(9, 3, 2, 7, hair),
      r(3, 0, 6, 2, hair) + r(2, 1, 8, 2, hair) + r(2, 3, 1, 2, hair) + r(9, 3, 1, 2, hair) + r(4, -2, 4, 2, hair) + r(5, -3, 2, 1, hair),
      r(2, 0, 8, 2, hair) + r(1, 1, 10, 3, hair) + r(1, 4, 2, 3, hair) + r(9, 4, 2, 3, hair)
    ][a.style]
    const hat = [
      '',
      r(2, 0, 8, 3, '#F59E8B') + r(2, 2, 8, 1, '#FFFFFF') + r(5, -1, 2, 1, '#FFFFFF'),
      r(2, 0, 8, 3, '#5B8DEF') + r(1, 3, 7, 1, '#3E6ACD') + r(2, 0, 8, 1, '#7BA3F5'),
      r(2, 1, 8, 1, C.leaf) + r(3, 0, 1, 1, C.flowerA) + r(5, 0, 1, 1, C.flowerB) + r(7, 0, 1, 1, C.flowerC) + r(9, 1, 1, 1, C.flowerA)
    ][a.hat]
    return hairBack + r(2, 3, 8, 5, skin) + hairTop + r(4, 5, 1, 1, C.ink) + r(7, 5, 1, 1, C.ink) + r(3, 6, 1, 1, C.cheek) + r(8, 6, 1, 1, C.cheek) + r(5, 7, 2, 1, C.roof2Dk) + hat +
      r(2, 8, 8, 5, shirt) + r(1, 9, 1, 3, skin) + r(10, 9, 1, 3, skin) + r(5, 9, 2, 1, shirt === '#FFFFFF' ? C.wallDk : C.white) +
      r(3, 13, 2, 3, C.pants) + r(7, 13, 2, 3, C.pants) + r(2, 16, 3, 1, C.ink) + r(7, 16, 3, 1, C.ink)
  }
  function hero(x, y, avatar) {
    return `<g transform="translate(${x} ${y})"><ellipse cx="6" cy="17.4" rx="6" ry="1.2" fill="#000" opacity=".12"/><g class="vl-hero">${heroBody(avatar)}</g></g>`
  }
  /** Hình xem trước độc lập (thẻ HUD và màn hình tùy chỉnh). */
  function avatarSvg(avatar, label = 'Nhân vật của bạn') {
    return `<svg class="vl-avatar" viewBox="-1 -4 14 22" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}">${heroBody(avatar)}</svg>`
  }
  /* ---------- bạn đồng hành pixel theo loài đã chọn (màu khớp frontend/js/pet.js), luôn vui vẻ ---------- */
  const PET_LOOK = {
    cat: { body: '#C9C6E3', dark: '#A9A5CF', light: '#E6E4F4' },
    bunny: { body: '#F2DCE8', dark: '#DDB8CB', light: '#FFF0F6' },
    fox: { body: '#F6B68F', dark: '#E08F5F', light: '#FFF3E8' },
    bear: { body: '#CFAE9A', dark: '#A98670', light: '#EAD5C6' }
  }
  function companionBody(species) {
    const kind = PET_LOOK[species] ? species : 'cat', p = PET_LOOK[kind]
    const ears = {
      cat: r(0, 0, 2, 2, p.body) + r(5, 0, 2, 2, p.body),
      bunny: r(1, -4, 2, 5, p.body) + r(4, -4, 2, 5, p.body) + r(1.5, -3, 1, 3, C.cheek) + r(4.5, -3, 1, 3, C.cheek),
      fox: r(0, -1, 2, 3, p.body) + r(5, -1, 2, 3, p.body) + r(0, -1, 1, 1, C.ink) + r(6, -1, 1, 1, C.ink),
      bear: r(-0.5, 0, 2.5, 2, p.dark) + r(5, 0, 2.5, 2, p.dark)
    }[kind]
    const tail = {
      cat: r(9, 4, 1, 3, p.dark),
      bunny: r(9, 6, 2, 2, C.white),
      fox: r(9, 3, 2, 4, p.body) + r(10, 2, 1, 2, C.white),
      bear: r(9, 6, 1, 1, p.dark)
    }[kind]
    const muzzle = kind === 'cat' ? '' : r(2, 4, 3, 2, p.light)
    return ears + tail + r(0, 1, 7, 5, p.body) + muzzle + r(2, 3, 1, 1, C.ink) + r(4, 3, 1, 1, C.ink) + r(1, 4, 1, 1, C.cheek) + r(5, 4, 1, 1, C.cheek) +
      r(3, 5, 1, 0.6, C.ink) + r(1, 6, 8, 3, p.body) + r(2, 7, 4, 1.5, p.light) + r(1, 9, 1, 1, p.dark) + r(7, 9, 1, 1, p.dark)
  }
  function companion(x, y, species) {
    return `<g transform="translate(${x} ${y})"><ellipse cx="5" cy="10.3" rx="5" ry="1" fill="#000" opacity=".12"/><g class="vl-cat">${companionBody(species)}</g></g>`
  }
  function cat(x, y) {
    const body = r(0, 0, 2, 2, C.roof2) + r(5, 0, 2, 2, C.roof2) + r(0, 1, 7, 5, C.roof2) + r(2, 3, 1, 1, C.ink) + r(4, 3, 1, 1, C.ink) + r(1, 4, 1, 1, C.cheek) + r(5, 4, 1, 1, C.cheek) +
      r(1, 6, 8, 3, C.roof2) + r(9, 4, 1, 3, C.roof2Dk) + r(1, 9, 1, 1, C.roof2Dk) + r(7, 9, 1, 1, C.roof2Dk)
    return `<g transform="translate(${x} ${y})"><ellipse cx="5" cy="10.3" rx="5" ry="1" fill="#000" opacity=".12"/><g class="vl-cat">${body}</g></g>`
  }

  /** Đĩa tròn pixel (mặt trời / mặt trăng). */
  function disc(cx, cy, rad, fill) {
    let out = ''
    for (let y = -rad; y < rad; y++) {
      const half = Math.round(Math.sqrt(rad * rad - (y + 0.5) * (y + 0.5)))
      out += r(cx - half, cy + y, half * 2, 1, fill)
    }
    return out
  }

  function sky(night) {
    if (!night) return r(0, 0, 192, 60, '#CFE8FF') + r(0, 40, 192, 20, '#E4F1FF') +
      `<g class="vl-cloud">${r(20, 12, 18, 4, C.white)}${r(24, 9, 10, 3, C.white)}</g><g class="vl-cloud vl-cloud2">${r(120, 18, 22, 4, C.white)}${r(126, 15, 10, 3, C.white)}</g>` +
      disc(176, 14, 6, C.gold)
    const stars = [[12, 8], [34, 20], [58, 6], [80, 16], [104, 9], [130, 22], [146, 6], [178, 26], [70, 30], [20, 34]]
    return r(0, 0, 192, 60, '#2E2A55') + r(0, 40, 192, 20, '#3D3870') +
      stars.map(([x, y], i) => r(x, y, 1, 1, C.white, ` class="vl-star" style="animation-delay:${(i % 5) * 0.6}s"`)).join('') +
      disc(176, 14, 6, '#FFF1B8') + disc(179, 12, 6, '#2E2A55')
  }

  function ground() {
    return r(0, 52, 192, 76, C.grass) + r(0, 52, 192, 2, C.grassLt) + r(0, 58, 192, 1, C.grassDk) +
      [[20, 66], [60, 90], [140, 70], [100, 118], [176, 96], [30, 120], [150, 124], [8, 92]].map(([x, y]) => r(x, y, 2, 1, C.grassDk) + r(x + 1, y - 1, 1, 1, C.grassDk)).join('') +
      // lối đi đá dẫn tới lều
      [[92, 88], [90, 94], [94, 100], [91, 106], [95, 112], [92, 118]].map(([x, y]) => r(x, y, 5, 3, C.stone) + r(x, y + 2, 5, 1, C.stoneDk)).join('')
  }

  function plot(x, baseline, w) {
    // nền đất chờ xây: trung tính, không mang nghĩa "bị bỏ hoang"
    return `<g class="vl-plot">${r(x, baseline - 4, w, 4, C.soil)}${r(x, baseline - 1, w, 1, C.soilDk)}${r(x + Math.floor(w / 2) - 1, baseline - 10, 2, 7, C.wood)}${r(x + Math.floor(w / 2) - 4, baseline - 12, 8, 4, C.wall)}${r(x + Math.floor(w / 2) - 3, baseline - 11, 6, 1, C.soilDk)}</g>`
  }

  /** Cảnh làng. interactive = true: công trình, nền đất, nhân vật và thú cưng là nút bấm được (bàn phím + chuột + chạm). */
  function scene(state, { night = false, fresh = new Set(), interactive = false } = {}) {
    const hit = (attrs, label) => interactive ? ` ${attrs} role="button" tabindex="0" aria-label="${esc(label)}"` : ''
    const placed = [...BUILDINGS].sort((a, b) => a.at[1] - b.at[1]).map(b => {
      const [w, h, art] = SPRITES[b.key]()
      const [x, base] = b.at
      if (state.stars < b.stars) return b.key === 'cloudhouse' ? '' : `<g class="vl-hit vl-hit-plot"${hit(`data-building="${b.key}"`, `Nền đất chờ xây ${b.name}, mở ở ${b.stars} sao`)}>${plot(x, base, Math.min(w, 20))}</g>`
      const glow = night && ['teahouse', 'library', 'observatory', 'cloudhouse'].includes(b.key) ? ' vl-night' : ''
      return `<g class="vl-b vl-hit${fresh.has(b.key) ? ' vl-new' : ''}${glow}" transform="translate(${x} ${base - h})"${hit(`data-building="${b.key}"`, `${b.name}, đã xây. Nhấn để xem`)}><ellipse cx="${w / 2}" cy="${h}" rx="${w / 2}" ry="1.3" fill="#000" opacity=".10"/>${art}</g>`
    }).join('')
    const who = `<g class="vl-hit vl-hit-hero"${hit('data-hero', 'Nhân vật của bạn. Nhấn để tùy chỉnh')}>${hero(98, 104, state.avatar)}</g><g class="vl-hit vl-hit-pet"${hit('data-pet-sprite', 'Bạn đồng hành. Nhấn để chọn bạn đồng hành')}>${companion(112, 112, state.pet)}</g>`
    return `<svg class="vl-scene${night ? ' is-night' : ''}" viewBox="0 0 192 128" shape-rendering="crispEdges" ${interactive ? `role="group" aria-label="${esc(sceneLabel(state))}"` : `role="img" aria-label="${esc(sceneLabel(state))}"`} preserveAspectRatio="${interactive ? 'xMidYMax slice' : 'xMidYMid meet'}">
      ${sky(night)}${ground()}${placed}${who}</svg>`
  }

  const unlockedOf = stars => BUILDINGS.filter(b => stars >= b.stars)
  const nextOf = stars => BUILDINGS.find(b => stars < b.stars) || null
  /** Cấp làng = số công trình đã xây (chỉ hiển thị, không phải nguồn Sao mới). */
  const levelOf = stars => unlockedOf(stars).length
  function sceneLabel(state) {
    const built = unlockedOf(state.stars).map(b => b.name).join(', ')
    return `Làng nhỏ của bạn có: ${built}. Bạn và mèo nhỏ đang vui vẻ dạo quanh làng.`
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))

  /** Lời chào của nhân vật: chỉ tích cực hoặc trung tính, không bao giờ trách móc. */
  function greeting(state, hour) {
    if (!state.completions) return 'Chào bạn! Làng nhỏ đang chờ bạn cùng xây. Mỗi việc nhỏ tốt cho giấc ngủ sẽ thêm một mảnh cho làng.'
    if (hour >= 21 || hour < 5) return 'Trời tối rồi, đèn trong làng đã sáng ấm. Chúc bạn một giấc ngủ êm.'
    if (hour < 11) return 'Chào buổi sáng! Hôm nay mình cùng làm một việc nhỏ nhé, hoặc chỉ ghé chơi cũng được.'
    return 'Rất vui được gặp lại bạn! Làng vẫn luôn ở đây, không có gì thay đổi khi bạn đi vắng.'
  }

  window.Village = { MECHANISMS, BUILDINGS, AVATAR_PARTS, DEFAULT_AVATAR, cleanAvatar, avatarSvg, scene, unlockedOf, nextOf, levelOf, greeting, mechanismFor: code => MECHANISMS[code] || '' }
})()
