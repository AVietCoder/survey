import { createHash } from 'node:crypto'
import { createCsvFile } from '../services/csv-export.js'
import { loadSurveyExport } from '../services/survey-export.js'
import { createXlsx } from '../services/xlsx-export.js'

const safeFilename = value => (String(value || 'survey').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'survey')

function sendExport(res, survey, exportedAt, content, extension, contentType) {
  const checksum = createHash('sha256').update(content).digest('hex')
  const filename = `${safeFilename(survey.title)}-responses-${exportedAt.slice(0, 10)}.${extension}`
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
  sendExport(res, survey, exportedAt, createCsvFile(headers, rows), 'csv', 'text/csv; charset=utf-8')
}

export async function surveyXlsx(req, res) {
  const { survey, exportedAt, headers, rows } = await loadSurveyExport(req.params.surveyId, req.user.id, req.query)
  const content = await createXlsx(headers, rows, exportedAt)
  sendExport(res, survey, exportedAt, content, 'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}
