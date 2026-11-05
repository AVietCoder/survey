import test from 'node:test'
import assert from 'node:assert/strict'
import { answerToText, createCsv, createCsvFile, csvCell } from '../src/services/csv-export.js'

test('CSV cells preserve UTF-8 text, quotes, and embedded newlines', () => {
  assert.equal(csvCell('Tâm lý, "nghiên cứu"\nMới'), '"Tâm lý, ""nghiên cứu""\nMới"')
})

test('CSV cells neutralize spreadsheet formulas', () => {
  assert.equal(csvCell('=1+1'), `"'=1+1"`)
  assert.equal(csvCell('\t@SUM(A1:A2)'), "\"'\t@SUM(A1:A2)\"")
  assert.equal(csvCell('\uFEFF=1+1'), "\"'\uFEFF=1+1\"")
})

test('answer values flatten arrays and structured responses', () => {
  assert.equal(answerToText(['Có', 'Thường xuyên']), 'Có; Thường xuyên')
  assert.equal(answerToText({ 'Mệt mỏi': 3, 'Tập trung': 'Thường' }), 'Mệt mỏi: 3; Tập trung: Thường')
  assert.equal(createCsv(['Câu hỏi'], [{ 'Câu hỏi': answerToText(['Có', 'Không']) }]), '"Câu hỏi"\r\n"Có; Không"')
})

test('CSV download content starts with the UTF-8 BOM', () => {
  assert.equal(createCsvFile(['câu hỏi'], []), '\uFEFF"câu hỏi"')
})
