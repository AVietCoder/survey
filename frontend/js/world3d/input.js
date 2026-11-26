/* Điều khiển: bàn phím, kéo để xoay camera, cần gạt và nút chạm. Mọi lắng nghe gắn với AbortSignal để gỡ sạch. */
import { keyAction } from './logic.js'

const typing = target => Boolean(target?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable=true]'))
const activatable = target => Boolean(target?.closest?.('button, a, summary, [role=button]'))

export function createInput({ host, canvas, signal, isBlocked, onInteract, onLock }) {
  const pressed = new Set(), stick = { x: 0, y: 0 }, look = { yaw: 0, pitch: 0 }
  let jumpQueued = false
  const clear = () => { pressed.clear(); stick.x = 0; stick.y = 0; jumpQueued = false }
  const opts = { signal }

  window.addEventListener('keydown', event => {
    const action = keyAction(event.code)
    if (!action || event.ctrlKey || event.metaKey || event.altKey || isBlocked() || typing(event.target)) return
    if (action === 'jump' && activatable(event.target)) return                    // để Space bấm nút đang chọn
    if (action === 'jump' || event.code.startsWith('Arrow')) event.preventDefault()
    if (action === 'interact') { if (!event.repeat) onInteract(); return }
    if (action === 'jump') { if (!event.repeat) jumpQueued = true; return }
    pressed.add(action)
  }, opts)
  window.addEventListener('keyup', event => { const action = keyAction(event.code); if (action) pressed.delete(action) }, opts)
  window.addEventListener('blur', clear, opts)
  document.addEventListener('visibilitychange', clear, opts)

  /* chuột: bấm vào cảnh để khóa con trỏ và xoay camera bằng cách rê chuột; Esc (trình duyệt) hoặc mở bảng thì trả chuột lại.
     Khóa không được thì vẫn kéo chuột để xoay. Ngón tay và bút luôn dùng cách kéo. */
  const hasMouse = !matchMedia('(pointer: coarse)').matches            // màn cảm ứng thì không gợi ý khóa chuột
  const locked = () => document.pointerLockElement === canvas
  function lock() {
    if (locked() || isBlocked() || !canvas.requestPointerLock) return
    try { canvas.requestPointerLock()?.catch?.(() => {}) } catch { /* trình duyệt từ chối (vừa bấm Esc): bấm lại sau */ }
  }
  const release = () => { if (locked()) document.exitPointerLock() }
  const hint = document.createElement('p')
  hint.className = 'gw-mouse'
  hint.setAttribute('role', 'status')
  const paintHint = () => {
    hint.classList.toggle('is-locked', locked())
    hint.innerHTML = locked() ? 'Rê chuột để xoay · bấm <kbd>Esc</kbd> để lấy lại chuột' : 'Bấm vào cảnh để điều khiển camera bằng chuột'
  }
  if (hasMouse) { paintHint(); host.append(hint) }
  document.addEventListener('pointerlockchange', () => { drag = null; paintHint(); onLock?.(locked()) }, opts)
  document.addEventListener('mousemove', event => {
    if (!locked() || isBlocked()) return
    const dx = Math.max(-200, Math.min(200, event.movementX || 0)), dy = Math.max(-200, Math.min(200, event.movementY || 0))   // chặn cú nhảy bất thường
    look.yaw -= dx * 0.0026; look.pitch += dy * 0.0022
  }, opts)

  let drag = null
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return
    canvas.focus({ preventScroll: true })
    if (event.pointerType === 'mouse') lock()
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
    try { canvas.setPointerCapture?.(event.pointerId) } catch { /* đang khóa con trỏ */ }
  }, opts)
  canvas.addEventListener('pointermove', event => {
    if (!drag || locked() || event.pointerId !== drag.id) return
    look.yaw -= (event.clientX - drag.x) * 0.006; look.pitch += (event.clientY - drag.y) * 0.004
    drag.x = event.clientX; drag.y = event.clientY
  }, opts)
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, event => { if (drag?.id === event.pointerId) drag = null }, opts)

  /* cần gạt + nút nhảy cho màn cảm ứng */
  const touch = document.createElement('div')
  touch.className = 'gw-touch'
  touch.innerHTML = '<div class="gw-stick" role="application" aria-label="Cần gạt di chuyển"><i></i></div><button type="button" class="gw-jump" aria-label="Nhảy">Nhảy</button>'
  host.append(touch)
  if (matchMedia('(pointer: coarse)').matches) touch.classList.add('is-on')
  window.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') touch.classList.add('is-on') }, opts)
  const pad = touch.querySelector('.gw-stick'), knob = pad.firstElementChild
  let finger = null
  const move = event => {
    const box = pad.getBoundingClientRect(), radius = box.width / 2
    let x = (event.clientX - box.left - radius) / radius, y = (event.clientY - box.top - radius) / radius
    const length = Math.hypot(x, y)
    if (length > 1) { x /= length; y /= length }
    stick.x = Math.abs(x) < 0.15 ? 0 : x; stick.y = Math.abs(y) < 0.15 ? 0 : y
    knob.style.transform = `translate(${x * radius * 0.55}px, ${y * radius * 0.55}px)`
  }
  const lift = event => { if (event.pointerId !== finger) return; finger = null; stick.x = 0; stick.y = 0; knob.style.transform = '' }
  pad.addEventListener('pointerdown', event => { event.preventDefault(); finger = event.pointerId; pad.setPointerCapture?.(finger); move(event) }, opts)
  pad.addEventListener('pointermove', event => { if (event.pointerId === finger) move(event) }, opts)
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, lift, opts)
  const jump = touch.querySelector('.gw-jump')
  jump.addEventListener('pointerdown', event => { event.preventDefault(); if (!isBlocked()) jumpQueued = true }, opts)
  jump.addEventListener('click', event => { if (event.detail === 0 && !isBlocked()) jumpQueued = true }, opts)   // kích hoạt bằng bàn phím

  return {
    pressed, stick, clear, release,
    lock() { if (hasMouse) lock() },                       // gọi từ nút bấm: chỉ khóa trên máy dùng chuột
    takeJump() { const value = jumpQueued; jumpQueued = false; return value },
    takeLook() { const value = { ...look }; look.yaw = 0; look.pitch = 0; return value },
    dispose() { clear(); release(); touch.remove(); hint.remove() }
  }
}
