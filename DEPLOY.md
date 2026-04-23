# SplitDash – Deployment Guide

SplitDash is a **100% frontend PWA** (React + Vite + Tailwind). There is no backend, so deployment is just serving a `dist/` folder of static assets.

---

## 1. Push to GitHub

The repo is laid out as a flat Vite project at the root (no subfolder).

```bash
git init
git add .
git commit -m "feat: SplitDash MVP"

git branch -M main
git remote add origin https://github.com/<your-username>/splitdash.git
git push -u origin main
```

Files that should NEVER be committed (already in `.gitignore`):

- `node_modules/`, `dist/`, `.vite/`
- `memory/`, `test_reports/`, `.emergent/` (Emergent pod internals)

---

## 2. Deploy to Vercel (2 minutes)

### Option A · Vercel Dashboard (recommended)

1. Go to https://vercel.com/new and import your GitHub repo.
2. Vercel will auto-detect everything from `vercel.json`:

   | Field | Value |
   |---|---|
   | **Framework Preset** | `Vite` |
   | **Build Command** | `yarn build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `yarn install` |

3. Click **Deploy**. Zero env vars required.

### Option B · Vercel CLI

```bash
npm i -g vercel
vercel            # first time: accept defaults
vercel --prod     # promote to production
```

---

## 3. Verify the deployment

1. Open the production URL in two tabs side-by-side.
2. Enter a name in each tab → claim an item in Tab A.
3. Tab B should update instantly (BroadcastChannel works across tabs of the same origin).
4. DevTools → Application → Service Workers. `sw.js` should be "activated and running".
5. Kill the network (DevTools → Network → Offline) and reload. The app shell must still load.

---

## 4. Build locally

```bash
yarn install
yarn build      # outputs dist/
yarn preview    # serves the built bundle on :3000
```

That's it. SplitDash is a static PWA – no servers, no databases, no secrets.
