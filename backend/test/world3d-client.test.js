// Phần client của thế giới 3D chạy trong node: vật lý, bản đồ đi tới được, trùm không thể thua, dựng cảnh three.js thật.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { WORLD_MAPS, describeWorld } from '../src/services/world3d-content.js'

const base = '../../frontend/js/world3d/'
const logic = await import(`${base}logic.js`)
const { createWorld, itemPoint } = await import(`${base}world.js`)
const { MAPS } = await import(`${base}maps/index.js`)
const { parseRects, characterModel, companionModel, disposeTree } = await import(`${base}voxel.js`)
const { buildScene } = await import(`${base}scene.js`)

const window = {}
vm.runInNewContext(fs.readFileSync(new URL('../../frontend/js/village.js', import.meta.url), 'utf8'), { window })
const V = window.Village
const allBuilt = new Set(V.BUILDINGS.map(item => item.key))
const flat = { heightAt: (x, z) => (Math.abs(x) > 10 || Math.abs(z) > 10 ? null : x > 3 && x < 5 ? 1 : z < -3 ? 5 : 0), terrainAt: () => 0 }
const still = { x: 0, z: 0, run: false, jump: false }
const run = (player, input, seconds, world = flat) => logic.stepPlayer(player, input, seconds, world)
const walk = (player, input, seconds, world = flat) => { for (let t = 0; t < seconds; t += 0.05) player = run(player, input, 0.05, world); return player }

test('input: keys map to actions; movement follows the camera and never exceeds unit length', () => {
  assert.deepEqual(['KeyW', 'ArrowLeft', 'Space', 'KeyE', 'ShiftLeft', 'KeyP'].map(logic.keyAction), ['forward', 'left', 'jump', 'interact', 'run', null])
  const north = logic.moveVector(new Set(['forward']), 0)
  assert.ok(Math.abs(north.x) < 1e-9 && north.z < -0.99)
  const turned = logic.moveVector(new Set(['forward']), Math.PI / 2)
  assert.ok(turned.x < -0.99 && Math.abs(turned.z) < 1e-9)
  const diagonal = logic.moveVector(new Set(['forward', 'right']), 0.7)
  assert.ok(Math.hypot(diagonal.x, diagonal.z) <= 1.000001)
  assert.ok(logic.moveVector(new Set(), 0, { x: 0, y: -1 }).z < -0.99, 'gạt lên là đi tới')
})

test('physics: walks, runs faster, stops at walls and the void, climbs a ledge only by jumping, never sinks', () => {
  const start = logic.spawnPlayer(flat, { x: 0, z: 0 })
  assert.ok(walk(start, { ...still, x: -1 }, 1).x < -3.5)
  assert.ok(walk(start, { ...still, x: -1, run: true }, 1).x < -6)
  assert.ok(walk(start, { ...still, x: -1 }, 10).x >= -10, 'không ra ngoài bản đồ')
  assert.ok(walk(start, { ...still, z: -1 }, 3).z > -3.4, 'tường cao chặn lại')
  assert.ok(walk(start, { ...still, x: 1 }, 2).x < 3, 'bậc cao 1 chặn khi không nhảy')
  let jumper = walk(start, { ...still, x: 1 }, 2)
  jumper = run(jumper, { ...still, x: 1, jump: true }, 0.05)
  jumper = walk(jumper, { ...still, x: 1 }, 0.45)
  jumper = walk(jumper, still, 1)
  assert.equal(jumper.y, 1, 'đứng trên bậc'); assert.ok(jumper.onGround)
  const down = walk(jumper, { ...still, x: 1 }, 1.5)
  assert.equal(down.y, 0)
  const big = run(start, { ...still, x: -1, jump: true }, 5)
  assert.ok(big.y >= 0 && big.x >= -10, 'khung hình rất chậm không làm xuyên tường')
})

test('maps: every server map has a layout, every treasure and building is placed, ids match', () => {
  assert.deepEqual(Object.keys(MAPS), WORLD_MAPS.map(map => map.id))
  for (const map of WORLD_MAPS) assert.deepEqual(Object.keys(MAPS[map.id].treasures).sort(), map.treasures.map(item => item.key).sort(), map.id)
  const placed = Object.values(MAPS).flatMap(map => Object.keys(map.buildings))
  assert.deepEqual([...placed].sort(), [...allBuilt].sort(), 'mỗi công trình ở đúng một bản đồ')
  assert.equal(MAPS.sky.orbs.length, WORLD_MAPS[2].guardian.goal)
  for (const map of Object.values(MAPS)) for (const npc of map.npcs) for (const code of npc.codes) assert.ok(V.MECHANISMS[code], `${npc.id} ${code}`)
})

