/* brainst0rm — phần giao diện HTML của thế giới 3D (bảng bản đồ, trùm, nhân vật phụ, màn chính, sưu tầm) và
   vòng đời tải/giải phóng cảnh. Chỉ tracking.js gọi vào. Nhiệm vụ vẫn do bảng sẵn có xử lý; ở đây không có Sao.
   Quy tắc: không thất bại, không đếm ngược, không ngẫu nhiên, không so sánh, không hiển thị nhóm. */
(() => {
  'use strict'

  let host = null                          // do tracking.js cung cấp qua connect()
  let loading = false, ticker = null
  const MAP_KEY = 'bs-world-map', QUALITY_KEY = 'bs-world-quality', INTRO_KEY = 'bs-world-intro'
  const memo = { map: null, calm: {}, orbRun: null, target: null, npcPage: 0, last: null }

  const read = (store, key) => { try { return store.getItem(key) } catch { return null } }
  const write = (store, key, value) => { try { store.setItem(key, value) } catch { /* storage có thể bị chặn */ } }
  const quality = () => read(localStorage, QUALITY_KEY) === 'low' ? 'low' : 'normal'
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const game = () => host.game
  const data = () => game().data
  const mapInfo = id => data()?.world?.maps.find(item => item.id === id)
  const stopTicker = () => { clearInterval(ticker); ticker = null }

  /** Máy này chạy được thế giới 3D không (để hiện lựa chọn). */
  const canUse3d = () => Boolean(window.World3DSupport?.hasWebGL2())

  /** Lấy trạng thái thế giới từ máy chủ. Trả null → dùng làng 2D (kể cả khi máy chủ cũ chưa có API). */
  async function prepare() {
    return host.tapi('GET', '/track/rewards/world').catch(error => {
      if (error.status === 401 || error.code === 'student_account_required') throw error
      toast('Chưa mở được thế giới 3D lúc này, bạn đang ở làng 2D.')
      return null
    })
  }

  function currentMap() {
    const wanted = memo.map || read(sessionStorage, MAP_KEY) || 'meadow'
    return mapInfo(wanted)?.open ? wanted : 'meadow'
  }

  function state() {
    const { V, data: village, world } = data()
    const mapId = currentMap()
    return {
      mapId, built: V.unlockedOf(village.stars).map(item => item.key), maps: world.maps, collecting: world.collecting,
      avatar: V.cleanAvatar(village.avatar), pet: village.pet, art: V, quality: quality(), reducedMotion: reduced(),
      orbs: memo.orbRun?.mapId === mapId ? memo.orbRun.calm.found : null
    }
  }

  /* ---------------------------------------------------------------- sự kiện từ cảnh */
  function promptLabel(target) {
    const { V, data: village } = data()
    if (target.kind === 'building') {
      const b = V.BUILDINGS.find(item => item.key === target.arg)
      return village.stars >= b.stars ? `Xem ${b.name}` : `Nền đất: ${b.name}`
    }
    if (target.kind === 'guardian') return `Gặp ${mapInfo(target.arg)?.guardian.name || 'người gác'}`
    if (target.kind === 'npc') return `Trò chuyện với ${target.label}`
    return target.label
  }
  function interact(target) {
    if (!target || !data()) return
    memo.target = target; memo.npcPage = 0
    host.openPanel(target.kind, target.arg, $('#gw-prompt'))
  }
  function showPrompt(target) {
    const button = $('#gw-prompt')
    if (!button || !data()) return
    memo.target = target || memo.target
    button.hidden = !target
    if (!target) return
    button.innerHTML = `<kbd aria-hidden="true">E</kbd><span>${esc(promptLabel(target))}</span>`
    button.onclick = () => interact(target)
  }

  async function collect(key) {
    const world = data()?.world
    if (!world?.collecting) return null
    try {
      const result = await host.tapi('POST', '/track/rewards/world/collect', { key })
      for (const map of data()?.world.maps || []) {
        for (const item of map.treasures) if (item.key === key) item.found = true
        if (map.guardian.key === key) map.guardian.calmed = true
      }
      if (!result.duplicate) toast(result.kind === 'keepsake' ? `Bạn nhận được kỷ vật: ${result.name}` : `Tìm thấy: ${result.name}`)
      if (window.World3D?.isMounted($('#gw-world'))) World3D.update({ maps: [...data().world.maps] })
      return result
    } catch (error) {
      toast(error.status >= 500 || !error.status ? 'Chưa lưu được món đồ này. Lần sau ghé lại nhé.' : error.message, 'error')
      return null
    }
  }

  function orb(id) {
    const run = memo.orbRun
    if (!run) return
    run.calm = World3D.calm.orb(run.calm, id)
    World3D.update({ orbs: run.calm.found })
    if (!World3D.calm.done(run.calm)) return toast(`Đốm sương ${run.calm.progress}/${run.calm.goal}`)
    host.openPanel('guardian', run.mapId, null)
  }

  const handlers = {
    isBlocked: () => { const panel = $('#gw-panel'); return !panel || !panel.hidden || Boolean($('dialog[open]')) },
    onPrompt: showPrompt, onInteract: interact, onCollect: collect, onOrb: orb,
    onSlow: () => toast('Máy có vẻ chạy chậm. Trong Cài đặt có chất lượng Nhẹ và làng 2D.'),
    onLost: () => fail('Cảnh 3D bị dừng, chuyển sang làng 2D.')
  }

  function fail(message) {
    toast(message)
    host.rebuild('light')                                    // không ghi đè lựa chọn đã lưu: lần sau vẫn thử lại được
  }

  /** Gắn hoặc cập nhật cảnh 3D trong #gw-world. Tải thư viện lần đầu; người dùng rời đi giữa chừng thì bỏ. */
  async function show(element) {
    if (window.World3D?.isMounted(element)) { World3D.update(state()); return }
    if (loading) return
    loading = true
    const session = game().session
    if (!element.querySelector('.gw-loading3d')) element.insertAdjacentHTML('beforeend', '<p class="gw-loading3d" role="status">Đang dựng thế giới…</p>')
    try {
      if (!await World3DSupport.loadEngine()) throw new Error('engine')
      await import('/js/world3d/index.js')
      if (session !== game().session || !element.isConnected) return
      World3D.mount(element, state(), handlers)
      element.querySelector('.gw-loading3d')?.remove()
      onPanel(game().panel)
      if (!game().panel && !read(sessionStorage, INTRO_KEY)) { write(sessionStorage, INTRO_KEY, '1'); host.openPanel('title', null, null) }
    } catch {
      if (session === game().session) fail('Thiết bị chưa chạy được thế giới 3D, bạn đang ở làng 2D.')
    } finally { if (session === game().session) loading = false }
  }

  /** Tạm dừng/xem trước theo bảng đang mở. */
  function onPanel(kind) {
    if (kind !== 'guardian') stopTicker()
    if (!window.World3D?.isMounted($('#gw-world'))) return
    World3D.focusHero(kind === 'hero')
    if (kind !== 'hero' && data()) World3D.update({ avatar: data().V.cleanAvatar(data().data.avatar), pet: data().data.pet })   // bỏ bản xem thử chưa lưu
    World3D.pause(Boolean(kind), { keepLive: ['hero', 'title', 'guardian'].includes(kind) })
  }
  const preview = (avatar, pet) => { if (window.World3D?.isMounted($('#gw-world'))) World3D.update({ avatar: { ...avatar }, pet }) }

  function reset() { stopTicker(); loading = false; memo.target = null }

  /* ---------------------------------------------------------------- các bảng */
  function switchMode(mode) {
    World3DSupport.setPreference(mode)
    host.closePanel()
    host.rebuild(mode)
  }

  function mapPanel(body, title) {
    title.textContent = 'Bản đồ'
    const { data: village, world, unit } = data(), here = currentMap()
    body.innerHTML = `<p class="tk-hint">Bản đồ mới mở theo tổng ${esc(unit.name)} bạn đã nhận. Không mất ${esc(unit.name)} khi đi lại. Ngưỡng đang là bản thử nghiệm.</p>
      <ul class="gw-maps">${world.maps.map(map => `<li class="gw-map is-${map.id}${map.open ? '' : ' is-locked'}"><span class="gw-map-art" aria-hidden="true"></span>
        <span class="gw-map-copy"><b>${esc(map.name)}</b><small>${map.open ? `Kho báu ${map.treasures.filter(item => item.found).length}/${map.treasures.length}` : `Mở khi có ${map.stars} ${esc(unit.icon)} (còn ${Math.max(0, map.stars - village.stars)})`}</small></span>
        ${map.id === here ? '<span class="gw-tag">Đang ở đây</span>' : map.open ? `<button type="button" class="btn pri" data-travel="${map.id}">Đi tới</button>` : `<span class="gw-lock">${svg('lock')}Chưa mở</span>`}</li>`).join('')}</ul>`
    $$('[data-travel]', body).forEach(button => button.onclick = () => {
      memo.map = button.dataset.travel; write(sessionStorage, MAP_KEY, memo.map)
      World3D.update({ ...state() })
      host.closePanel()
      World3D.focusCanvas()
      toast(`Bạn đang ở ${mapInfo(memo.map).name}`)
    })
  }

  function npcPanel(body, title, arg) {
    const npc = World3D.mapInfo(currentMap()).npcs.find(item => item.id === arg)
    if (!npc) return host.closePanel()
    const { V } = data()
    title.textContent = npc.name
    const render = () => {
      const code = npc.codes[memo.npcPage % npc.codes.length]
      body.innerHTML = `<div class="gw-npc"><span class="gw-npc-face" aria-hidden="true">${V.avatarSvg(npc.avatar, npc.name)}</span><p class="gw-say" aria-live="polite">${esc(V.MECHANISMS[code] || 'Chúc bạn một ngày dễ chịu!')}</p></div>
        <div class="gw-panel-actions"><button type="button" class="btn pri" data-more>Kể thêm</button><button type="button" class="btn" data-goto="quests">Việc hôm nay</button></div>
        <p class="tk-hint">Đây là kiến thức phổ thông, không phải chẩn đoán hay lời khuyên y khoa.</p>`
      $('[data-more]', body).onclick = () => { memo.npcPage++; render(); $('[data-more]', body).focus() }
      $$('[data-goto]', body).forEach(button => button.onclick = () => host.openPanel(button.dataset.goto, null, null))
    }
    render()
  }

  function guardianPanel(body, title, mapId) {
    stopTicker()
    const info = mapInfo(mapId)
    if (!info) return host.closePanel()
    const guardian = info.guardian, village = data().data, name = esc(guardian.name)
    title.textContent = guardian.name
    if (!guardian.awake && !guardian.calmed) {
      body.innerHTML = `<p class="gw-tag is-soon">Đang ngủ ngon</p><p>${name} sẽ thức khi bạn đã làm <b>${guardian.completions}</b> việc nhỏ. Hiện bạn đã làm <b>${village.completions}</b>.</p>
        <div class="gw-xp gw-xp-lg" role="progressbar" aria-label="Tiến độ để ${name} thức" aria-valuemin="0" aria-valuemax="${guardian.completions}" aria-valuenow="${Math.min(village.completions, guardian.completions)}"><i style="width:${Math.min(100, village.completions / guardian.completions * 100)}%"></i></div>
        <p class="tk-hint">Không có hạn chót. ${name} luôn chờ ở đây.</p><button type="button" class="btn pri" data-goto="quests">Xem việc hôm nay</button>`
      $$('[data-goto]', body).forEach(button => button.onclick = () => host.openPanel(button.dataset.goto, null, null))
      return
    }
    const api = World3D.calm
    let calm = memo.calm[mapId] || (memo.orbRun?.mapId === mapId ? memo.orbRun.calm : null)
    if (calm && api.done(calm)) return celebrate(body, mapId)
    if (guardian.calmed && !calm) {
      body.innerHTML = `<p class="gw-tag">${svg('check')}Đã dịu lại</p><p>${name} đang vui. Kỷ vật của bạn: <b>${esc(guardian.keepsake)}</b>.</p><button type="button" class="btn" data-again>Chơi lại cho vui</button>`
      $('[data-again]', body).onclick = () => { memo.calm[mapId] = api.create(guardian.game, guardian.goal); if (memo.orbRun?.mapId === mapId) memo.orbRun = null; guardianPanel(body, title, mapId) }
      return
    }
    calm ||= api.create(guardian.game, guardian.goal)
    memo.calm[mapId] = calm
    const meter = () => `<div class="gw-calm"><span>Bình yên <b data-calm-count>${memo.calm[mapId].progress}/${calm.goal}</b></span><div class="gw-xp gw-xp-lg" role="progressbar" aria-label="Mức bình yên của ${name}" aria-valuemin="0" aria-valuemax="${calm.goal}" aria-valuenow="${memo.calm[mapId].progress}"><i style="width:${memo.calm[mapId].progress / calm.goal * 100}%"></i></div></div>`
    const step = (next, message) => {
      memo.calm[mapId] = next
      $('[data-calm-count]', body).textContent = `${next.progress}/${next.goal}`
      const bar = $('.gw-calm [role=progressbar]', body); bar.setAttribute('aria-valuenow', next.progress); bar.firstElementChild.style.width = `${next.progress / next.goal * 100}%`
      $('[data-calm-say]', body).textContent = message
      if (api.done(next)) { stopTicker(); celebrate(body, mapId) }
    }
    const frame = inner => `${meter()}${inner}<p class="gw-calm-say" data-calm-say role="status"></p><p class="tk-hint">Không có thua cuộc hay giới hạn thời gian. Đóng bảng rồi quay lại lúc nào cũng được.</p>`

    if (guardian.game === 'breath') {
      const started = Date.now()
      body.innerHTML = frame(`<p>Bấm <b>Thở cùng</b> trong lúc vòng tròn đang <b>hít vào</b>. Bạn thở theo nhịp thoải mái của mình, không cần nín thở.</p>
        <div class="gw-breath" data-phase="inhale" aria-hidden="true"><span></span></div><p class="gw-phase" data-phase-label aria-live="polite"></p><button type="button" class="btn pri btn-block" data-breathe>Thở cùng ${name}</button>`)
      let shown = ''
      const paint = () => {
        const phase = RewardGames.phaseAt((Date.now() - started) / 1000)
        if (phase.key === shown || !body.isConnected) return
        shown = phase.key
        const circle = $('.gw-breath', body); if (!circle) return stopTicker()
        circle.dataset.phase = phase.key; $('[data-phase-label]', body).textContent = phase.label
      }
      paint(); ticker = setInterval(paint, 200)
      $('[data-breathe]', body).onclick = () => {
        const elapsed = (Date.now() - started) / 1000, next = api.breath(memo.calm[mapId], elapsed, RewardGames.phaseAt(elapsed).key)
        step(next, next === memo.calm[mapId] ? 'Cứ thong thả, đợi nhịp hít vào tiếp theo nhé.' : `${guardian.name} dịu thêm một chút.`)
      }
    } else if (guardian.game === 'order') {
      const render = () => {
        body.innerHTML = frame(`<p>Thắp đèn lồng lần lượt <b>từ nhỏ đến lớn</b> để ${name} dễ ngủ.</p>
          <div class="gw-lanterns">${api.lanterns.map(size => `<button type="button" class="gw-lantern${size <= memo.calm[mapId].progress ? ' is-lit' : ''}" style="--size:${size}" data-lantern="${size}" aria-label="Đèn cỡ ${size}${size <= memo.calm[mapId].progress ? ', đã thắp' : ''}"><i aria-hidden="true"></i><b>${size}</b></button>`).join('')}</div>`)
        $$('[data-lantern]', body).forEach(button => button.onclick = () => {
          const before = memo.calm[mapId], next = api.order(before, Number(button.dataset.lantern))
          if (next === before) return step(before, 'Thử chiếc đèn khác nhé.')
          memo.calm[mapId] = next
          if (api.done(next)) return celebrate(body, mapId)
          render(); $('[data-calm-say]', body).textContent = 'Một chiếc đèn nữa đã sáng.'; $(`[data-lantern="${next.progress + 1}"]`, body)?.focus()
        })
      }
      render()
    } else {
      body.innerHTML = frame(`<p>Quanh hồ có <b>${calm.goal} đốm sương</b>. Đi chạm vào từng đốm để ${name} thấy mát lành.</p>
        <button type="button" class="btn pri btn-block" data-orbs>${memo.orbRun?.mapId === mapId ? 'Tiếp tục tìm' : 'Bắt đầu tìm đốm sương'}</button>`)
      $('[data-orbs]', body).onclick = () => {
        if (memo.orbRun?.mapId !== mapId) memo.orbRun = { mapId, calm: memo.calm[mapId] }
        delete memo.calm[mapId]                                  // tiến độ nằm trong memo.orbRun
        host.closePanel()
        World3D.update({ orbs: memo.orbRun.calm.found }); World3D.focusCanvas()
        toast('Các đốm sương đã hiện ra quanh hồ')
      }
    }
  }

  function celebrate(body, mapId) {
    stopTicker()
    const info = mapInfo(mapId), guardian = info.guardian, collecting = data().world.collecting, name = esc(guardian.name)
    delete memo.calm[mapId]
    if (memo.orbRun?.mapId === mapId) { memo.orbRun = null; World3D.update({ orbs: null }) }
    body.innerHTML = `<div class="gw-reward"><span class="gw-reward-art" aria-hidden="true"></span><h3>${name} đã dịu lại</h3>
      <p data-keepsake role="status">${guardian.calmed ? `Kỷ vật <b>${esc(guardian.keepsake)}</b> đã ở trong túi của bạn.` : collecting ? 'Đang cất kỷ vật…' : `Cảm ơn bạn! Kỷ vật sẽ được cất khi nhóm nghiên cứu bật sưu tầm.`}</p>
      <button type="button" class="btn pri" data-done>Tiếp tục khám phá</button></div>`
    $('[data-done]', body).onclick = () => host.closePanel()
    window.RewardGames?.celebrate($('.gw-reward', body))
    if (!guardian.calmed && collecting) collect(guardian.key).then(result => {
      const slot = $('[data-keepsake]', body)
      if (!slot) return
      if (result) slot.innerHTML = `Kỷ vật <b>${esc(guardian.keepsake)}</b> đã ở trong túi của bạn.`
      else { slot.textContent = 'Chưa cất được kỷ vật. '; slot.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-sm" data-retry>Thử lại</button>'); $('[data-retry]', slot).onclick = () => celebrate(body, mapId) }
    })
  }

  function titlePanel(body, title) {
    title.textContent = 'Chào mừng đến Làng nhỏ 3D'
    body.innerHTML = `<p><span class="gw-beta">BETA</span> Thế giới 3D đang thử nghiệm.</p><p>Đi dạo, trò chuyện, tìm kho báu và làm những việc nhỏ cho giấc ngủ của bạn. Mọi việc đều mở được ngay từ thanh dưới, không cần đi bộ tới.</p>
      <div class="gw-title-actions"><button type="button" class="btn pri btn-block" data-play>Chơi</button><button type="button" class="btn btn-block" data-goto="hero">Chọn nhân vật</button>
      <button type="button" class="btn btn-block" data-goto="settings">Cài đặt</button><button type="button" class="btn btn-block" data-light>Chế độ nhẹ (làng 2D)</button></div>
      <p class="tk-hint"><b>Chuột:</b> bấm vào cảnh rồi rê chuột để xoay camera, bấm Esc để lấy lại chuột.<br><b>Phím:</b> WASD hoặc mũi tên để đi, Shift chạy, Space nhảy, E tương tác, Q và R xoay góc nhìn.<br><b>Điện thoại:</b> dùng cần gạt, kéo để xoay.</p>`
    $('[data-play]', body).onclick = () => { host.closePanel(); World3D.focusCanvas(); World3D.lockMouse() }
    $('[data-light]', body).onclick = () => switchMode('light')
  }

  /** Bảng chỉ có trong thế giới 3D. Trả true nếu đã dựng (hoặc đã đóng). */
  function panel(kind, arg, body, title) {
    if (!['map', 'npc', 'guardian', 'title'].includes(kind)) return false
    if (!data()?.world || !window.World3D?.isMounted($('#gw-world'))) { host.closePanel(); return true }
    if (kind === 'map') mapPanel(body, title)
    else if (kind === 'npc') npcPanel(body, title, arg)
    else if (kind === 'guardian') guardianPanel(body, title, arg || currentMap())
    else titlePanel(body, title)
    return true
  }

  /** Phần thêm vào các bảng sẵn có. */
  function extend(kind, body) {
    const ctx = data(), world = ctx.world
    if (kind === 'bag' && world) {
      body.insertAdjacentHTML('beforeend', `<h3 class="gw-sub">Kho báu và kỷ vật</h3>${world.collecting ? '' : '<p class="tk-hint">Sưu tầm chưa được bật, nên kho báu chưa xuất hiện trong thế giới.</p>'}
        ${world.maps.map(map => `<h4 class="gw-sub2">${esc(map.name)}</h4><ul class="gw-finds">${[...map.treasures.map(item => ({ name: item.name, found: item.found })), { name: map.guardian.keepsake, found: map.guardian.calmed, special: true }]
          .map(item => `<li class="${item.found ? 'is-found' : ''}${item.special ? ' is-keep' : ''}"><i aria-hidden="true"></i><span>${item.found ? esc(item.name) : 'Chưa tìm thấy'}</span></li>`).join('')}</ul>`).join('')}`)
    }
    if (kind === 'codex' && world) {
      const list = window.World3D?.achievements(ctx.data, world.maps) || []
      body.insertAdjacentHTML('beforeend', `<h3 class="gw-sub">Thành tích của bạn (${list.filter(item => item.done).length}/${list.length})</h3><p class="tk-hint">Chỉ của riêng bạn, không so sánh với ai, không có hạn.</p>
        <ul class="gw-awards">${list.map(item => `<li class="${item.done ? 'is-done' : ''}">${item.done ? svg('check') : '<i aria-hidden="true"></i>'}<span>${esc(item.title)}</span><span class="sr-only">${item.done ? ' (đã đạt)' : ' (chưa đạt)'}</span></li>`).join('')}</ul>`)
    }
    if (kind === 'settings') {
      const inside = Boolean(world)
      if (!inside && !canUse3d()) return
      body.insertAdjacentHTML('afterbegin', `<div class="gw-setting"><span><b>Thế giới</b><small>${inside ? 'Bạn đang ở thế giới 3D (beta).' : 'Bạn đang ở làng 2D (chế độ nhẹ).'}</small></span>
        ${inside ? `<label class="gw-quality">Chất lượng hình<select class="sel" id="gw-quality"><option value="normal"${quality() === 'normal' ? ' selected' : ''}>Bình thường</option><option value="low"${quality() === 'low' ? ' selected' : ''}>Nhẹ (máy yếu)</option></select></label><button type="button" class="btn" id="gw-to-2d">Chuyển sang làng 2D</button>` : '<button type="button" class="btn pri" id="gw-to-3d">Vào thế giới 3D <span class="gw-beta">BETA</span></button>'}</div>`)
      const select = $('#gw-quality', body)
      if (select) select.onchange = () => { write(localStorage, QUALITY_KEY, select.value); World3D.update({ quality: select.value }) }
      $('#gw-to-2d', body)?.addEventListener('click', () => switchMode('light'))
      $('#gw-to-3d', body)?.addEventListener('click', () => switchMode('3d'))
    }
  }

  window.WorldUI = { connect: api => { host = api }, canUse3d, prepare, show, onPanel, preview, panel, extend, reset }
})()
