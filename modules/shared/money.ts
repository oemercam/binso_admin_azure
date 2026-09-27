/** Canonical money helpers. All authoritative calculations use integer minor units. */
export type MinorAmount = number & { readonly __minorAmount: unique symbol }

export function toMinorUnits(amount: number): MinorAmount {
  if (!Number.isFinite(amount)) throw new Error('money_invalid')
  return Math.round((amount + Number.EPSILON) * 100) as MinorAmount
}

export function fromMinorUnits(amount: number): number {
  if (!Number.isSafeInteger(amount)) throw new Error('money_minor_invalid')
  return amount / 100
}

export function addMinor(...amounts: number[]): MinorAmount {
  const total = amounts.reduce((sum, amount) => {
    if (!Number.isSafeInteger(amount)) throw new Error('money_minor_invalid')
    return sum + amount
  }, 0)
  if (!Number.isSafeInteger(total)) throw new Error('money_overflow')
  return total as MinorAmount
}

export function multiplyMinor(unitPriceMinor: number, quantity: number): MinorAmount {
  if (!Number.isSafeInteger(unitPriceMinor) || !Number.isFinite(quantity) || quantity < 0) throw new Error('money_invalid')
  return Math.round(unitPriceMinor * quantity) as MinorAmount
}

export function vatMinor(netMinor: number, vatRatePercent: number): MinorAmount {
  if (!Number.isSafeInteger(netMinor) || !Number.isFinite(vatRatePercent) || vatRatePercent < 0) throw new Error('money_invalid')
  return Math.round((netMinor * vatRatePercent) / 100) as MinorAmount
}

export function lineTotalMinor(input: { quantity: number; unitPrice: number; vatRate?: number }) {
  const netMinor = multiplyMinor(toMinorUnits(input.unitPrice), input.quantity)
  const vat = vatMinor(netMinor, input.vatRate ?? 0)
  return { netMinor, vatMinor: vat, grossMinor: addMinor(netMinor, vat) }
}
