/* Dựng mô hình va chạm của một bản đồ từ dữ liệu bố cục (maps/*.js). Thuần, không import three.js.
   Mặt đất = hợp các vùng chữ nhật (areas); "holes" là nước/khoảng trống; "solids" là vật chắn nâng độ cao. */

export const BUILDING_SIZE = Object.freeze({
  tent: { hx: 1.9, hz: 1.4, h: 3 }, garden: { hx: 2.4, hz: 0.9, h: 0.4 }, hammock: { hx: 2.6, hz: 0.5, h: 3 }, teahouse: { hx: 2.4, hz: 1.4, h: 4 },
  lantern: { hx: 0.6, hz: 0.6, h: 4 }, clocktower: { hx: 1.6, hz: 1.1, h: 6 }, library: { hx: 2.8, hz: 1.6, h: 4.6 },
  pond: { hx: 3, hz: 2.4, h: 0.15 }, observatory: { hx: 2.2, hz: 1.4, h: 5 }, cloudhouse: { hx: 2.4, hz: 1.4, h: 4 }, bigtree: { hx: 1.2, hz: 1.2, h: 6 }
})

const inRect = (x, z, a) => x >= a.x1 && x <= a.x2 && z >= a.z1 && z <= a.z2

/** @param built Set các khóa công trình đã xây (đủ Sao). Công trình chưa xây chỉ là nền đất thấp. */
export function createWorld(map, built = new Set()) {
  const solids = []
  for (const [key, at] of Object.entries(map.buildings)) {
    const size = BUILDING_SIZE[key]
    if (built.has(key)) solids.push({ x: at.x, z: at.z, hx: size.hx, hz: size.hz, h: (at.y ?? 0) + size.h })
  }
  for (const tree of map.trees || []) solids.push({ x: tree.x, z: tree.z, hx: 0.45, hz: 0.45, h: (tree.y ?? 0) + 4 })
  for (const npc of map.npcs) solids.push({ x: npc.x, z: npc.z, hx: 0.35, hz: 0.35, h: (npc.y ?? 0) + 2 })
  solids.push({ x: map.board.x, z: map.board.z, hx: 1.1, hz: 0.25, h: (map.board.y ?? 0) + 2.4 })
  solids.push({ x: map.guardian.x, z: map.guardian.z, hx: 1.2, hz: 1.2, h: (map.guardian.y ?? 0) + 3 })

  function terrainAt(x, z) {
    if ((map.holes || []).some(hole => Math.hypot(x - hole.x, z - hole.z) < hole.r)) return null
    let height = null
    for (const area of map.areas) if (inRect(x, z, area) && (height === null || area.h > height)) height = area.h
    return height
  }
  function heightAt(x, z) {
    let height = terrainAt(x, z)
    if (height === null) return null
    for (const solid of solids) if (Math.abs(x - solid.x) <= solid.hx && Math.abs(z - solid.z) <= solid.hz && solid.h > height) height = solid.h
    return height
  }

  const at = (point, extra) => ({ ...extra, x: point.x, z: point.z, y: terrainAt(point.x, point.z) ?? 0 })
  const targets = [
    ...Object.entries(map.buildings).map(([key, point]) => {
      const size = BUILDING_SIZE[key]
      return at(point, { kind: 'building', arg: key, radius: Math.max(size.hx, size.hz) + 1.4 })
    }),
    at(map.board, { kind: 'quests', arg: null, radius: 2.4, label: 'Bảng việc hôm nay' }),
    at(map.portal, { kind: 'map', arg: null, radius: 2, label: 'Cổng bản đồ' }),
    at(map.guardian, { kind: 'guardian', arg: map.id, radius: 3.2 }),
    ...map.npcs.map(npc => at(npc, { kind: 'npc', arg: npc.id, radius: 2, label: npc.name, codes: npc.codes }))
  ]

  return { map, solids, targets, heightAt, terrainAt }
}

/** Vị trí đặt kho báu/đốm sương: đứng trên mặt đất của bản đồ. */
export const itemPoint = (world, point) => ({ x: point.x, z: point.z, y: world.terrainAt(point.x, point.z) ?? 0 })
