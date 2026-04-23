# SplitDash – Deployment Guide

SplitDash is a **100% frontend PWA** (React + Vite + Tailwind). There is no backend, so deployment is just serving a `dist/` folder of static assets.

---

## 1. Push to GitHub

```bash
# from /app (or wherever your project lives)
cd frontend

# Create a fresh repo if you don't have one yet
git init
git add .
git commit -m "feat: SplitDash MVP"

# Add your remote and push
git branch -M main
git remote add origin https://github.com/<your-username>/splitdash.git
git push -u origin main
```

> Tip: commit only the `frontend/` directory (or rename it to the repo root) so Vercel picks up `package.json` automatically.

---

## 2. Deploy to Vercel (2 minutes)

### Option A · Vercel Dashboard (recommended)

1. Go to https://vercel.com/new and import your GitHub repo.
2. When Vercel asks for settings, use:

   | Field | Value |
   |---|---|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `frontend` *(skip if the repo root already contains `package.json`)* |
   | **Build Command** | `yarn build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `yarn install` |

3. Click **Deploy**. Zero env vars required – SplitDash needs nothing server-side.

### Option B · Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel            # first time: accept defaults, framework = Vite
vercel --prod     # promote to production
```

---

## 3. Custom headers for the Service Worker (optional)

Vercel serves `/sw.js` from `public/` automatically, but you can force fresh SW updates by adding this to `vercel.json` in the project root:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

---

## 4. Verify the deployment

1. Open the production URL in two tabs side-by-side.
2. Enter a name in each tab → claim an item in Tab A.
3. Tab B should update instantly (BroadcastChannel works across tabs of the same origin).
4. Open DevTools → Application → Service Workers. `sw.js` should be "activated and running".
5. Kill the network (DevTools → Network → Offline) and reload. The app shell must still load.

---

## 5. Build locally

```bash
cd frontend
yarn install
yarn build      # outputs dist/
yarn preview    # serves the built bundle on :3000
```

That's it. SplitDash is a static PWA – no servers, no databases, no secrets.
