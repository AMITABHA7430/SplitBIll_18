import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Users,
  RotateCcw,
  Pencil,
  Wifi,
  WifiOff,
  Radio,
  Download
} from 'lucide-react'

import NameModal from './components/NameModal'
import AddItemForm from './components/AddItemForm'
import ItemCard from './components/ItemCard'
import ProgressCircle from './components/ProgressCircle'
import Summary from './components/Summary'

import useBroadcast from './hooks/useBroadcast'
import { makeTimestamp, resolveClaim, mergeState } from './utils/conflictResolver'
import { claimedPercent, subtotal, currency } from './utils/calculations'
import { colorFor } from './utils/color'

// ---- Storage key (single source of truth for persistence) ----
const STORAGE_KEY = 'splitdash:v1'
const CHANNEL = 'splitdash-sync'
const SESSION_ID = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const DEFAULT_ITEMS = [
  { id: 'demo-1', name: 'Butter Chicken', price: 420, claimedBy: null, claimedAt: null, claimSessionId: null, createdAt: 1, updatedAt: 1 },
  { id: 'demo-2', name: 'Garlic Naan (x2)', price: 120, claimedBy: null, claimedAt: null, claimSessionId: null, createdAt: 2, updatedAt: 2 },
  { id: 'demo-3', name: 'Paneer Tikka', price: 320, claimedBy: null, claimedAt: null, claimSessionId: null, createdAt: 3, updatedAt: 3 },
  { id: 'demo-4', name: 'Mango Lassi', price: 140, claimedBy: null, claimedAt: null, claimSessionId: null, createdAt: 4, updatedAt: 4 }
]

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.items)) return null
    return parsed
  } catch {
    return null
  }
}

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// Small utility for sound feedback (optional, best-effort only).
const playBlip = (freq = 660, dur = 0.08) => {
  try {
    const ctx = playBlip._ctx || (playBlip._ctx = new (window.AudioContext || window.webkitAudioContext)())
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = 0.04
    o.connect(g).connect(ctx.destination)
    o.start()
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.stop(ctx.currentTime + dur)
  } catch {}
}

