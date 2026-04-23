import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

// Dynamically add items to the bill. Broadcasts ADD_ITEM to peers.
export default function AddItemForm({ onAdd }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [shake, setShake] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    const priceNum = parseFloat(price)
    if (!trimmed || !Number.isFinite(priceNum) || priceNum <= 0) {
      setShake(true)
      setTimeout(() => setShake(false), 420)
      return
    }
    onAdd({ name: trimmed, price: priceNum })
    setName('')
    setPrice('')
  }

  return (
    <motion.form
      onSubmit={submit}
      data-testid="add-item-form"
      animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold tracking-wide text-white">Add an item</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          syncs across tabs
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto]">
        <input
          data-testid="add-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Butter Chicken"
          maxLength={48}
          className="input"
        />
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/50">
            ₹
          </span>
          <input
            data-testid="add-item-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            className="input pl-7"
          />
        </div>
        <button type="submit" data-testid="add-item-submit" className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </motion.form>
  )
}
