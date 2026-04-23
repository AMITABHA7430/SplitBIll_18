// Conflict resolver – "first claim wins".
//
// Each claim message carries a monotonic timestamp (performance.now() + page load
// origin) plus the tab's unique session id. When two tabs attempt to claim the
// same item simultaneously we keep the record with the smallest timestamp; ties
// are broken deterministically by session id so every tab converges to the same
// state without any coordination.

export const makeTimestamp = () => {
  // performance.timeOrigin is the high-resolution epoch-anchored origin of this
  // tab. Combined with performance.now() we get an absolute, drift-resistant
  // timestamp that is still comparable across tabs on the same machine.
  return performance.timeOrigin + performance.now()
}

// Resolve a proposed claim against an existing item.
// Returns the "winning" claim fields ({ claimedBy, claimedAt, claimSessionId })
// or null when the proposed claim loses.
export const resolveClaim = (existing, proposed) => {
  // No prior claim → proposed wins.
  if (!existing || !existing.claimedBy) return proposed

  // Same owner re-claiming (e.g. echoed message) → keep the earliest timestamp.
  if (existing.claimedBy === proposed.claimedBy) {
    return existing.claimedAt <= proposed.claimedAt ? existing : proposed
  }

  // Different owners – earliest wins.
  if (proposed.claimedAt < existing.claimedAt) return proposed
  if (proposed.claimedAt > existing.claimedAt) return existing

  // Exact tie → deterministic tiebreak by session id (lexicographically smaller).
  return proposed.claimSessionId < existing.claimSessionId ? proposed : existing
}

// Merge two full state snapshots (used on INIT_SYNC).
// Strategy:
//   - items: union by id; for overlapping ids, prefer the newer "updatedAt"
//     and re-apply claim resolution on top.
//   - customerName, tax, tip, settings: take the more recently updated copy.
export const mergeState = (local, remote) => {
  if (!remote) return local
  if (!local) return remote

  const byId = new Map()
  for (const it of local.items || []) byId.set(it.id, it)
  for (const it of remote.items || []) {
    const existing = byId.get(it.id)
    if (!existing) {
      byId.set(it.id, it)
      continue
    }
    // Prefer most recently updated metadata (name/price edits).
    const base = (existing.updatedAt || 0) >= (it.updatedAt || 0) ? existing : it
    // Resolve claim independently.
    const winner = resolveClaim(existing, it)
    byId.set(it.id, {
      ...base,
      claimedBy: winner?.claimedBy || null,
      claimedAt: winner?.claimedAt || null,
      claimSessionId: winner?.claimSessionId || null
    })
  }

  const newer = (local.updatedAt || 0) >= (remote.updatedAt || 0) ? local : remote

  return {
    items: Array.from(byId.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    customerName: newer.customerName ?? '',
    taxPct: newer.taxPct ?? 0,
    tipPct: newer.tipPct ?? 0,
    updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0)
  }
}
