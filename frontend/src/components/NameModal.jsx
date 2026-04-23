import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

// Full-screen glassmorphism modal enforcing user identity before app access.
// Uses React state only (no localStorage, no prompt()).
export default function NameModal({ onSubmit }) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)

  const trimmed = name.trim()
  const valid = trimmed.length >= 2 && trimmed.length <= 24

  const submit = (e) => {
    e?.preventDefault?.()
    setTouched(true)
    if (!valid) return
    onSubmit(trimmed)
  }

  return (
    <div
      data-testid="name-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-midnight-950/80 backdrop-blur-xl"
      />

      {/* Orb accents */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-glow/30 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[32rem] w-[32rem] rounded-full bg-emerald-glow/25 blur-3xl animate-float-slow" />

      <motion.form
        onSubmit={submit}
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="glass-strong relative w-full max-w-md rounded-[28px] p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
        data-testid="name-modal"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-glow/30 to-violet-glow/30 ring-1 ring-white/10">
            <Sparkles className="h-5 w-5 text-emerald-glow" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">SplitDash</p>
            <h1 className="font-display text-xl font-semibold text-white">Who's splitting tonight?</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/60">
          Enter your name to start claiming items. Every tab open on this device syncs in real time — no account, no backend.
        </p>

        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
          Your name
        </label>
        <input
          data-testid="name-modal-input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aarav"
          maxLength={24}
          className="input"
        />
        {touched && !valid && (
          <p data-testid="name-modal-error" className="mt-2 text-xs text-rose-300">
            Please enter 2–24 characters.
          </p>
        )}

        <button
          type="submit"
          data-testid="name-modal-submit"
          disabled={!valid}
          className="btn-primary mt-6 w-full"
        >
          Enter SplitDash
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/35">
          <span>v1.0 · offline-first</span>
          <span>broadcastchannel · pwa</span>
        </div>
      </motion.form>
    </div>
  )
}
