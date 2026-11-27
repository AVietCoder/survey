import { createHash } from 'node:crypto'
import { logActivity } from '../services/activity.js'
import { createCsvFile } from '../services/csv-export.js'
import { loadSurveyExport } from '../services/survey-export.js'
import { createXlsx, createXlsxSheets } from '../services/xlsx-export.js'
import { supabase } from '../config/supabase.js'
import { getSurveyAccess } from '../services/research-projects.js'
import { ANSWER_HEADERS, ANSWER_TASKS, createTaskAnswerService, parseFilter } from '../services/task-answers.js'

const safeFilename = value => (String(value || 'survey').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'survey')

function sendExport(res, survey, exportedAt, content, extension, contentType, kind = 'responses') {
  const checksum = createHash('sha256').update(content).digest('hex')
  const filename = `${safeFilename(survey.title)}-${kind}-${exportedAt.slice(0, 10)}.${extension}`
  res.set({
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Content-SHA256': checksum
  })
  res.send(content)
}

export async function surveyCsv(req, res) {
  const { survey, exportedAt, headers, rows } = await loadSurveyExport(req.params.surveyId, req.user.id, req.query)
  await logActivity(req, 'export.csv', { type: 'survey', id: survey.id, label: survey.title }, { rows: rows.length })
  sendExport(res, survey, exportedAt, createCsvFile(headers, rows), 'csv', 'text/csv; charset=utf-8')
}

export async function surveyXlsx(req, res) {
  const { survey, exportedAt, headers, rows } = await loadSurveyExport(req.params.surveyId, req.user.id, req.query)
  const content = await createXlsx(headers, rows, exportedAt)
  await logActivity(req, 'export.xlsx', { type: 'survey', id: survey.id, label: survey.title }, { rows: rows.length })
  sendExport(res, survey, exportedAt, content, 'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

/* ---- câu trả lời nhiệm vụ Y-01/Y-02: chỉ chủ sở hữu và researcher của khảo sát (như xuất phản hồi); viewer, reviewer nhận 404 */
async function loadAnswers(req) {
  const { survey } = await getSurveyAccess(req.params.surveyId, req.user.id, ['owner', 'researcher'])
  const filter = parseFilter(req.query)
  const service = createTaskAnswerService(supabase)
  return { survey, filter, service, rows: await service.list(survey.id, filter) }
}
const SHOWN = 200

export async function taskAnswers(req, res) {
  const { service, rows } = await loadAnswers(req)
  res.set('Cache-Control', 'private, no-store')
  res.json({ summary: service.summarize(rows), total: rows.length, rows: rows.slice(-SHOWN).reverse() })
}

export async function taskAnswersCsv(req, res) {
  const { survey, filter, service, rows } = await loadAnswers(req)
  await logActivity(req, 'export.task_answers', { type: 'survey', id: survey.id, label: survey.title }, { rows: rows.length, format: 'csv', task: filter.task || 'all' })
  sendExport(res, survey, new Date().toISOString(), createCsvFile(ANSWER_HEADERS, rows.map(service.toRecord)), 'csv', 'text/csv; charset=utf-8', `task-answers${filter.task ? `-${filter.task}` : ''}`)
}

export async function taskAnswersXlsx(req, res) {
  const { survey, filter, service, rows } = await loadAnswers(req)
  const exportedAt = new Date().toISOString()
  const codes = filter.task ? [filter.task] : Object.keys(ANSWER_TASKS)       // mỗi nhiệm vụ một trang tính
  const content = await createXlsxSheets(codes.map(code => ({ name: code, headers: ANSWER_HEADERS, rows: rows.filter(row => row.task === code).map(service.toRecord) })), exportedAt)
  await logActivity(req, 'export.task_answers', { type: 'survey', id: survey.id, label: survey.title }, { rows: rows.length, format: 'xlsx', task: filter.task || 'all' })
  sendExport(res, survey, exportedAt, content, 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `task-answers${filter.task ? `-${filter.task}` : ''}`)
}
