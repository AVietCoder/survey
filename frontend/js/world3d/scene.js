/* Dựng cảnh three.js cho một bản đồ: mặt đất, trang trí, công trình, nhân vật phụ, trùm, kho báu.
   Mọi hình đều tạo trong mã, không tải gì. Trang trí đặt theo hàm băm cố định (không ngẫu nhiên giữa các lần). */
import * as THREE from '../../vendor/three/three.module.js'
import { Blocks, buildingModel, characterModel } from './voxel.js'
import { BUILDING_SIZE, itemPoint } from './world.js'

const hash = (x, z) => { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n) }
const pick = (list, x, z) => list[Math.floor(hash(x, z) * list.length) % list.length]

function ground(blocks, world, low) {
  const { map } = world, theme = map.theme
  const inHole = (x, z) => (map.holes || []).some(hole => Math.hypot(x - hole.x, z - hole.z) < hole.r)
  for (const area of map.areas) {
    const base = theme.floating ? -1.6 : -1
    const holed = area.h === 0 && (map.holes || []).length
    const soilTop = area.h - (holed ? 0.6 : 0.45)
    blocks.add((area.x1 + area.x2) / 2, (base + soilTop) / 2, (area.z1 + area.z2) / 2, area.x2 - area.x1, soilTop - base, area.z2 - area.z1, theme.side)
    if (theme.floating && area.h === 0) blocks.add((area.x1 + area.x2) / 2, base - 0.7, (area.z1 + area.z2) / 2, (area.x2 - area.x1) * 0.62, 1.4, (area.z2 - area.z1) * 0.62, '#9F8CC4')
    for (let x = area.x1; x < area.x2 - 1e-6; x += 1) for (let z = area.z1; z < area.z2 - 1e-6; z += 1) {
      const w = Math.min(1, area.x2 - x), d = Math.min(1, area.z2 - z), cx = x + w / 2, cz = z + d / 2
      if (world.terrainAt(cx, cz) !== area.h) { if (area.h === 0 && inHole(cx, cz)) blocks.add(cx, -0.45, cz, w, 0.3, d, hash(cx, cz) > 0.8 ? '#BFE9FF' : '#8FD3F4'); continue }
      blocks.add(cx, area.h - 0.075, cz, w, 0.15, d, pick(theme.grass, cx, cz))
      blocks.add(cx, area.h - 0.3, cz, w, 0.3, d, theme.side)
      if (!low && hash(cz, cx) > 0.9) {                     // hoa và cỏ nhỏ
        const fx = cx + (hash(cx, 1) - 0.5) * 0.6, fz = cz + (hash(1, cz) - 0.5) * 0.6
        blocks.add(fx, area.h + 0.12, fz, 0.06, 0.24, 0.06, theme.leaf[0]).add(fx, area.h + 0.27, fz, 0.18, 0.12, 0.18, pick(theme.flowers, fz, fx), theme.light < 0.9)
      }
    }
  }
}

function backdrop(blocks, map, low) {
  const night = map.theme.light < 0.9
  if (!map.theme.floating) {
    blocks.add(0, -1.6, 0, 130, 1, 130, map.theme.grass[1])
    const edge = map.areas[0]                               // hàng rào ở mép đi được, rặng đồi phía xa
    for (let x = edge.x1; x <= edge.x2; x += 1.5) for (const z of [edge.z1 - 0.3, edge.z2 + 0.3]) blocks.add(x, 0.35, z, 0.2, 0.7, 0.2, '#B98563').add(x + 0.75, 0.5, z, 1.5, 0.12, 0.08, '#D9A97F')
    for (let z = edge.z1; z <= edge.z2; z += 1.5) for (const x of [edge.x1 - 0.3, edge.x2 + 0.3]) blocks.add(x, 0.35, z, 0.2, 0.7, 0.2, '#B98563').add(x, 0.5, z + 0.75, 0.08, 0.12, 1.5, '#D9A97F')
    for (let i = 0; i < (low ? 10 : 24); i++) {
      const angle = i / (low ? 10 : 24) * Math.PI * 2, r = 32 + hash(i, 2) * 8, h = 3 + hash(2, i) * 6
      blocks.add(Math.cos(angle) * r, h / 2 - 1, Math.sin(angle) * r, 8, h, 8, pick(map.theme.leaf, i, 5))
      blocks.add(Math.cos(angle) * r, h - 0.5, Math.sin(angle) * r, 5, 1.2, 5, pick(map.theme.leaf, 5, i))
    }
  }
  for (let i = 0; i < (low ? 8 : 18); i++) {                 // mây; ở bản đồ trên mây có cả mây phía dưới
    const x = (hash(i, 7) - 0.5) * 80, z = (hash(7, i) - 0.5) * 80
    const y = map.theme.floating && i % 2 ? -7 - hash(i, i) * 4 : 14 + hash(i, 3) * 6
    const color = night ? '#4A447C' : '#FFFFFF'
    blocks.add(x, y, z, 5, 1.2, 3, color, true).add(x + 1.5, y + 0.8, z, 2.6, 1, 2, color, true).add(x - 1.6, y + 0.5, z + 0.4, 2, 0.8, 2, color, true)
  }
  if (night) for (let i = 0; i < (low ? 40 : 90); i++) blocks.add((hash(i, 11) - 0.5) * 90, 18 + hash(11, i) * 18, (hash(i, 13) - 0.5) * 90, 0.18, 0.18, 0.18, '#FFF1B8', true)
}

