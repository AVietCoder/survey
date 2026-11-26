/* brainst0rm — chọn chế độ thế giới game (2D "chế độ nhẹ" hoặc 3D) và tải thư viện 3D khi cần.
   Giai đoạn 0: chỉ có phần phát hiện và tải; chưa có cảnh 3D nên game vẫn là làng 2D cho mọi người.
   Bản 3D mặc định tắt: chỉ bật thử bằng ?world=3d trên địa chỉ. Không gửi gì về máy chủ. */
(() => {
  'use strict'

  const THREE_URL = '/vendor/three/three.module.js'
  const THREE_REVISION = '187'
  const PREFERENCE_KEY = 'bs-world-mode'                 // 'light' = người dùng tự chọn chế độ nhẹ

  /** Hàm thuần. Trả { mode: '3d' | 'light', reason }. Lý do để hiển thị và kiểm thử. */
  function chooseMode({ webgl2, preview, preference }) {
    if (!preview) return { mode: 'light', reason: 'preview-off' }
    if (preference === 'light') return { mode: 'light', reason: 'user-choice' }
    if (!webgl2) return { mode: 'light', reason: 'no-webgl2' }
    return { mode: '3d', reason: 'ok' }
  }

  function hasWebGL2(doc = document) {
    try {
      const gl = doc.createElement('canvas').getContext('webgl2')
      gl?.getExtension('WEBGL_lose_context')?.loseContext()          // trả lại ngữ cảnh ngay, trình duyệt giới hạn số lượng
      return Boolean(gl)
    } catch { return false }
  }

  /** ?world=3d đặt trước hoặc sau dấu # đều được. */
  const previewRequested = (loc = location) => /[?&]world=3d(?:&|$|#)/.test(`${loc.search || ''}${loc.hash || ''}`)

  const readPreference = () => { try { return localStorage.getItem(PREFERENCE_KEY) } catch { return null } }
  function setPreference(value) {
    try { value === 'light' ? localStorage.setItem(PREFERENCE_KEY, 'light') : localStorage.removeItem(PREFERENCE_KEY) } catch { /* storage có thể bị chặn */ }
  }

  function detect() {
    const preview = previewRequested()
    return chooseMode({ preview, preference: readPreference(), webgl2: preview ? hasWebGL2() : false })
  }

  let engine = null
  /** Tải thư viện 3D một lần. Trả null nếu lỗi (mất mạng, trình duyệt cũ): nơi gọi phải dùng chế độ nhẹ. Lần sau được thử lại. */
  function loadEngine(importer = url => import(url)) {
    engine ||= Promise.resolve().then(() => importer(THREE_URL))
      .then(module => { if (module.REVISION !== THREE_REVISION) throw new Error('Sai phiên bản thư viện 3D'); return module })
      .catch(() => { engine = null; return null })
    return engine
  }

  window.World3DSupport = { chooseMode, hasWebGL2, previewRequested, setPreference, detect, loadEngine, THREE_URL, THREE_REVISION }
})()
