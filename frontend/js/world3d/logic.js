/* Logic thuần của thế giới 3D: không import three.js, không đụng DOM, test được bằng node.
   Quy tắc: không có thất bại, không đếm ngược, không ngẫu nhiên; tiến độ chỉ tăng. */

export const PHYSICS = Object.freeze({ walk: 4.2, run: 7, gravity: 20, jump: 7.8, step: 0.55, radius: 0.3, maxRise: 1.2 })

const KEYS = {
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'jump', KeyE: 'interact', KeyQ: 'camLeft', KeyR: 'camRight'
}
export const keyAction = code => KEYS[code] || null

/** Hướng đi trên mặt đất theo góc camera. yaw = 0: camera ở phía +z nhìn về -z. */
export function moveVector(pressed, yaw, stick = { x: 0, y: 0 }) {
  const forward = (pressed.has('forward') ? 1 : 0) - (pressed.has('back') ? 1 : 0) - stick.y
  const side = (pressed.has('right') ? 1 : 0) - (pressed.has('left') ? 1 : 0) + stick.x
  let x = -Math.sin(yaw) * forward + Math.cos(yaw) * side
  let z = -Math.cos(yaw) * forward - Math.sin(yaw) * side
  const length = Math.hypot(x, z)
  if (length > 1) { x /= length; z /= length }
  return { x, z, run: pressed.has('run') || Math.hypot(stick.x, stick.y) > 0.92 }
}

const corners = (x, z, r) => [[x - r, z - r], [x + r, z - r], [x - r, z + r], [x + r, z + r]]

/** Đứng được ở (x, z) khi đang ở độ cao y: mọi góc có mặt đất và không cao hơn một bậc. */
export function canOccupy(world, x, z, y) {
  return corners(x, z, PHYSICS.radius).every(([cx, cz]) => { const h = world.heightAt(cx, cz); return h !== null && h <= y + PHYSICS.step })
}

export function groundAt(world, x, z) {
  let ground = null
  for (const [cx, cz] of corners(x, z, PHYSICS.radius)) { const h = world.heightAt(cx, cz); if (h !== null && (ground === null || h > ground)) ground = h }
  return ground
}

export const spawnPlayer = (world, spawn) => ({ x: spawn.x, z: spawn.z, y: groundAt(world, spawn.x, spawn.z) ?? 0, vy: 0, onGround: true, facing: spawn.facing ?? Math.PI, moving: false })

/** Một bước mô phỏng. Chia nhỏ dt để không xuyên tường khi máy chậm. Trả đối tượng mới. */
export function stepPlayer(player, input, dt, world) {
  let state = { ...player }
  let left = Math.min(Math.max(dt, 0), 0.25)
  let jump = Boolean(input.jump)
  while (left > 1e-6) {
    const t = Math.min(left, 1 / 60)
    left -= t
    const speed = input.run ? PHYSICS.run : PHYSICS.walk
    const nx = state.x + input.x * speed * t, nz = state.z + input.z * speed * t
    if (nx !== state.x && canOccupy(world, nx, state.z, state.y)) state.x = nx
    if (nz !== state.z && canOccupy(world, state.x, nz, state.y)) state.z = nz
    if (jump && state.onGround) { state.vy = PHYSICS.jump; state.onGround = false }
    jump = false
    state.vy -= PHYSICS.gravity * t
    state.y += state.vy * t
    const ground = groundAt(world, state.x, state.z) ?? 0
    if (state.y <= ground) { state.y = ground; state.vy = 0; state.onGround = true } else state.onGround = false
  }
  state.moving = Math.hypot(input.x, input.z) > 0.05
  if (state.moving) state.facing = Math.atan2(input.x, input.z)
  return state
}

/** Điểm tương tác gần nhất trong tầm (khoảng cách tính tới mép vật). */
export function nearestTarget(targets, player) {
  let best = null, bestGap = Infinity
  for (const target of targets) {
    const gap = Math.hypot(target.x - player.x, target.z - player.z) - target.radius
    if (gap <= 0 && gap < bestGap && Math.abs((target.y ?? 0) - player.y) < 2.5) { best = target; bestGap = gap }
  }
  return best
}

