import React from 'react'
import { motion } from 'framer-motion'
import { buildSummary, currency } from '../utils/calculations'
import { colorFor, initials } from '../utils/color'
import { Receipt, TrendingUp } from 'lucide-react'

export default function Summary({ items, taxPct, tipPct, onTaxChange, onTipChange, currentUser }) {
  const s = buildSummary(items, taxPct, tipPct, colorFor)

  return (
    <section className="glass rounded-2xl p-5 sm:p-6" data-testid="summary-panel">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-glow" />
          <h3 className="font-display text-base font-semibold text-white">Bill summary</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          live
        </span>
      </div>

      {/* Tax & Tip inputs */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
            Tax %
          </span>
          <input
            data-testid="tax-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxPct}
            onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
            Tip %
          </span>
          <input
            data-testid="tip-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={tipPct}
            onChange={(e) => onTipChange(parseFloat(e.target.value) || 0)}
            className="input"
          />
        </label>
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
        <Row label="Subtotal" value={currency(s.base)} />
        <Row label={`Tax (${taxPct || 0}%)`} value={currency(s.taxAmt)} />
        <Row label={`Tip (${tipPct || 0}%)`} value={currency(s.tipAmt)} />
        <div className="mt-3 flex items-baseline justify-between border-t border-white/5 pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            Grand total
          </span>
          <span
            data-testid="grand-total"
            className="font-display text-2xl font-semibold text-gradient-emerald"
          >
            {currency(s.grandTotal)}
          </span>
        </div>
      </div>

      {/* Per-user breakdown */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-white/50" />
          <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            per-person share
          </h4>
        </div>

        {s.users.length === 0 && s.unclaimedBase === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
            Add items and start claiming to see splits.
          </p>
        )}

        <ul className="space-y-2" data-testid="user-breakdown-list">
          {s.users.map((u) => (
            <motion.li
              key={u.name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid={`user-row-${u.name}`}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
              style={{ borderColor: `${u.color}30` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-bold"
                  style={{ background: u.color, color: '#04060f' }}
                >
                  {initials(u.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {u.name}
                    {u.name === currentUser && (
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/60">
                        you
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-[10px] text-white/50">
                    {u.itemCount} item{u.itemCount !== 1 ? 's' : ''} · base {currency(u.base)} · +tax {currency(u.tax)} · +tip {currency(u.tip)}
                  </p>
                </div>
              </div>
              <span
                className="font-mono text-base font-semibold"
                style={{ color: u.color }}
                data-testid={`user-total-${u.name}`}
              >
                {currency(u.total)}
              </span>
            </motion.li>
          ))}

          {s.unclaimedBase > 0 && (
            <li
              data-testid="user-row-unclaimed"
              className="flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 font-mono text-xs text-white/50">
                  ??
                </span>
                <div>
                  <p className="text-sm font-semibold text-white/70">Unclaimed</p>
                  <p className="font-mono text-[10px] text-white/40">
                    base {currency(s.unclaimedBase)}
                  </p>
                </div>
              </div>
              <span className="font-mono text-base font-semibold text-white/60">
                {currency(s.unclaimedTotal)}
              </span>
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">{label}</span>
    <span className="font-mono text-sm text-white/85">{value}</span>
  </div>
)
