import test from 'node:test'
import assert from 'node:assert/strict'
import { fingerprintDataset } from '../src/services/dataset-versions.js'

const surveyExport = (overrides = {}) => ({
  survey: { id: 'survey-1' },
  headers: [
    'survey_id', 'survey_title', 'exported_at_utc', 'record_number',
    'submitted_at_utc', 'review_status', '1. Câu hỏi'
  ],
  questions: [{ id: 'question-1', position: 0, question_text: 'Câu hỏi', question_type: 'single', is_required: true, settings: {}, options: [] }],
  rows: [{
    survey_id: 'survey-1',
    survey_title: 'Nghiên cứu',
    exported_at_utc: '2026-01-01T00:00:00.000Z',
    record_number: 1,
    submitted_at_utc: '2025-12-01T10:00:00.000Z',
    review_status: 'accepted',
    '1. Câu hỏi': 'Câu trả lời riêng tư',
    ...overrides
  }]
})

test('dataset checksum is stable across captures and ignores export-only metadata', () => {
  const first = surveyExport()
  const second = surveyExport({
    exported_at_utc: '2026-02-01T00:00:00.000Z',
    record_number: 99
  })
  const fingerprint = fingerprintDataset([first], 'stable-secret')

  assert.equal(fingerprint.checksum, fingerprintDataset([second], 'stable-secret').checksum)
  assert.equal(fingerprint.responseCount, 1)
  assert.deepEqual(fingerprint.surveyIds, ['survey-1'])
  assert.equal(fingerprint.checksum.includes('Câu trả lời riêng tư'), false)
})

test('dataset checksum changes when included response data changes', () => {
  const original = fingerprintDataset([surveyExport()], 'stable-secret')
  const changed = fingerprintDataset([surveyExport({ '1. Câu hỏi': 'Câu trả lời khác' })], 'stable-secret')

  assert.notEqual(original.checksum, changed.checksum)
})

test('dataset checksum changes when question schema changes', () => {
  const original = fingerprintDataset([surveyExport()], 'stable-secret')
  const changed = surveyExport()
  changed.questions[0].options = [{ value: 'yes', label: 'Có' }]
  assert.notEqual(original.checksum, fingerprintDataset([changed], 'stable-secret').checksum)
})

test('dataset checksum is independent of survey load order', () => {
  const second = { ...surveyExport(), survey: { id: 'survey-2' } }
  second.rows = second.rows.map(row => ({ ...row, survey_id: 'survey-2' }))
  assert.equal(
    fingerprintDataset([surveyExport(), second], 'stable-secret').checksum,
    fingerprintDataset([second, surveyExport()], 'stable-secret').checksum
  )
})

test('dataset checksum requires a stable secret', () => {
  assert.throws(() => fingerprintDataset([], ''), /stable dataset checksum secret/)
})
