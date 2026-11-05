import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCompletionRate, calculateCorrelation, calculateCronbachAlpha, describeNumeric } from '../src/controllers/analytics.js'
import { getDateRange } from '../src/services/date-range.js'

test('descriptive statistics ignore absent values and report sample deviation', () => {
  const stats = describeNumeric([1, 2, 2, 4, null, ''])
  assert.deepEqual(stats, {
    n: 4,
    values: [1, 2, 2, 4],
    mean: 2.25,
    median: 2,
    mode: [2],
    standardDeviation: 1.26
  })
})

test('completion rate uses the start cohort denominator and handles empty cohorts', () => {
  assert.equal(calculateCompletionRate(10, 7), 70)
  assert.equal(calculateCompletionRate(0, 0), 0)
})

test('descriptive statistics return tied modes and null values for empty input', () => {
  assert.deepEqual(describeNumeric([1, 2, 3]).mode, [1, 2, 3])
  assert.deepEqual(describeNumeric([]), {
    n: 0,
    values: [],
    mean: null,
    median: null,
    mode: [],
    standardDeviation: null
  })
})

test('Cronbach alpha uses complete cases and reports their count', () => {
  const result = calculateCronbachAlpha([
    { first: 1, second: 1 },
    { first: 2, second: 2 },
    { first: 3, second: 3 },
    { first: 4 }
  ], ['first', 'second'])
  assert.deepEqual(result, { alpha: 1, n: 3, method: 'complete-case' })
})

test('Cronbach alpha is unavailable when total scores have no variance', () => {
  const result = calculateCronbachAlpha([
    { first: 1, second: 4 },
    { first: 2, second: 3 }
  ], ['first', 'second'])
  assert.deepEqual(result, { alpha: null, n: 2, method: 'complete-case' })
})

test('Pearson correlation uses complete numeric pairs and does not infer causation', () => {
  const result = calculateCorrelation([
    { first: 1, second: 2 },
    { first: 2, second: 4 },
    { first: 3, second: 6 },
    { first: 4, second: null }
  ], 'first', 'second')
  assert.deepEqual(result, { coefficient: 1, n: 3 })
})

test('Pearson correlation is unavailable for a constant variable', () => {
  const result = calculateCorrelation([
    { first: 1, second: 4 },
    { first: 2, second: 4 }
  ], 'first', 'second')
  assert.deepEqual(result, { coefficient: null, n: 2 })
})

test('date filters include the full end date in UTC', () => {
  assert.deepEqual(getDateRange({ from: '2026-02-28', to: '2026-03-01' }), {
    from: '2026-02-28',
    to: '2026-03-01',
    start: '2026-02-28T00:00:00.000Z',
    end: '2026-03-02T00:00:00.000Z'
  })
})

test('date filters reject invalid or reversed dates', () => {
  assert.throws(() => getDateRange({ from: '2026-02-30' }), { status: 400 })
  assert.throws(() => getDateRange({ to: '2026-99-99' }), { status: 400 })
  assert.throws(() => getDateRange({ from: '2026-03-02', to: '2026-03-01' }), { status: 400 })
})
