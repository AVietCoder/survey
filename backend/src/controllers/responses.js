import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { getSurveyAccess } from '../services/research-projects.js'
import { applyDateRange, getDateRange } from '../services/date-range.js'

const REVIEW_STATUSES = ['needs_review', 'accepted', 'excluded']

export async function listBySurvey(req, res) {
  const { survey: s, role } = await getSurveyAccess(req.params.surveyId, req.user.id)
  const page = Number(req.query.page || 1)
  const status = req.query.status || ''
  const range = getDateRange(req.query)
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'Trang không hợp lệ')
  if (status && !REVIEW_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái đánh giá không hợp lệ')
  const pageSize = 25
  let query = applyDateRange(supabase.from('responses')
    .select('id, started_at, submitted_at, duration_seconds, quality_status, quality_score, signals, review_status, review_note, reviewed_at', { count: 'exact' })
    .eq('survey_id', s.id).not('submitted_at', 'is', null), range).order('submitted_at', { ascending: false })
  if (status) query = query.eq('review_status', status)
  const result = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const responses = ok(result)
  res.json({ responses, total: result.count, page, pageSize, canReview: role !== 'reviewer' })
}

export async function review(req, res) {
  const { responseId } = req.params
  const status = String(req.body?.status || '')
  const note = String(req.body?.note || '').trim()
  if (!REVIEW_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái đánh giá không hợp lệ')
  if (note.length > 1000) throw new HttpError(400, 'Ghi chú không được vượt quá 1000 ký tự')

  const response = ok(await supabase.from('responses').select('id,survey_id,submitted_at')
    .eq('id', responseId).maybeSingle())
  if (!response) throw new HttpError(404, 'Không tìm thấy phản hồi')
  await getSurveyAccess(response.survey_id, req.user.id, ['owner', 'researcher'])
  if (!response.submitted_at) throw new HttpError(400, 'Chỉ có thể đánh giá phản hồi đã hoàn tất')

  const reviewedAt = status === 'needs_review' ? null : new Date().toISOString()
  const reviewedBy = status === 'needs_review' ? null : req.user.id
  const updated = ok(await supabase.from('responses').update({
    review_status: status, review_note: note, reviewed_at: reviewedAt, reviewed_by: reviewedBy
  }).eq('id', response.id)
    .select('id,review_status,review_note,reviewed_at').single())
  res.json({ response: updated })
}
