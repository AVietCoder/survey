/* Small reward task interactions. User-entered plan text stays in the page and is never submitted. */
(() => {
  const phaseAt = elapsedSeconds => {
    const phase = ((Math.floor(elapsedSeconds) % 8) + 8) % 8
    return phase < 3 ? { key: 'inhale', label: 'Hít vào nhẹ hai nhịp qua mũi' } : { key: 'exhale', label: 'Thở ra chậm qua miệng' }
  }

  function timer(game, elapsedSeconds = 0) {
    if (game === 'breathing') return `<div class="tk-game-breathing" data-game-breathing><div class="tk-breath-orb" style="--breath-delay:-${(elapsedSeconds % 8).toFixed(2)}s" aria-hidden="true"><span></span></div><p data-game-phase aria-live="polite">Hít vào nhẹ hai nhịp qua mũi</p><small>Nếu không thoải mái, bạn có thể dừng mà không mất điểm hay tiến trình.</small></div>`
    if (game === 'rest_timer') return `<div class="tk-game-rest" data-game-rest><span aria-hidden="true">☾</span><p>Đặt thiết bị xuống nếu bạn muốn. Đồng hồ vẫn tiếp tục chạy.</p><div class="tk-rest-progress" role="progressbar" aria-label="Thời gian nghỉ" aria-valuemin="0" aria-valuemax="100"><i data-rest-progress></i></div></div>`
    return ''
  }

  function threePlans(code, minCount) {
    return `<div class="tk-game-plans" data-plan-for="${code}" data-min="${minCount}">
      <label>Việc thứ nhất<textarea class="in" data-plan-field maxlength="180" rows="2"></textarea></label>
      <label>Việc thứ hai<textarea class="in" data-plan-field maxlength="180" rows="2"></textarea></label>
      <label>Việc thứ ba<textarea class="in" data-plan-field maxlength="180" rows="2"></textarea></label>
      <p class="tk-hint" data-plan-count>${minCount} ký tự tối thiểu; nội dung chỉ ở trên thiết bị.</p>
      <button class="btn pri" type="button" data-act="complete" data-code="${code}" disabled>Ghi nhận số ký tự</button>
      <small class="tk-hint">Chỉ tổng số ký tự được gửi để xác minh. Nội dung không được lưu.</small>
    </div>`
  }

  function countPlans(root) {
    return [...root.querySelectorAll('[data-plan-field]')].reduce((sum, field) => sum + field.value.length, 0)
  }

  function celebrate(card) {
    if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    card.classList.add('tk-game-celebrating')
    const colors = ['gold', 'pink', 'white', 'mint', 'lavender']
    const count = 5 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('i')
      piece.className = `tk-game-confetti ${colors[i % colors.length]}`
      piece.style.setProperty('--confetti-x', `${Math.round((Math.random() - .5) * 180)}px`)
      card.append(piece)
      setTimeout(() => piece.remove(), 650)
    }
    setTimeout(() => card.classList.remove('tk-game-celebrating'), 650)
  }

  window.RewardGames = { phaseAt, timer, threePlans, countPlans, celebrate }
})()
