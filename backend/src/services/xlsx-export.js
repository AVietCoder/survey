import ExcelJS from 'exceljs'

export async function createXlsx(headers, rows, exportedAt) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'brainst0rm'
  workbook.created = new Date(exportedAt)
  workbook.modified = new Date(exportedAt)
  const worksheet = workbook.addWorksheet('Responses', { views: [{ state: 'frozen', ySplit: 1 }] })
  worksheet.columns = headers.map(header => ({
    header,
    key: header,
    width: Math.min(60, Math.max(12, header.length + 2))
  }))
  worksheet.addRows(rows)
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46A5' } }
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rows.length + 1), column: headers.length }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
