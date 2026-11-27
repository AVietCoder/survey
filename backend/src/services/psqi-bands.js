/* Ngưỡng PSQI nằm ngoài code, ở backend/config/psqi-bands.json. Nhóm vàng PSQI chỉ bật khi người có thẩm quyền đã
   xác nhận đủ ba mức; không bao giờ tự đặt ngưỡng. */
import file from '../../config/psqi-bands.json' with { type: 'json' }

export const PSQI_PUBLISHED = Object.freeze(file.published)

/** Hai điểm cắt đã xác nhận (ba mức), hoặc null nếu chưa xác nhận đầy đủ và hợp lệ. */
export function confirmedPsqiCutoffs(study = file.study) {
  const cutoffs = study?.cutoffs
  if (study?.confirmed !== true || !String(study.confirmedBy || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(study.confirmedAt || '')) return null
  if (!Array.isArray(cutoffs) || cutoffs.length !== 2 || !cutoffs.every(value => Number.isInteger(value) && value >= 1 && value <= 21) || cutoffs[0] >= cutoffs[1]) return null
  return [...cutoffs]
}

/** Phiên PSQI được vào nhóm vàng chỉ khi nó được chia đúng bằng hai ngưỡng đã xác nhận. */
export function psqiYellowAllowed(bandThresholds, study = file.study) {
  const confirmed = confirmedPsqiCutoffs(study)
  const used = bandThresholds?.cutoffs
  return Boolean(confirmed && Array.isArray(used) && used.length === 2 && used.every((value, index) => Number(value) === confirmed[index]))
}

export const psqiStudyStatus = () => ({ confirmed: Boolean(confirmedPsqiCutoffs()), cutoffs: confirmedPsqiCutoffs() })
export const psqiStudy = () => file.study