export const touches = (item, player, reach = 0.9) => Math.hypot(item.x - player.x, item.z - player.z) <= reach && Math.abs(item.y - player.y) < 1.2

/** Các ô tới được từ điểm xuất phát bằng đi bộ, nhảy lên bậc ≤ maxRise và bước xuống (dùng để kiểm thử bản đồ). */
export function reachableCells(world, start, cell = 0.4) {
  const key = (i, j) => `${i},${j}`
  const origin = [Math.round(start.x / cell), Math.round(start.z / cell)]
  const seen = new Map([[key(...origin), { x: origin[0] * cell, z: origin[1] * cell, y: groundAt(world, origin[0] * cell, origin[1] * cell) }]])
  const queue = [origin]
  while (queue.length) {
    const [i, j] = queue.shift()
    const here = seen.get(key(i, j))
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj
      if (seen.has(key(ni, nj))) continue
      const x = ni * cell, z = nj * cell
      if (!canOccupy(world, x, z, here.y + PHYSICS.maxRise - PHYSICS.step)) continue
      seen.set(key(ni, nj), { x, z, y: groundAt(world, x, z) })
      queue.push([ni, nj])
    }
  }
  return [...seen.values()]
}

/* ---------------------------------------------------------------- trùm: làm dịu, không thể thua */
export const ORDER_LANTERNS = Object.freeze([3, 1, 5, 2, 4])          // thứ tự bày cố định, không ngẫu nhiên

export const createCalm = (game, goal) => ({ game, goal, progress: 0, lastCycle: -1, found: [] })
export const isCalm = calm => calm.progress >= calm.goal
const advance = (calm, patch) => ({ ...calm, ...patch, progress: Math.min(calm.goal, calm.progress + 1) })

/** Thở cùng: bấm trong nhịp hít vào được tính một lần mỗi chu kỳ 8 giây. Bấm lúc khác không mất gì. */
export function calmBreath(calm, elapsedSeconds, phaseKey) {
  const cycle = Math.floor(elapsedSeconds / 8)
  if (isCalm(calm) || phaseKey !== 'inhale' || cycle === calm.lastCycle) return calm
  return advance(calm, { lastCycle: cycle })
}
/** Thắp đèn từ nhỏ tới lớn. Chọn đèn khác thì chưa thắp, không mất tiến độ. */
export function calmOrder(calm, value) {
  if (isCalm(calm) || value !== calm.progress + 1) return calm
  return advance(calm, {})
}
export function calmOrb(calm, id) {
  if (isCalm(calm) || calm.found.includes(id)) return calm
  return advance(calm, { found: [...calm.found, id] })
}

/* ---------------------------------------------------------------- thành tích cá nhân (không so sánh với ai) */
export function achievements({ completions = 0, activeDays = 0 }, maps = []) {
  const list = [
    { id: 'first', title: 'Việc nhỏ đầu tiên', done: completions >= 1 },
    { id: 'five', title: 'Năm việc nhỏ', done: completions >= 5 },
    { id: 'fifteen', title: 'Mười lăm việc nhỏ', done: completions >= 15 },
    { id: 'thirty', title: 'Ba mươi việc nhỏ', done: completions >= 30 },
    { id: 'days3', title: 'Ghé làng ba ngày', done: activeDays >= 3 },
    { id: 'days7', title: 'Ghé làng bảy ngày', done: activeDays >= 7 }
  ]
  for (const map of maps) {
    list.push({ id: `map-${map.id}`, title: `Đặt chân tới ${map.name}`, done: map.open })
    list.push({ id: `gather-${map.id}`, title: `Đủ kho báu ở ${map.name}`, done: map.treasures.length > 0 && map.treasures.every(item => item.found) })
    list.push({ id: `calm-${map.id}`, title: `Làm dịu ${map.guardian.name}`, done: map.guardian.calmed })
  }
  return list
}
