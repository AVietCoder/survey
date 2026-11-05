import { supabase, ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'
import { loadQuestions } from '../services/surveys.js'
import { getSurveyAccess } from '../services/research-projects.js'
import { applyDateRange, getDateRange } from '../services/date-range.js'

export function calculateCompletionRate(startedCount, completedCount) {
  return startedCount ? Math.round(completedCount / startedCount * 100) : 0
}

function summarize(rs, range = {}, startedCount = rs.length, cohortCompletedCount) {
  const done = rs.filter(r => r.submitted_at)
  const q = { normal: 0, suspicious: 0, spam: 0 }
  done.forEach(r => q[r.quality_status]++)
  const review = { needs_review: 0, accepted: 0, excluded: 0 }
  done.forEach(r => { review[r.review_status]++ })
  const durs = done.map(r => r.duration_seconds).filter(d => d != null)
  const today = new Date().toISOString().slice(0, 10)
  const endDate = range.to || today
  const startDate = range.from || new Date(Date.parse(`${endDate}T00:00:00.000Z`) - 13 * 864e5).toISOString().slice(0, 10)
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const span = Math.max(0, Math.min(364, Math.floor((end - start) / 864e5)))
  const days = [...Array(span + 1)].map((_, i) => new Date(Math.max(start.getTime(), end.getTime() - (span - i) * 864e5)).toISOString().slice(0, 10))
  const cnt = Object.fromEntries(days.map(d => [d, 0]))
  done.forEach(r => { const d = r.submitted_at.slice(0, 10); if (d in cnt) cnt[d]++ })
  return {
    started: startedCount, completed: done.length,
    cohortCompleted: cohortCompletedCount ?? done.length,
    completionRate: calculateCompletionRate(startedCount, cohortCompletedCount ?? done.length),
    avgDuration: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null,
    quality: q, review, normalRate: done.length ? Math.round(q.normal / done.length * 100) : null,
    series: days.map(d => ({ date: d, count: cnt[d] }))
  }
}

async function fetchAll(queryForRange) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const page = ok(await queryForRange(from, from + 999))
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

export async function overview(req, res) {
  const surveys = await fetchAll((from, to) => supabase.from('surveys').select('id').eq('user_id', req.user.id).range(from, to))
  const ids = surveys.map(s => s.id)
  const rs = ids.length ? await fetchAll((from, to) => supabase.from('responses')
    .select('survey_id, submitted_at, duration_seconds, quality_status, review_status').in('survey_id', ids).range(from, to)) : []
  res.json({ totalSurveys: surveys.length, ...summarize(rs) })
}

const bars = (counts, order) => {
  const n = Object.values(counts).reduce((a, b) => a + b, 0)
  return (order || Object.keys(counts)).map(label => ({ label, count: counts[label] || 0, pct: n ? Math.round((counts[label] || 0) / n * 100) : 0 }))
}

function questionStats(q, vals, eligibleResponses) {
  const base = { id: q.id, text: q.question_text, type: q.question_type, n: vals.length, missing: Math.max(0, eligibleResponses - vals.length) }
  const labels = q.options.map(o => o.label), t = q.question_type
  if (t === 'single' || t === 'image' || t === 'mc') {
    const c = {}; vals.forEach(v => [].concat(v).forEach(x => c[x] = (c[x] || 0) + 1))
    return { ...base, kind: 'bars', bars: bars(c, labels) }
  }
  if (t === 'likert' || t === 'rating') {
    const data = describeNumeric(vals)
    const { values, ...stats } = data
    const c = {}; values.forEach(v => c[v] = (c[v] || 0) + 1)
    return { ...base, n: stats.n, missing: Math.max(0, eligibleResponses - stats.n), kind: 'bars', avg: stats.mean, stats, bars: bars(c, [1, 2, 3, 4, 5].map(String)).map(b => ({ ...b, label: b.label + (t === 'rating' ? ' ★' : '') })) }
  }
  if (t === 'slider') {
    const c = { '0–20': 0, '21–40': 0, '41–60': 0, '61–80': 0, '81–100': 0 }
    const data = describeNumeric(vals)
    const { values, ...stats } = data
    values.forEach(v => c[Object.keys(c)[Math.min(4, Math.floor(Math.max(0, v - 1) / 20))]]++)
    return { ...base, n: stats.n, missing: Math.max(0, eligibleResponses - stats.n), kind: 'bars', avg: stats.mean, stats, bars: bars(c) }
  }
  if (t === 'rank') {
    const sum = {}; vals.forEach(v => v.forEach((x, i) => sum[x] = (sum[x] || 0) + i + 1))
    return { ...base, kind: 'rows', rows: labels.map(l => ({ label: l, avg: vals.length ? +((sum[l] || 0) / vals.length).toFixed(2) : null, max: labels.length })), hint: 'Thứ hạng trung bình (1 = quan trọng nhất)' }
  }
  if (t === 'sd' || t === 'matrix') {
    const cols = q.settings.cols || [], acc = {}
    vals.forEach(v => Object.entries(v).forEach(([k, x]) => { const n = t === 'sd' ? +x : cols.indexOf(x) + 1; (acc[k] ||= []).push(n) }))
    const keys = t === 'sd' ? (q.settings.pairs || []).map(p => p.join('|')) : labels
    return { ...base, kind: 'rows', rows: keys.map(k => ({ label: k.replace('|', ' ↔ '), avg: acc[k]?.length ? +(acc[k].reduce((a, b) => a + b, 0) / acc[k].length).toFixed(2) : null, max: t === 'sd' ? 5 : cols.length })) }
  }
  return { ...base, kind: 'text', samples: vals.slice(-5).reverse() }
}

export function describeNumeric(values) {
  const numbers = values.map(numericValue).filter(Number.isFinite)
  const n = numbers.length
  if (!n) return { n: 0, values: [], mean: null, median: null, mode: [], standardDeviation: null }
  const sorted = numbers.slice().sort((a, b) => a - b)
  const frequencies = new Map()
  numbers.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1))
  const highestFrequency = [...frequencies.values()].reduce((highest, count) => Math.max(highest, count), 0)
  const mean = numbers.reduce((sum, value) => sum + value, 0) / n
  const middle = Math.floor(n / 2)
  const variance = n > 1 ? numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : null
  return {
    n,
    values: numbers,
    mean: +mean.toFixed(2),
    median: +((n % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2).toFixed(2)),
    mode: [...frequencies].filter(([, count]) => count === highestFrequency).map(([value]) => value).sort((a, b) => a - b),
    standardDeviation: variance == null ? null : +Math.sqrt(variance).toFixed(2)
  }
}

