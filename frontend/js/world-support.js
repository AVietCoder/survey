/* brainst0rm — chọn chế độ thế giới game (làng 2D hoặc thế giới 3D beta) và tải thư viện 3D khi cần.
   Người chơi tự chọn khi vào game; không ai bị chuyển sang 3D nếu không chọn. Thiếu WebGL2 → làng 2D.
   Lựa chọn chỉ lưu trên thiết bị, không gửi về máy chủ. */
(() => {
  'use strict'

  const THREE_URL = '/vendor/three/three.module.js'
  const THREE_REVISION = '187'
  const PREFERENCE_KEY = 'bs-world-mode'                 // 'light' = người dùng tự chọn chế độ nhẹ

  /** Hàm thuần. choice: '3d' | 'light' | null (chưa chọn). Trả { mode: '3d' | 'light', reason }. */
  function chooseMode({ webgl2, choice }) {
    if (!webgl2) return { mode: 'light', reason: 'no-webgl2' }
    if (choice === '3d') return { mode: '3d', reason: 'ok' }
    return { mode: 'light', reason: choice === 'light' ? 'user-choice' : 'not-chosen' }
  }

  function hasWebGL2(doc = document) {
    try {
      const gl = doc.createElement('canvas').getContext('webgl2')
      gl?.getExtension('WEBGL_lose_context')?.loseContext()          // trả lại ngữ cảnh ngay, trình duyệt giới hạn số lượng
      return Boolean(gl)
    } catch { return false }
  }

  /** Lựa chọn lần trước (để đánh dấu sẵn ở màn chọn). */
  const getPreference = () => { try { const value = localStorage.getItem(PREFERENCE_KEY); return value === '3d' || value === 'light' ? value : null } catch { return null } }
  function setPreference(value) {
    try { localStorage.setItem(PREFERENCE_KEY, value === '3d' ? '3d' : 'light') } catch { /* storage có thể bị chặn */ }
  }

  /** Kết quả WebGL2 được nhớ lại: mỗi lần thử tạo một ngữ cảnh đồ họa. */
  let webgl2Known = null
  const webgl2Cached = () => webgl2Known ??= hasWebGL2()

  let engine = null
  /** Tải thư viện 3D một lần. Trả null nếu lỗi (mất mạng, trình duyệt cũ): nơi gọi phải dùng chế độ nhẹ. Lần sau được thử lại. */
  function loadEngine(importer = url => import(url)) {
    engine ||= Promise.resolve().then(() => importer(THREE_URL))
      .then(module => { if (module.REVISION !== THREE_REVISION) throw new Error('Sai phiên bản thư viện 3D'); return module })
      .catch(() => { engine = null; return null })
    return engine
  }

  window.World3DSupport = { chooseMode, hasWebGL2: webgl2Cached, getPreference, setPreference, loadEngine, THREE_URL, THREE_REVISION }
})()
