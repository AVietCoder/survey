/* brainst0rm — Progress Tracking (frontend)
   Nạp TRƯỚC app.js; dùng các helper toàn cục của app.js tại thời điểm gọi:
   $, $$, esc, svg, toast, shell, loading, fail, emptyState, setButtonLoading, confirmAction, credit, app, TN.
   Mọi dữ liệu lấy từ API thật (/api/track/* cho người tham gia, /api/tracking/* cho researcher). */
const Tracking = (() => {
  'use strict'

  /* ---------- gọi API (KHÔNG dùng api() của app.js: nó coi mọi 401 là "hết phiên researcher" và đăng xuất) ---------- */
  async function tapi(method, path, body) {
    const res = await fetch('/api' + path, {
      method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw Object.assign(new Error(json.error || 'Có lỗi xảy ra'), { status: res.status, code: json.code })
    return json
  }

  /* ---------- định dạng ---------- */
  const fmtDate = v => (v ? new Date(v).toLocaleDateString('vi-VN') : '—')
  const fmtDateTime = v => (v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
  const fmtScore = v => (v === null || v === undefined ? '—' : Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
  function maybeShowLocalReminder(enabled) {
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return
    const date = new Date(), key = `brainst0rm-reminder-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    try { if (localStorage.getItem('brainst0rm-reminder-notifications') !== 'enabled' || localStorage.getItem('brainst0rm-reminder-last') === key) return } catch { return }
    try {
      const notice = new Notification('brainst0rm', { body: 'Hôm nay bạn muốn làm việc nhỏ nào?', tag: 'brainst0rm-gentle-reminder' })
      notice.onclick = () => { notice.close(); window.focus(); location.hash = '#/track/tasks' }
      try { localStorage.setItem('brainst0rm-reminder-last', key) } catch { /* no persistent browser storage */ }
    } catch { /* browser may block notifications in this context */ }
  }
  const STATUS = {
    upcoming: ['Chưa đến hạn', 'c-end'], due_soon: ['Sắp đến hạn', 'c-warn'], due: ['Đến hạn', 'c-run'],
    overdue: ['Quá hạn', 'c-bad'], completed: ['Đã đủ số lần đo', 'c-ok'], unscheduled: ['Không có lịch', 'c-end']
  }
  const KIND = { cookie: 'Thiết bị đã đăng nhập', recovery_code: 'Mã khôi phục', recovery_link: 'Liên kết khôi phục (dùng một lần)' }
  const statusChip = schedule => {
    const [label, tone] = STATUS[schedule?.status] || STATUS.unscheduled
    return `<span class="chip ${tone}">${label}</span>`
  }
  function scheduleText(schedule) {
    if (!schedule || schedule.status === 'unscheduled') return 'Nhà nghiên cứu chưa đặt lịch đo định kỳ cho khảo sát này.'
    if (schedule.status === 'completed') return 'Bạn đã hoàn thành đủ số lần đo theo lịch.'
    const days = schedule.daysUntilDue
    const when = days > 0 ? `còn ${days} ngày` : days === 0 ? 'hôm nay' : `đã quá ${-days} ngày`
    return `Lần đo tiếp theo dự kiến: ${fmtDate(schedule.nextDueAt)} (${when}). Bạn có thể làm sớm hoặc muộn hơn, khảo sát không bị khóa.`
  }

  /* ---------- khung trang người tham gia (không cần tài khoản) ---------- */
  function frame(inner, { wide = false, bare = false } = {}) {
    document.onkeydown = null
    app().className = 'app bare tk-app'
    const current = (location.hash.split('/')[2] || 'home') === 'tasks' ? 'village' : (location.hash.split('/')[2] || 'home')
    const participantTab = ['pet', 'tasks', 'inventory', 'village']
    const navItem = (key, label, icon, href) => { const active = current === key || (key === 'home' && !participantTab.includes(current)); return `<a href="${href}" class="${active ? 'on' : ''}" ${active ? 'aria-current="page"' : ''}><span class="tk-nav-icon">${svg(icon)}</span><span>${label}</span></a>` }
    app().innerHTML = `<div class="tk">
      <header class="tk-top"><a class="logo sv-logo" href="#/track" aria-label="brainst0rm — tiến triển của tôi"><i></i><span class="brand-word">brainst0rm</span></a>
        <a class="tk-top-link" href="#/track">Tiến triển của tôi</a></header>
      ${bare ? '' : `<nav class="tk-bottom-nav" aria-label="Điều hướng học sinh">${navItem('home','Tiến độ','trend','#/track')}${navItem('village','Vào game','home','#/track/village')}</nav>`}
      <main class="tk-main ${wide ? 'tk-wide' : ''}" id="tk-main">${inner}</main>${credit}</div>`
    window.scrollTo(0, 0)
  }
  const loadingBlock = () => `<div class="tk-loading" role="status" aria-live="polite" aria-busy="true"><span class="spinner" aria-hidden="true"></span>Đang tải…</div>`
  const failBlock = (message, retryId = 'tk-retry') => `<section class="tk-card tk-error" role="alert"><h2>Chưa thể tải nội dung</h2><p>${esc(message)}</p>
    <button class="btn pri" id="${retryId}" type="button">Thử lại</button></section>`

  async function copyText(text, done = 'Đã sao chép') {
    try { await navigator.clipboard.writeText(text); toast(done) } catch { toast('Không thể sao chép trên thiết bị này. Hãy chọn và chép thủ công.', 'error') }
  }

  /* ---------- hiển thị bí mật (chỉ một lần) ---------- */
  const secretPanel = (title, value, hint, id) => `<div class="tk-secret" role="group" aria-label="${esc(title)}">
    <strong>${esc(title)}</strong><code id="${id}" tabindex="0">${esc(value)}</code>
    <p>${hint}</p>
    <button class="btn" type="button" data-copy="${id}">${svg('copy')}Sao chép</button></div>`
  const wireCopy = root => $$('[data-copy]', root).forEach(button => {
    button.onclick = () => copyText($('#' + button.dataset.copy).textContent.trim())
  })
  const recoveryLink = token => `${location.origin}${location.pathname}#/track/recover/${token}`

  /* =====================================================================
     Trang khảo sát công khai: ngữ cảnh, lựa chọn trước khi làm, đăng ký sau khi xong
     ===================================================================== */
  async function context(slug) {
    try { return await tapi('GET', `/track/context/${encodeURIComponent(slug)}`) } catch { return { enabled: false } }
  }

  function introHtml(trk) {
    if (!trk?.enabled) return ''
    if (trk.hasProfile && trk.consentOk) return `<label class="tk-opt"><input type="checkbox" id="track-opt" checked>
      <span><b>Lưu kết quả lần này vào tiến triển của bạn</b>
      <small>Hồ sơ theo dõi ẩn danh trên trình duyệt này. <a href="#/track" target="_blank" rel="noopener">Xem tiến triển</a></small></span></label>`
    if (trk.hasProfile) return `<p class="tk-note">${svg('info')}<span>Nội dung đồng ý theo dõi đã được cập nhật. Sau khi hoàn thành, bạn sẽ được hỏi lại trước khi lưu kết quả.</span></p>`
    return `<p class="tk-note">${svg('trend')}<span>Khảo sát này hỗ trợ <b>theo dõi tiến triển</b> (tùy chọn). Sau khi hoàn thành, bạn có thể chọn lưu kết quả để so sánh giữa các lần làm${trk.rewardsEnabled ? ' và mở khu nhiệm vụ trò chơi' : ''}.
      <a href="#/track/recover" target="_blank" rel="noopener">Đã có hồ sơ? Khôi phục</a></span></p>`
  }
  const wantsTrack = trk => Boolean(trk?.hasProfile && trk.consentOk && $('#track-opt')?.checked)

  function consentForm(trk) {
    const returning = trk.hasProfile && trk.consentOk
    if (returning) return `<p>Bạn đã đồng ý nội dung theo dõi cho khảo sát này trước đó.</p>
      <button class="btn pri" type="button" id="track-save">${svg('trend')}Lưu kết quả lần này vào tiến triển</button>`
    return `<details class="tk-has-account"><summary>Đã có tài khoản học sinh? Đăng nhập để lưu vào hồ sơ cũ</summary>
        <form id="track-relogin" class="tk-form" novalidate>
          <label for="track-re-user">Tên đăng nhập</label><input class="in" id="track-re-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30">
          <label for="track-re-pass">Mật khẩu</label><input class="in" id="track-re-pass" type="password" autocomplete="current-password" maxlength="72">
          <p class="err" id="track-re-error" role="alert"></p>
          <button class="btn" type="submit" id="track-re-go">Đăng nhập</button></form></details>
      <details class="tk-consent"><summary>Đọc nội dung đồng ý (phiên bản ${esc(trk.consentVersion)})</summary><div class="tk-consent-text">${esc(trk.consentText)}</div></details>
      <form id="track-form" class="tk-form" novalidate>
        ${trk.adultAttestation ? `<label class="tk-check"><input type="checkbox" id="track-adult"><span>Tôi xác nhận mình từ 18 tuổi trở lên.</span></label>` : ''}
        <label class="tk-check"><input type="checkbox" id="track-agree"><span>Tôi đã đọc và đồng ý với nội dung trên. Tôi hiểu có thể xóa hồ sơ bất cứ lúc nào.</span></label>
        <fieldset class="tk-acc-inline"><legend>Tạo tài khoản đăng nhập <small>(không bắt buộc)</small></legend>
          <p class="tk-hint">Để quay lại làng nhỏ và nhiệm vụ trên mọi thiết bị. Không cần email hay số điện thoại; không dùng họ tên thật.</p>
          <label for="track-user">Tên đăng nhập</label>
          <input class="in" id="track-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="vd: meo_con_2009">
          <label for="track-pass">Mật khẩu</label>
          <input class="in" id="track-pass" type="password" autocomplete="new-password" maxlength="72" placeholder="Tối thiểu 8 ký tự"></fieldset>
        <p class="err" id="track-error" role="alert"></p>
        <button class="btn pri" type="submit" id="track-go" disabled>${svg('trend')}Tạo hồ sơ theo dõi</button></form>`
  }

  /** Kết quả mức điểm sau khi nộp bài: hoạt động kể cả khi không tạo hồ sơ theo dõi. Không chẩn đoán. */
  function bandHtml(band) {
    if (!band) return ''
    const label = band.showLabel && band.label ? `<section class="tk-card tk-band tk-band-${esc(band.tone || 'n')}" aria-labelledby="band-title"><span class="tk-band-dot" aria-hidden="true"></span><div><h2 id="band-title">${esc(band.label)}</h2>
      <p>Đây là gợi ý dựa trên câu trả lời của bạn, giúp bạn chọn việc nhỏ phù hợp. Đây không phải là chẩn đoán hay đánh giá về bạn.</p></div></section>` : ''
    const support = band.support ? `<section class="tk-card tk-support" aria-labelledby="support-title">${svg('heart')}<div><h2 id="support-title">Cần người lắng nghe?</h2>
      <p class="tk-support-text">${esc(band.support)}</p><p class="tk-hint">Bạn không cần chờ đến khi mọi chuyện tệ hơn mới tìm sự giúp đỡ.</p></div></section>` : ''
    return label + support
  }

  function doneHtml(trk, state) {
    if (!trk?.enabled) return ''
    const saved = state.result?.tracking
    if (saved?.status === 'saved') return `<section class="tk-card tk-done" id="track-done">${savedMessage(saved.session, trk.rewardsEnabled)}</section>`
    const unchecked = trk.hasProfile && trk.consentOk
    return `<section class="tk-card tk-done" id="track-done"><h2>${unchecked ? 'Bạn chưa lưu kết quả lần này' : 'Theo dõi tiến triển của bạn'}</h2>
      <p>Lưu kết quả “${esc(trk.assessmentName)}” để so sánh với các lần làm sau. Kết quả được tính thành một điểm số đơn giản. brainst0rm không chẩn đoán; mọi gợi ý chỉ để tham khảo.${trk.rewardsEnabled ? ' Nếu đồng ý tạo hồ sơ sau khi nộp bài, bạn cũng có thể mở khu nhiệm vụ trò chơi.' : ''}</p>
      <div id="track-body">${consentForm(trk)}</div></section>`
  }
  const savedMessage = (session, rewardsEnabled = false) => `<h2>${svg('check')}Đã lưu vào tiến triển của bạn</h2>
    <p>Kết quả lần này đã được thêm vào hồ sơ theo dõi${session?.assessmentName ? ` “${esc(session.assessmentName)}”` : ''}.</p>
    <div class="tk-actions"><a class="btn" href="#/track">${svg('trend')}Xem tiến triển</a>${rewardsEnabled ? `<a class="btn pri" href="#/track/village">Vào game</a>` : ''}</div>`

  function wireDone(trk, state, slug) {
    if (!trk?.enabled || state.result?.tracking?.status === 'saved') return
    const body = $('#track-body')
    if (!body) return
    const submit = async button => {
      const wantUser = ($('#track-user')?.value || '').trim(), wantPass = $('#track-pass')?.value || ''
      if ((wantUser || wantPass) && (!wantUser || wantPass.length < 8)) {
        const slot = $('#track-error'); if (slot) slot.textContent = !wantUser ? 'Hãy nhập tên đăng nhập hoặc xóa ô mật khẩu.' : 'Mật khẩu cần từ 8 ký tự.'
        return
      }
      const restore = setButtonLoading(button, 'Đang lưu…')
      try {
        const result = await tapi('POST', '/track/enroll', {
          slug, responseId: state.result?.responseId || state.rid,
          consent: trk.hasProfile && trk.consentOk ? undefined
            : { accepted: true, adultConfirmed: Boolean($('#track-adult')?.checked), version: trk.consentVersion }
        })
        const target = $('#track-done')
        // Tài khoản học sinh (tùy chọn) tạo ngay sau hồ sơ; chỉ khi có tài khoản mới có đường vào game.
        let made = null, accountProblem = '', hasAccount = false
        if (wantUser) { try { made = (await tapi('POST', '/track/account', { username: wantUser, password: wantPass })).account } catch (error) { accountProblem = error.message } }
        if (made) hasAccount = true
        else { try { const info = await tapi('GET', '/track/account'); hasAccount = Boolean(info.account) } catch { /* bảng tài khoản chưa có */ } }
        const gameCta = hasAccount && trk.rewardsEnabled
        target.innerHTML = savedMessage(result.session, gameCta) + (result.recoveryCode
          ? secretPanel('Mã khôi phục của bạn', result.recoveryCode,
            'Hãy lưu mã này ở nơi an toàn. <b>Mã chỉ hiển thị một lần.</b> Bạn cần nó để quay lại trên thiết bị khác hoặc khi xóa dữ liệu trình duyệt. Không chia sẻ mã với người khác.', 'track-recovery-code') : '')
        if (made) target.insertAdjacentHTML('beforeend', `<div class="tk-acc-after"><p class="tk-done-note">${svg('check')}Đã tạo tài khoản <b>${esc(made.username)}</b>. Lần sau vào <a href="#/track/login">Khu học sinh</a> để đăng nhập.</p></div>`)
        if (accountProblem) toast(`Đã tạo hồ sơ nhưng chưa tạo được tài khoản: ${accountProblem}`, 'error')
        if (!hasAccount && trk.rewardsEnabled) {
          target.insertAdjacentHTML('beforeend', `<div class="tk-acc-after"><h3>Muốn chơi game?</h3>
            <p class="tk-hint">Game chỉ dành cho học sinh có tài khoản. Tạo tên đăng nhập và mật khẩu (không cần email) để vào. Bạn vẫn xem được tiến triển mà không cần tài khoản.</p>${accountFormHtml('tk-acc-new')}</div>`)
          wireAccountForm('tk-acc-new', account => { const box = $('.tk-acc-after', target); if (box) box.innerHTML = `<p class="tk-done-note">${svg('check')}Đã tạo tài khoản <b>${esc(account.username)}</b>.</p><div class="tk-actions"><a class="btn pri" href="#/track/village">Vào game</a></div>` })
        }
        wireCopy(target)
      } catch (error) {
        restore()
        const slot = $('#track-error')
        if (slot) slot.textContent = error.message; else toast(error.message, 'error')
      }
    }
    const save = $('#track-save')
    if (save) save.onclick = () => submit(save)
    const relogin = $('#track-relogin')
    if (relogin) relogin.onsubmit = async event => {
      event.preventDefault()
      const slot = $('#track-re-error'), user = $('#track-re-user').value.trim(), pass = $('#track-re-pass').value
      if (!user || !pass) { slot.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return }
      const restore = setButtonLoading($('#track-re-go'), 'Đang đăng nhập…')
      try {
        await tapi('POST', '/track/account/login', { username: user, password: pass })
        Object.assign(trk, await context(slug))           // hồ sơ + đồng ý hiện có của tài khoản này
        body.innerHTML = consentForm(trk)
        toast('Đã đăng nhập. Bạn có thể lưu kết quả vào hồ sơ cũ.')
        wireDone(trk, state, slug)
      } catch (error) { restore(); slot.textContent = error.message }
    }
    const form = $('#track-form')
    if (!form) return
    const sync = () => { $('#track-go').disabled = !($('#track-agree').checked && (!$('#track-adult') || $('#track-adult').checked)) }
    $$('input[type=checkbox]', form).forEach(box => box.onchange = sync)
    form.onsubmit = event => { event.preventDefault(); if (!$('#track-go').disabled) submit($('#track-go')) }
  }

  /* =====================================================================
     Người tham gia: khôi phục, dashboard, chi tiết
     ===================================================================== */
  function participantRoute(arg, detail) {
    if (arg === 'recover') return recoverView(detail)
    if (arg === 'login') return loginView()
    if (arg === 'village') return gameView(null)
    if (arg === 'tasks') return gameView('quests')
    if (arg === 'pet') return gameView('hero')
    if (arg === 'inventory') return gameView('bag')
    if (arg) return assessmentView(arg)
    return dashboardView()
  }

  /* =====================================================================
     Nhiệm vụ hôm nay (reward system giai đoạn 2). Giọng điệu nhẹ nhàng: không phạt, không đếm ngày bỏ lỡ.
     ===================================================================== */
  let taskTicker = null
  const REWARD_KIND_LABEL = { title: 'Danh hiệu', badge: 'Huy hiệu', sticker: 'Sticker', theme: 'Giao diện', pet_item: 'Đồ trang trí thú cưng' }
  const ITEM_ART = {
    star: '<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
    leaf: '<path d="M20.5 3.5C12 3.7 5.2 5.1 4 11.3c-.7 3.5 2.3 5.7 5.4 4.5 4.8-1.9 7-7.3 7-7.3s-1.2 5-7.8 8.5c-2.1 1.1-4 1.6-5.6 1.8"/>',
    moon: '<path d="M19.5 15.4A8 8 0 0 1 8.6 4.5 8.5 8.5 0 1 0 19.5 15.4Z"/>',
    heart: '<path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  }
  const timerKey = code => `tk-timer-${code}`
  const readTimer = code => { try { return sessionStorage.getItem(timerKey(code)) } catch { return null } }
  const writeTimer = (code, value) => { try { value ? sessionStorage.setItem(timerKey(code), value) : sessionStorage.removeItem(timerKey(code)) } catch { /* sessionStorage có thể bị chặn */ } }
  const clockText = seconds => `${Math.floor(seconds / 60)}:${String(Math.max(0, Math.ceil(seconds % 60))).padStart(2, '0')}`

  function taskAction(task) {
    if (task.completed) return `<p class="tk-done-note">${svg('check')}Bạn đã hoàn thành nhiệm vụ này hôm nay</p>`
    if (!task.available) return `<p class="tk-hint">Nhiệm vụ này làm được trong khung giờ ${esc(task.window?.start || '')}–${esc(task.window?.end || '')}.</p>`
    if (task.completionType === 'timer') {
      const started = readTimer(task.code)
      const elapsed = started ? Math.max(0, (Date.now() - new Date(started)) / 1000) : 0
      return started
        ? `<div class="tk-timer ${task.game ? `has-game game-${esc(task.game)}` : ''}" data-timer="${esc(task.code)}" data-started="${esc(started)}" data-min="${task.minSeconds}">${window.RewardGames?.timer(task.game, elapsed) || ''}<b class="tk-clock" aria-live="off">--:--</b>
            <button class="btn pri" type="button" data-act="complete" data-code="${esc(task.code)}" disabled>Hoàn thành</button>${task.game === 'breathing' ? `<button class="btn" type="button" data-act="cancel" data-code="${esc(task.code)}">Dừng bài thở</button>` : ''}</div>`
        : `<button class="btn pri" type="button" data-act="start" data-code="${esc(task.code)}">Bắt đầu${task.minSeconds ? ` (${clockText(task.minSeconds)})` : ''}</button>`
    }
    if (task.game === 'three_plans') return window.RewardGames.threePlans(esc(task.code), task.minCount)
    if (task.completionType === 'count_chars')
      return `<label class="tk-lbl" for="tk-text-${esc(task.code)}">Ghi vào đây (chỉ đếm số ký tự, nội dung không được gửi đi hay lưu)</label>
        <textarea class="in" id="tk-text-${esc(task.code)}" rows="3" maxlength="600" data-count-for="${esc(task.code)}" data-min="${task.minCount}"></textarea>
        <p class="tk-hint" data-count-hint="${esc(task.code)}">0 / ${task.minCount} ký tự</p>
        <button class="btn pri" type="button" data-act="complete" data-code="${esc(task.code)}" disabled>Xong</button>`
    if (task.completionType === 'choice')
      return `<div class="tk-choices" role="radiogroup" aria-label="Bạn đã chọn cách nào?">${task.choices.map((choice, index) => `<label class="tk-check"><input type="radio" name="tk-choice-${esc(task.code)}" value="${esc(choice)}" ${index === 0 ? '' : ''}><span>${esc(choice)}</span></label>`).join('')}</div>
        <button class="btn pri" type="button" data-act="complete" data-code="${esc(task.code)}" disabled>Xong</button>`
    return `<button class="btn pri" type="button" data-act="complete" data-code="${esc(task.code)}">Mình đã làm</button>`
  }

  function taskCard(task, unit) {
    return `<article class="tk-card tk-task ${task.completed ? 'is-done' : ''}" data-task="${esc(task.code)}">
      <div class="tk-task-head"><h2>${esc(task.name)}</h2><span class="chip c-run">+${task.points} ${esc(unit.icon)}</span></div>
      <p>${esc(task.description)}</p>${task.instructions ? `<p class="tk-hint">${esc(task.instructions)}</p>` : ''}
      ${window.Village?.mechanismFor(task.code) ? `<details class="tk-why"><summary>Vì sao việc này có ích?</summary><p>${esc(window.Village.mechanismFor(task.code))}</p></details>` : ''}
      ${task.placeholder ? '<p class="tk-hint tk-temp">Nhiệm vụ mẫu (nội dung tạm thời, chưa phải bản chính thức).</p>' : ''}
      <div class="tk-task-action">${taskAction(task)}</div></article>`
  }

  /** Phần thân của "Việc hôm nay": ví Sao, chuỗi ngày, danh sách nhiệm vụ, hỗ trợ. Dùng cho trang Nhiệm vụ và bên trong game. */
  function tasksBody(data) {
      const unit = data.unit
      const meter = (label, part) => `<div class="tk-meter"><div class="tk-meter-top"><span>${label}</span><b>${part.earned} / ${part.cap} ${esc(unit.icon)}</b></div>
        <div class="tk-meter-bar" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${part.cap}" aria-valuenow="${part.earned}"><i style="width:${Math.min(100, part.earned / part.cap * 100)}%"></i></div></div>`
      const support = data.support ? `<section class="tk-card tk-support" aria-labelledby="tk-support-title">${svg('heart')}<div><h2 id="tk-support-title">Bạn cần người đồng hành?</h2><p class="tk-support-text">${esc(data.support)}</p></div></section>` : ''
      const streak = data.streak ? `<section class="tk-card tk-streak" aria-labelledby="tk-streak-title"><div><h2 id="tk-streak-title">Chuỗi ngày của bạn</h2>
        <p><b class="num">${data.streak.current}</b> ngày hiện tại <span aria-hidden="true">·</span> <b class="num">${data.streak.best}</b> ngày dài nhất</p>
        <p class="tk-hint">Chuỗi chỉ để khích lệ. Nghỉ một ngày không làm mất điểm hay tiến trình của bạn.</p></div>
        <div class="tk-rest-card"><label for="tk-rest-date">Dùng Thẻ nghỉ cho</label><select class="sel" id="tk-rest-date" ${data.streak.restCardsLeft < 1 ? 'disabled' : ''}>
          <option value="${esc(data.localDate)}">Hôm nay</option><option value="${esc(new Date(new Date(`${data.localDate}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10))}">Hôm qua</option></select>
          <button class="btn" type="button" data-rest-card ${data.streak.restCardsLeft < 1 ? 'disabled' : ''}>Dùng Thẻ nghỉ · còn ${data.streak.restCardsLeft}/${data.streak.restCardsPerWeek}</button></div></section>` : ''
      return `<section class="tk-card tk-wallet"><div class="tk-wallet-total"><span class="tk-star" aria-hidden="true">${esc(unit.icon)}</span><div><small>${esc(unit.name)} của bạn</small><b class="num">${data.balance}</b></div></div>
          ${meter('Hôm nay', data.day)}${meter('Tuần này', data.week)}
          <p class="tk-hint">Mỗi ngày và mỗi tuần có một mức tối đa chung để việc tích điểm không thành áp lực. Điểm đã nhận luôn được giữ.</p></section>
        ${streak}
        <div class="tk-task-list">${data.tasks.length ? data.tasks.map(task => taskCard(task, unit)).join('') : emptyState('Chưa có nhiệm vụ cho gói của bạn', 'Nhà nghiên cứu sẽ bổ sung sớm.', '', 'inbox')}</div>
        ${support}`
  }

  /* =====================================================================
     GAME "Làng nhỏ" — MỘT màn hình chơi thống nhất: thế giới ở giữa, HUD, thanh hành động, panel trong game.
     Không tab, không chuyển trang. Sao chỉ đến từ nhiệm vụ (không có nguồn mới); công trình mở theo tổng Sao,
     không tiêu, không mất; nhân vật chỉ vui/thư giãn; khu hỗ trợ luôn mở được từ HUD.
     ===================================================================== */
  const game = { panel: null, arg: null, scroll: null, lastStars: null, opener: null, data: null }
  const GI = {
    quest: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 10h6M9 14h6M9 18h4"/>',
    bag: '<path d="M6 9h12l-1 11H7z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
    hero: '<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    book: '<path d="M5 5a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0-2 2z"/><path d="M5 19V5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    heart: '<path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"/>',
    exit: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'
  }
  const gi = (name, label = '') => `<svg class="gw-i" viewBox="0 0 24 24" aria-hidden="true"${label ? ` aria-label="${esc(label)}"` : ''}>${GI[name]}</svg>`

  function avatarEditor(V, draft, pets, selectedPet) {
    const group = key => {
      const part = V.AVATAR_PARTS[key], list = part.colors || part.names
      return `<fieldset class="vl-fs"><legend>${esc(part.label)}</legend><div class="vl-opts">${list.map((value, index) => part.colors
        ? `<button type="button" class="vl-sw" style="--c:${value}" data-part="${key}" data-i="${index}" aria-label="${esc(part.label)} ${index + 1}" aria-pressed="${draft[key] === index}"></button>`
        : `<button type="button" class="vl-pill" data-part="${key}" data-i="${index}" aria-pressed="${draft[key] === index}">${esc(value)}</button>`).join('')}</div></fieldset>`
    }
    return `<div class="vl-editor"><div class="vl-preview" id="vl-preview">${V.avatarSvg(draft)}</div>
      <div class="vl-controls">${['skin', 'hair', 'style', 'shirt', 'hat'].map(group).join('')}
        <fieldset class="vl-fs"><legend>Bạn đồng hành</legend><div class="vl-opts">${Object.entries(pets).map(([code, name]) => `<button type="button" class="vl-pill" data-pet="${code}" aria-pressed="${code === selectedPet}">${esc(name)}</button>`).join('')}</div></fieldset>
        <div class="gw-panel-actions"><button class="btn pri" type="button" id="vl-save">Lưu nhân vật</button><button class="btn" type="button" id="vl-reset">Hoàn tác</button></div></div></div>`
  }

  async function gameView(open = game.panel, arg = game.arg) {
    clearInterval(taskTicker)
    const keepScroll = $('#gw-world')?.scrollLeft
    if (keepScroll !== undefined) game.scroll = keepScroll
    if (!$('#gw')) { app().className = 'app bare gw-app'; app().innerHTML = `<div class="gw gw-boot">${loadingBlock()}</div>` }
    try {
      const [data, today, inv] = await Promise.all([
        tapi('GET', '/track/rewards/village'),
        tapi('GET', '/track/rewards/today').catch(error => { if (isLocked(error) || error.status === 401) throw error; return { enabled: false } }),
        tapi('GET', '/track/rewards/inventory').catch(error => { if (isLocked(error) || error.status === 401) throw error; return null })
      ])
      const V = window.Village
      if (!data.enabled || !V) {
        frame(`<section class="tk-card tk-narrow"><h1>Làng nhỏ</h1><p>Làng nhỏ sẽ mở khi khảo sát của bạn có bật nhiệm vụ. Hãy hoàn thành khảo sát nhà trường gửi và đồng ý lưu kết quả.</p>
          <a class="btn" href="#/track">${svg('trend')}Về tiến triển của tôi</a></section>`, { wide: true })
        return
      }
      renderGame({ V, data, today, inv }, open, arg)
    } catch (error) {
      if (error.status === 401) return loginView()
      if (isLocked(error)) return lockedView()
      frame(failBlock(error.message)); $('#tk-retry').onclick = () => gameView()
    }
  }

  function renderGame(ctx, open, arg) {
    const { V, data, today, inv } = ctx
    game.data = ctx
    const unit = data.unit, hour = new Date().getHours(), night = hour >= 18 || hour < 6
    let seen = -1
    try { seen = Number(localStorage.getItem('bs-village-seen') ?? -1) } catch { /* storage có thể bị chặn */ }
    const unlocked = V.unlockedOf(data.stars), next = V.nextOf(data.stars), level = V.levelOf(data.stars)
    const fresh = new Set(seen >= 0 ? unlocked.filter(b => b.stars > seen).map(b => b.key) : [])
    try { localStorage.setItem('bs-village-seen', String(data.stars)) } catch { /* bỏ qua */ }
    const prev = next ? [...unlocked].pop() : null
    const progress = next ? Math.round((data.stars - (prev?.stars || 0)) / (next.stars - (prev?.stars || 0)) * 100) : 100
    const avatar = V.cleanAvatar(data.avatar)
    const tasks = today.enabled ? today.tasks : []
    const doneCount = tasks.filter(task => task.completed).length
    const gained = game.lastStars !== null && data.stars > game.lastStars ? data.stars - game.lastStars : 0
    game.lastStars = data.stars

    app().className = 'app bare gw-app'
    app().innerHTML = `<div class="gw${night ? ' is-night' : ''}" id="gw">
      <div class="gw-world" id="gw-world" aria-label="Thế giới làng nhỏ. Kéo để xem, nhấn vào công trình hoặc nhân vật.">${V.scene({ ...data, avatar }, { night, fresh, interactive: true })}</div>
      <header class="gw-hud">
        <button type="button" class="gw-portrait" data-open="hero" aria-label="Nhân vật của bạn, cấp làng ${level}. Nhấn để tùy chỉnh">
          <span class="gw-portrait-img">${V.avatarSvg(avatar)}</span><span class="gw-level" aria-hidden="true">${level}</span></button>
        <div class="gw-player">
          <b>Làng của bạn <span class="gw-lv">Cấp ${level}</span></b>
          <div class="gw-xp" role="progressbar" aria-label="${next ? `Tiến độ tới ${esc(next.name)}` : 'Làng đã đủ công trình'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
          <small>${next ? `Sắp xây <b>${esc(next.name)}</b> · ${data.stars}/${next.stars} ${esc(unit.icon)}` : 'Làng đã đủ mọi công trình'}</small></div>
        <div class="gw-res">
          <span class="gw-chip${gained ? ' gw-pulse' : ''}" title="${esc(unit.name)} đã nhận"><span aria-hidden="true">${esc(unit.icon)}</span><b class="num">${data.stars}</b><span class="sr-only"> ${esc(unit.name)}</span>${gained ? `<span class="gw-gain" aria-hidden="true">+${gained}</span>` : ''}</span>
          <span class="gw-chip" title="Công trình đã xây"><span aria-hidden="true">🏠</span><b class="num">${unlocked.length}/${V.BUILDINGS.length}</b><span class="sr-only"> công trình</span></span>
          ${today.streak ? `<span class="gw-chip" title="Chuỗi ngày (chỉ để khích lệ)"><span aria-hidden="true">🔥</span><b class="num">${today.streak.current}</b><span class="sr-only"> ngày liên tiếp</span></span>` : ''}
        </div>
        <div class="gw-sys">
          ${today.support ? `<button type="button" class="gw-round gw-help" data-open="support" aria-label="Bạn cần người đồng hành?">${gi('heart')}</button>` : ''}
          <button type="button" class="gw-round" data-open="settings" aria-label="Cài đặt">${gi('gear')}</button>
          <a class="gw-round" href="#/track" aria-label="Thoát game, về tiến triển của tôi">${gi('exit')}</a></div>
      </header>
      ${today.enabled ? `<button type="button" class="gw-tracker" data-open="quests"><span class="gw-tracker-title">${gi('quest')}Việc hôm nay</span><span class="gw-tracker-count"><b>${doneCount}</b>/${tasks.length}</span>
        <span class="gw-tracker-bar" aria-hidden="true"><i style="width:${tasks.length ? doneCount / tasks.length * 100 : 0}%"></i></span></button>` : ''}
      <div class="gw-bubble" id="gw-bubble" role="status"><span>${esc(V.greeting(data, hour))}</span><button type="button" aria-label="Ẩn lời chào" id="gw-bubble-x">${gi('close')}</button></div>
      <nav class="gw-actions" aria-label="Chức năng trong game">
        <button type="button" data-open="quests">${gi('quest')}<span>Nhiệm vụ</span>${tasks.length - doneCount > 0 ? `<em class="gw-badge" aria-label="${tasks.length - doneCount} việc chưa làm">${tasks.length - doneCount}</em>` : ''}</button>
        <button type="button" data-open="bag">${gi('bag')}<span>Túi đồ</span></button>
        <button type="button" data-open="hero">${gi('hero')}<span>Nhân vật</span></button>
        <button type="button" data-open="codex">${gi('book')}<span>Sổ làng</span></button>
      </nav>
      <aside class="gw-panel" id="gw-panel" role="dialog" aria-modal="false" aria-labelledby="gw-panel-title" hidden>
        <header class="gw-panel-head"><h2 id="gw-panel-title"></h2><button type="button" class="gw-round" id="gw-panel-x" aria-label="Đóng">${gi('close')}</button></header>
        <div class="gw-panel-body" id="gw-panel-body"></div></aside>
    </div>`

    // thế giới: cuộn tới giữa, kéo để xem (chuột), chạm thì cuộn tự nhiên
    const world = $('#gw-world')
    world.scrollLeft = game.scroll ?? Math.max(0, (world.scrollWidth - world.clientWidth) / 2)
    let drag = null
    world.onpointerdown = event => { if (event.pointerType === 'mouse' && event.button === 0) drag = { x: event.clientX, left: world.scrollLeft, moved: false } }
    world.onpointermove = event => { if (!drag) return; const dx = event.clientX - drag.x; if (Math.abs(dx) > 4) { drag.moved = true; world.scrollLeft = drag.left - dx; world.classList.add('is-dragging') } }
    const endDrag = () => { setTimeout(() => { drag = null }, 0); world.classList.remove('is-dragging') }
    world.onpointerup = endDrag; world.onpointerleave = endDrag
    const activate = target => {
      const building = target.closest('[data-building]'), heroEl = target.closest('[data-hero]'), petEl = target.closest('[data-pet-sprite]')
      const el = building || heroEl || petEl
      if (!el) return
      el.classList.remove('is-tapped'); void el.getBoundingClientRect(); el.classList.add('is-tapped')
      if (building) openPanel('building', building.dataset.building, el)
      else openPanel('hero', null, el)
    }
    world.onclick = event => { if (drag?.moved) return; activate(event.target) }
    world.onkeydown = event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[role=button]')) { event.preventDefault(); activate(event.target) } }

    $$('[data-open]').forEach(button => button.onclick = () => openPanel(button.dataset.open, null, button))
    $('#gw-panel-x').onclick = closePanel
    $('#gw-bubble-x').onclick = () => $('#gw-bubble').remove()
    document.onkeydown = event => { if (event.key === 'Escape' && $('#gw-panel') && !$('#gw-panel').hidden) closePanel() }
    if (fresh.size) toast(`Làng vừa có thêm: ${unlocked.filter(b => fresh.has(b.key)).map(b => b.name).join(', ')}`)
    if (open) openPanel(open, arg, null, { instant: true })
  }

  function closePanel() {
    const panel = $('#gw-panel')
    if (!panel) return
    panel.hidden = true; $('#gw').classList.remove('has-panel')
    $('#gw-panel-body').innerHTML = ''
    clearInterval(taskTicker)
    game.panel = null; game.arg = null
    if (game.opener?.isConnected) game.opener.focus()
  }

  function openPanel(kind, arg, opener, { instant = false } = {}) {
    const { V, data, today, inv } = game.data
    const panel = $('#gw-panel'), body = $('#gw-panel-body'), title = $('#gw-panel-title')
    clearInterval(taskTicker)
    game.panel = kind; game.arg = arg; if (opener) game.opener = opener
    panel.dataset.kind = kind
    const unit = data.unit
    const refresh = () => gameView(kind, arg)
    const support = today.support ? `<section class="gw-note gw-support">${gi('heart')}<div><b>Bạn cần người đồng hành?</b><p>${esc(today.support)}</p></div></section>` : ''
    const taskList = list => list.length ? `<div class="tk-task-list">${list.map(task => taskCard(task, unit)).join('')}</div>` : ''

    if (kind === 'quests') {
      title.textContent = 'Việc hôm nay'
      body.innerHTML = today.enabled ? tasksBody(today) : '<p class="tk-hint">Khi nhà nghiên cứu bật nhiệm vụ cho khảo sát của bạn, các việc nhỏ sẽ hiện ở đây.</p>'
      if (today.enabled) wireTasks(today, refresh, body)
    } else if (kind === 'building') {
      const b = V.BUILDINGS.find(item => item.key === arg)
      if (!b) return closePanel()
      const open = data.stars >= b.stars
      const related = today.enabled ? today.tasks.filter(task => b.tasks.includes(task.code)) : []
      title.textContent = b.name
      body.innerHTML = open
        ? `<p class="gw-tag">${svg('check')}Đã xây</p><p>${esc(b.about)}</p>
          ${b.tasks.length ? `<p class="tk-hint">Nhiệm vụ liên quan: ${b.tasks.map(code => `${esc(code)}${data.tasks[code] ? ` (đã làm ${data.tasks[code]} lần)` : ''}`).join(', ')}</p>` : ''}
          ${related.length ? `<h3 class="gw-sub">Làm ngay tại đây</h3>${taskList(related)}` : ''}`
        : `<p class="gw-tag is-soon">Nền đất chờ xây</p><p>Công trình này mở khi bạn có tổng <b>${b.stars} ${esc(unit.icon)}</b>. Bạn đang có ${data.stars} ${esc(unit.icon)}, còn ${b.stars - data.stars} nữa.</p>
          <div class="gw-xp gw-xp-lg" role="progressbar" aria-label="Tiến độ tới ${esc(b.name)}" aria-valuemin="0" aria-valuemax="${b.stars}" aria-valuenow="${data.stars}"><i style="width:${Math.min(100, data.stars / b.stars * 100)}%"></i></div>
          <p class="tk-hint">Phần giải thích về giấc ngủ sẽ hiện khi công trình được xây.</p>
          ${today.enabled ? '<button type="button" class="btn pri" data-goto="quests">Xem việc hôm nay</button>' : ''}`
      if (related.length && open) wireTasks(today, refresh, body)
    } else if (kind === 'hero') {
      title.textContent = 'Nhân vật'
      const pets = window.RewardPet?.species || {}
      const draft = V.cleanAvatar(data.avatar), saved = { ...draft }
      let selectedPet = ['cat', 'bunny', 'fox', 'bear'].includes(data.pet) ? data.pet : 'cat'
      body.innerHTML = `<p class="tk-hint">Chọn bộ phận có sẵn. Thay đổi hiện ngay trên nhân vật trong làng; đổi bao nhiêu lần cũng được.</p>${avatarEditor(V, draft, pets, selectedPet)}`
      // Vẽ lại nhân vật + bạn đồng hành ngay trong làng (chưa lưu thì chỉ là xem trước).
      const repaint = () => {
        $('#vl-preview').innerHTML = V.avatarSvg(draft)
        const temp = document.createElement('div')
        temp.innerHTML = V.scene({ ...data, avatar: draft, pet: selectedPet }, { night: $('#gw').classList.contains('is-night'), interactive: true })
        for (const cls of ['.vl-hit-hero', '.vl-hit-pet']) { const old = $(`#gw-world ${cls}`), fresh = $(cls, temp); if (old && fresh) old.replaceWith(fresh) }
        $$('[data-part]', body).forEach(button => button.setAttribute('aria-pressed', String(draft[button.dataset.part] === Number(button.dataset.i))))
        $$('[data-pet]', body).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pet === selectedPet)))
      }
      const friendly = error => error.status >= 500 || !error.status ? 'Chưa lưu được, hãy thử lại sau ít phút.' : error.message
      $$('[data-part]', body).forEach(button => button.onclick = () => { draft[button.dataset.part] = Number(button.dataset.i); repaint() })
      $('#vl-reset').onclick = () => { Object.assign(draft, saved); repaint() }
      $('#vl-save').onclick = async event => {
        const restore = setButtonLoading(event.currentTarget, 'Đang lưu…')
        try { await tapi('POST', '/track/rewards/equip', { kind: 'avatar', avatar: draft }); data.avatar = { ...draft }; toast('Đã lưu nhân vật của bạn'); gameView('hero') }
        catch (error) { restore(); toast(friendly(error), 'error') }
      }
      $$('[data-pet]', body).forEach(button => button.onclick = async () => {
        if (button.dataset.pet === selectedPet || button.disabled) return
        const previous = selectedPet
        selectedPet = button.dataset.pet; repaint()                 // đổi ngay trong làng, lỗi thì trả lại
        $$('[data-pet]', body).forEach(x => { x.disabled = true })
        try { await tapi('POST', '/track/rewards/equip', { kind: 'pet', itemCode: selectedPet }); data.pet = selectedPet; toast(`Đã đổi bạn đồng hành: ${pets[selectedPet] || ''}`) }
        catch (error) { selectedPet = previous; repaint(); toast(friendly(error), 'error') }
        finally { $$('[data-pet]', body).forEach(x => { x.disabled = false }) }
      })
    } else if (kind === 'bag') {
      title.textContent = 'Túi đồ'
      if (!inv) body.innerHTML = '<p class="tk-hint">Túi đồ chưa sẵn sàng. Nhóm nghiên cứu cần bật danh mục vật phẩm.</p>'
      else {
        const items = inv.items.map(item => {
          const art = ITEM_ART[item.assetKey] || ITEM_ART.star
          const action = item.unlocked
            ? item.equipped ? `<button class="btn" type="button" data-unequip-kind="${esc(item.kind)}">Gỡ</button>` : `<button class="btn pri" type="button" data-equip-code="${esc(item.code)}">Trang bị</button>`
            : `<span class="gw-lock">${svg('lock')}${item.unlockStars} ${esc(unit.icon)}</span>`
          return `<article class="gw-item${item.unlocked ? '' : ' is-locked'}${item.equipped ? ' is-on' : ''}"><div class="gw-item-art" aria-hidden="true"><svg viewBox="0 0 24 24">${art}</svg></div>
            <div class="gw-item-copy"><small>${esc(REWARD_KIND_LABEL[item.kind] || item.kind)}</small><b>${esc(item.name)}</b>${item.description ? `<span>${esc(item.description)}</span>` : ''}</div><div class="gw-item-act">${action}</div></article>`
        }).join('')
        body.innerHTML = `<p class="tk-hint">Tổng ${esc(unit.name)} mở khóa vật phẩm. Trang bị không tiêu ${esc(unit.name)} và đồ đã mở không bao giờ mất.</p>
          <div class="gw-items">${items || '<p class="tk-hint">Túi đồ đang trống. Vật phẩm sẽ xuất hiện khi nhóm nghiên cứu thêm vào danh mục.</p>'}</div>`
        body.onclick = async event => {
          const equipButton = event.target.closest('[data-equip-code]'), unequipButton = event.target.closest('[data-unequip-kind]')
          if (!equipButton && !unequipButton) return
          const button = equipButton || unequipButton, restore = setButtonLoading(button, 'Đang lưu…')
          try { await tapi('POST', '/track/rewards/equip', equipButton ? { itemCode: equipButton.dataset.equipCode } : { kind: unequipButton.dataset.unequipKind, itemCode: null }); toast(equipButton ? 'Đã trang bị' : 'Đã gỡ'); gameView('bag') }
          catch (error) { restore(); toast(error.message, 'error') }
        }
      }
    } else if (kind === 'codex') {
      title.textContent = 'Sổ làng'
      body.innerHTML = `<p class="tk-hint">Mỗi công trình kể một điều về giấc ngủ. Đây là kiến thức phổ thông, không phải chẩn đoán hay lời khuyên y khoa. Ngưỡng mở khóa đang là bản thử nghiệm.</p>
        <ul class="gw-codex">${V.BUILDINGS.map(b => { const open = data.stars >= b.stars; return `<li><button type="button" class="gw-codex-row${open ? '' : ' is-soon'}" data-building-open="${b.key}"><b>${esc(b.name)}</b><span>${open ? 'Đã xây' : `${b.stars} ${esc(unit.icon)}`}</span></button></li>` }).join('')}</ul>`
      $$('[data-building-open]', body).forEach(button => button.onclick = () => openPanel('building', button.dataset.buildingOpen, button))
    } else if (kind === 'support') {
      title.textContent = 'Bạn cần người đồng hành?'
      body.innerHTML = `${support || '<p class="tk-hint">Chưa có thông tin hỗ trợ.</p>'}<p class="tk-hint">Bạn không cần chờ đến khi mọi chuyện tệ hơn mới tìm sự giúp đỡ.</p>`
    } else if (kind === 'settings') {
      title.textContent = 'Cài đặt'
      let optedIn = false
      try { optedIn = localStorage.getItem('brainst0rm-reminder-notifications') === 'enabled' } catch { /* bỏ qua */ }
      const reminders = inv ? inv.remindersEnabled : null
      body.innerHTML = `${reminders === null ? '' : `<form class="gw-setting" id="gw-reminder"><label class="tk-switch"><input type="checkbox" name="enabled" ${reminders ? 'checked' : ''}><span><b>Lời nhắc nhẹ</b><small>Chỉ hiện khi bạn mở trang Tiến độ. Không gửi email hay tin nhắn.</small></span></label><button class="btn" type="submit">Lưu</button></form>`}
        ${reminders && typeof Notification !== 'undefined' ? `<div class="gw-setting"><span><b>Thông báo trên thiết bị</b><small>Tối đa một lần mỗi ngày, chỉ khi bạn tự bật.</small></span>${Notification.permission === 'denied' ? '<small>Đang bị chặn trong cài đặt trình duyệt.</small>' : optedIn ? '<button class="btn" type="button" id="gw-notify-off">Tắt</button>' : '<button class="btn" type="button" id="gw-notify-on">Bật</button>'}</div>` : ''}
        <a class="btn" href="#/track">${gi('exit')}Thoát game</a>`
      const form = $('#gw-reminder')
      if (form) form.onsubmit = async event => {
        event.preventDefault()
        const restore = setButtonLoading($('button', form), 'Đang lưu…')
        try { await tapi('PUT', '/track/rewards/reminders', { enabled: $('input', form).checked }); toast('Đã lưu lời nhắc'); gameView('settings') } catch (error) { restore(); toast(error.message, 'error') }
      }
      $('#gw-notify-on', body)?.addEventListener('click', async () => {
        try { const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission(); if (permission === 'granted') localStorage.setItem('brainst0rm-reminder-notifications', 'enabled'); gameView('settings') } catch (error) { toast(error.message, 'error') }
      })
      $('#gw-notify-off', body)?.addEventListener('click', () => { try { localStorage.removeItem('brainst0rm-reminder-notifications') } catch { /* bỏ qua */ } gameView('settings') })
    }
    $$('[data-goto]', body).forEach(button => button.onclick = () => openPanel(button.dataset.goto, null, button))
    panel.hidden = false; $('#gw').classList.add('has-panel')
    panel.classList.toggle('no-anim', instant)
    if (!instant) $('#gw-panel-x').focus()
  }

  function wireTasks(data, refresh = () => gameView('quests'), root = $('#tk-main')) {
    const sync = () => {
      $$('[data-count-for]', root).forEach(area => {
        const min = Number(area.dataset.min), n = area.value.length, task = area.closest('.tk-task')
        $(`[data-count-hint="${area.dataset.countFor}"]`, root).textContent = `${n} / ${min} ký tự`
        $('[data-act=complete]', task).disabled = n < min
      })
      $$('[data-plan-for]', root).forEach(group => {
        const fields = $$('[data-plan-field]', group), count = RewardGames.countPlans(group), min = Number(group.dataset.min)
        $('[data-plan-count]', group).textContent = `${count} / ${min} ký tự; chỉ tổng số được gửi`
        $('[data-act=complete]', group).disabled = count < min || fields.some(field => !field.value.trim())
      })
      $$('.tk-choices', root).forEach(group => { $('[data-act=complete]', group.closest('.tk-task')).disabled = !$('input:checked', group) })
    }
    root.oninput = sync; root.onchange = sync; sync()
    const tick = () => $$('[data-timer]', root).forEach(box => {
      const elapsed = (Date.now() - new Date(box.dataset.started)) / 1000
      const left = Number(box.dataset.min) - elapsed
      $('.tk-clock', box).textContent = left > 0 ? clockText(left) : 'Đủ giờ'
      $('[data-act=complete]', box).disabled = left > 0
      const breathing = $('[data-game-breathing]', box)
      if (breathing) {
        const phase = RewardGames.phaseAt(elapsed)
        $('[data-game-phase]', breathing).textContent = phase.label
        $('.tk-breath-orb', breathing).dataset.phase = phase.key
      }
      const progress = $('[data-rest-progress]', box)
      if (progress) {
        const percent = Math.min(100, elapsed / Number(box.dataset.min) * 100)
        progress.style.width = `${percent}%`
        progress.setAttribute('aria-valuenow', String(Math.floor(percent)))
      }
    })
    tick(); taskTicker = setInterval(() => { if (!root.isConnected) clearInterval(taskTicker); else tick() }, 1000)
    root.onclick = async event => {
      const restButton = event.target.closest('[data-rest-card]')
      if (restButton && !restButton.disabled) {
        const restore = setButtonLoading(restButton, 'Đang dùng…')
        try {
          await tapi('POST', '/track/rewards/rest-card', { localDate: $('#tk-rest-date', root).value })
          toast('Đã dùng Thẻ nghỉ. Bạn vẫn giữ nguyên điểm và tiến trình.')
          refresh()
        } catch (error) { restore(); toast(error.message, 'error') }
        return
      }
      const button = event.target.closest('[data-act]')
      if (!button || button.disabled) return
      const code = button.dataset.code, task = button.closest('.tk-task')
      const restore = setButtonLoading(button, button.dataset.act === 'start' ? 'Đang bắt đầu…' : 'Đang ghi nhận…')
      try {
        if (button.dataset.act === 'start') {
          const result = await tapi('POST', `/track/rewards/tasks/${encodeURIComponent(code)}/start`)
          writeTimer(code, result.startedAt)
        } else if (button.dataset.act === 'cancel') {
          await tapi('POST', `/track/rewards/tasks/${encodeURIComponent(code)}/cancel`)
          writeTimer(code, null)
          toast('Đã dừng bài thở. Bạn có thể quay lại khi thấy phù hợp.')
        } else {
          const def = data.tasks.find(item => item.code === code)
          const body = def.completionType === 'self_report' ? { confirmed: true }
            : def.game === 'three_plans' ? { count: RewardGames.countPlans(task) }
            : def.completionType === 'count_chars' ? { count: $('textarea', task).value.length }
            : def.completionType === 'choice' ? { choice: $('input:checked', task)?.value } : {}
          const result = await tapi('POST', `/track/rewards/tasks/${encodeURIComponent(code)}/complete`, body)
          writeTimer(code, null)
          toast(result.duplicate ? 'Nhiệm vụ này đã được ghi nhận rồi' : result.points > 0 ? `Cảm ơn bạn! +${result.points} ${data.unit.icon}` : 'Đã ghi nhận. Hôm nay bạn đã đạt mức tối đa, nhưng việc bạn làm vẫn được trân trọng')
          if (!result.duplicate) { RewardGames.celebrate(task); await new Promise(resolve => setTimeout(resolve, 650)) }
        }
        refresh()
      } catch (error) { restore(); toast(error.message, 'error') }
    }
  }


  /* ---------- game chỉ dành cho học sinh có tài khoản ---------- */
  const isLocked = error => error?.code === 'student_account_required'
  function lockedView() {
    frame(`<section class="tk-card tk-narrow tk-locked"><span class="eyebrow">Game</span><h1>Game dành cho học sinh có tài khoản</h1>
      <p>Bạn đang dùng hồ sơ theo dõi bằng mã định danh. Bạn vẫn làm khảo sát và xem tiến triển bình thường. Để vào game, hãy tạo tên đăng nhập và mật khẩu (không cần email hay số điện thoại).</p>
      ${accountFormHtml('tk-acc-lock')}
      <p class="tk-hint"><a href="#/track">← Về tiến triển của tôi</a></p></section>`, { bare: true })
    wireAccountForm('tk-acc-lock', () => { if (location.hash === '#/track/village') gameView(null); else location.hash = '#/track/village' })
  }

  /* ---------- tài khoản học sinh: tên đăng nhập + mật khẩu (migration 019) ---------- */
  function loginView() {
    frame(`<section class="tk-card tk-narrow tk-login"><span class="eyebrow">Khu học sinh</span><h1>Đăng nhập</h1>
      <p>Dùng tên đăng nhập và mật khẩu bạn đã tạo trong hồ sơ theo dõi.</p>
      <form id="tk-login-form" class="tk-form" novalidate>
        <label for="tk-login-user">Tên đăng nhập</label>
        <input class="in" id="tk-login-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" required>
        <label for="tk-login-pass">Mật khẩu</label>
        <input class="in" id="tk-login-pass" type="password" autocomplete="current-password" maxlength="72" required>
        <p class="err" id="tk-login-error" role="alert"></p>
        <button class="btn pri" type="submit" id="tk-login-go">${svg('lock')}Đăng nhập</button></form>
      <div class="tk-login-alt"><a href="#/track/recover">Dùng mã khôi phục</a></div>
      <p class="tk-hint">Chưa có tài khoản? Hãy làm khảo sát nhà trường gửi, đồng ý lưu kết quả để tạo hồ sơ. Sau đó bạn tạo tên đăng nhập ngay trên màn hình hoàn thành hoặc ở trang Tiến độ.</p></section>`, { bare: true })
    $('#tk-login-user').focus()
    $('#tk-login-form').onsubmit = async event => {
      event.preventDefault()
      const button = $('#tk-login-go'), user = $('#tk-login-user'), pass = $('#tk-login-pass'), slot = $('#tk-login-error')
      if (!user.value.trim() || !pass.value) { slot.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return }
      const restore = setButtonLoading(button, 'Đang đăng nhập…')
      try {
        await tapi('POST', '/track/account/login', { username: user.value, password: pass.value })
        toast('Chào mừng bạn quay lại')
        location.hash = '#/track/village'
      } catch (error) { restore(); slot.textContent = error.message; pass.value = ''; pass.focus() }
    }
  }

  const accountFormHtml = (id = 'tk-acc') => `<form class="tk-form tk-acc-form" id="${id}-form" novalidate>
      <label for="${id}-user">Tên đăng nhập</label>
      <input class="in" id="${id}-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="vd: meo_con_2009" required>
      <p class="tk-hint">3–30 ký tự: chữ thường không dấu, số hoặc gạch dưới. Không dùng họ tên thật hay số điện thoại.</p>
      <label for="${id}-pass">Mật khẩu</label>
      <input class="in" id="${id}-pass" type="password" autocomplete="new-password" maxlength="72" placeholder="Tối thiểu 8 ký tự" required>
      <p class="err" id="${id}-error" role="alert"></p>
      <button class="btn pri" type="submit" id="${id}-go">${svg('lock')}Tạo tài khoản</button></form>`
  function wireAccountForm(id, onDone) {
    const form = $(`#${id}-form`)
    if (!form) return
    form.onsubmit = async event => {
      event.preventDefault()
      const button = $(`#${id}-go`), slot = $(`#${id}-error`)
      const restore = setButtonLoading(button, 'Đang tạo…')
      try {
        const { account } = await tapi('POST', '/track/account', { username: $(`#${id}-user`).value, password: $(`#${id}-pass`).value })
        toast(`Đã tạo tài khoản ${account.username}`)
        onDone(account)
      } catch (error) { restore(); slot.textContent = error.message }
    }
  }

  async function studentAccountSection() {
    const host = $('#tk-student-account')
    if (!host) return
    try {
      const { available, account } = await tapi('GET', '/track/account')
      if (!available) { host.innerHTML = ''; return }
      if (!account) {
        host.innerHTML = `<section class="tk-card" aria-labelledby="tk-acc-title"><h2 id="tk-acc-title">Tạo tài khoản đăng nhập</h2>
          <p class="tk-hint">Để vào lại làng nhỏ, nhiệm vụ và tiến triển trên bất kỳ thiết bị nào. Không cần email hay số điện thoại.</p>${accountFormHtml()}</section>`
        wireAccountForm('tk-acc', () => studentAccountSection())
        return
      }
      host.innerHTML = `<section class="tk-card" aria-labelledby="tk-acc-title"><h2 id="tk-acc-title">Tài khoản của bạn</h2>
        <p>Tên đăng nhập: <b>${esc(account.username)}</b></p>
        <details class="tk-acc-pw"><summary>Đổi mật khẩu</summary>
          <form class="tk-form" id="tk-pw-form" novalidate>
            <label for="tk-pw-cur">Mật khẩu hiện tại</label><input class="in" id="tk-pw-cur" type="password" autocomplete="current-password" maxlength="72" required>
            <label for="tk-pw-new">Mật khẩu mới</label><input class="in" id="tk-pw-new" type="password" autocomplete="new-password" maxlength="72" placeholder="Tối thiểu 8 ký tự" required>
            <p class="err" id="tk-pw-error" role="alert"></p>
            <button class="btn pri" type="submit" id="tk-pw-go">Lưu mật khẩu mới</button></form></details>
        <div class="tk-actions"><button class="btn" type="button" id="tk-signout">${svg('logout')}Đăng xuất</button></div></section>`
      $('#tk-pw-form').onsubmit = async event => {
        event.preventDefault()
        const restore = setButtonLoading($('#tk-pw-go'), 'Đang lưu…')
        try {
          await tapi('PUT', '/track/account/password', { currentPassword: $('#tk-pw-cur').value, newPassword: $('#tk-pw-new').value })
          toast('Đã đổi mật khẩu'); studentAccountSection()
        } catch (error) { restore(); $('#tk-pw-error').textContent = error.message }
      }
      $('#tk-signout').onclick = async event => {
        const restore = setButtonLoading(event.currentTarget, 'Đang đăng xuất…')
        try { await tapi('POST', '/track/signout'); toast('Đã đăng xuất'); location.hash = '#/track/login' } catch (error) { restore(); toast(error.message, 'error') }
      }
    } catch { host.innerHTML = '' }
  }

  function recoverView(token = '') {
    if (token) history.replaceState(null, '', '#/track/recover')          // không để token nằm lại trong lịch sử trình duyệt
    frame(`<section class="tk-card tk-narrow"><h1>Quay lại hồ sơ theo dõi</h1>
      <p>Nhập <b>mã khôi phục</b> hoặc dán <b>liên kết khôi phục</b> bạn đã lưu khi tạo hồ sơ.</p>
      <form id="recover-form" class="tk-form" novalidate>
        <label for="recover-input">Mã hoặc liên kết khôi phục</label>
        <input class="in" id="recover-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH-JKMN-PQRS" value="${esc(token)}" required>
        <p class="err" id="recover-error" role="alert"></p>
        <button class="btn pri" type="submit" id="recover-go">${svg('lock')}Khôi phục hồ sơ</button></form>
      <div class="tk-login-alt"><a href="#/track/login">Đăng nhập bằng tên đăng nhập</a></div>
      <p class="tk-hint">Chưa có hồ sơ? Hồ sơ chỉ được tạo sau khi bạn hoàn thành một khảo sát có hỗ trợ theo dõi và đồng ý lưu kết quả.</p></section>`, { bare: true })
    $('#recover-input').focus()
    $('#recover-form').onsubmit = async event => {
      event.preventDefault()
      const button = $('#recover-go'), input = $('#recover-input')
      if (!input.value.trim()) { $('#recover-error').textContent = 'Vui lòng nhập mã hoặc liên kết khôi phục.'; input.setAttribute('aria-invalid', 'true'); return }
      const restore = setButtonLoading(button, 'Đang kiểm tra…')
      try {
        await tapi('POST', '/track/recover', { credential: input.value })
        toast('Đã khôi phục hồ sơ theo dõi')
        if (location.hash === '#/track') dashboardView(); else location.hash = '#/track'
      } catch (error) {
        restore(); input.setAttribute('aria-invalid', 'true'); $('#recover-error').textContent = error.message
      }
    }
  }

  async function dashboardView() {
    frame(loadingBlock())
    try {
      const data = await tapi('GET', '/track/me')
      let showReminder = false, hasStudentAccount = false
      try { hasStudentAccount = Boolean((await tapi('GET', '/track/account')).account) } catch { /* chưa có bảng tài khoản */ }
      try { const prefs = await tapi('GET', '/track/rewards/inventory'); showReminder = prefs.enabled && prefs.remindersEnabled } catch { /* reward inventory may not be configured for this profile */ }
      maybeShowLocalReminder(showReminder)
      const gameCard = hasStudentAccount
        ? `<a class="tk-card tk-game-link" href="#/track/village"><span class="tk-shortcut-icon" aria-hidden="true">${svg('home')}</span><span><b>Vào game Làng nhỏ</b><small>Làm việc nhỏ, xây làng, tùy chỉnh nhân vật của bạn.</small></span></a>`
        : `<a class="tk-card tk-game-link is-locked" href="#/track/village"><span class="tk-shortcut-icon" aria-hidden="true">${svg('lock')}</span><span><b>Game Làng nhỏ · cần tài khoản học sinh</b><small>Tạo tên đăng nhập và mật khẩu để vào game. Bạn vẫn xem được tiến triển như bình thường.</small></span></a>`
      const cards = data.assessments.map(item => `<article class="tk-card tk-assess">
        <div class="tk-assess-head"><h2>${esc(item.name)}</h2>${statusChip(item.schedule)}</div>
        <dl class="tk-metrics">
          <div><dt>Số lần đo</dt><dd class="num">${item.sessionCount}</dd></div>
          <div><dt>Điểm gần nhất</dt><dd class="num">${item.latestScore === null ? '—' : `${fmtScore(item.latestScore)}`}${item.scale && item.latestScore !== null ? `<small> / ${fmtScore(item.scale.min)}–${fmtScore(item.scale.max)}</small>` : ''}</dd></div>
          <div><dt>Lần gần nhất</dt><dd>${fmtDate(item.lastCompletedAt)}</dd></div></dl>
        <p class="tk-hint">${esc(scheduleText(item.schedule))}</p>
        <div class="tk-actions"><a class="btn pri" href="#/track/${esc(item.ref)}">${svg('chart')}Xem chi tiết</a>
          ${item.takeSlug ? `<a class="btn" href="#/s/${esc(item.takeSlug)}">${svg('edit')}Làm lại khảo sát</a>` : '<span class="tk-hint">Khảo sát hiện không nhận thêm lần đo.</span>'}</div></article>`).join('')
      frame(`<div class="tk-hero"><span class="eyebrow">Hồ sơ theo dõi</span><h1>Tiến triển của bạn</h1>
        <p>Chỉ bạn xem được trang này trên trình duyệt đã đăng nhập. brainst0rm mô tả sự thay đổi của điểm số giữa các lần đo, không đưa ra chẩn đoán hay khuyến nghị.</p></div>
        ${showReminder ? `<section class="tk-gentle-reminder" role="status"><span class="tk-reminder-spark" aria-hidden="true">✦</span><div><strong>Hôm nay bạn muốn làm việc nhỏ nào?</strong><p>Bạn có thể chọn một nhiệm vụ nhẹ nhàng, hoặc nghỉ ngơi tùy ý.</p></div><a class="btn" href="#/track/tasks">Xem nhiệm vụ</a></section>` : ''}
        ${gameCard}
        <div class="tk-grid">${cards || emptyState('Chưa có lần đo nào', 'Hoàn thành một khảo sát có hỗ trợ theo dõi và chọn lưu kết quả để thấy tiến triển tại đây.', '', 'trend')}</div>
        <div id="tk-student-account"></div>
        <div id="tk-account">${loadingBlock()}</div>`, { wide: true })
      studentAccountSection()
      accountPanel()
    } catch (error) {
      if (error.status === 401) return loginView()
      frame(failBlock(error.message)); $('#tk-retry').onclick = dashboardView
    }
  }

  async function accountPanel() {
    const host = $('#tk-account')
    try {
      const { credentials } = await tapi('GET', '/track/credentials')
      host.innerHTML = `<section class="tk-card" aria-labelledby="tk-dev-title"><h2 id="tk-dev-title">Thiết bị và khôi phục</h2>
        <p class="tk-hint">Mã khôi phục và liên kết chỉ hiển thị một lần khi tạo. brainst0rm chỉ lưu bản băm, không thể xem lại mã của bạn.</p>
        <div class="tk-actions"><button class="btn" type="button" id="new-code">${svg('lock')}Tạo mã khôi phục mới</button>
          <button class="btn" type="button" id="new-link">${svg('link')}Tạo liên kết khôi phục</button></div>
        <div id="tk-secret-slot" aria-live="polite"></div>
        <ul class="tk-creds">${credentials.map(item => `<li><div><strong>${esc(KIND[item.kind] || item.kind)}${item.current ? ' · thiết bị này' : ''}</strong>
          <small>${esc(item.label || '')} · tạo ${fmtDate(item.createdAt)} · hết hạn ${fmtDate(item.expiresAt)}${item.lastUsedAt ? ` · dùng gần nhất ${fmtDate(item.lastUsedAt)}` : ''}</small></div>
          <button class="btn" type="button" data-revoke="${esc(item.id)}" data-current="${item.current}">${item.current ? 'Đăng xuất thiết bị này' : 'Thu hồi'}</button></li>`).join('')}</ul></section>
        <section class="tk-card tk-danger" aria-labelledby="tk-del-title"><h2 id="tk-del-title">Quyền riêng tư</h2>
        <p>Bạn có thể xóa hồ sơ theo dõi bất cứ lúc nào. Các lần đo trong hồ sơ sẽ bị xóa; phản hồi bạn đã gửi cho nhà nghiên cứu vẫn được giữ ở dạng ẩn danh và không còn liên kết với hồ sơ của bạn.</p>
        <button class="btn danger" type="button" id="del-profile">${svg('trash')}Xóa hồ sơ theo dõi</button></section>`
      const slot = $('#tk-secret-slot')
      $('#new-code').onclick = async event => {
        if (!await confirmAction('Mã khôi phục cũ sẽ ngừng hoạt động ngay. Hãy lưu mã mới ở nơi an toàn.', 'Tạo mã khôi phục mới?', 'Tạo mã mới')) return
        const restore = setButtonLoading(event.currentTarget, 'Đang tạo…')
        try {
          const { recoveryCode } = await tapi('POST', '/track/credentials/recovery-code')
          slot.innerHTML = secretPanel('Mã khôi phục mới', recoveryCode, 'Mã chỉ hiển thị một lần. Hãy lưu lại ngay.', 'new-code-value'); wireCopy(slot); restore()
        } catch (error) { restore(); toast(error.message, 'error') }
      }
      $('#new-link').onclick = async event => {
        const restore = setButtonLoading(event.currentTarget, 'Đang tạo…')
        try {
          const { token, expiresAt } = await tapi('POST', '/track/credentials/recovery-link')
          slot.innerHTML = secretPanel('Liên kết khôi phục', recoveryLink(token), `Dùng được <b>một lần</b>, hết hạn ${fmtDate(expiresAt)}. Mở liên kết trên thiết bị khác để quay lại hồ sơ này.`, 'new-link-value'); wireCopy(slot); restore()
        } catch (error) { restore(); toast(error.message, 'error') }
      }
      $$('[data-revoke]').forEach(button => button.onclick = async () => {
        const current = button.dataset.current === 'true'
        if (!await confirmAction(current ? 'Trình duyệt này sẽ không còn truy cập được hồ sơ cho đến khi bạn khôi phục lại bằng mã.' : 'Thiết bị hoặc mã này sẽ ngừng hoạt động ngay.',
          current ? 'Đăng xuất thiết bị này?' : 'Thu hồi quyền truy cập?', current ? 'Đăng xuất' : 'Thu hồi')) return
        try {
          await tapi('DELETE', `/track/credentials/${encodeURIComponent(button.dataset.revoke)}`)
          if (current) { toast('Đã đăng xuất thiết bị này'); recoverView() } else { toast('Đã thu hồi'); accountPanel() }
        } catch (error) { toast(error.message, 'error') }
      })
      $('#del-profile').onclick = async event => {
        if (!await confirmAction('Toàn bộ lịch sử theo dõi của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.', 'Xóa hồ sơ theo dõi?', 'Xóa hồ sơ')) return
        const restore = setButtonLoading(event.currentTarget, 'Đang xóa…')
        try { await tapi('DELETE', '/track/profile'); toast('Đã xóa hồ sơ theo dõi'); recoverView() } catch (error) { restore(); toast(error.message, 'error') }
      }
    } catch (error) { host.innerHTML = failBlock(error.message, 'tk-acc-retry'); $('#tk-acc-retry').onclick = accountPanel }
  }

  /* ---------- biểu đồ xu hướng (SVG, dữ liệu thật) ---------- */
  function chartSvg(chart, name) {
    const points = chart.points
    if (!points.length || !chart.scale) return ''
    const W = 640, H = 250, L = 52, R = 18, T = 18, B = 40, { min, max } = chart.scale
    const x = i => points.length === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (points.length - 1)
    const y = value => T + (1 - (value - min) / (max - min || 1)) * (H - T - B)
    const ticks = [min, (min + max) / 2, max]
    const label = `Biểu đồ điểm ${name} qua ${points.length} lần đo, từ ${fmtScore(points[0].score)} đến ${fmtScore(points[points.length - 1].score)}`
    return `<svg class="tk-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
      ${ticks.map(t => `<line class="tk-grid-line" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="tk-axis" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${fmtScore(t)}</text>`).join('')}
      ${points.length > 1 ? `<polyline class="tk-line" points="${points.map((p, i) => `${x(i)},${y(p.score)}`).join(' ')}"/>` : ''}
      ${points.map((p, i) => `<circle class="tk-dot" cx="${x(i)}" cy="${y(p.score)}" r="5"><title>${esc(fmtDate(p.completedAt))}: ${fmtScore(p.score)}</title></circle>`).join('')}
      <text class="tk-axis" x="${x(0)}" y="${H - 12}" text-anchor="${points.length === 1 ? 'middle' : 'start'}">${esc(fmtDate(points[0].completedAt))}</text>
      ${points.length > 1 ? `<text class="tk-axis" x="${x(points.length - 1)}" y="${H - 12}" text-anchor="end">${esc(fmtDate(points[points.length - 1].completedAt))}</text>` : ''}</svg>`
  }

  const DIRECTION = { higher: 'Cao hơn', lower: 'Thấp hơn', same: 'Không đổi' }
  function compareCard(title, diff) {
    if (!diff) return ''
    const note = diff.direction === 'same' ? 'Điểm không đổi' : `${DIRECTION[diff.direction]} ${fmtScore(Math.abs(diff.delta))} điểm${diff.percentOfScale !== null ? ` (khoảng ${fmtScore(diff.percentOfScale)}% độ rộng thang đo)` : ''}`
    return `<article class="tk-card tk-compare"><h3>${esc(title)}</h3>
      <p class="tk-compare-nums"><span class="num">${fmtScore(diff.fromScore)}</span><span aria-hidden="true">→</span><span class="num">${fmtScore(diff.toScore)}</span></p>
      <p class="tk-compare-note">${esc(note)}</p></article>`
  }

  async function assessmentView(ref) {
    frame(loadingBlock(), { wide: true })
    try {
      const { assessment: a } = await tapi('GET', `/track/assessments/${encodeURIComponent(ref)}`)
      const h = a.history, c = h.comparison
      let comparison
      if (c.status === 'ok') {
        comparison = `<div class="tk-grid tk-grid-2">${compareCard('So với lần đo gần nhất trước đó', c.vsPrevious)}
          ${c.vsBaseline ? compareCard('So với lần đầu (baseline)', c.vsBaseline) : `<article class="tk-card tk-compare"><h3>So với lần đầu (baseline)</h3><p class="tk-hint">Hiện có hai lần đo tương thích nên lần đầu cũng là lần gần nhất trước đó.</p></article>`}</div>`
      } else {
        comparison = `<section class="tk-card"><h3>So sánh kết quả</h3><p>${esc(c.message)}</p></section>`
      }
      const rows = h.sessions.map(item => `<tr class="${item.comparable ? '' : 'tk-muted-row'}">
        <td class="num">${item.number}</td><td>${esc(fmtDateTime(item.completedAt))}</td>
        <td class="num">${item.score === null ? '—' : fmtScore(item.score)}${item.isBaseline ? ' <span class="chip c-end">Mốc ban đầu</span>' : ''}</td>
        <td>${item.note ? esc(item.note) : item.comparable ? 'Dùng để so sánh' : ''}</td></tr>`).join('')
      frame(`<a class="tk-back" href="#/track">← Tất cả tiến triển</a>
        <div class="tk-hero"><span class="eyebrow">Chi tiết</span><h1>${esc(a.name)}</h1>
          ${a.scoreMeaning ? `<p><b>Ý nghĩa điểm:</b> ${esc(a.scoreMeaning)}</p>` : ''}</div>
        <section class="tk-card tk-schedule"><div class="tk-assess-head"><h2>Lịch theo dõi</h2>${statusChip(a.schedule)}</div>
          <p>${esc(scheduleText(a.schedule))}</p>
          ${a.takeSlug ? `<a class="btn pri" href="#/s/${esc(a.takeSlug)}">${svg('edit')}Làm lại khảo sát</a>` : '<p class="tk-hint">Khảo sát hiện không nhận thêm lần đo.</p>'}</section>
        ${comparison}
        <section class="tk-card"><h2>Xu hướng điểm</h2>${h.chart.points.length ? chartSvg(h.chart, a.name) : '<p class="tk-hint">Chưa có đủ dữ liệu để vẽ biểu đồ.</p>'}
          ${h.incompatibleCount ? `<p class="tk-hint">${h.incompatibleCount} lần đo không nằm trên biểu đồ vì chưa chấm đủ, không còn tương thích hoặc không dùng để so sánh (xem lý do trong bảng).</p>` : ''}</section>
        <section class="tk-card"><h2>Lịch sử các lần đo</h2><div class="analytics-table-wrap"><table class="tbl"><caption class="sr-only">Lịch sử các lần đo ${esc(a.name)}</caption>
          <thead><tr><th scope="col">Lần</th><th scope="col">Thời điểm</th><th scope="col">Điểm</th><th scope="col">Ghi chú</th></tr></thead><tbody>${rows}</tbody></table></div></section>
        <p class="tk-disclaimer">${svg('info')}<span>${esc(h.disclaimer)}</span></p>`, { wide: true })
    } catch (error) {
      if (error.status === 401) return loginView()
      if (error.status === 404) { frame(`<a class="tk-back" href="#/track">← Tất cả tiến triển</a>${emptyState('Không tìm thấy loại đánh giá này', 'Đường dẫn có thể đã cũ hoặc không thuộc hồ sơ của bạn.', '<a class="btn pri" href="#/track">Về tiến triển của tôi</a>', 'search')}`, { wide: true }); return }
      frame(failBlock(error.message)); $('#tk-retry').onclick = () => assessmentView(ref)
    }
  }

  /* =====================================================================
     Researcher / owner: cấu hình theo dõi cho một khảo sát
     ===================================================================== */
  const CONSENT_TEMPLATE = 'Tôi đồng ý để brainst0rm lưu kết quả các lần làm khảo sát này vào một hồ sơ theo dõi ẩn danh trên trình duyệt của tôi, nhằm so sánh điểm giữa các lần đo. Hồ sơ không chứa họ tên, email hay thông tin liên hệ. Tôi hiểu rằng: (1) việc tham gia là tự nguyện; (2) kết quả chỉ mô tả sự thay đổi của điểm số, không phải chẩn đoán hay lời khuyên chuyên môn; (3) tôi có thể xóa hồ sơ bất cứ lúc nào.\n\n[Mẫu tham khảo — cần được nhóm nghiên cứu và hội đồng đạo đức rà soát trước khi sử dụng.]'

  async function configView(surveyId) {
    loading('tracking')
    try {
      const [cfg, sum] = await Promise.all([api('GET', `/tracking/surveys/${encodeURIComponent(surveyId)}/config`), api('GET', `/tracking/surveys/${encodeURIComponent(surveyId)}/summary`).catch(() => ({ summary: null }))])
      renderConfig(surveyId, cfg, sum.summary)
    } catch (error) { fail('tracking', error, () => configView(surveyId)) }
  }

  const SUMMARY_STATUS = [['due_soon', 'Sắp đến hạn'], ['due', 'Đến hạn'], ['overdue', 'Quá hạn'], ['upcoming', 'Chưa đến hạn'], ['completed', 'Đã đủ số lần đo'], ['unscheduled', 'Không có lịch']]

  function bandSummaryHtml(bands) {
    if (!bands) return ''
    const rows = (bands.levels || []).map(level => `<li><span>${esc(level.label)}</span><b class="num">${level.count === null ? '<span class="tk-hint">ẩn (&lt; 5)</span>' : level.count}</b></li>`).join('')
    return `<section class="card"><h3>Số lần đo theo mức điểm</h3>${bands.suppressed ? '<p class="tk-hint">Chưa đủ lần đo để hiển thị phân bố theo mức (cần ít nhất 5).</p>' : `<ul class="tk-statuses">${rows}</ul>`}
      <p class="tk-hint">Chỉ tính các lần đo đã lưu vào hồ sơ theo dõi, không gồm người không đăng ký. Ô nhỏ hơn 5 được ẩn để không lộ danh tính nhóm nhỏ.</p></section>`
  }

  function summaryHtml(summary) {
    if (!summary) return emptyState('Chưa có số liệu theo dõi', 'Bật theo dõi và xuất bản khảo sát; số liệu tổng hợp sẽ xuất hiện khi người tham gia tạo hồ sơ.', '', 'trend')
    const stat = (label, value) => `<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${label}</span></div><b class="num">${Number(value).toLocaleString('vi')}</b></div>`
    const meanRows = summary.bySessionNumber.map(row => `<tr><td class="num">Lần ${row.number}</td><td class="num">${row.n}</td><td class="num">${row.mean === null ? `<span class="tk-hint">Chưa đủ mẫu</span>` : fmtScore(row.mean)}</td></tr>`).join('')
    const truncated = summary.truncated ? `<div class="notice" role="note">${svg('alert')}<div><strong>Số liệu có thể chưa đầy đủ</strong><span>Khảo sát có rất nhiều lần đo; bảng tổng hợp chỉ đọc 5.000 bản ghi gần nhất.</span></div></div>` : ''
    return `${truncated}<div class="grid g4">${stat('Người đã đồng ý theo dõi', summary.enrolledProfiles)}${stat('Người có lần đo', summary.activeProfiles)}${stat('Tổng số lần đo', summary.sessionsTotal)}${stat('Lần đo của khảo sát này', summary.sessionsThisSurvey)}</div>
      <div class="grid g2 tk-config-grid"><section class="card"><h3>Tình trạng lịch</h3><ul class="tk-statuses">${SUMMARY_STATUS.map(([key, label]) => `<li><span>${label}</span><b class="num">${summary.scheduleStatuses[key] || 0}</b></li>`).join('')}</ul></section>
      ${bandSummaryHtml(summary.bands)}
      <section class="card"><h3>Điểm trung bình theo thứ tự lần đo</h3>${meanRows ? `<div class="analytics-table-wrap"><table class="tbl"><thead><tr><th scope="col">Thứ tự</th><th scope="col">Số người</th><th scope="col">Điểm TB</th></tr></thead><tbody>${meanRows}</tbody></table></div>` : '<p class="tk-hint">Chưa có lần đo nào được chấm điểm.</p>'}
        <p class="tk-hint">Chỉ hiển thị số liệu tổng hợp; không có thông tin từng người tham gia. Điểm trung bình bị ẩn khi dưới ${summary.minGroupSize} người.</p></section></div>`
  }

  function renderConfig(surveyId, data, summary) {
    const { survey, config, canEdit, role, scorableQuestions } = data
    const items = new Map((config?.scoring.items || []).map(item => [item.question_id, item]))
    const schedule = config?.schedule || { intervalDays: null, upcomingDays: 3, graceDays: 7, maxSessions: null }
    const bands = config?.bands || { enabled: false }
    const instruments = config?.instruments || []
    const val = v => (v === null || v === undefined ? '' : esc(v))
    const rangeOf = question => `${question.min}–${question.max}`
    const publicLink = survey.status === 'published' ? '' : '<p class="tk-hint">Khảo sát chưa xuất bản nên người tham gia chưa thể dùng tính năng này.</p>'
    shell('tracking', `<nav class="research-back" aria-label="Điều hướng"><a href="#/builder/${esc(surveyId)}">← Về trình tạo</a>${role !== 'owner' ? `<span class="role-badge">${role === 'admin' ? 'Quản trị viên · chỉ xem' : role === 'researcher' ? 'Researcher · chỉ xem' : role === 'viewer' ? 'Chỉ xem' : 'Reviewer · chỉ xem'}</span>` : ''}</nav>
      <div class="head"><div><span class="eyebrow">Theo dõi tiến triển</span><h1>${esc(survey.title)}</h1>
        <p><span class="chip ${config?.enabled ? 'c-run' : 'c-end'}">${config?.enabled ? 'Đang bật' : 'Đang tắt'}</span>${config ? ` · phiên bản đồng ý ${config.consentVersion}` : ' · mặc định tắt cho mọi khảo sát'}</p></div></div>
      ${publicLink}
      ${config?.warnings?.length ? `<div class="notice" role="alert">${svg('alert')}<div><strong>Cần kiểm tra cấu hình chấm điểm</strong><span>${config.warnings.map(esc).join('<br>')}</span></div></div>` : ''}
      <section class="a-section">${summaryHtml(config ? summary : null)}</section>
      <form id="tk-config" class="card tk-config" novalidate ${canEdit ? '' : 'aria-disabled="true"'}>
        ${canEdit ? '' : '<div class="notice" role="note">' + svg('lock') + '<div><strong>Chỉ chủ sở hữu khảo sát được chỉnh sửa</strong><span>Bạn có thể xem cấu hình và số liệu tổng hợp theo quyền hiện có.</span></div></div>'}
        <fieldset ${canEdit ? '' : 'disabled'}>
          <legend class="sr-only">Cấu hình theo dõi tiến triển</legend>
          <label class="tk-switch"><input type="checkbox" id="tk-enabled" ${config?.enabled ? 'checked' : ''}><span><b>Bật theo dõi tiến triển cho khảo sát này</b><small>Người tham gia sẽ được mời lưu kết quả vào hồ sơ ẩn danh sau khi hoàn thành. Khảo sát hiện có không bị ảnh hưởng nếu bạn không bật.</small></span></label>

          <h2>Loại đánh giá</h2>
          <div class="tk-row"><label><span class="tk-lbl">Tên loại đánh giá</span><input class="in" id="tk-name" maxlength="120" value="${val(config?.assessmentName || survey.title)}" required></label>
            <label><span class="tk-lbl">Mã loại <small>(chữ thường, số, dấu gạch ngang)</small></span><input class="in" id="tk-key" maxlength="48" value="${val(config?.assessmentKey)}" placeholder="tự tạo từ tên" autocomplete="off" spellcheck="false"></label></div>
          <p class="tk-hint">Các khảo sát của bạn có cùng mã loại được coi là các phiên bản của một đánh giá và chỉ so sánh khi thang điểm tương thích. Khác mã loại thì không bao giờ gộp điểm.</p>

          <h2>Cách tính điểm</h2>
          <div class="tk-row"><label><span class="tk-lbl">Cách tính</span><select class="sel" id="tk-method"><option value="sum" ${config?.scoring.method === 'sum' || (!config && true) ? 'selected' : ''}>Tổng điểm</option><option value="mean" ${config?.scoring.method === 'mean' ? 'selected' : ''}>Điểm trung bình</option>${instruments.map(item => `<option value="instrument:${esc(item.id)}" ${config?.scoring.method === 'instrument' && config.scoring.instrument === item.id ? 'selected' : ''}>Thang chuẩn: ${esc(item.name)}</option>`).join('')}</select></label>
            <label><span class="tk-lbl">Phiên bản thang điểm</span><input class="in" id="tk-version" maxlength="40" value="${val(config?.scoring.version || '1')}"></label></div>
          <p class="tk-hint">Tăng phiên bản khi bạn thay đổi ý nghĩa thang điểm: các lần đo cũ sẽ không bị so sánh với lần mới.</p>
          ${scorableQuestions.length ? `<div class="tk-items" id="tk-items" role="group" aria-label="Câu hỏi tính điểm">${scorableQuestions.map(q => `<div class="tk-item"><label><input type="checkbox" data-item="${esc(q.id)}" data-range="${rangeOf(q)}" ${items.has(q.id) ? 'checked' : ''}><span>${esc(q.text)} <small>${esc(TN[q.type] || q.type)} · ${rangeOf(q)}</small></span></label>
            <label class="tk-rev"><input type="checkbox" data-reverse="${esc(q.id)}" ${items.get(q.id)?.reverse ? 'checked' : ''}><span>Đảo chiều</span></label></div>`).join('')}</div>`
            : instruments.length ? '<div class="tk-items" id="tk-items" hidden></div><p class="tk-hint">Khảo sát này có đủ câu hỏi của một thang chuẩn: hãy chọn “Thang chuẩn” ở mục Cách tính để chấm điểm theo đúng hướng dẫn của thang.</p>'
            : emptyState('Khảo sát chưa có câu hỏi chấm điểm được', 'Thêm câu Likert, đánh giá sao hoặc thanh trượt trong trình tạo trước khi bật theo dõi.', `<a class="btn pri" href="#/builder/${esc(surveyId)}">${svg('edit')}Mở trình tạo</a>`, 'edit')}
          <label>Ý nghĩa của điểm <small>(mô tả trung tính, ví dụ "điểm cao hơn thể hiện mức hài lòng cao hơn")</small><input class="in" id="tk-meaning" maxlength="300" value="${val(config?.scoreMeaning)}"></label>
          <p class="tk-hint">So sánh giữa các lần đo chỉ mô tả chênh lệch điểm, không có nhãn "tốt/xấu" hay kết luận lâm sàng. Việc chia mức xanh/vàng/đỏ (nếu bật bên dưới) chỉ để gợi ý nhiệm vụ.</p>

          <h2>Chia mức điểm <small class="tk-opt-tag">tùy chọn</small></h2>
          <label class="tk-switch"><input type="checkbox" id="tk-bands-on" ${bands.enabled ? 'checked' : ''}><span><b>Chia người làm khảo sát thành 2–6 mức theo điểm</b><small>Dùng để gợi ý nhiệm vụ phù hợp ngay sau khi nộp bài, kể cả khi người đó không tạo hồ sơ theo dõi.</small></span></label>
          <div id="tk-bands-body" ${bands.enabled ? '' : 'hidden'}>
            <div class="notice" role="note">${svg('info')}<div><strong>Ngưỡng phải có căn cứ khoa học</strong><span>brainst0rm không tự suy ra ngưỡng và không chẩn đoán. Hãy dùng điểm cắt của công cụ đã được chuẩn hóa cho đúng nhóm đối tượng. Mức chỉ để gợi ý nhiệm vụ.</span></div></div>
            <div id="tk-published" class="tk-actions" hidden></div>
            <div class="tk-row tk-row-3"><label><span class="tk-lbl">Số mức</span><select class="sel" id="tk-bands-count">${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${(bands.labels?.length || 3) === n ? 'selected' : ''}>${n} mức</option>`).join('')}</select></label>
              <label><span class="tk-lbl">Điểm cao nghĩa là</span><select class="sel" id="tk-bands-dir"><option value="higher_worse" ${bands.direction !== 'higher_better' ? 'selected' : ''}>Cần hỗ trợ nhiều hơn</option><option value="higher_better" ${bands.direction === 'higher_better' ? 'selected' : ''}>Tốt hơn</option></select></label>
              <label><span class="tk-lbl">Hiện tên mức cho người làm khảo sát</span><select class="sel" id="tk-bands-show"><option value="no" ${bands.showToStudent ? '' : 'selected'}>Ẩn (khuyến nghị)</option><option value="yes" ${bands.showToStudent ? 'selected' : ''}>Hiện</option></select></label></div>
            <div id="tk-levels" class="tk-levels" role="group" aria-label="Các mức điểm"></div>
            <p class="tk-hint" id="tk-bands-preview" role="status"></p>
            <label>Kênh hỗ trợ cho mức cần hỗ trợ nhiều nhất <small>(bắt buộc, ví dụ phòng tư vấn của trường, đường dây nóng)</small><textarea id="tk-support" rows="3" maxlength="600" placeholder="Nhập đúng thông tin liên hệ thật của kênh hỗ trợ">${esc(bands.supportText || '')}</textarea></label>
            <p class="tk-hint">Hộp “Cần người lắng nghe?” luôn hiện cho mức cần hỗ trợ nhiều nhất, kể cả khi bạn ẩn tên mức. brainst0rm không tự điền thông tin liên hệ.</p>
            <label class="tk-switch"><input type="checkbox" id="tk-rewards-on" ${config?.rewardsEnabled ? 'checked' : ''}><span><b>Bật nhiệm vụ hằng ngày và điểm thưởng (Sao) cho khảo sát này</b><small>Người đã lưu kết quả vào hồ sơ theo dõi sẽ thấy trang “Nhiệm vụ hôm nay” theo nhóm của họ. Cần chạy migration 009. Nhiệm vụ do quản trị viên quản lý.</small></span></label>
          </div>

          <h2>Lịch theo dõi</h2>
          <div class="tk-row tk-row-4"><label><span class="tk-lbl">Khoảng cách giữa các lần (ngày)</span><input class="in" id="tk-interval" type="number" min="1" max="365" inputmode="numeric" value="${val(schedule.intervalDays)}" placeholder="Không đặt lịch"></label>
            <label><span class="tk-lbl">Nhắc trước hạn (ngày)</span><input class="in" id="tk-upcoming" type="number" min="0" max="60" inputmode="numeric" value="${val(schedule.upcomingDays)}"></label>
            <label><span class="tk-lbl">Chờ trước khi coi là quá hạn (ngày)</span><input class="in" id="tk-grace" type="number" min="0" max="90" inputmode="numeric" value="${val(schedule.graceDays)}"></label>
            <label><span class="tk-lbl">Số lần đo tối đa</span><input class="in" id="tk-max" type="number" min="1" max="200" inputmode="numeric" value="${val(schedule.maxSessions)}" placeholder="Không giới hạn"></label></div>
          <p class="tk-hint">Lịch chỉ hiển thị trạng thái cho người tham gia; khảo sát không bị khóa khi chưa đến hạn. brainst0rm không gửi email hay tin nhắn nhắc lịch.</p>

          <h2>Đồng ý của người tham gia</h2>
          <label>Nội dung đồng ý hiển thị trước khi tạo hồ sơ<textarea id="tk-consent" rows="7" maxlength="4000" placeholder="Giải thích dữ liệu nào được lưu, mục đích, quyền xóa hồ sơ…">${esc(config?.consentText || '')}</textarea></label>
          <div class="tk-actions"><button class="btn" type="button" id="tk-template">Chèn mẫu tham khảo</button></div>
          <label class="tk-switch"><input type="checkbox" id="tk-adult" ${config?.adultAttestation !== false ? 'checked' : ''}><span><b>Yêu cầu người tham gia tự xác nhận từ 18 tuổi trở lên</b><small>Đây chỉ là tự khai báo, không phải xác minh tuổi hay đồng ý của người giám hộ. Hệ thống chưa có quy trình xác minh người giám hộ.</small></span></label>
          <p class="tk-hint">Khi bạn sửa nội dung đồng ý hoặc tùy chọn trên, phiên bản đồng ý tăng lên và người đã tham gia sẽ được hỏi lại ở lần lưu tiếp theo.</p>
          <p class="err" id="tk-error" role="alert"></p>
          ${canEdit ? `<div class="tk-actions"><button class="btn pri" type="submit" id="tk-save">${svg('check')}Lưu cấu hình</button></div>` : ''}
        </fieldset></form>`)

    const form = $('#tk-config')
    if (!canEdit) return
    const boxes = () => $$('[data-item]', form)
    const syncRanges = () => {   // chỉ cho chọn các câu cùng khoảng giá trị
      const chosen = boxes().filter(box => box.checked)
      const range = chosen[0]?.dataset.range
      boxes().forEach(box => { box.disabled = Boolean(range) && box.dataset.range !== range && !box.checked })
      $$('[data-reverse]', form).forEach(box => { box.disabled = !$(`[data-item="${box.dataset.reverse}"]`, form).checked })
    }
    boxes().forEach(box => box.onchange = syncRanges); syncRanges()
    $('#tk-template').onclick = async () => {
      const area = $('#tk-consent')
      if (area.value.trim() && !await confirmAction('Nội dung hiện tại sẽ bị thay bằng mẫu tham khảo.', 'Thay nội dung đồng ý?', 'Thay bằng mẫu')) return
      area.value = CONSENT_TEMPLATE; area.focus()
    }
    const instrumentOf = () => { const value = $('#tk-method').value; return value.startsWith('instrument:') ? instruments.find(item => item.id === value.slice(11)) : null }
    const syncMethod = () => { const inst = instrumentOf(); const box = $('#tk-items'); if (box) box.hidden = Boolean(inst) }
    const range = () => {
      const inst = instrumentOf()
      if (inst) return inst.range
      const chosen = boxes().filter(box => box.checked)
      if (!chosen.length) return null
      const [lo, hi] = chosen[0].dataset.range.split('–').map(Number)
      return $('#tk-method').value === 'sum' ? [lo * chosen.length, hi * chosen.length] : [lo, hi]
    }
    const level = { cutoffs: (bands.cutoffs || []).map(String), labels: [...(bands.labels || [])] }
    const tones = { 2: ['green', 'red'], 3: ['green', 'yellow', 'red'], 4: ['green', 'yellow', 'orange', 'red'], 5: ['green', 'lime', 'yellow', 'orange', 'red'], 6: ['blue', 'green', 'lime', 'yellow', 'orange', 'red'] }
    const readLevels = () => {
      level.labels = $$('[data-level-label]', form).map(input => input.value)
      level.cutoffs = $$('[data-level-cut]', form).map(input => input.value)
    }
    const previewBands = () => {
      const slot = $('#tk-bands-preview'), r = range(), count = Number($('#tk-bands-count').value)
      if (!r) { slot.textContent = 'Chọn câu hỏi tính điểm ở trên để xem khoảng điểm.'; return }
      readLevels()
      const cuts = level.cutoffs.slice(0, count - 1)
      const parts = Array.from({ length: count }, (_, index) => {
        const from = index === 0 ? r[0] : cuts[index - 1], to = index === count - 1 ? r[1] : cuts[index]
        const name = (level.labels[index] || '').trim() || `Mức ${index + 1}`
        return from === '' || to === '' || from === undefined || to === undefined ? null : `${name}: ${from}${index === count - 1 ? '–' + to : ' đến dưới ' + to}`
      })
      slot.textContent = `Khoảng điểm đạt được ${r[0]}–${r[1]}. ${parts.every(Boolean) ? parts.join(' · ') : 'Nhập đủ các điểm cắt để xem từng mức.'}`
    }
    const renderLevels = (fresh = false) => {
      const count = Number($('#tk-bands-count').value), r = range()
      // Đọc lại từ ô nhập chỉ khi đang có ô (đổi số mức/hướng điểm). Lần vẽ đầu hoặc khi nạp ngưỡng đã công bố
      // phải dùng giá trị trong `level`, nếu không sẽ bị ghi đè bằng ô trống.
      if (!fresh && $('#tk-levels').children.length) readLevels()
      while (level.labels.length < count) level.labels.push('')
      while (level.cutoffs.length < count - 1) level.cutoffs.push('')
      const worseUp = $('#tk-bands-dir').value === 'higher_worse', palette = tones[count]
      $('#tk-levels').innerHTML = Array.from({ length: count }, (_, index) => {
        const severity = worseUp ? index : count - 1 - index
        return `<div class="tk-level"><span class="tk-level-dot tk-tone-${palette[severity]}" aria-hidden="true"></span>
          <label><span class="tk-lbl">Tên mức ${index + 1}</span><input class="in" data-level-label maxlength="40" value="${esc(level.labels[index] || '')}" placeholder="Mức ${index + 1}"></label>
          ${index === 0 ? `<div class="tk-level-from"><span class="tk-lbl">Từ điểm</span><b>${r ? r[0] : '—'}</b></div>` : `<label><span class="tk-lbl">Từ điểm</span><input class="in" type="number" step="any" inputmode="decimal" data-level-cut value="${esc(level.cutoffs[index - 1] || '')}"></label>`}</div>`
      }).join('')
      $$('#tk-levels input').forEach(input => { input.oninput = previewBands })
      previewBands()
    }
    const showPublished = () => {
      const slot = $('#tk-published'), inst = instrumentOf()
      if (!inst) { slot.hidden = true; slot.innerHTML = ''; return }
      slot.hidden = false
      slot.innerHTML = `<button class="btn" type="button" id="tk-use-published">Điền ngưỡng đã công bố của ${esc(inst.name)}</button><p class="tk-hint">${esc(inst.publishedBands.note)}</p>`
      $('#tk-use-published').onclick = () => {
        const published = inst.publishedBands
        $('#tk-bands-count').value = String(published.labels.length); window.BrainstormUI?.refreshDropdown?.($('#tk-bands-count'))
        $('#tk-bands-dir').value = published.direction; window.BrainstormUI?.refreshDropdown?.($('#tk-bands-dir'))
        level.labels = [...published.labels]; level.cutoffs = published.cutoffs.map(String)
        renderLevels(true)
      }
    }
    const refreshBands = () => { syncMethod(); showPublished(); renderLevels() }
    $('#tk-bands-on').onchange = () => { $('#tk-bands-body', form).hidden = !$('#tk-bands-on').checked; if ($('#tk-bands-on').checked) refreshBands() }
    ;['#tk-bands-count', '#tk-bands-dir'].forEach(id => { $(id).onchange = () => renderLevels() })
    $('#tk-method').onchange = refreshBands
    boxes().forEach(box => { const prior = box.onchange; box.onchange = () => { prior?.(); renderLevels() } })
    syncMethod(); showPublished(); renderLevels()
    form.onsubmit = async event => {
      event.preventDefault()
      const intOrNull = id => { const v = $(id).value.trim(); return v === '' ? null : Number(v) }
      const body = {
        enabled: $('#tk-enabled').checked, assessmentName: $('#tk-name').value, assessmentKey: $('#tk-key').value.trim() || undefined,
        scoreMeaning: $('#tk-meaning').value, consentText: $('#tk-consent').value, adultAttestation: $('#tk-adult').checked,
        scoring: { ...(instrumentOf() ? { method: 'instrument', instrument: instrumentOf().id } : { method: $('#tk-method').value }), version: $('#tk-version').value, items: instrumentOf() ? [] : boxes().filter(box => box.checked).map(box => ({ question_id: box.dataset.item, reverse: $(`[data-reverse="${box.dataset.item}"]`, form).checked })) },
        schedule: { intervalDays: intOrNull('#tk-interval'), upcomingDays: intOrNull('#tk-upcoming'), graceDays: intOrNull('#tk-grace'), maxSessions: intOrNull('#tk-max') }
      }
      // Chỉ gửi `bands` khi đang bật hoặc trước đó đã có, để khảo sát không dùng tính năng này không phụ thuộc migration 008
      if ($('#tk-bands-on').checked || config?.bands?.enabled) {
        readLevels()
        const count = Number($('#tk-bands-count').value)
        body.bands = $('#tk-bands-on').checked ? {
          enabled: true, direction: $('#tk-bands-dir').value, showToStudent: $('#tk-bands-show').value === 'yes',
          cutoffs: level.cutoffs.slice(0, count - 1), labels: level.labels.slice(0, count), supportText: $('#tk-support').value
        } : { enabled: false }
      }
      // Chỉ gửi cờ nhiệm vụ khi đang bật hoặc trước đó đã bật, để khảo sát không dùng tính năng này không phụ thuộc migration 009
      const rewardsBox = $('#tk-rewards-on')
      if (rewardsBox && (rewardsBox.checked || config?.rewardsEnabled)) body.rewardsEnabled = rewardsBox.checked && $('#tk-bands-on').checked
      $('#tk-error').textContent = ''
      const restore = setButtonLoading($('#tk-save'), 'Đang lưu…')
      try {
        await api('PUT', `/tracking/surveys/${encodeURIComponent(surveyId)}/config`, body)
        toast(body.enabled ? 'Đã lưu và bật theo dõi tiến triển' : 'Đã lưu cấu hình (theo dõi đang tắt)')
        configView(surveyId)
      } catch (error) { restore(); $('#tk-error').textContent = error.message; $('#tk-error').scrollIntoView({ block: 'center' }) }
    }
  }

  return { context, introHtml, wantsTrack, bandHtml, doneHtml, wireDone, participantRoute, configView }
})()
