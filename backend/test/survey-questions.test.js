import test from 'node:test'
import assert from 'node:assert/strict'
import { TYPES, cleanQuestion } from '../src/services/surveys.js'

const image = (char = 'A', size = 24) => `data:image/png;base64,${char.repeat(size)}`
const question = over => ({
  question_text: 'Câu hỏi',
  question_type: 'single',
  settings: {},
  options: [{ label: 'Một', value: 'Một' }],
  ...over
})

test('time is a supported question type', () => {
  assert.ok(TYPES.includes('time'))
  const cleaned = cleanQuestion(question({ question_type: 'time', settings: { placeholder: '22:30' } }), 0)
  assert.equal(cleaned.question_type, 'time')
  assert.equal(cleaned.settings.placeholder, '22:30')
})

test('unknown question types are rejected with a specific message', () => {
  assert.throws(
    () => cleanQuestion(question({ question_type: 'clock' }), 2),
    error => error.status === 400 && /Dạng câu hỏi không hợp lệ/.test(error.message)
  )
})

test('image questions keep valid data URLs and align them with options', () => {
  const cleaned = cleanQuestion(question({
    question_type: 'image',
    options: [{ label: 'Rừng', value: 'Rừng' }, { label: 'Biển', value: 'Biển' }],
    settings: { images: [image('A'), null] }
  }), 0)
  assert.deepEqual(cleaned.settings.images, [image('A'), null])
})

test('image questions reject SVG, non-data URLs and oversized images', () => {
  const invalid = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
  assert.throws(
    () => cleanQuestion(question({ question_type: 'image', settings: { images: [invalid] } }), 0),
    error => error.status === 400 && /không hợp lệ/.test(error.message)
  )
  assert.throws(
    () => cleanQuestion(question({ question_type: 'image', settings: { images: [image('A', 200_001)] } }), 1),
    error => error.status === 400 && /quá lớn/.test(error.message)
  )
})

test('the total image payload of one question is capped', () => {
  const images = Array.from({ length: 5 }, () => image('A', 199_000))
  assert.throws(
    () => cleanQuestion(question({ question_type: 'image', settings: { images } }), 0),
    error => error.status === 400 && /Tổng dung lượng ảnh/.test(error.message)
  )
})

test('images are dropped from non-image questions and settings arrays are ignored', () => {
  const cleaned = cleanQuestion(question({ question_type: 'single', settings: { images: [image()] } }), 0)
  assert.equal(cleaned.settings.images, undefined)
  assert.deepEqual(cleanQuestion(question({ settings: ['not', 'an', 'object'] }), 0).settings, {})
})

test('option labels and values are trimmed to the storage limits', () => {
  const cleaned = cleanQuestion(question({
    options: [{ label: '  ' }, { label: 'A'.repeat(300), value: 'V'.repeat(300) }]
  }), 0)
  assert.equal(cleaned.options.length, 1)
  assert.equal(cleaned.options[0].label.length, 200)
  assert.equal(cleaned.options[0].value.length, 200)
})