const numericValue = value => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return NaN
}

export function calculateCronbachAlpha(rows, questionIds) {
  const complete = rows.filter(row => questionIds.every(id => Number.isFinite(numericValue(row[id]))))
  const n = complete.length, k = questionIds.length
  if (k < 2 || n < 2) return { alpha: null, n, method: 'complete-case' }
  const itemVariances = questionIds.map(id => {
    const values = complete.map(row => numericValue(row[id]))
    const mean = values.reduce((sum, value) => sum + value, 0) / n
    return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1)
  })
  const totals = complete.map(row => questionIds.reduce((sum, id) => sum + numericValue(row[id]), 0))
  const totalMean = totals.reduce((sum, value) => sum + value, 0) / n
  const totalVariance = totals.reduce((sum, value) => sum + (value - totalMean) ** 2, 0) / (n - 1)
  if (totalVariance === 0) return { alpha: null, n, method: 'complete-case' }
  const alpha = k / (k - 1) * (1 - itemVariances.reduce((sum, value) => sum + value, 0) / totalVariance)
  return { alpha: +alpha.toFixed(3), n, method: 'complete-case' }
}

export function calculateCorrelation(rows, firstId, secondId) {
  const pairs = rows.map(row => [numericValue(row[firstId]), numericValue(row[secondId])])
    .filter(([first, second]) => Number.isFinite(first) && Number.isFinite(second))
  const n = pairs.length
  if (n < 2) return { coefficient: null, n }
  const firstMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / n
  const secondMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / n
  const covariance = pairs.reduce((sum, pair) => sum + (pair[0] - firstMean) * (pair[1] - secondMean), 0)
  const firstSquares = pairs.reduce((sum, pair) => sum + (pair[0] - firstMean) ** 2, 0)
  const secondSquares = pairs.reduce((sum, pair) => sum + (pair[1] - secondMean) ** 2, 0)
  const denominator = Math.sqrt(firstSquares * secondSquares)
  return { coefficient: denominator ? +(covariance / denominator).toFixed(3) : null, n }
}

