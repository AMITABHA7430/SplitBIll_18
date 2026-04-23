import { useEffect, useRef } from 'react'

/**
 * useBroadcast – thin wrapper around BroadcastChannel.
 *
 * Why:
 *   BroadcastChannel lets multiple tabs/windows of the same origin exchange
 *   structured-clone messages with zero backend. We use it as SplitDash's
 *   real-time sync transport: every state mutation is echoed to peers which
 *   then merge / resolve it locally.
 *
 * Fallback:
 *   Older browsers without BroadcastChannel fall back to `storage` events on
 *   localStorage so the app still syncs (only across tabs, not iframes).
 */

const FALLBACK_KEY = '__splitdash_bc_fallback__'

export default function useBroadcast(channelName, onMessage) {
  const chanRef = useRef(null)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  useEffect(() => {
    let bc = null
    let storageListener = null

    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(channelName)
      bc.onmessage = (ev) => handlerRef.current?.(ev.data)
      let closed = false
      chanRef.current = {
        post: (data) => {
          if (closed) return
          try { bc.postMessage(data) } catch { /* channel may have been closed */ }
        },
        close: () => { closed = true; try { bc.close() } catch {} }
      }
    } else {
      // Fallback using localStorage `storage` events.
      storageListener = (ev) => {
        if (ev.key !== FALLBACK_KEY || !ev.newValue) return
        try {
          const { channel, data } = JSON.parse(ev.newValue)
          if (channel === channelName) handlerRef.current?.(data)
        } catch {}
      }
      window.addEventListener('storage', storageListener)
      chanRef.current = {
        post: (data) => {
          try {
            localStorage.setItem(
              FALLBACK_KEY,
              JSON.stringify({ channel: channelName, data, t: Date.now() })
            )
          } catch {}
        },
        close: () => window.removeEventListener('storage', storageListener)
      }
    }

    return () => {
      if (bc) {
        try { bc.close() } catch {}
      }
      if (storageListener) window.removeEventListener('storage', storageListener)
    }
  }, [channelName])

  // Stable post() reference that ignores the hook's render cycle.
  return (data) => chanRef.current?.post(data)
}
