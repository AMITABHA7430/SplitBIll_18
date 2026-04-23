import React from 'react'
import { motion } from 'framer-motion'

// SVG circular progress bar – percentage of the bill claimed.
// Stroke is animated via stroke-dashoffset transitions.
export default function ProgressCircle({ percent = 0, size = 180, stroke = 12, label = 'Claimed' }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      data-testid="progress-circle"
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="pcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34f0b1" />
            <stop offset="60%" stopColor="#6ee7ff" />
            <stop offset="100%" stopColor="#8b7bff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#pcGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          initial={false}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          style={{ filter: 'drop-shadow(0 0 12px rgba(52,240,177,0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
          {label}
        </span>
        <span
          data-testid="progress-percent"
          className="mt-1 font-display text-4xl font-semibold text-gradient-emerald"
        >
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  )
}
