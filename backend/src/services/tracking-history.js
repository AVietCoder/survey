import { createHash } from 'node:crypto'
import { explainIncompatibility, isCompatible } from './tracking-scoring.js'

/**
 * Dựng lịch sử + so sánh cho MỘT assessment của MỘT hồ sơ.
 * Quy tắc:
 *  - Chỉ so sánh các lần đo cùng assessment, cùng dấu vân tay thang đo, đã chấm điểm đầy đủ và không bị researcher loại.
 *  - Không diễn giải: chỉ mô tả chênh lệch số học, không gọi là "tốt lên/xấu đi" và không đưa ra khuyến nghị.
 */
const round2 = value => Math.round(value * 100) / 100

export const assessmentRef = (ownerId, key) =>
  createHash('sha256').update(`brainst0rm:assessment-ref-v1:${ownerId}:${key}`).digest('hex').slice(0, 20)

const usable = session => session.score !== null && session.score !== undefined && session.score_status === 'scored'
  && Boolean(session.scoring_fingerprint) && !session.excluded

function difference(from, to) {
  const delta = round2(to.score - from.score)
  const span = Number(to.score_max) - Number(to.score_min)
  return {
    fromSessionId: from.id, toSessionId: to.id, fromScore: Number(from.score), toScore: Number(to.score), delta,
    direction: delta > 0 ? 'higher' : delta < 0 ? 'lower' : 'same',
    percentOfScale: span > 0 ? round2(Math.abs(delta) / span * 100) : null
  }
}

export function buildHistory(rows) {
  const sessions = [...rows].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at) || String(a.id).localeCompare(String(b.id)))
  const anchor = [...sessions].reverse().find(usable) || null
  const comparable = anchor ? sessions.filter(session => usable(session) && isCompatible(session, anchor)) : []
  const inSet = new Set(comparable.map(session => session.id))
  const first = comparable[0], latest = comparable[comparable.length - 1], previous = comparable[comparable.length - 2]

  const annotated = sessions.map((session, index) => {
    let note = null
    if (!inSet.has(session.id)) {
      if (session.excluded) note = 'Không dùng để so sánh.'
      else if (!usable(session)) note = 'Chưa đủ câu trả lời để tính điểm nên không dùng để so sánh.'
      else if (anchor) note = explainIncompatibility(session, anchor).join(' ')
    }
    return {
      id: session.id, number: index + 1, completedAt: session.completed_at, surveyId: session.survey_id,
      score: usable(session) ? Number(session.score) : null, scoreMin: session.score_min === null ? null : Number(session.score_min),
      scoreMax: session.score_max === null ? null : Number(session.score_max), scoreStatus: session.score_status,
      comparable: inSet.has(session.id), isBaseline: Boolean(first) && session.id === first.id, note
    }
  })

  let comparison
  if (!anchor) {
    comparison = { status: 'no_scored', message: 'Chưa có lần đo nào được tính điểm đầy đủ để so sánh.' }
  } else if (comparable.length < 2) {
    comparison = {
      status: 'insufficient', message: 'Cần ít nhất hai lần đo cùng thang đo để so sánh. Lần đo hiện tại được dùng làm mốc ban đầu (baseline).',
      baseline: { sessionId: first.id, score: Number(first.score) }
    }
  } else {
    comparison = {
      status: 'ok',
      baseline: { sessionId: first.id, completedAt: first.completed_at, score: Number(first.score) },
      latest: { sessionId: latest.id, completedAt: latest.completed_at, score: Number(latest.score) },
      vsPrevious: difference(previous, latest),
      vsBaseline: comparable.length > 2 ? difference(first, latest) : null,
      scale: { min: Number(latest.score_min), max: Number(latest.score_max) }
    }
  }

  const excludedFromCompare = annotated.filter(session => !session.comparable).length
  return {
    sessions: annotated,
    comparison,
    chart: {
      scale: anchor ? { min: Number(anchor.score_min), max: Number(anchor.score_max) } : null,
      points: comparable.map(session => ({ sessionId: session.id, completedAt: session.completed_at, score: Number(session.score) }))
    },
    incompatibleCount: excludedFromCompare,
    disclaimer: 'Đây là mô tả chênh lệch điểm giữa các lần đo, không phải kết luận về tình trạng của bạn. Brainst0rm không đưa ra chẩn đoán hay khuyến nghị lâm sàng.'
  }
}
