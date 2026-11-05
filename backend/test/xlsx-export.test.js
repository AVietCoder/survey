import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { createXlsx } from '../src/services/xlsx-export.js'

test('XLSX preserves Vietnamese text, freezes headers, and stores formula-like answers as text', async () => {
  const content = await createXlsx(
    ['Câu hỏi', 'Trả lời'],
    [{ 'Câu hỏi': 'Tâm lý học', 'Trả lời': '=1+1' }],
    '2026-11-05T12:00:00.000Z'
  )
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(content)
  const worksheet = workbook.getWorksheet('Responses')
  assert.equal(worksheet.getCell('A1').value, 'Câu hỏi')
  assert.equal(worksheet.getCell('A2').value, 'Tâm lý học')
  assert.equal(worksheet.getCell('B2').value, '=1+1')
  assert.equal(worksheet.getCell('B2').type, ExcelJS.ValueType.String)
  assert.equal(worksheet.views[0].ySplit, 1)
})
