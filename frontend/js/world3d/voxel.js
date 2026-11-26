/* Dựng hình khối: gom hộp theo màu thành InstancedMesh, và "đùn" hình pixel SVG sẵn có của village.js
   thành mô hình 3D (nhân vật, bạn đồng hành, công trình dùng đúng hình vẽ của bản 2D, không vẽ lại). */
import * as THREE from '../../vendor/three/three.module.js'

/** Đọc các ô <rect> trong chuỗi SVG pixel. Thuần. */
export function parseRects(markup) {
  const rects = []
  for (const match of String(markup).matchAll(/<rect\b([^>]*)\/?>/g)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(pair => [pair[1], pair[2]]))
    const rect = { x: Number(attrs.x || 0), y: Number(attrs.y || 0), w: Number(attrs.width), h: Number(attrs.height), fill: attrs.fill, glow: /vl-glow/.test(attrs.class || '') }
    if (rect.w > 0 && rect.h > 0 && /^#[0-9a-f]{6}$/i.test(rect.fill || '') && Number(attrs.opacity ?? 1) >= 0.5) rects.push(rect)
  }
  return rects
}

/** Thu thập hộp rồi dựng mỗi màu một InstancedMesh (ít lệnh vẽ). add(): tâm và kích thước. */
export class Blocks {
  constructor() { this.groups = new Map() }
  add(x, y, z, sx, sy, sz, color, glow = false) {
    const key = `${color}|${glow ? 1 : 0}`
    if (!this.groups.has(key)) this.groups.set(key, { color, glow, boxes: [] })
    this.groups.get(key).boxes.push([x, y, z, sx, sy, sz])
    return this
  }
  build() {
    const group = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), turn = new THREE.Quaternion()
    for (const { color, glow, boxes } of this.groups.values()) {
      const material = glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color })
      const mesh = new THREE.InstancedMesh(geometry, material, boxes.length)
      boxes.forEach(([x, y, z, sx, sy, sz], i) => mesh.setMatrixAt(i, matrix.compose(position.set(x, y, z), turn, scale.set(sx, sy, sz))))
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
      group.add(mesh)
    }
    return group
  }
}

/** Đùn danh sách ô pixel thành hộp. Ô vẽ sau nhô ra mặt trước (mắt, má, cửa sổ); ô vẽ trước nhô ra mặt sau.
 *  Gốc tọa độ ở đáy giữa. depthFor trả độ dày (đơn vị pixel). */
export function extrude(blocks, rects, { unit, depthFor, centerX, baseY, z = 0 }) {
  const n = rects.length
  rects.forEach((rect, i) => {
    const depth = depthFor(rect) * unit, front = depth / 2 + i * unit * 0.02, back = -depth / 2 - (n - i) * unit * 0.02
    blocks.add((rect.x + rect.w / 2 - centerX) * unit, (baseY - rect.y - rect.h / 2) * unit, z + (front + back) / 2, rect.w * unit, rect.h * unit, front - back, rect.fill, rect.glow)
  })
  return blocks
}

const bounds = rects => ({ minX: Math.min(...rects.map(r => r.x)), maxX: Math.max(...rects.map(r => r.x + r.w)), maxY: Math.max(...rects.map(r => r.y + r.h)) })

const isLeg = rect => rect.y >= 13 && rect.x >= 1.5 && rect.x < 9.9

/** Nhân vật: thân + hai chân tách riêng để bước đi. art.heroMarkup lấy từ village.js. */
export function characterModel(art, avatar) {
  const clean = art.cleanAvatar(avatar), rects = parseRects(art.heroMarkup(clean))
  const unit = 0.11, centerX = 6, baseY = bounds(rects).maxY
  const depthFor = rect => rect.y + rect.h / 2 < 8 ? 6 : rect.y < 13 ? 4 : 3
  const group = new THREE.Group()
  const body = extrude(new Blocks(), rects.filter(rect => !isLeg(rect)), { unit, depthFor, centerX, baseY })
  if (clean.preset === 'default') {                       // gáy và đỉnh đầu có tóc khi nhìn từ phía sau
    const hair = art.hairColor(clean)
    body.add(0, (baseY - 4) * unit, -3.7 * unit, 8.4 * unit, 7 * unit, 1.4 * unit, hair)
  }
  group.add(body.build())
  const hipY = (baseY - 13) * unit
  const legs = [rect => rect.x < 5.5, rect => rect.x >= 5.5].map(side => {
    const pivot = new THREE.Group()
    pivot.position.y = hipY
    const mesh = extrude(new Blocks(), rects.filter(rect => isLeg(rect) && side(rect)), { unit, depthFor, centerX, baseY }).build()
    mesh.position.y = -hipY
    pivot.add(mesh); group.add(pivot)
    return pivot
  })
  return { group, legs }
}

export function companionModel(art, species) {
  const rects = parseRects(art.companionMarkup(species)), box = bounds(rects)
  return extrude(new Blocks(), rects, { unit: 0.085, depthFor: () => 4.5, centerX: (box.minX + box.maxX) / 2, baseY: box.maxY }).build()
}

const BUILDING_DEPTH = { tent: 14, garden: 8, hammock: 3, teahouse: 13, lantern: 5, clocktower: 10, library: 15, observatory: 13, cloudhouse: 13, bigtree: 9 }

/** Công trình từ hình 2D; hồ nước dựng riêng vì hình 2D nhìn từ trên xuống. */
export function buildingModel(art, key, size) {
  const blocks = new Blocks()
  if (key === 'pond') {
    for (let x = -size.hx; x <= size.hx; x += 0.5) for (let z = -size.hz; z <= size.hz; z += 0.5) {
      const d = (x / size.hx) ** 2 + (z / size.hz) ** 2
      if (d <= 0.72) blocks.add(x, 0.06, z, 0.5, 0.1, 0.5, (Math.round(x * 2) + Math.round(z * 2)) % 5 ? '#8FD3F4' : '#BFE9FF')
      else if (d <= 1.05) blocks.add(x, 0.12, z, 0.5, 0.25, 0.5, '#CFC8D8')
    }
    for (const [x, z] of [[-1.2, 0.6], [0.9, -0.7], [1.4, 0.8]]) blocks.add(x, 0.18, z, 0.45, 0.06, 0.45, '#6FBF73').add(x, 0.28, z, 0.15, 0.15, 0.15, '#F6A8B8')
    return blocks.build()
  }
  const sprite = art.buildingMarkup(key)
  if (!sprite) return blocks.build()
  const [width, height, markup] = sprite
  const unit = (size.hx * 2) / width
  return extrude(blocks, parseRects(markup), { unit, depthFor: () => BUILDING_DEPTH[key] || 8, centerX: width / 2, baseY: height }).build()
}

/** Giải phóng mọi hình học và vật liệu dưới một nút. */
export function disposeTree(root) {
  root.traverse(node => {
    node.geometry?.dispose()
    for (const material of [].concat(node.material || [])) material.dispose()
    if (node.isInstancedMesh) node.dispose()
  })
  root.removeFromParent()
}