function optionLabels(question) {
  return [...new Set(question.options.map(option => option.label))]
}

export async function relationshipAnalysis(req, res) {
  const { survey } = await getSurveyAccess(req.params.surveyId, req.user.id)
  const range = getDateRange(req.query)
  const { analysisType, firstQuestionId, secondQuestionId } = req.body || {}
  if (!['group', 'crosstab', 'correlation'].includes(analysisType)
    || typeof firstQuestionId !== 'string' || typeof secondQuestionId !== 'string'
    || firstQuestionId === secondQuestionId)
    throw new HttpError(400, 'Kiểu phân tích hoặc cặp câu hỏi không hợp lệ')

  const questions = await loadQuestions(survey.id)
  const first = questions.find(question => question.id === firstQuestionId)
  const second = questions.find(question => question.id === secondQuestionId)
  if (!first || !second) throw new HttpError(400, 'Câu hỏi không thuộc khảo sát này')
  const numericTypes = ['likert', 'rating', 'slider']
  const valid = analysisType === 'group'
    ? first.question_type === 'single' && numericTypes.includes(second.question_type)
    : analysisType === 'crosstab'
      ? first.question_type === 'single' && second.question_type === 'single'
      : numericTypes.includes(first.question_type) && numericTypes.includes(second.question_type)
  if (!valid) throw new HttpError(400, 'Loại câu hỏi không phù hợp với phép phân tích đã chọn')

  const countResult = await applyDateRange(supabase.from('responses').select('id', { count: 'exact', head: true })
    .eq('survey_id', survey.id).not('submitted_at', 'is', null).neq('review_status', 'excluded'), range)
  if (countResult.error) throw countResult.error
  const eligible = countResult.count || 0
  const answers = await fetchAll((from, to) => applyDateRange(supabase.from('answers')
    .select('response_id, question_id, answer_value, responses!inner(survey_id, submitted_at, review_status)')
    .eq('responses.survey_id', survey.id).not('responses.submitted_at', 'is', null)
    .neq('responses.review_status', 'excluded').in('question_id', [first.id, second.id]), range, 'responses.submitted_at').range(from, to))
  const byResponse = new Map()
  answers.forEach(answer => {
    const values = byResponse.get(answer.response_id) || {}
    values[answer.question_id] = answer.answer_value
    byResponse.set(answer.response_id, values)
  })
  const rows = [...byResponse.values()]
  const title = question => ({ id: question.id, text: question.question_text })
  if (analysisType === 'correlation') {
    const result = calculateCorrelation(rows, first.id, second.id)
    return res.json({
      analysisType, first: title(first), second: title(second), ...result,
      missing: Math.max(0, eligible - result.n), method: 'Pearson r; chỉ các cặp số hợp lệ',
      interpretation: 'Tương quan không chứng minh quan hệ nhân quả.'
    })
  }
  if (analysisType === 'crosstab') {
    const firstLabels = optionLabels(first), secondLabels = optionLabels(second)
    const cells = Object.fromEntries(firstLabels.map(label => [label, Object.fromEntries(secondLabels.map(value => [value, 0]))]))
    let n = 0
    rows.forEach(row => {
      const a = row[first.id], b = row[second.id]
      if (typeof a !== 'string' || typeof b !== 'string') return
      if (!cells[a]) cells[a] = Object.fromEntries(secondLabels.map(value => [value, 0]))
      if (!(b in cells[a])) cells[a][b] = 0
      cells[a][b]++
      n++
    })
    const columnLabels = [...new Set([...secondLabels, ...Object.values(cells).flatMap(row => Object.keys(row))])]
    return res.json({
      analysisType, first: title(first), second: title(second), n, missing: Math.max(0, eligible - n),
      columns: columnLabels,
      rows: Object.entries(cells).map(([label, values]) => {
        const total = Object.values(values).reduce((sum, count) => sum + count, 0)
        return { label, total, cells: columnLabels.map(column => ({ label: column, count: values[column] || 0, percent: total ? Math.round((values[column] || 0) / total * 100) : 0 })) }
      }),
      method: 'Đếm các cặp câu trả lời hợp lệ; phần trăm theo hàng.'
    })
  }

  const labels = optionLabels(first)
  const groups = new Map(labels.map(label => [label, []]))
  rows.forEach(row => {
    const group = row[first.id]
    if (typeof group !== 'string') return
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(numericValue(row[second.id]))
  })
  const groupedValid = [...groups.values()].reduce((sum, values) => sum + values.filter(Number.isFinite).length, 0)
  return res.json({
    analysisType, first: title(first), second: title(second),
    n: groupedValid,
    missing: Math.max(0, eligible - groupedValid),
    groups: [...groups].map(([label, values]) => {
      const stats = describeNumeric(values)
      return { label, participants: values.length, n: stats.n, missing: values.length - stats.n, mean: stats.mean, standardDeviation: stats.standardDeviation }
    }),
    method: 'So sánh trung bình theo câu single; chỉ câu trả lời số hợp lệ được tính.'
  })
}

