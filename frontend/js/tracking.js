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
    if (!res.ok) throw Object.assign(new Error(json.error || 'Có lỗi xảy ra'), { status: res.status })
    return json
  }

  /* ---------- định dạng ---------- */
  const fmtDate = v => (v ? new Date(v).toLocaleDateString('vi-VN') : '—')
  const fmtDateTime = v => (v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
  const fmtScore = v => (v === null || v === undefined ? '—' : Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
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
  function frame(inner, { wide = false } = {}) {
    app().className = 'app bare tk-app'
    app().innerHTML = `<div class="tk">
      <header class="tk-top"><a class="logo sv-logo" href="#/track" aria-label="brainst0rm — tiến triển của tôi"><i></i><span class="brand-word">brainst0rm</span></a>
        <a class="tk-top-link" href="#/track">Tiến triển của tôi</a></header>
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
    return `<p class="tk-note">${svg('trend')}<span>Khảo sát này hỗ trợ <b>theo dõi tiến triển</b> (tùy chọn). Sau khi hoàn thành, bạn có thể chọn lưu kết quả để so sánh giữa các lần làm.
      <a href="#/track/recover" target="_blank" rel="noopener">Đã có hồ sơ? Khôi phục</a></span></p>`
  }
  const wantsTrack = trk => Boolean(trk?.hasProfile && trk.consentOk && $('#track-opt')?.checked)

  function consentForm(trk) {
    const returning = trk.hasProfile && trk.consentOk
    if (returning) return `<p>Bạn đã đồng ý nội dung theo dõi cho khảo sát này trước đó.</p>
      <button class="btn pri" type="button" id="track-save">${svg('trend')}Lưu kết quả lần này vào tiến triển</button>`
    return `<details class="tk-consent"><summary>Đọc nội dung đồng ý (phiên bản ${esc(trk.consentVersion)})</summary><div class="tk-consent-text">${esc(trk.consentText)}</div></details>
      <form id="track-form" class="tk-form" novalidate>
        ${trk.adultAttestation ? `<label class="tk-check"><input type="checkbox" id="track-adult"><span>Tôi xác nhận mình từ 18 tuổi trở lên.</span></label>` : ''}
        <label class="tk-check"><input type="checkbox" id="track-agree"><span>Tôi đã đọc và đồng ý với nội dung trên. Tôi hiểu có thể xóa hồ sơ bất cứ lúc nào.</span></label>
        <p class="err" id="track-error" role="alert"></p>
        <button class="btn pri" type="submit" id="track-go" disabled>${svg('trend')}Tạo hồ sơ theo dõi</button></form>`
  }

  function doneHtml(trk, state) {
    if (!trk?.enabled) return ''
    const saved = state.result?.tracking
    if (saved?.status === 'saved') return `<section class="tk-card tk-done" id="track-done">${savedMessage(saved.session)}</section>`
    const unchecked = trk.hasProfile && trk.consentOk
    return `<section class="tk-card tk-done" id="track-done"><h2>${unchecked ? 'Bạn chưa lưu kết quả lần này' : 'Theo dõi tiến triển của bạn'}</h2>
      <p>Lưu kết quả “${esc(trk.assessmentName)}” để so sánh với các lần làm sau. Kết quả được tính thành một điểm số đơn giản; brainst0rm không đưa ra chẩn đoán hay khuyến nghị.</p>
      <div id="track-body">${consentForm(trk)}</div></section>`
  }
  const savedMessage = session => `<h2>${svg('check')}Đã lưu vào tiến triển của bạn</h2>
    <p>Kết quả lần này đã được thêm vào hồ sơ theo dõi${session?.assessmentName ? ` “${esc(session.assessmentName)}”` : ''}.</p>
    <a class="btn pri" href="#/track">${svg('trend')}Xem tiến triển</a>`

  function wireDone(trk, state, slug) {
    if (!trk?.enabled || state.result?.tracking?.status === 'saved') return
    const body = $('#track-body')
    if (!body) return
    const submit = async button => {
      const restore = setButtonLoading(button, 'Đang lưu…')
      try {
        const result = await tapi('POST', '/track/enroll', {
          slug, responseId: state.result?.responseId || state.rid,
          consent: trk.hasProfile && trk.consentOk ? undefined
            : { accepted: true, adultConfirmed: Boolean($('#track-adult')?.checked), version: trk.consentVersion }
        })
        const target = $('#track-done')
        target.innerHTML = savedMessage(result.session) + (result.recoveryCode
          ? secretPanel('Mã khôi phục của bạn', result.recoveryCode,
            'Hãy lưu mã này ở nơi an toàn. <b>Mã chỉ hiển thị một lần.</b> Bạn cần nó để quay lại trên thiết bị khác hoặc khi xóa dữ liệu trình duyệt. Không chia sẻ mã với người khác.', 'track-recovery-code') : '')
        wireCopy(target)
      } catch (error) {
        restore()
        const slot = $('#track-error')
        if (slot) slot.textContent = error.message; else toast(error.message, 'error')
      }
    }
    const save = $('#track-save')
    if (save) save.onclick = () => submit(save)
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
    if (arg) return assessmentView(arg)
    return dashboardView()
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
      <p class="tk-hint">Chưa có hồ sơ? Hồ sơ chỉ được tạo sau khi bạn hoàn thành một khảo sát có hỗ trợ theo dõi và đồng ý lưu kết quả.</p></section>`)
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
        <div class="tk-grid">${cards || emptyState('Chưa có lần đo nào', 'Hoàn thành một khảo sát có hỗ trợ theo dõi và chọn lưu kết quả để thấy tiến triển tại đây.', '', 'trend')}</div>
        <div id="tk-account">${loadingBlock()}</div>`, { wide: true })
      accountPanel()
    } catch (error) {
      if (error.status === 401) return recoverView()
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
      if (error.status === 401) return recoverView()
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

  function summaryHtml(summary) {
    if (!summary) return emptyState('Chưa có số liệu theo dõi', 'Bật theo dõi và xuất bản khảo sát; số liệu tổng hợp sẽ xuất hiện khi người tham gia tạo hồ sơ.', '', 'trend')
    const stat = (label, value) => `<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${label}</span></div><b class="num">${Number(value).toLocaleString('vi')}</b></div>`
    const meanRows = summary.bySessionNumber.map(row => `<tr><td class="num">Lần ${row.number}</td><td class="num">${row.n}</td><td class="num">${row.mean === null ? `<span class="tk-hint">Chưa đủ mẫu</span>` : fmtScore(row.mean)}</td></tr>`).join('')
    const truncated = summary.truncated ? `<div class="notice" role="note">${svg('alert')}<div><strong>Số liệu có thể chưa đầy đủ</strong><span>Khảo sát có rất nhiều lần đo; bảng tổng hợp chỉ đọc 5.000 bản ghi gần nhất.</span></div></div>` : ''
    return `${truncated}<div class="grid g4">${stat('Người đã đồng ý theo dõi', summary.enrolledProfiles)}${stat('Người có lần đo', summary.activeProfiles)}${stat('Tổng số lần đo', summary.sessionsTotal)}${stat('Lần đo của khảo sát này', summary.sessionsThisSurvey)}</div>
      <div class="grid g2 tk-config-grid"><section class="card"><h3>Tình trạng lịch</h3><ul class="tk-statuses">${SUMMARY_STATUS.map(([key, label]) => `<li><span>${label}</span><b class="num">${summary.scheduleStatuses[key] || 0}</b></li>`).join('')}</ul></section>
      <section class="card"><h3>Điểm trung bình theo thứ tự lần đo</h3>${meanRows ? `<div class="analytics-table-wrap"><table class="tbl"><thead><tr><th scope="col">Thứ tự</th><th scope="col">Số người</th><th scope="col">Điểm TB</th></tr></thead><tbody>${meanRows}</tbody></table></div>` : '<p class="tk-hint">Chưa có lần đo nào được chấm điểm.</p>'}
        <p class="tk-hint">Chỉ hiển thị số liệu tổng hợp; không có thông tin từng người tham gia. Điểm trung bình bị ẩn khi dưới ${summary.minGroupSize} người.</p></section></div>`
  }

  function renderConfig(surveyId, data, summary) {
    const { survey, config, canEdit, role, scorableQuestions } = data
    const items = new Map((config?.scoring.items || []).map(item => [item.question_id, item]))
    const schedule = config?.schedule || { intervalDays: null, upcomingDays: 3, graceDays: 7, maxSessions: null }
    const val = v => (v === null || v === undefined ? '' : esc(v))
    const rangeOf = question => `${question.min}–${question.max}`
    const publicLink = survey.status === 'published' ? '' : '<p class="tk-hint">Khảo sát chưa xuất bản nên người tham gia chưa thể dùng tính năng này.</p>'
    shell('tracking', `<nav class="research-back" aria-label="Điều hướng"><a href="#/builder/${esc(surveyId)}">← Về trình tạo</a>${role !== 'owner' ? `<span class="role-badge">${role === 'admin' ? 'Quản trị viên · chỉ xem' : role === 'researcher' ? 'Researcher · chỉ xem' : 'Reviewer · chỉ xem'}</span>` : ''}</nav>
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
          <div class="tk-row"><label><span class="tk-lbl">Cách tính</span><select class="sel" id="tk-method"><option value="sum" ${config?.scoring.method !== 'mean' ? 'selected' : ''}>Tổng điểm</option><option value="mean" ${config?.scoring.method === 'mean' ? 'selected' : ''}>Điểm trung bình</option></select></label>
            <label><span class="tk-lbl">Phiên bản thang điểm</span><input class="in" id="tk-version" maxlength="40" value="${val(config?.scoring.version || '1')}"></label></div>
          <p class="tk-hint">Tăng phiên bản khi bạn thay đổi ý nghĩa thang điểm: các lần đo cũ sẽ không bị so sánh với lần mới.</p>
          ${scorableQuestions.length ? `<div class="tk-items" role="group" aria-label="Câu hỏi tính điểm">${scorableQuestions.map(q => `<div class="tk-item"><label><input type="checkbox" data-item="${esc(q.id)}" data-range="${rangeOf(q)}" ${items.has(q.id) ? 'checked' : ''}><span>${esc(q.text)} <small>${esc(TN[q.type] || q.type)} · ${rangeOf(q)}</small></span></label>
            <label class="tk-rev"><input type="checkbox" data-reverse="${esc(q.id)}" ${items.get(q.id)?.reverse ? 'checked' : ''}><span>Đảo chiều</span></label></div>`).join('')}</div>`
            : emptyState('Khảo sát chưa có câu hỏi chấm điểm được', 'Thêm câu Likert, đánh giá sao hoặc thanh trượt trong trình tạo trước khi bật theo dõi.', `<a class="btn pri" href="#/builder/${esc(surveyId)}">${svg('edit')}Mở trình tạo</a>`, 'edit')}
          <label>Ý nghĩa của điểm <small>(mô tả trung tính, ví dụ "điểm cao hơn thể hiện mức hài lòng cao hơn")</small><input class="in" id="tk-meaning" maxlength="300" value="${val(config?.scoreMeaning)}"></label>
          <p class="tk-hint">brainst0rm chỉ mô tả chênh lệch điểm. Không dùng ngưỡng, nhãn "tốt/xấu" hay kết luận lâm sàng.</p>

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
    form.onsubmit = async event => {
      event.preventDefault()
      const intOrNull = id => { const v = $(id).value.trim(); return v === '' ? null : Number(v) }
      const body = {
        enabled: $('#tk-enabled').checked, assessmentName: $('#tk-name').value, assessmentKey: $('#tk-key').value.trim() || undefined,
        scoreMeaning: $('#tk-meaning').value, consentText: $('#tk-consent').value, adultAttestation: $('#tk-adult').checked,
        scoring: { method: $('#tk-method').value, version: $('#tk-version').value, items: boxes().filter(box => box.checked).map(box => ({ question_id: box.dataset.item, reverse: $(`[data-reverse="${box.dataset.item}"]`, form).checked })) },
        schedule: { intervalDays: intOrNull('#tk-interval'), upcomingDays: intOrNull('#tk-upcoming'), graceDays: intOrNull('#tk-grace'), maxSessions: intOrNull('#tk-max') }
      }
      $('#tk-error').textContent = ''
      const restore = setButtonLoading($('#tk-save'), 'Đang lưu…')
      try {
        await api('PUT', `/tracking/surveys/${encodeURIComponent(surveyId)}/config`, body)
        toast(body.enabled ? 'Đã lưu và bật theo dõi tiến triển' : 'Đã lưu cấu hình (theo dõi đang tắt)')
        configView(surveyId)
      } catch (error) { restore(); $('#tk-error').textContent = error.message; $('#tk-error').scrollIntoView({ block: 'center' }) }
    }
  }

  return { context, introHtml, wantsTrack, doneHtml, wireDone, participantRoute, configView }
})()
