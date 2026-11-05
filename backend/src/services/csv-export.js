export function csvCell(value) {
  let text = value == null ? '' : String(value)
  if (/^[\u0000-\u0020\uFEFF\u200B-\u200F\u2028\u2029]*[=+\-@]/u.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function answerToText(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(answerToText).join('; ')
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${key}: ${answerToText(item)}`).join('; ')
  }
  return String(value)
}

export function createCsv(headers, rows) {
  return [
    headers.map(csvCell).join(','),
    ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))
  ].join('\r\n')
}

export function createCsvFile(headers, rows) {
  return `\uFEFF${createCsv(headers, rows)}`
}