test('maps: from the spawn point a player can reach every treasure, orb and interaction, with buildings built or not', () => {
  for (const map of Object.values(MAPS)) for (const built of [new Set(), allBuilt]) {
    const world = createWorld(map, built)
    assert.ok(logic.canOccupy(world, map.spawn.x, map.spawn.z, 0), `${map.id}: điểm xuất phát`)
    const cells = logic.reachableCells(world, map.spawn)
    const items = [...Object.entries(map.treasures), ...map.orbs.map((point, i) => [`orb ${i}`, point])]
    for (const [name, point] of items) {
      const target = itemPoint(world, point)
      assert.ok(cells.some(cell => logic.touches(target, cell)), `${map.id} ${built.size ? 'đã xây' : 'chưa xây'}: không tới được ${name}`)
    }
    for (const target of world.targets) assert.ok(cells.some(cell => logic.nearestTarget([target], cell)), `${map.id}: không tới được ${target.kind} ${target.arg}`)
    assert.equal(logic.nearestTarget(world.targets, logic.spawnPlayer(world, map.spawn)), null, `${map.id}: vừa vào chưa đứng sát gì`)
  }
})

test('guardians cannot be lost: any input only keeps or raises progress, and finishing needs no luck or time limit', () => {
  const phase = elapsed => (elapsed % 8 < 3 ? 'inhale' : 'exhale')
  let breath = logic.createCalm('breath', 4)
  for (const elapsed of [4, 5, 6.9, 0.5, 1, 2, 7, 7.5]) { const next = logic.calmBreath(breath, elapsed, phase(elapsed)); assert.ok(next.progress >= breath.progress); breath = next }
  assert.equal(breath.progress, 1, 'một chu kỳ chỉ tính một lần')
  for (const elapsed of [8.5, 800, 9000.2]) breath = logic.calmBreath(breath, elapsed - elapsed % 8 + 1, 'inhale')
  assert.ok(logic.isCalm(breath))
  let order = logic.createCalm('order', 5)
  for (const value of [5, 3, 9, -1, 2]) { const next = logic.calmOrder(order, value); assert.equal(next, order, 'chọn khác không mất gì') }
  for (let value = 1; value <= 5; value++) order = logic.calmOrder(order, value)
  assert.ok(logic.isCalm(order)); assert.equal(logic.calmOrder(order, 6).progress, 5)
  assert.deepEqual([...logic.ORDER_LANTERNS].sort(), [1, 2, 3, 4, 5])
  let orbs = logic.createCalm('orbs', 5)
  for (const id of [0, 0, 1, 1, 2, 3, 4, 4]) orbs = logic.calmOrb(orbs, id)
  assert.ok(logic.isCalm(orbs)); assert.equal(orbs.found.length, 5)
  for (const calm of [breath, order, orbs]) assert.deepEqual(Object.keys(calm).filter(key => /fail|lose|health|hp|timer|deadline|star|point/i.test(key)), [])
})

test('achievements are personal milestones derived from server data', () => {
  const none = logic.achievements({ completions: 0, activeDays: 0 }, describeWorld(0, 0, new Set()))
  assert.deepEqual(none.filter(item => item.done).map(item => item.id), ['map-meadow'])
  const all = new Set(WORLD_MAPS.flatMap(map => [map.guardian.key, ...map.treasures.map(item => item.key)]))
  assert.ok(logic.achievements({ completions: 40, activeDays: 9 }, describeWorld(999, 40, all)).every(item => item.done))
})

test('voxels come from the village sprites: every preset, hair style, pet and building yields blocks', () => {
  assert.deepEqual(parseRects('<rect x="1" y="2" width="3" height="4" fill="#abcdef" class="vl-glow"/><rect x="0" y="0" width="1" height="1" fill="#000" opacity=".1"/>'), [{ x: 1, y: 2, w: 3, h: 4, fill: '#abcdef', glow: true }])
  const avatars = [{}, { preset: 'emma' }, { preset: 'tinh' }, ...[0, 1, 2, 3].map(style => ({ style, hat: style }))]
  for (const avatar of avatars) { const model = characterModel(V, avatar); assert.ok(model.group.children.length >= 3); assert.equal(model.legs.length, 2); for (const leg of model.legs) assert.ok(leg.children[0].children.length > 0, JSON.stringify(avatar)); disposeTree(model.group) }
  for (const species of ['cat', 'bunny', 'fox', 'bear']) assert.ok(companionModel(V, species).children.length > 0)
  for (const key of allBuilt) assert.ok(key === 'pond' || parseRects(V.buildingMarkup(key)[2]).length > 3, key)
})

test('scenes build and dispose for every map, in both qualities, with few draw calls; found and disabled treasures are absent', () => {
  for (const map of Object.values(MAPS)) for (const low of [false, true]) {
    const world = createWorld(map, allBuilt)
    const maps = describeWorld(999, 99, new Set([Object.keys(map.treasures)[0]]))
    const view = buildScene(world, { art: V, built: allBuilt, maps, collecting: true, low })
    assert.equal(view.treasures.size, 3, map.id); assert.equal(view.orbs.length, map.orbs.length)
    let meshes = 0; view.group.traverse(node => { if (node.isMesh) meshes++ })
    assert.ok(meshes < 420, `${map.id}: ${meshes} lệnh vẽ`)
    assert.equal(buildScene(world, { art: V, built: new Set(), maps, collecting: false, low }).treasures.size, 0)
    disposeTree(view.group)
  }
})
