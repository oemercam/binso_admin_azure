export function versionAtLeast(actual, minimum) {
  const parse = (value) => String(value).split('.').map((part) => Number.parseInt(part, 10) || 0)
  const a = parse(actual)
  const b = parse(minimum)
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av > bv) return true
    if (av < bv) return false
  }
  return true
}

export function assertVersionAtLeast(assert, actual, minimum) {
  assert.ok(versionAtLeast(actual, minimum), `Expected package version >= ${minimum}, received ${actual}`)
}
