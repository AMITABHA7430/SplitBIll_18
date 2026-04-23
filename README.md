# SplitDash – Real-Time Bill Splitter

A production-grade Progressive Web App for splitting restaurant bills in real time — **zero backend, zero APIs, zero Firebase**. Cross-tab sync is powered by `BroadcastChannel`, state is persisted in `localStorage`, and the app works fully offline via a cache-first Service Worker.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3 (glassmorphism theme)
- framer-motion (animations)
- lucide-react (icons)
- BroadcastChannel API (cross-tab sync)
- Service Worker (offline PWA)

## Quick start

```bash
yarn install
yarn start      # dev server on :3000
yarn build      # production bundle to dist/
yarn preview    # preview the built bundle
```

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) for GitHub + Vercel steps. The included `vercel.json` makes it a one-click import.

## Project layout

```
.
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── DEPLOY.md
├── public/
│   ├── manifest.json
│   ├── sw.js                  # cache-first service worker
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx               # entry + SW registration
    ├── App.jsx                # state + BroadcastChannel wiring
    ├── index.css              # Tailwind + glass utilities
    ├── components/
    │   ├── NameModal.jsx
    │   ├── AddItemForm.jsx
    │   ├── ItemCard.jsx
    │   ├── ProgressCircle.jsx
    │   └── Summary.jsx
    ├── hooks/
    │   └── useBroadcast.js    # BroadcastChannel + storage fallback
    └── utils/
        ├── calculations.js    # subtotal, tax/tip distribution (INR)
        ├── color.js           # deterministic per-user colour
        └── conflictResolver.js # first-claim-wins timestamps
```

## BroadcastChannel message types

| Type           | Direction           | Payload |
|----------------|---------------------|---------|
| `HELLO`        | new tab → peers     | announce presence |
| `PRESENCE`     | reply → new tab     | peer counter bookkeeping |
| `BYE`          | closing tab → peers | decrement peer counter |
| `INIT_SYNC`    | peer → new tab      | full state snapshot |
| `STATE_UPDATE` | any → peers         | `{customerName?, taxPct?, tipPct?, items?}` |
| `ADD_ITEM`     | any → peers         | `{item}` |
| `REMOVE_ITEM`  | any → peers         | `{id}` |
| `CLAIM_ITEM`   | any → peers         | `{itemId, claimedBy, claimedAt, claimSessionId}` |
| `RESET_BILL`   | any → peers         | wipes all claims |

## Conflict resolution

First-claim-wins, using `performance.timeOrigin + performance.now()` as a monotonic, drift-resistant timestamp. Ties are broken deterministically by session id so every tab converges to the same state with no coordinator.

## License

MIT