function props(blocks, world) {
  const { map, terrainAt } = world
  for (const tree of map.trees || []) {
    const y = terrainAt(tree.x, tree.z) ?? 0, leaf = map.theme.leaf
    blocks.add(tree.x, y + 1, tree.z, 0.55, 2, 0.55, '#8E6248')
    blocks.add(tree.x, y + 2.5, tree.z, 2.2, 1.1, 2.2, leaf[0]).add(tree.x + 0.2, y + 3.4, tree.z - 0.1, 1.5, 0.8, 1.5, leaf[1]).add(tree.x - 0.1, y + 4, tree.z, 0.8, 0.5, 0.8, leaf[0])
  }
  for (const rock of map.rocks || []) { const y = terrainAt(rock.x, rock.z) ?? 0; blocks.add(rock.x, y + 0.12, rock.z, 0.7, 0.24, 0.55, '#CFC8D8').add(rock.x + 0.15, y + 0.3, rock.z, 0.35, 0.2, 0.3, '#A9A1B8') }
  for (const lamp of map.lamps || []) { const y = terrainAt(lamp.x, lamp.z) ?? 0; blocks.add(lamp.x, y + 0.7, lamp.z, 0.14, 1.4, 0.14, '#3A3550').add(lamp.x, y + 1.6, lamp.z, 0.5, 0.45, 0.5, '#FFD36E', true).add(lamp.x, y + 1.9, lamp.z, 0.62, 0.12, 0.62, '#6D5DD3') }
  for (const [x, z] of map.path || []) { const y = terrainAt(x, z); if (y !== null) blocks.add(x + (hash(x, z) - 0.5) * 0.5, y + 0.03, z, 0.9, 0.06, 0.7, '#E7DFC9') }
}

function plot(blocks, key, x, y, z) {
  const size = BUILDING_SIZE[key]
  blocks.add(x, y + 0.08, z, size.hx * 1.5, 0.16, size.hz * 1.5, '#C9A27E')
  blocks.add(x, y + 0.6, z, 0.16, 1, 0.16, '#B98563').add(x, y + 1.15, z, 1.1, 0.6, 0.12, '#FFF6E8').add(x, y + 1.15, z + 0.08, 0.7, 0.1, 0.04, '#A9835F')
}

function board(blocks, at) {
  const { x, y, z } = at
  blocks.add(x - 0.9, y + 0.8, z, 0.18, 1.6, 0.18, '#8E6248').add(x + 0.9, y + 0.8, z, 0.18, 1.6, 0.18, '#8E6248')
    .add(x, y + 1.5, z, 2.2, 1.2, 0.16, '#B98563').add(x, y + 2.2, z, 2.4, 0.22, 0.35, '#6D5DD3')
  for (const [dx, dy, color] of [[-0.62, 0.25, '#FFF6E8'], [0.02, 0.18, '#FFD36E'], [0.64, 0.28, '#F6A8B8'], [-0.3, -0.25, '#BFE3FF'], [0.35, -0.28, '#FFF6E8']]) blocks.add(x + dx, y + 1.5 + dy, z + 0.1, 0.45, 0.34, 0.05, color)
}

function portal(blocks, at) {
  const { x, y, z } = at
  for (const side of [-1.1, 1.1]) for (let i = 0; i < 4; i++) blocks.add(x + side, y + 0.35 + i * 0.7, z, 0.6, 0.68, 0.6, i % 2 ? '#8B7CF6' : '#6D5DD3')
  blocks.add(x, y + 3.15, z, 2.8, 0.55, 0.65, '#8B7CF6').add(x, y + 3.55, z, 0.5, 0.35, 0.5, '#FFD36E', true)
  for (let i = 0; i < 5; i++) blocks.add(x + (hash(i, 1) - 0.5) * 1.2, y + 0.5 + i * 0.5, z, 0.22, 0.22, 0.12, '#D9CCFF', true)
}

