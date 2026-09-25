export type StructuredPaymentAddress = { name: string; street: string; buildingNumber?: string; postalCode: string; town: string; country: string }

export function validSwissIban(value: string) {
  const iban = value.replace(/\s/g, '').toUpperCase()
  if (!/^(CH|LI)\d{2}[A-Z0-9]{17}$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    for (const digit of (/\d/.test(char) ? char : String(char.charCodeAt(0) - 55))) remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1
}

/** Validated input for a future SIX-tested QR renderer; does not claim QR conformance. */
export function prepareSwissPayment(input: { iban: string; creditor: StructuredPaymentAddress; debtor: StructuredPaymentAddress; amount: number; currency: 'CHF' | 'EUR'; message: string }) {
  if (!validSwissIban(input.iban)) throw new Error('Ungültige Schweizer/Liechtensteiner IBAN.')
  const iban = input.iban.replace(/\s/g, '').toUpperCase()
  const iid = Number(iban.slice(4, 9))
  if (iid >= 30000 && iid <= 31999) throw new Error('QR-IBAN benötigt eine validierte QR-Referenz; noch nicht freigegeben.')
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 999999999.99 || Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 0.0001) throw new Error('Ungültiger Zahlbetrag.')
  if (!['CHF','EUR'].includes(input.currency) || input.message.length > 140 || /[\r\n]/.test(input.message)) throw new Error('Ungültige Zahlungsangaben.')
  for (const address of [input.creditor, input.debtor]) {
    if (!address.name || !address.street || !address.postalCode || !address.town || !/^[A-Z]{2}$/.test(address.country)) throw new Error('Strukturierte Zahlungsadresse fehlt.')
    if (Object.values(address).some(value => value && (value.length > 70 || /[\r\n]/.test(value)))) throw new Error('Zahlungsadresse ist ungültig.')
  }
  return { ...input, iban, referenceType: 'NON' as const, addressType: 'S' as const, amount: input.amount.toFixed(2) }
}
