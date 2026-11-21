/* Fixed, local SVG companions. No user-entered names, external images, or negative states. */
(() => {
  const species = {
    cat: { name: 'Mây', color: '#C9C6E3', light: '#E6E4F4', ears: '<path d="M31 48 34 20 55 38M69 38 90 20 93 48"/>' },
    bunny: { name: 'Thỏ Bông', color: '#F2DCE8', light: '#FFF0F6', ears: '<ellipse cx="45" cy="28" rx="10" ry="25"/><ellipse cx="79" cy="28" rx="10" ry="25"/>' },
    fox: { name: 'Cáo Nhỏ', color: '#F6B68F', light: '#FFD9BC', ears: '<path d="M29 52 31 17 58 39M67 39 94 17 96 52"/>' },
    bear: { name: 'Gấu Mật', color: '#CFAE9A', light: '#EAD5C6', ears: '<circle cx="37" cy="39" r="14"/><circle cx="87" cy="39" r="14"/>' }
  }

  const moodCopy = {
    welcome: 'Chào bạn, mình ở đây cùng bạn.',
    calm: 'Mình cùng làm từng việc nhỏ nhé.',
    sleepy: 'Đến giờ nghỉ ngơi rồi. Hẹn gặp lại bạn nhé.'
  }

  function moodAt(date = new Date()) {
    const hour = date.getHours()
    if (hour >= 21 || hour < 6) return 'sleepy'
    if (hour < 11) return 'welcome'
    return 'calm'
  }

  function render(code = 'cat', mood = moodAt()) {
    const pet = species[code] || species.cat
    const eyes = mood === 'sleepy'
      ? '<path d="M43 67q5 5 10 0m18 0q5 5 10 0"/>'
      : '<circle cx="48" cy="66" r="3.2"/><circle cx="76" cy="66" r="3.2"/>'
    const mouth = mood === 'sleepy' ? 'M59 77q5 3 10 0' : 'M57 76q7 9 14 0'
    return `<div class="tk-pet-scene tk-pet-${code} tk-pet-mood-${mood}">
      <svg class="tk-pet-svg" viewBox="0 0 128 132" role="img" aria-label="${pet.name}, ${moodCopy[mood]}">
        <ellipse class="tk-pet-shadow" cx="64" cy="119" rx="35" ry="8"/>
        <g class="tk-pet-body"><ellipse cx="64" cy="96" rx="28" ry="22"/><ellipse class="tk-pet-belly" cx="64" cy="99" rx="16" ry="13"/></g>
        <g class="tk-pet-ears">${pet.ears}</g>
        <path class="tk-pet-head" d="M34 54c0-19 13-31 30-31s30 12 30 31v17c0 19-13 31-30 31S34 90 34 71Z"/>
        <path class="tk-pet-face-light" d="M45 76q19-15 38 0v7q-19 17-38 0Z"/>
        <g class="tk-pet-eyes">${eyes}</g><circle class="tk-pet-nose" cx="64" cy="75" r="3"/><path class="tk-pet-mouth" d="${mouth}"/>
        <circle class="tk-pet-blush" cx="42" cy="77" r="5"/><circle class="tk-pet-blush" cx="86" cy="77" r="5"/>
      </svg>
      <p class="tk-pet-speech" aria-live="polite">${moodCopy[mood]}</p>
    </div>`
  }

  window.RewardPet = { species: Object.fromEntries(Object.entries(species).map(([code, pet]) => [code, pet.name])), moodAt, render }
})()
