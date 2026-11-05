import { createHmac } from 'node:crypto'

const VARIABLE_COLUMNS = new Set([
  'exported_at_utc', 'filter_from_utc', 'filter_to_utc', 'record_number'
])

export const DATASET_CHECKSUM_ALGORITHM = 'hmac-sha256-v1'
export const DATASET_DEFINITION = 'completed-not-excluded-v1'

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]))
  return value
}

export function fingerprintDataset(surveyExports, secret) {
  if (typeof secret !== 'string' || secret.length === 0)
    throw new TypeError('A stable dataset checksum secret is required')

  const checksum = createHmac('sha256', secret)
  checksum.update(`brainst0rm:${DATASET_CHECKSUM_ALGORITHM}:${DATASET_DEFINITION}\n`)
  const sortedExports = [...surveyExports].sort((a, b) => a.survey.id.localeCompare(b.survey.id))
  const surveyIds = sortedExports.map(item => item.survey.id)
  let responseCount = 0

  for (const item of sortedExports) {
    const columns = item.headers.filter(header => !VARIABLE_COLUMNS.has(header))
    const questions = (item.questions || []).map(question => ({
      id: question.id,
      position: question.position,
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      settings: question.settings,
      options: question.options
    }))
    checksum.update(`${JSON.stringify(canonicalize({ surveyId: item.survey.id, columns, questions }))}\n`)
    for (const row of item.rows) {
      checksum.update(`${JSON.stringify(canonicalize(columns.map(column => row[column] ?? null)))}\n`)
      responseCount += 1
    }
  }

  return {
    checksum: checksum.digest('hex'),
    responseCount,
    surveyCount: surveyIds.length,
    surveyIds
  }
}