/** Trùm: luôn hiền. state: 'asleep' (nhắm mắt, ngủ ngon) | 'awake' (mở mắt, chờ bạn) | 'calm' (cười, có tim). */
export function guardianModel(look, state) {
  const blocks = new Blocks(), ink = '#3A3550', cheek = '#F6A8B8'
  const eyes = (y, z, gap, size) => {
    for (const x of [-gap, gap]) {
      if (state === 'awake') blocks.add(x, y, z, size, size * 1.3, 0.08, ink).add(x - size * 0.2, y + size * 0.3, z + 0.05, size * 0.3, size * 0.3, 0.04, '#FFFFFF', true)
      else if (state === 'calm') blocks.add(x, y + size * 0.3, z, size, size * 0.3, 0.08, ink).add(x - size * 0.5, y, z, size * 0.3, size * 0.4, 0.08, ink).add(x + size * 0.5, y, z, size * 0.3, size * 0.4, 0.08, ink)
      else blocks.add(x, y, z, size * 1.3, size * 0.25, 0.08, ink)
    }
  }
  if (look === 'cloud') {
    blocks.add(0, 1.5, 0, 2.4, 1.4, 1.6, '#FFFFFF').add(-1.2, 1.3, 0, 1, 1, 1.2, '#F4F1FF').add(1.2, 1.35, 0, 1.1, 1.1, 1.2, '#F4F1FF').add(0.2, 2.4, 0, 1.4, 0.8, 1.2, '#FFFFFF').add(-0.6, 2.2, 0.1, 0.9, 0.7, 1, '#EDE8FF')
    eyes(1.6, 0.84, 0.5, 0.28)
    blocks.add(-0.85, 1.25, 0.83, 0.26, 0.16, 0.06, cheek).add(0.85, 1.25, 0.83, 0.26, 0.16, 0.06, cheek).add(0, 1.22, 0.84, 0.28, 0.12, 0.06, ink)
    blocks.add(0.5, 3, 0, 0.9, 0.35, 0.9, '#8B7CF6').add(0.9, 3.25, 0, 0.25, 0.25, 0.25, '#FFD36E', true)
  } else if (look === 'owl') {
    blocks.add(0, 1.2, 0, 2, 2, 1.6, '#A98670').add(0, 0.95, 0.55, 1.3, 1.3, 0.6, '#EAD5C6').add(0, 2.4, 0, 2.2, 0.8, 1.7, '#CFAE9A').add(-0.9, 3, 0, 0.45, 0.6, 0.5, '#8E6248').add(0.9, 3, 0, 0.45, 0.6, 0.5, '#8E6248')
    blocks.add(-0.5, 2.35, 0.84, 0.75, 0.75, 0.08, '#FFF6E8').add(0.5, 2.35, 0.84, 0.75, 0.75, 0.08, '#FFF6E8')
    eyes(2.35, 0.93, 0.5, 0.34)
    blocks.add(0, 1.95, 0.95, 0.3, 0.28, 0.25, '#FFB347').add(-1.15, 1.2, 0, 0.35, 1.4, 1, '#8E6248').add(1.15, 1.2, 0, 0.35, 1.4, 1, '#8E6248').add(-0.45, 0.12, 0.6, 0.4, 0.24, 0.5, '#FFB347').add(0.45, 0.12, 0.6, 0.4, 0.24, 0.5, '#FFB347')
  } else {
    for (const [x, y, z, s] of [[1.7, 0.5, -0.5, 0.7], [1.1, 0.6, -0.9, 0.9], [0.3, 0.7, -1, 1.1]]) blocks.add(x, y, z, s, s, s, '#8FE0CF').add(x, y + s * 0.6, z, s * 0.35, s * 0.35, s * 0.35, '#FFD36E')
    blocks.add(-0.3, 0.9, -0.4, 1.4, 1.3, 1.3, '#9BE8D8').add(-0.3, 2.1, 0.1, 1.7, 1.35, 1.4, '#A9F0E0').add(-0.3, 1.75, 0.9, 1.1, 0.6, 0.45, '#E6FFF8')
    eyes(2.35, 0.84, 0.42, 0.28)
    blocks.add(-1.0, 1.95, 0.83, 0.22, 0.14, 0.06, cheek).add(0.4, 1.95, 0.83, 0.22, 0.14, 0.06, cheek).add(-0.55, 1.85, 1.15, 0.1, 0.1, 0.06, ink).add(-0.05, 1.85, 1.15, 0.1, 0.1, 0.06, ink)
    blocks.add(-0.9, 3.05, 0, 0.22, 0.55, 0.22, '#FFD36E').add(0.3, 3.05, 0, 0.22, 0.55, 0.22, '#FFD36E').add(-1.5, 1.7, -0.5, 0.9, 0.9, 0.2, '#D9CCFF').add(0.95, 1.9, -0.5, 0.9, 0.9, 0.2, '#D9CCFF')
  }
  if (state === 'asleep') blocks.add(1.5, 3.1, 0.3, 0.36, 0.08, 0.08, '#FFFFFF', true).add(1.5, 2.96, 0.3, 0.08, 0.2, 0.08, '#FFFFFF', true).add(1.5, 2.84, 0.3, 0.36, 0.08, 0.08, '#FFFFFF', true)
  if (state === 'calm') for (const [x, y] of [[-1.6, 3], [1.7, 2.7]]) blocks.add(x, y, 0.4, 0.3, 0.22, 0.12, '#F27C9E', true).add(x, y - 0.18, 0.4, 0.16, 0.14, 0.12, '#F27C9E', true).add(x - 0.1, y + 0.14, 0.4, 0.12, 0.1, 0.12, '#F27C9E', true).add(x + 0.1, y + 0.14, 0.4, 0.12, 0.1, 0.12, '#F27C9E', true)
  return blocks.build()
}