export async function reliability(req, res) {
  const { survey } = await getSurveyAccess(req.params.surveyId, req.user.id)
  const range = getDateRange(req.query)
  const ids = req.body?.questionIds
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 30 || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string'))
    throw new HttpError(400, 'Chọn từ 2 đến 30 câu hỏi khác nhau')
  const questions = await loadQuestions(survey.id)
  const selected = ids.map(id => questions.find(question => question.id === id))
  if (selected.some(question => !question || !['likert', 'rating'].includes(question.question_type)))
    throw new HttpError(400, 'Chỉ có thể phân tích các câu hỏi Likert hoặc thang đánh giá trong khảo sát này')

  const answers = await fetchAll((from, to) => applyDateRange(supabase.from('answers')
    .select('response_id, question_id, answer_value, responses!inner(survey_id, submitted_at, review_status)')
    .eq('responses.survey_id', survey.id).not('responses.submitted_at', 'is', null)
    .neq('responses.review_status', 'excluded').in('question_id', ids), range, 'responses.submitted_at').range(from, to))
  const byResponse = new Map()
  answers.forEach(answer => {
    const values = byResponse.get(answer.response_id) || {}
    values[answer.question_id] = answer.answer_value
    byResponse.set(answer.response_id, values)
  })
  const rows = [...byResponse.values()]
  const result = calculateCronbachAlpha(rows, ids)
  res.json({
    ...result,
    items: selected.map(question => ({ id: question.id, text: question.question_text })),
    missingPolicy: 'complete-case'
  })
}

export async function bySurvey(req, res) {
  const { survey: s, role } = await getSurveyAccess(req.params.surveyId, req.user.id)
  const range = getDateRange(req.query)
  const rs = await fetchAll((from, to) => applyDateRange(supabase.from('responses')
    .select('submitted_at, duration_seconds, quality_status, review_status, signals').eq('survey_id', s.id), range).range(from, to))
  let startedCount = rs.length
  let cohortCompletedCount = rs.filter(response => response.submitted_at).length
  if (range.start || range.end) {
    const starts = await applyDateRange(supabase.from('responses')
      .select('id', { count: 'exact', head: true }).eq('survey_id', s.id), range, 'started_at')
    if (starts.error) throw starts.error
    startedCount = starts.count || 0
    const completions = await applyDateRange(supabase.from('responses')
      .select('id', { count: 'exact', head: true }).eq('survey_id', s.id).not('submitted_at', 'is', null), range, 'started_at')
    if (completions.error) throw completions.error
    cohortCompletedCount = completions.count || 0
  }
  const questions = await loadQuestions(s.id)
  const rows = await fetchAll((from, to) => applyDateRange(supabase.from('answers')
    .select('question_id, answer_value, responses!inner(survey_id, submitted_at, review_status)')
    .eq('responses.survey_id', s.id).not('responses.submitted_at', 'is', null)
    .neq('responses.review_status', 'excluded'), range, 'responses.submitted_at').range(from, to))
  const eligibleCount = rs.filter(response => response.submitted_at && response.review_status !== 'excluded').length
  const by = {}; rows.forEach(r => (by[r.question_id] ||= []).push(r.answer_value))
  const signalCounts = {}
  rs.filter(r => r.submitted_at).forEach(r => (r.signals || []).forEach(x => signalCounts[x.code] = (signalCounts[x.code] || 0) + 1))
  res.json({ survey: { id: s.id, title: s.title, status: s.status, public_slug: s.public_slug }, canReview: role !== 'reviewer', ...summarize(rs, range, startedCount, cohortCompletedCount), signalCounts,
    range: { from: range.from, to: range.to }, eligibleResponses: eligibleCount, questions: questions.map(q => questionStats(q, by[q.id] || [], eligibleCount)) })
}
