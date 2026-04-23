# SplitDash — Product Requirements Document

## Original Problem Statement
Build a production-grade Progressive Web App (PWA) called SplitDash – Real-Time Bill Splitter.
Non-negotiable: frontend-only (no backend / no APIs / no Firebase), React (Vite), Tailwind, BroadcastChannel API, fully offline via Service Worker, complete/production-ready code.

## User Choices (captured via ask_human)
- Project: fresh Vite-only project replacing CRA template
- Theme: midnight blue base with emerald + violet/indigo accents
- Deployment: include full DEPLOY.md (GitHub + Vercel)
- Currency: INR (₹)

## Architecture
- React 18 + Vite 5, Tailwind 3, framer-motion, lucide-react.
- Single-page app (`App.jsx` orchestrates state, BroadcastChannel, persistence).
- Cross-tab sync via `BroadcastChannel('splitdash-sync')` with `storage`-event fallback inside `hooks/useBroadcast.js`.
- Conflict resolution: monotonic timestamps (`performance.timeOrigin + performance.now()`) with deterministic sessionId tiebreaker in `utils/conflictResolver.js`.
- Persistence: `localStorage` key `splitdash:v1` (items, customerName, taxPct, tipPct).
- Offline PWA: `public/manifest.json` + `public/sw.js` (cache-first app shell, navigation fallback to cached index.html).

## User Personas
- Restaurant diners splitting a bill at the table on one phone / multiple tabs.
- Waitstaff sharing a single device across seats.
- Small-group expense splitters who want a zero-install, offline-friendly tool.

## Core Requirements (static)
1. Full-screen glassmorphism NameModal (React state only – no prompt()).
2. Editable customer/table context (persisted + synced).
3. Dynamic add/remove of menu items with instant cross-tab sync.
4. Claim / lock / conflict-resolved first-wins claiming.
5. Circular SVG progress indicator for % of bill claimed.
6. Tax & tip % inputs distributed proportionally per user.
7. Per-user breakdown (unique colour, initials avatar, totals).
8. Reset-claims + remove-item actions.
9. Installable PWA + offline-first service worker.
10. Sound + pulse feedback on claim/add/reset.

## What's Been Implemented (2026-02)
- [x] Fresh Vite project, Tailwind, framer-motion, lucide-react.
- [x] `NameModal` with live validation + blur-triggered error surfacing.
- [x] `AddItemForm` with shake-on-error and broadcasting ADD_ITEM.
- [x] `ItemCard` with three states (unclaimed / locked-mine / locked-other) + remove.
- [x] `ProgressCircle` with animated stroke-dashoffset.
- [x] `Summary` with live tax/tip distribution + per-user rows + unclaimed row.
- [x] `useBroadcast` hook + storage-event fallback.
- [x] `conflictResolver` (resolveClaim, mergeState, makeTimestamp).
- [x] `calculations` (subtotal, claimedPercent, buildSummary, INR currency).
- [x] Presence protocol: HELLO / PRESENCE / BYE for accurate peer count.
- [x] Online/offline indicator, install-prompt button, session badge.
- [x] Persistence (localStorage), hydrated on boot + merged with peers on HELLO.
- [x] PWA manifest + service worker + icons + favicon.
- [x] `/app/DEPLOY.md` with GitHub + Vercel instructions.

## Testing (iteration_1)
- Frontend success rate ~95% (12/13 spec items).
- Fixes applied after first test run:
  - NameModal now triggers `touched` on blur → validation error visible for invalid input.
  - Peer counter uses a Set + BYE on pagehide/beforeunload → self-correcting.

## Prioritized Backlog
### P0 (none)
### P1
- Export / share summary as PDF or screenshot.
- QR-code "join this bill" for easy same-device tab hand-off.
### P2
- Multi-currency support + live FX (optional, would require API).
- Item quantity field + per-seat split option.
- Themes (light mode / user-customisable accent).

## Next Tasks
- Gather user feedback from live preview.
- If approved, ship P1 (share/export) next iteration.
