/* Nội dung thế giới 3D: NGUỒN DUY NHẤT cho tên bản đồ, ngưỡng mở, kho báu và điều kiện trùm.
   Toàn bộ là GIÁ TRỊ THỬ NGHIỆM, cần người có thẩm quyền xác nhận trước khi dùng chính thức.
   Quy tắc: không thưởng Sao, không ngẫu nhiên, không có đồ hiếm; ngưỡng dựa trên tổng Sao và số việc đã làm,
   không bao giờ dựa trên nhóm hay kết quả khảo sát. Vị trí trong cảnh nằm ở frontend/js/world3d/maps/. */

export const WORLD_MAPS = Object.freeze([
  {
    id: 'meadow', name: 'Làng Khởi Đầu', stars: 0,
    treasures: [
      { key: 'meadow_dew', name: 'Giọt sương sớm' }, { key: 'meadow_clover', name: 'Cỏ bốn lá' },
      { key: 'meadow_acorn', name: 'Hạt dẻ ấm' }, { key: 'meadow_shell', name: 'Vỏ ốc nhỏ' }
    ],
    guardian: { key: 'keep_cloud', name: 'Mây Ngái Ngủ', game: 'breath', goal: 4, completions: 5, keepsake: 'Chiếc gối mây' }
  },
  {
    id: 'forest', name: 'Rừng Đèn Lồng', stars: 100,
    treasures: [
      { key: 'forest_firefly', name: 'Lọ đom đóm' }, { key: 'forest_feather', name: 'Lông vũ mềm' },
      { key: 'forest_pine', name: 'Quả thông thơm' }, { key: 'forest_ribbon', name: 'Dải ruy băng' }
    ],
    guardian: { key: 'keep_owl', name: 'Cú Thao Thức', game: 'order', goal: 5, completions: 15, keepsake: 'Đèn lồng của Cú' }
  },
  {
    id: 'sky', name: 'Hồ Trên Mây', stars: 280,
    treasures: [
      { key: 'sky_pearl', name: 'Ngọc trai mây' }, { key: 'sky_star', name: 'Mảnh sao giấy' },
      { key: 'sky_lotus', name: 'Hoa sen trời' }, { key: 'sky_bell', name: 'Chuông gió' }
    ],
    guardian: { key: 'keep_dragon', name: 'Rồng Sương', game: 'orbs', goal: 5, completions: 30, keepsake: 'Vảy sương lấp lánh' }
  }
])

/** Tìm vật phẩm theo khóa trong danh sách cho phép. Trả { map, kind: 'treasure'|'keepsake', item } hoặc null. */
export function findWorldItem(key) {
  for (const map of WORLD_MAPS) {
    if (map.guardian.key === key) return { map, kind: 'keepsake', item: map.guardian }
    const item = map.treasures.find(entry => entry.key === key)
    if (item) return { map, kind: 'treasure', item }
  }
  return null
}

/** Bản đồ đã mở: đủ Sao, hoặc đã từng nhặt đồ ở đó (Sao giảm do dữ liệu bị xóa không khóa lại nơi đã đến). */
export function isMapOpen(map, stars, found) {
  return stars >= map.stars || map.guardian.key && found.has(map.guardian.key) || map.treasures.some(item => found.has(item.key))
}

export const isGuardianAwake = (map, stars, completions, found) => isMapOpen(map, stars, found) && completions >= map.guardian.completions

/** Trạng thái thế giới của một học sinh, tính từ dữ liệu máy chủ đã có. */
export function describeWorld(stars, completions, found = new Set()) {
  return WORLD_MAPS.map(map => ({
    id: map.id, name: map.name, stars: map.stars, open: Boolean(isMapOpen(map, stars, found)),
    treasures: map.treasures.map(item => ({ ...item, found: found.has(item.key) })),
    guardian: {
      ...map.guardian,
      awake: Boolean(isGuardianAwake(map, stars, completions, found)),
      calmed: found.has(map.guardian.key)
    }
  }))
}
