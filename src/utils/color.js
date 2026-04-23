// Deterministic color per user name so every tab renders the same color.
const PALETTE = [
  '#34f0b1', // emerald glow
  '#8b7bff', // violet glow
  '#6ee7ff', // sky
  '#ffb86b', // amber
  '#ff7ab6', // pink
  '#f6d365', // sun
  '#a0e7a0', // mint
  '#f38ba8'  // rose
]

const hash = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export const colorFor = (name) => {
  if (!name) return PALETTE[0]
  return PALETTE[hash(name) % PALETTE.length]
}

export const initials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
