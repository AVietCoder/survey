/* Cầu nối duy nhất giữa phần web (script cổ điển) và thế giới 3D: window.World3D.
   world3d/ không bao giờ gọi API nhiệm vụ; tracking.js/world-ui.js đưa trạng thái vào và nhận sự kiện. */
import { createEngine } from './engine.js'
import { achievements, calmBreath, calmOrb, calmOrder, createCalm, isCalm, ORDER_LANTERNS } from './logic.js'
import { getMap } from './maps/index.js'

let engine = null

function dispose() { engine?.dispose(); engine = null }

const World3D = {
  mount(host, state, handlers) { dispose(); engine = createEngine(host, state, handlers) },
  isMounted: host => Boolean(engine) && engine.host === host,
  update(patch) { engine?.update(patch) },
  pause(value, options) { engine?.setPaused(value, options) },
  focusHero(value) { engine?.setFocus(value) },
  focusCanvas() { engine?.focusCanvas() },
  lockMouse() { engine?.lockMouse() },
  dispose,
  get debug() { return engine?.debug || null },
  mapInfo: id => getMap(id),
  calm: { create: createCalm, breath: calmBreath, order: calmOrder, orb: calmOrb, done: isCalm, lanterns: ORDER_LANTERNS },
  achievements
}

window.World3D = World3D
export default World3D
