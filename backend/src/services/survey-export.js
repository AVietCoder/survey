import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { getSurveyAccess } from './research-projects.js'
import { applyDateRange, getDateRange } from './date-range.js'
import { answerToText } from './csv-export.js'
import { loadQuestions } from './surveys.js'

const REVIEW_FILTERS = ['not_excluded', 'all', 'needs_review', 'accepted', 'excluded']
const MAX_EXPORT_RESPONSES = 10000
const PAGE_SIZE = 500
const text = value => String(value || '').trim()

export async function loadSurveyExport(surveyId, userId, query, { asOf } = {}) {
  const { survey } = await getSurveyAccess(surveyId, userId, ['owner', 'researcher'])
  const range = getDateRange(query)
  const exportedAt = asOf || new Date().toISOString()
  const reviewFilter = text(query.reviewStatus) || 'not_excluded'
  if (!REVIEW_FILTERS.includes(reviewFilter)) throw new HttpError(400, 'Bộ lọc trạng thái review không hợp lệ')

  const questions = await loadQuestions(survey.id)
  const requestedIds = query.questionIds === undefined ? null
    : String(query.questionIds).split(',').filter(Boolean)
  if (requestedIds && (!requestedIds.length || new Set(requestedIds).size !== requestedIds.length
    || requestedIds.length > 200 || requestedIds.some(id => !questions.some(question => question.id === id)))) {
    throw new HttpError(400, 'Danh sách câu hỏi xuất không hợp lệ')
  }
  const selectedQuestions = requestedIds
    ? questions.filter(question => requestedIds.includes(question.id))
    : questions

  const responseQuery = (withCount = false) => {
    let responseQueryBuilder = applyDateRange(supabase.from('responses')
      .select('id,submitted_at,duration_seconds,quality_status,quality_score,review_status',
        withCount ? { count: 'exact' } : undefined)
      .eq('survey_id', survey.id).not('submitted_at', 'is', null).lte('submitted_at', exportedAt), range)
    if (reviewFilter === 'not_excluded') responseQueryBuilder = responseQueryBuilder.neq('review_status', 'excluded')
    else if (reviewFilter !== 'all') responseQueryBuilder = responseQueryBuilder.eq('review_status', reviewFilter)
    return responseQueryBuilder
  }
  const countResult = await responseQuery(true).range(0, 0)
  if (countResult.error) throw countResult.error
  const total = countResult.count || 0
  if (total > MAX_EXPORT_RESPONSES)
    throw new HttpError(413, `Tệp có ${total} phản hồi; giới hạn mỗi lần xuất là ${MAX_EXPORT_RESPONSES}. Hãy lọc theo ngày hoặc trạng thái review.`)

  const responses = []
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    responses.push(...ok(await responseQuery().order('submitted_at', { ascending: true })
      .order('id', { ascending: true }).range(offset, offset + PAGE_SIZE - 1)))
  }
  if (responses.length !== total) throw new HttpError(409, 'Dữ liệu phản hồi thay đổi trong lúc xuất; vui lòng thử lại')

  const answerByResponse = new Map(responses.map(response => [response.id, {}]))
  const ids = responses.map(response => response.id)
  for (let offset = 0; selectedQuestions.length && offset < ids.length; offset += 250) {
    const answers = ok(await supabase.from('answers').select('response_id,question_id,answer_value')
      .in('response_id', ids.slice(offset, offset + 250)).in('question_id', selectedQuestions.map(question => question.id)))
    answers.forEach(answer => answerByResponse.get(answer.response_id)[answer.question_id] = answer.answer_value)
  }

  const metadataHeaders = ['survey_id', 'survey_title', 'exported_at_utc', 'filter_from_utc', 'filter_to_utc',
    'record_number', 'submitted_at_utc', 'duration_seconds', 'quality_status', 'quality_score', 'review_status']
  const questionHeaders = selectedQuestions.map((question, index) => `${index + 1}. ${question.question_text}`)
  const headers = [...metadataHeaders, ...questionHeaders]
  const rows = responses.map((response, index) => {
    const answers = answerByResponse.get(response.id)
    return {
      survey_id: survey.id,
      survey_title: survey.title,
      exported_at_utc: exportedAt,
      filter_from_utc: range.from,
      filter_to_utc: range.to,
      record_number: index + 1,
      submitted_at_utc: response.submitted_at,
      duration_seconds: response.duration_seconds,
      quality_status: response.quality_status,
      quality_score: response.quality_score,
      review_status: response.review_status,
      ...Object.fromEntries(selectedQuestions.map((question, questionIndex) => [
        questionHeaders[questionIndex],
        answerToText(answers[question.id])
      ]))
    }
  })

  return { survey, exportedAt, headers, rows, questions: selectedQuestions }
}