export default function App() {
  // ---- Identity (React state only) ----
  const [currentUser, setCurrentUser] = useState('')

  // ---- Persisted shared state ----
  const initial = loadState()
  const [items, setItems] = useState(initial?.items ?? DEFAULT_ITEMS)
  const [customerName, setCustomerName] = useState(initial?.customerName ?? '')
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [taxPct, setTaxPct] = useState(initial?.taxPct ?? 5)
  const [tipPct, setTipPct] = useState(initial?.tipPct ?? 10)

  // Peer tracking & network status (UX flair).
  const [peers, setPeers] = useState(1) // includes this tab
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [justClaimedIds, setJustClaimedIds] = useState({})

  // Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  const stateRef = useRef({ items, customerName, taxPct, tipPct })
  useEffect(() => {
    stateRef.current = { items, customerName, taxPct, tipPct, updatedAt: Date.now() }
  }, [items, customerName, taxPct, tipPct])

  // Persist whenever core state changes.
  useEffect(() => {
    saveState({ items, customerName, taxPct, tipPct, updatedAt: Date.now() })
  }, [items, customerName, taxPct, tipPct])

  // ---- BroadcastChannel handler (messages from peer tabs) ----
  const onMessage = useCallback((msg) => {
    if (!msg || !msg.type || msg.from === SESSION_ID) return

    switch (msg.type) {
      case 'HELLO': {
        // A new tab announced itself. Reply with our full state so they sync.
        post({
          type: 'INIT_SYNC',
          from: SESSION_ID,
          state: stateRef.current
        })
        setPeers((p) => p + 1)
        break
      }
      case 'INIT_SYNC': {
        // Merge incoming state with ours.
        setItems((prevItems) => {
          const merged = mergeState(
            { items: prevItems, customerName: stateRef.current.customerName, taxPct: stateRef.current.taxPct, tipPct: stateRef.current.tipPct, updatedAt: 0 },
            msg.state
          )
          // Propagate fields that are non-item.
          if (msg.state?.customerName && !stateRef.current.customerName) setCustomerName(msg.state.customerName)
          if (msg.state?.taxPct !== undefined) setTaxPct((t) => (stateRef.current.updatedAt > (msg.state.updatedAt || 0) ? t : msg.state.taxPct))
          if (msg.state?.tipPct !== undefined) setTipPct((t) => (stateRef.current.updatedAt > (msg.state.updatedAt || 0) ? t : msg.state.tipPct))
          return merged.items
        })
        break
      }
      case 'STATE_UPDATE': {
        // Authoritative partial update (customer name / tax / tip / items bulk edit).
        if (msg.payload.customerName !== undefined) setCustomerName(msg.payload.customerName)
        if (msg.payload.taxPct !== undefined) setTaxPct(msg.payload.taxPct)
        if (msg.payload.tipPct !== undefined) setTipPct(msg.payload.tipPct)
        if (Array.isArray(msg.payload.items)) setItems(msg.payload.items)
        break
      }
      case 'ADD_ITEM': {
        setItems((prev) => {
          if (prev.some((it) => it.id === msg.item.id)) return prev
          return [...prev, msg.item]
        })
        break
      }
      case 'REMOVE_ITEM': {
        setItems((prev) => prev.filter((it) => it.id !== msg.id))
        break
      }
      case 'CLAIM_ITEM': {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== msg.itemId) return it
            const winner = resolveClaim(it, {
              claimedBy: msg.claimedBy,
              claimedAt: msg.claimedAt,
              claimSessionId: msg.claimSessionId
            })
            return {
              ...it,
              claimedBy: winner?.claimedBy || null,
              claimedAt: winner?.claimedAt || null,
              claimSessionId: winner?.claimSessionId || null,
              updatedAt: Math.max(it.updatedAt || 0, Date.now())
            }
          })
        )
        break
      }
      case 'RESET_BILL': {
        setItems((prev) =>
          prev.map((it) => ({
            ...it,
            claimedBy: null,
            claimedAt: null,
            claimSessionId: null,
            updatedAt: Date.now()
          }))
        )
        break
      }
      default:
        break
    }
  }, [])

  const post = useBroadcast(CHANNEL, onMessage)

  // On mount: say hello to any existing peers so they share their state.
  useEffect(() => {
    const t = setTimeout(() => {
      post({ type: 'HELLO', from: SESSION_ID })
    }, 120)
    return () => clearTimeout(t)
  }, [post])

  // Online / offline indicator
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  // ---- Mutations ----
  const addItem = ({ name, price }) => {
    const now = Date.now()
    const item = {
      id: `it_${now}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      price,
      claimedBy: null,
      claimedAt: null,
      claimSessionId: null,
      createdAt: now,
      updatedAt: now
    }
    setItems((prev) => [...prev, item])
    post({ type: 'ADD_ITEM', from: SESSION_ID, item })
    playBlip(820, 0.06)
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    post({ type: 'REMOVE_ITEM', from: SESSION_ID, id })
  }

  const claimItem = (id) => {
    if (!currentUser) return
    const ts = makeTimestamp()
    // Local optimistic resolve
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        const winner = resolveClaim(it, {
          claimedBy: currentUser,
          claimedAt: ts,
          claimSessionId: SESSION_ID
        })
        return {
          ...it,
          claimedBy: winner?.claimedBy || null,
          claimedAt: winner?.claimedAt || null,
          claimSessionId: winner?.claimSessionId || null,
          updatedAt: Date.now()
        }
      })
    )
    post({
      type: 'CLAIM_ITEM',
      from: SESSION_ID,
      itemId: id,
      claimedBy: currentUser,
      claimedAt: ts,
      claimSessionId: SESSION_ID
    })
    // Pulse animation
    setJustClaimedIds((m) => ({ ...m, [id]: Date.now() }))
    setTimeout(() => {
      setJustClaimedIds((m) => {
        const n = { ...m }
        delete n[id]
        return n
      })
    }, 750)
    playBlip(1040, 0.1)
  }

  const resetBill = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        claimedBy: null,
        claimedAt: null,
        claimSessionId: null,
        updatedAt: Date.now()
      }))
    )
    post({ type: 'RESET_BILL', from: SESSION_ID })
    playBlip(320, 0.15)
  }

  const updateCustomer = (name) => {
    setCustomerName(name)
    post({ type: 'STATE_UPDATE', from: SESSION_ID, payload: { customerName: name } })
  }

  const updateTax = (v) => {
    setTaxPct(v)
    post({ type: 'STATE_UPDATE', from: SESSION_ID, payload: { taxPct: v } })
  }
  const updateTip = (v) => {
    setTipPct(v)
    post({ type: 'STATE_UPDATE', from: SESSION_ID, payload: { tipPct: v } })
  }

  // Derived values
  const percent = useMemo(() => claimedPercent(items), [items])
  const totalBase = useMemo(() => subtotal(items), [items])
  const uniqueClaimers = useMemo(() => {
    const s = new Set()
    items.forEach((it) => it.claimedBy && s.add(it.claimedBy))
    return Array.from(s)
  }, [items])

  // ---- Render gate: name modal ----
  if (!currentUser) {
    return <NameModal onSubmit={setCurrentUser} />
  }

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-glow/30 to-violet-glow/30 ring-1 ring-white/10">
              <Radio className="h-4 w-4 text-emerald-glow" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50">
              SplitDash · real-time
            </span>
          </div>

          {/* Customer name context bar */}
          {!editingCustomer ? (
            <div
              data-testid="customer-display"
              className="group flex items-center gap-2"
            >
              <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                Bill for:{' '}
                <span className="text-gradient-emerald">
                  {customerName || 'Table 07'}
                </span>
              </h1>
              <button
                data-testid="customer-edit-btn"
                onClick={() => setEditingCustomer(true)}
                className="btn-ghost !p-2 opacity-0 transition group-hover:opacity-100"
                title="Edit customer"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setEditingCustomer(false)
              }}
              className="flex items-center gap-2"
            >
              <input
                data-testid="customer-input"
                autoFocus
                value={customerName}
                onChange={(e) => updateCustomer(e.target.value)}
                onBlur={() => setEditingCustomer(false)}
                placeholder="Table / Customer name"
                maxLength={48}
                className="input max-w-xs"
              />
              <button type="submit" data-testid="customer-save-btn" className="btn-primary !px-4 !py-2 text-sm">
                Save
              </button>
            </form>
          )}

          <p className="mt-2 max-w-xl text-sm text-white/55">
            Claim items, split tax & tip proportionally. Every tab open on this device stays in sync via BroadcastChannel.
          </p>
        </div>

        {/* Right: status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="peer-indicator"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80"
          >
            <Users className="h-3.5 w-3.5 text-emerald-glow" />
            {peers} tab{peers !== 1 ? 's' : ''}
          </div>
          <div
            data-testid="online-indicator"
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              online
                ? 'border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow'
                : 'border-amber-300/40 bg-amber-300/10 text-amber-200'
            }`}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? 'online' : 'offline'}
          </div>
          <div
            data-testid="current-user-chip"
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              background: `${colorFor(currentUser)}22`,
              color: colorFor(currentUser),
              border: `1px solid ${colorFor(currentUser)}55`
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: colorFor(currentUser) }}
            />
            {currentUser}
          </div>
          {deferredPrompt && (
            <button
              data-testid="install-btn"
              onClick={installApp}
              className="btn-ghost text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          )}
        </div>
      </header>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: items + add form */}
        <div className="space-y-5">
          {/* Top stat row */}
          <div className="glass-strong flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:gap-8">
            <ProgressCircle percent={percent} />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                subtotal
              </p>
              <p
                data-testid="subtotal-display"
                className="font-display text-3xl font-semibold text-white sm:text-4xl"
              >
                {currency(totalBase)}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {uniqueClaimers.length === 0 && (
                  <span className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs text-white/40">
                    No claims yet – tap "Claim" on any item
                  </span>
                )}
                {uniqueClaimers.map((u) => (
                  <span
                    key={u}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `${colorFor(u)}22`,
                      color: colorFor(u),
                      border: `1px solid ${colorFor(u)}55`
                    }}
                  >
                    {u}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  data-testid="reset-bill-btn"
                  onClick={resetBill}
                  className="btn-ghost text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset claims
                </button>
              </div>
            </div>
          </div>

          <AddItemForm onAdd={addItem} />

          <div className="space-y-3" data-testid="items-list">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  currentUser={currentUser}
                  onClaim={claimItem}
                  onRemove={removeItem}
                  justClaimed={!!justClaimedIds[it.id]}
                />
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center text-sm text-white/50">
                No items yet. Add something above to get started.
              </div>
            )}
          </div>
        </div>

        {/* Right column: summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Summary
            items={items}
            taxPct={taxPct}
            tipPct={tipPct}
            onTaxChange={updateTax}
            onTipChange={updateTip}
            currentUser={currentUser}
          />
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
            session · {SESSION_ID}
          </p>
        </aside>
      </div>
    </div>
  )
}
