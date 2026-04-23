import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, Trash2, Sparkles } from 'lucide-react'
import { currency } from '../utils/calculations'
import { colorFor, initials } from '../utils/color'

// One row per menu item. Three states: unclaimed, claimed-by-me, claimed-locked.
export default function ItemCard({ item, currentUser, onClaim, onRemove, justClaimed }) {
  const isClaimed = !!item.claimedBy
  const mine = isClaimed && item.claimedBy === currentUser
  const claimColor = isClaimed ? colorFor(item.claimedBy) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      data-testid={`item-card-${item.id}`}
      className={`glass group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition ${
        isClaimed ? 'ring-1 ring-white/10' : 'hover:border-white/20'
      } ${justClaimed ? 'claim-pulse' : ''}`}
      style={
        isClaimed
          ? {
              background: `linear-gradient(135deg, ${claimColor}18, rgba(255,255,255,0.02))`,
              borderColor: `${claimColor}38`
            }
          : {}
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              data-testid={`item-name-${item.id}`}
              className="truncate font-display text-base font-semibold text-white sm:text-lg"
            >
              {item.name}
            </h4>
            {isClaimed && (
              <span
                className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-mono uppercase tracking-wider"
                style={{
                  background: `${claimColor}22`,
                  color: claimColor,
                  border: `1px solid ${claimColor}44`
                }}
              >
                <Lock className="h-3 w-3" /> locked
              </span>
            )}
          </div>
          <p
            data-testid={`item-price-${item.id}`}
            className="mt-1 font-mono text-sm text-white/60"
          >
            {currency(item.price)}
          </p>
        </div>

        {/* Right side action */}
        <div className="flex shrink-0 items-center gap-2">
          {!isClaimed ? (
            <>
              <button
                data-testid={`claim-btn-${item.id}`}
                onClick={() => onClaim(item.id)}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Claim
              </button>
              <button
                data-testid={`remove-btn-${item.id}`}
                onClick={() => onRemove(item.id)}
                title="Remove item"
                className="btn-ghost !p-2"
              >
                <Trash2 className="h-4 w-4 text-white/60" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold"
                style={{
                  background: `${claimColor}25`,
                  color: claimColor,
                  border: `1px solid ${claimColor}55`
                }}
                data-testid={`claimed-by-${item.id}`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px]"
                  style={{ background: claimColor, color: '#04060f' }}
                >
                  {initials(item.claimedBy)}
                </span>
                <span className="hidden sm:inline">{item.claimedBy}</span>
                {mine && <Check className="h-4 w-4" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claimed glow stripe */}
      <AnimatePresence>
        {isClaimed && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
            style={{ background: `linear-gradient(90deg, transparent, ${claimColor}, transparent)` }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
