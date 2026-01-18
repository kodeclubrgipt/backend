# Fix Render Deployment - Start Command Issue

## Problem

Render is trying to run `node dist/server.js` but the file is now at `src/server.js` (after TypeScript to JavaScript conversion).

## Solution: Update Render Dashboard Settings

### Option 1: Update via Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (`kode-club-backend`)
3. Go to **Settings** tab
4. Scroll down to **Build & Deploy** section
5. Find **Start Command**
6. Change it from:
   ```
   node dist/server.js
   ```
   To:
   ```
   node src/server.js
   ```
7. Click **Save Changes**
8. Render will automatically redeploy

### Option 2: Ensure render.yaml is Committed

Make sure `render.yaml` is committed and pushed to GitHub:

```bash
cd backend
git add render.yaml
git commit -m "Update render.yaml for JavaScript"
git push
```

Then trigger a manual deploy in Render dashboard.

## Verify render.yaml is Correct

Your `render.yaml` should have:

```yaml
services:
  - type: web
    name: kode-club-backend
    env: node
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
```

## After Fixing

Once you update the start command, Render should:
1. ✅ Build successfully (`npm install`)
2. ✅ Start with `node src/server.js`
3. ✅ Server should run without errors

## Check Logs

After redeploy, check Render logs. You should see:
```
🚀 Server running on port 5000
🌐 Frontend URL: [your-frontend-url]
📡 API available at http://localhost:5000/api
```

If you still see `Cannot find module '/opt/render/project/src/dist/server.js'`, the start command wasn't updated correctly.
