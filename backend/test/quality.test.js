import test from 'node:test'
import assert from 'node:assert/strict'
import { findInconsistentAnswers } from '../src/services/quality.js'

test('configured same-answer checks flag only a mismatch', () => {
  const questions = [
    { id: 'first', question_type: 'single', question_text: 'Câu một', settings: { consistency_check: { question_id: 'second', relation: 'same' } } },
    { id: 'second', question_type: 'single', question_text: 'Câu hai', settings: {} }
  ]
  const signals = findInconsistentAnswers(questions, [
    { question_id: 'first', value: 'Có' },
    { question_id: 'second', value: 'Không' }
  ])
  assert.equal(signals.length, 1)
  assert.equal(signals[0].code, 'inconsistent')
  assert.match(signals[0].message, /Câu một.*Câu hai/)
})

test('configured different-answer checks flag matching answers and ignore incomplete pairs', () => {
  const questions = [
    { id: 'first', question_type: 'rating', question_text: 'Câu một', settings: { consistency_check: { question_id: 'second', relation: 'different' } } },
    { id: 'second', question_type: 'rating', question_text: 'Câu hai', settings: {} }
  ]
  assert.equal(findInconsistentAnswers(questions, [
    { question_id: 'first', value: 3 },
    { question_id: 'second', value: 3 }
  ])[0].code, 'inconsistent')
  assert.deepEqual(findInconsistentAnswers(questions, [{ question_id: 'first', value: 3 }]), [])
})

test('consistency checks compare structured values without object key-order sensitivity', () => {
  const questions = [
    { id: 'first', question_type: 'likert', question_text: 'Câu một', settings: { consistency_check: { question_id: 'second', relation: 'same' } } },
    { id: 'second', question_type: 'likert', question_text: 'Câu hai', settings: {} }
  ]
  assert.deepEqual(findInconsistentAnswers(questions, [
    { question_id: 'first', value: { focus: 4, energy: 2 } },
    { question_id: 'second', value: { energy: 2, focus: 4 } }
  ]), [])
})

test('a configured pair produces at most one signal and conflicting pair rules are ignored', () => {
  const questions = [
    { id: 'first', question_type: 'single', question_text: 'Câu một', settings: { consistency_check: { question_id: 'second', relation: 'same' } } },
    { id: 'second', question_type: 'single', question_text: 'Câu hai', settings: { consistency_check: { question_id: 'first', relation: 'same' } } }
  ]
  const answers = [{ question_id: 'first', value: 'Có' }, { question_id: 'second', value: 'Không' }]
  assert.equal(findInconsistentAnswers(questions, answers).length, 1)
  questions[1].settings.consistency_check.relation = 'different'
  assert.deepEqual(findInconsistentAnswers(questions, answers), [])
})
