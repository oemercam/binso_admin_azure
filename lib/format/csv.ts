export function csvCell(value: unknown) {
  let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')
  if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
  return [headers.map(csvCell).join(';'), ...rows.map(row => headers.map(key => csvCell(row[key])).join(';'))].join('\r\n')
}

export function parseCsv(input: string) {
  const text = input.replace(/^\uFEFF/, '')
  if (text.length > 2_000_000) throw new Error('CSV-Datei ist zu gross.')
  const first = text.split(/\r?\n/, 1)[0]
  const separator = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ';' : ','
  const records: string[][] = []
  let record: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ }
      else if (quoted || cell === '') quoted = !quoted
      else throw new Error('Ungültige CSV-Anführungszeichen.')
    } else if (char === separator && !quoted) { record.push(cell); cell = '' }
    else if ((char === '\r' || char === '\n') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      record.push(cell)
      if (record.some(value => value !== '')) records.push(record)
      record = []; cell = ''
    } else cell += char
  }
  if (quoted) throw new Error('CSV-Feld ist nicht abgeschlossen.')
  record.push(cell)
  if (record.some(value => value !== '')) records.push(record)
  if (!records.length) return []
  if (records.length > 10_001) throw new Error('Maximal 10 000 Zeilen erlaubt.')
  const headers = records.shift()!.map(value => value.trim().toLowerCase())
  if (headers.some(value => !value) || new Set(headers).size !== headers.length) throw new Error('Kopfzeilen fehlen oder sind doppelt.')
  return records.map(values => {
    if (values.length !== headers.length) throw new Error('CSV-Spaltenanzahl stimmt nicht mit der Kopfzeile überein.')
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]))
  })
}

export function importNumber(value: string | undefined, fallback = 0) {
  const number = value?.trim() ? Number(value) : fallback
  if (!Number.isFinite(number) || number < 0) throw new Error('Ungültige Zahl.')
  return number
}