const TREASURE_COLORS = ['#FFD36E', '#8FE0CF', '#F6A8B8', '#BFE3FF']

function sparkle(color, size) {
  return new Blocks().add(0, 0, 0, size, size, size, color, true).add(0, size * 0.85, 0, size * 0.35, size * 0.35, size * 0.35, '#FFFFFF', true)
    .add(size * 0.85, 0, 0, size * 0.3, size * 0.3, size * 0.3, color, true).add(-size * 0.85, 0, 0, size * 0.3, size * 0.3, size * 0.3, color, true).build()
}

/** Dấu thoi bay trên đầu nơi tương tác được, để biết chỗ bấm. */
function marker(color) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color }))
  return mesh
}

/** @returns {{group, floaters, treasures: Map, orbs: [], guardian}} floaters: vật nhấp nhô/xoay nhẹ. */
export function buildScene(world, { art, built, maps, collecting, low }) {
  const { map, terrainAt } = world
  const group = new THREE.Group(), blocks = new Blocks(), floaters = []
  const float = (node, y, spin = 0, bob = 0.15) => { floaters.push({ node, y, spin, bob }); node.position.y = y; group.add(node); return node }
  ground(blocks, world, low)
  backdrop(blocks, map, low)
  props(blocks, world)

  for (const [key, at] of Object.entries(map.buildings)) {
    const y = terrainAt(at.x, at.z) ?? 0
    if (!built.has(key)) { plot(blocks, key, at.x, y, at.z); continue }
    const model = buildingModel(art, key, BUILDING_SIZE[key])
    model.position.set(at.x, y, at.z)
    group.add(model)
  }
  board(blocks, itemPoint(world, map.board))
  portal(blocks, itemPoint(world, map.portal))
  group.add(blocks.build())
  for (const [point, height, color] of [[map.board, 3, '#FFD36E'], [map.portal, 4.3, '#C4B5FD']]) {
    const node = marker(color); node.position.set(point.x, 0, point.z); float(node, (terrainAt(point.x, point.z) ?? 0) + height, 1.5)
  }

  for (const npc of map.npcs) {
    const model = characterModel(art, npc.avatar), y = terrainAt(npc.x, npc.z) ?? 0
    model.group.position.set(npc.x, y, npc.z)
    group.add(model.group)
    const node = marker('#8FE0CF'); node.position.set(npc.x, 0, npc.z); float(node, y + 2.7, 1.5)
  }

  const info = maps?.find(item => item.id === map.id)
  const guardianState = info?.guardian.calmed ? 'calm' : info?.guardian.awake ? 'awake' : 'asleep'
  const guardian = guardianModel(map.guardian.look, guardianState)
  guardian.position.set(map.guardian.x, 0, map.guardian.z)
  float(guardian, (terrainAt(map.guardian.x, map.guardian.z) ?? 0) + 0.05, 0, 0.08)

  const treasures = new Map()
  if (collecting) Object.entries(map.treasures).forEach(([key, point], i) => {
    if (info?.treasures.find(item => item.key === key)?.found !== false) return
    const at = itemPoint(world, point), node = sparkle(TREASURE_COLORS[i % TREASURE_COLORS.length], 0.34)
    node.position.set(at.x, 0, at.z)
    float(node, at.y + 0.6, 1.2)
    treasures.set(key, { node, ...at })
  })
  const orbs = (map.orbs || []).map((point, id) => {
    const at = itemPoint(world, point), node = sparkle('#BFE9FF', 0.38)
    node.position.set(at.x, 0, at.z); node.visible = false
    float(node, at.y + 0.8, 0.8, 0.25)
    return { id, node, ...at }
  })
  return { group, floaters, treasures, orbs, guardian }
}
