// Pure calculation helpers – used by Summary & ProgressCircle.
// All figures are in the same (user) currency; no conversions.

export const currency = (n) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

export const subtotal = (items) =>
  items.reduce((s, it) => s + (Number(it.price) || 0), 0)

export const claimedSubtotal = (items) =>
  items
    .filter(it => it.claimedBy)
    .reduce((s, it) => s + (Number(it.price) || 0), 0)

export const claimedPercent = (items) => {
  const total = subtotal(items)
  if (!total) return 0
  return (claimedSubtotal(items) / total) * 100
}

// Distribute tax & tip proportionally to each user's claimed subtotal.
// Returns: { users: [{name,color,itemCount,base,tax,tip,total}], grandTotal, ... }
export const buildSummary = (items, taxPct, tipPct, colorFor) => {
  const base = subtotal(items)
  const taxAmt = base * (Number(taxPct) || 0) / 100
  const tipAmt = base * (Number(tipPct) || 0) / 100
  const grandTotal = base + taxAmt + tipAmt

  // Group claimed items per user
  const perUser = new Map()
  for (const it of items) {
    if (!it.claimedBy) continue
    const key = it.claimedBy
    if (!perUser.has(key)) perUser.set(key, { name: key, items: [], base: 0 })
    const u = perUser.get(key)
    u.items.push(it)
    u.base += Number(it.price) || 0
  }

  const claimedBase = Array.from(perUser.values()).reduce((s, u) => s + u.base, 0)

  const users = Array.from(perUser.values()).map(u => {
    const ratio = claimedBase > 0 ? u.base / claimedBase : 0
    const tax = taxAmt * ratio
    const tip = tipAmt * ratio
    return {
      name: u.name,
      color: colorFor ? colorFor(u.name) : '#34f0b1',
      itemCount: u.items.length,
      items: u.items,
      base: u.base,
      tax,
      tip,
      total: u.base + tax + tip
    }
  }).sort((a, b) => b.total - a.total)

  const unclaimedBase = base - claimedBase
  const unclaimedTax = base > 0 ? taxAmt * (unclaimedBase / base) : 0
  const unclaimedTip = base > 0 ? tipAmt * (unclaimedBase / base) : 0

  return {
    base,
    taxAmt,
    tipAmt,
    grandTotal,
    users,
    claimedBase,
    unclaimedBase,
    unclaimedTotal: unclaimedBase + unclaimedTax + unclaimedTip
  }
}
