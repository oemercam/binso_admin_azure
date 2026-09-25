function nextSequence(numbers: string[], prefix: string, year: number) {
  const expression = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  const current = numbers.reduce((max, number) => {
    const match = number.match(expression)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${year}-${String(current + 1).padStart(3, '0')}`
}

export function nextInvoiceNumber(numbers: string[], date = new Date()) {
  return nextSequence(numbers, 'RE', date.getFullYear())
}

export function nextQuoteNumber(numbers: string[], date = new Date()) {
  return nextSequence(numbers, 'AN', date.getFullYear())
}

export function nextContractNumber(numbers: string[], date = new Date()) {
  return nextSequence(numbers, 'VR', date.getFullYear())
}

export function nextCreditNumber(numbers: string[], date = new Date()) {
  return nextSequence(numbers, 'GS', date.getFullYear())
}
