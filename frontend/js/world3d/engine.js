/* Vòng lặp three.js của thế giới 3D. Không gọi API và không viết DOM mỗi khung hình: chỉ báo sự kiện khi đổi.
   Tạm dừng khi tab ẩn hoặc đang mở bảng; giải phóng toàn bộ khi rời game. */
import * as THREE from '../../vendor/three/three.module.js'
import { getMap } from './maps/index.js'
import { createWorld } from './world.js'
import { buildScene } from './scene.js'
import { characterModel, companionModel, disposeTree } from './voxel.js'
import { createInput } from './input.js'
import { PHYSICS, canOccupy, moveVector, nearestTarget, spawnPlayer, stepPlayer, touches } from './logic.js'

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

export function createEngine(host, initial, handlers) {
  let state = { quality: 'normal', collecting: false, orbs: null, ...initial }
  const low = () => state.quality === 'low'
  const renderer = new THREE.WebGLRenderer({ antialias: !low(), powerPreference: 'low-power' })
  const canvas = renderer.domElement
  canvas.className = 'gw-canvas'
  canvas.tabIndex = 0
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Thế giới 3D. Di chuyển bằng WASD hoặc phím mũi tên, nhảy bằng Space, tương tác bằng E.')
  host.append(canvas)

  const abort = new AbortController(), signal = abort.signal
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 140)
  const hemi = new THREE.HemisphereLight('#FFFFFF', '#B9AED6', 2.6), sun = new THREE.DirectionalLight('#FFF3E0', 1.8)
  sun.position.set(8, 16, 10)
  scene.add(hemi, sun)
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2
  scene.add(shadow)

  let world, view, player, hero, pet
  let yaw = 0, pitch = 0.5, focus = false, paused = false, frame = 0, last = 0, clock = 0, walkPhase = 0
  let popHero = 1, popPet = 1, shiftX = 0, shiftY = 0
  const look = new THREE.Vector3()
  let promptKey = null, near = null, built = '', itemKey = '', touching = new Set(), slow = { frames: 0, time: 0, told: false }
  const eye = new THREE.Vector3(), aim = new THREE.Vector3()
  let cameraReady = false

  const input = createInput({ host, canvas, signal, isBlocked: () => paused || handlers.isBlocked?.(), onInteract: () => { if (near) handlers.onInteract(near) } })

  const signatureOfItems = () => JSON.stringify([state.collecting, state.maps?.find(m => m.id === state.mapId)])

  function buildMap(keepPlayer) {
    const map = getMap(state.mapId)
    if (view) disposeTree(view.group)
    world = createWorld(map, new Set(state.built))
    view = buildScene(world, { art: state.art, built: new Set(state.built), maps: state.maps, collecting: state.collecting, low: low() })
    scene.add(view.group)
    scene.background = new THREE.Color(map.theme.sky)
    scene.fog = new THREE.Fog(map.theme.fog, low() ? 22 : 34, low() ? 55 : 85)
    hemi.intensity = 2.6 * map.theme.light; sun.intensity = 1.8 * map.theme.light
    hemi.groundColor.set(map.theme.light < 0.9 ? '#7A6CB0' : '#B9AED6')
    // giữ chỗ đứng nếu vẫn hợp lệ; công trình mới mọc đúng chỗ đang đứng thì đưa về điểm xuất phát
    if (!keepPlayer || !canOccupy(world, player.x, player.z, player.y)) { player = spawnPlayer(world, map.spawn); yaw = 0; cameraReady = false }
    built = [...state.built].sort().join(); itemKey = signatureOfItems(); promptKey = undefined
    touching = new Set()
    host.dataset.map = map.id
  }

  /** Dựng lại đúng mô hình vừa đổi, tại chỗ: giữ vị trí, hướng; thú cưng không bị dịch đi nơi khác. */
  function buildHero() {
    const next = characterModel(state.art, state.avatar)
    next.group.position.set(player.x, player.y, player.z)
    next.group.rotation.y = hero ? hero.group.rotation.y : player.facing
    if (hero) { disposeTree(hero.group); popHero = 0 }
    hero = next
    scene.add(hero.group)
  }
  function buildPet() {
    const next = companionModel(state.art, state.pet)
    if (pet) { next.position.copy(pet.position); next.rotation.copy(pet.rotation); disposeTree(pet); popPet = 0 }
    else next.position.set(player.x + 1.2, player.y, player.z + 0.8)
    pet = next
    scene.add(pet)
  }
  const placePet = () => pet.position.set(player.x + 1.2, player.y, player.z + 0.8)
  const pop = (node, age) => node.scale.setScalar(state.reducedMotion || age >= 1 ? 1 : 0.82 + 0.18 * (1 - (1 - age) ** 3) + Math.sin(age * Math.PI) * 0.06)

  function simulate(dt) {
    const turn = input.takeLook()
    yaw += turn.yaw + ((input.pressed.has('camLeft') ? 1 : 0) - (input.pressed.has('camRight') ? 1 : 0)) * 2.2 * dt
    pitch = clamp(pitch + turn.pitch, 0.1, 1.2)
    const direction = moveVector(input.pressed, yaw, input.stick)
    player = stepPlayer(player, { ...direction, jump: input.takeJump() }, dt, world)
  }

  function animate(dt) {
    clock += dt
    const still = state.reducedMotion
    hero.group.position.set(player.x, player.y, player.z)
    const targetTurn = player.facing
    let delta = Math.atan2(Math.sin(targetTurn - hero.group.rotation.y), Math.cos(targetTurn - hero.group.rotation.y))
    hero.group.rotation.y += still ? delta : delta * Math.min(1, dt * 14)
    walkPhase = player.moving && player.onGround ? walkPhase + dt * 11 : 0
    hero.legs.forEach((leg, i) => { leg.rotation.x = still ? 0 : Math.sin(walkPhase + i * Math.PI) * 0.6 })
    shadow.position.set(player.x, (world.terrainAt(player.x, player.z) ?? player.y) + 0.07, player.z)

    // bạn đồng hành đi theo phía sau bên cạnh
    // khi đang xem nhân vật, bạn đồng hành bước ra đứng bên cạnh để nhìn thấy
    const back = focus ? -0.2 : 1.1, side = focus ? (camera.aspect < 0.8 ? 1.15 : 1.45) : 0.8
    const px = player.x - Math.sin(player.facing) * back + Math.cos(player.facing) * side, pz = player.z - Math.cos(player.facing) * back - Math.sin(player.facing) * side
    const ease = still ? 1 : Math.min(1, dt * 4)
    const gx = px - pet.position.x, gz = pz - pet.position.z
    pet.position.x += gx * ease; pet.position.z += gz * ease
    pet.position.y += (player.y - pet.position.y) * (still ? 1 : Math.min(1, dt * 8))
    if (!focus && Math.hypot(gx, gz) > 0.15) pet.rotation.y = Math.atan2(gx, gz); else pet.rotation.y = player.facing
    popHero = Math.min(1, popHero + dt * 4); popPet = Math.min(1, popPet + dt * 4)
    pop(hero.group, popHero); pop(pet, popPet)

    for (const item of view.floaters) {
      item.node.position.y = item.y + (still ? 0 : Math.sin(clock * 1.8 + item.node.position.x) * item.bob)
      if (item.spin && !still) item.node.rotation.y += item.spin * dt
    }
  }

  function placeCamera(dt) {
    let goalYaw = yaw, goalPitch = pitch, distance = camera.aspect < 0.8 ? 11.5 : 9, height = 1.4
    if (focus) {                                              // đứng trước mặt nhân vật để xem khi đổi đồ
      goalYaw = player.facing; goalPitch = 0.18; distance = camera.aspect < 0.8 ? 7.5 : 5.6; height = 1
    }
    aim.set(player.x, player.y + height, player.z)
    eye.set(aim.x + Math.sin(goalYaw) * Math.cos(goalPitch) * distance, aim.y + Math.sin(goalPitch) * distance, aim.z + Math.cos(goalYaw) * Math.cos(goalPitch) * distance)
    const w = host.clientWidth, h = host.clientHeight
    const goalX = focus && w > 760 ? Math.min(220, w * 0.25) : 0                  // chừa chỗ cho bảng bên phải
    const goalY = focus && w <= 760 ? h * 0.3 : 0                                 // bảng trượt từ dưới lên
    const jump = !cameraReady || state.reducedMotion
    const ease = jump ? 1 : Math.min(1, dt * (focus ? 7 : 10))
    camera.position.lerp(eye, ease); look.lerp(aim, jump ? 1 : Math.min(1, dt * 12))
    shiftX += (goalX - shiftX) * ease; shiftY += (goalY - shiftY) * ease
    cameraReady = true
    camera.lookAt(look)
    if (Math.abs(shiftX) > 0.5 || Math.abs(shiftY) > 0.5) camera.setViewOffset(w, h, shiftX, shiftY, w, h)
    else if (camera.view?.enabled) camera.clearViewOffset()
  }

  function interact() {
    near = nearestTarget(world.targets, player)
    const key = near ? `${near.kind}:${near.arg ?? ''}` : null
    if (key !== promptKey) { promptKey = key; handlers.onPrompt(near) }
    const items = [...[...view.treasures].map(([itemId, item]) => ({ id: `t:${itemId}`, item, take: () => { item.node.visible = false; Promise.resolve(handlers.onCollect(itemId)).then(saved => { if (!saved) item.node.visible = true }) } })),     // lưu lỗi thì món đồ hiện lại
      ...(state.orbs ? view.orbs.filter(orb => !state.orbs.includes(orb.id)).map(orb => ({ id: `o:${orb.id}`, item: orb, take: () => { orb.node.visible = false; handlers.onOrb(orb.id) } })) : [])]
    const now = new Set()
    for (const { id, item, take } of items) if (touches(item, player)) { now.add(id); if (!touching.has(id)) take() }   // chỉ kích hoạt khi bước vào
    touching = now
  }

  const showOrbs = () => view.orbs.forEach(orb => { orb.node.visible = Boolean(state.orbs) && !state.orbs.includes(orb.id) })
  const draw = () => renderer.render(scene, camera)

  function renderOnce() { popHero = popPet = 1; animate(0); placeCamera(1); draw() }          // khung tĩnh: vẽ ngay trạng thái cuối

  function tick(now) {
    frame = requestAnimationFrame(tick)
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016)
    last = now
    if (!paused) { simulate(dt); animate(dt); interact() }
    else animate(dt)
    placeCamera(dt)
    draw()
    if (!slow.told && !paused) {
      slow.frames++; slow.time += dt
      if (slow.time > 6) { if (slow.frames / slow.time < 20) { slow.told = true; handlers.onSlow?.() } slow.frames = 0; slow.time = 0 }
    }
  }
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0 }
  /** Chạy vòng lặp khi đang chơi hoặc đang xem trước nhân vật/trùm; còn lại đứng yên để tiết kiệm pin. */
  let live = true
  const sync = () => { if (!document.hidden && (!paused || live)) { if (!frame) frame = requestAnimationFrame(tick) } else stop() }

  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low() ? 1 : 1.5))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (!frame) renderOnce()
  }

  player = { x: 0, y: 0, z: 0, facing: Math.PI, moving: false, onGround: true, vy: 0 }
  buildMap(false)
  buildHero()
  buildPet()
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  document.addEventListener('visibilitychange', sync, { signal })
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); stop(); handlers.onLost?.() }, { signal })
  resize()
  sync()

  let disposed = false
  return {
    host,
    update(patch) {
      const before = state
      state = { ...state, ...patch }
      const newMap = patch.mapId !== undefined && patch.mapId !== before.mapId
      const quality = patch.quality !== undefined && patch.quality !== before.quality
      if (newMap || quality || [...state.built].sort().join() !== built || signatureOfItems() !== itemKey) buildMap(!newMap)
      const lookOf = avatar => JSON.stringify(state.art.cleanAvatar(avatar))
      if (lookOf(state.avatar) !== lookOf(before.avatar)) buildHero()
      if (state.pet !== before.pet) buildPet()
      if (newMap) { hero.group.rotation.y = player.facing; placePet() }
      showOrbs()
      if (quality) resize()
      if (!frame) renderOnce()
    },
    /** keepLive: vẫn vẽ chuyển động (xem nhân vật, trùm) nhưng không nhận điều khiển. */
    setPaused(value, { keepLive = false } = {}) {
      paused = Boolean(value); live = !paused || keepLive
      input.clear()
      if (paused) input.release()                          // mở bảng thì trả con trỏ chuột lại cho người chơi
      if (!paused) promptKey = undefined
      sync()
      if (!frame) renderOnce()
    },
    setFocus(value) { focus = Boolean(value); if (!frame) renderOnce() },
    focusCanvas() { canvas.focus({ preventScroll: true }) },
    /** Khóa chuột để xoay camera; chỉ có tác dụng khi gọi trong lúc người chơi vừa bấm. */
    lockMouse() { input.lock() },
    /** Chỉ dùng cho kiểm thử trên trình duyệt: đọc trạng thái, đặt nhân vật. Không gửi đi đâu. */
    debug: {
      read: () => ({ yaw: +yaw.toFixed(3), pitch: +pitch.toFixed(3), locked: document.pointerLockElement === canvas, x: +player.x.toFixed(2), y: +player.y.toFixed(2), z: +player.z.toFixed(2), map: world.map.id, running: Boolean(frame), paused, near: near && `${near.kind}:${near.arg ?? ''}`, treasures: view.treasures.size, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries }),
      place(x, z) { player = { ...player, x, z, y: (world.terrainAt(x, z) ?? 0), vy: 0 }; cameraReady = false },
      speed: PHYSICS.walk
    },
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      abort.abort()
      observer.disconnect()
      input.dispose()
      disposeTree(view.group); disposeTree(hero.group); disposeTree(pet); disposeTree(shadow)
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      delete host.dataset.map
    }
  }
}
