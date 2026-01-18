# Render Deployment Guide

## Issue Fixed: Build Command

The error `Cannot find module '/opt/render/project/src/dist/server.js'` occurs because Render wasn't compiling TypeScript.

## Solution

### Option 1: Update Build Command in Render Dashboard (Recommended)

1. Go to your Render Dashboard
2. Select your backend service
3. Go to **Settings** → **Build & Deploy**
4. Update the **Build Command** to:
   ```
   npm install && npm run build
   ```
5. Keep the **Start Command** as:
   ```
   npm start
   ```
6. Click **Save Changes**
7. Manually trigger a new deployment

### Option 2: Use render.yaml (Alternative)

If you prefer configuration as code, you can use the `render.yaml` file I've created. However, you need to set up the service using the Render Dashboard first, then it will use the YAML config.

## Environment Variables

Make sure you've added all required environment variables in Render:

- `PORT=5000`
- `NODE_ENV=production`
- `BACKEND_URL=https://your-backend-service.onrender.com`
- `FRONTEND_URL=https://kode-club-ciuf-9y5rmytsk-kodeclubs-projects.vercel.app`
- `MONGODB_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-jwt-secret`
- `JWT_EXPIRES_IN=7d`
- `GOOGLE_CLIENT_ID=462986956172-frc64iehpfh3bat443ad93gni9ihockc.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET=your-google-client-secret`

## After Deployment

1. Update your frontend `.env` or Vercel environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api`

2. Update Google OAuth Console:
   - Add authorized redirect URI: `https://your-backend-service.onrender.com/api/auth/google/callback`

3. Test the deployment:
   - Visit: `https://your-backend-service.onrender.com/api/health` (if you have a health endpoint)
   - Check logs in Render Dashboard

## Troubleshooting

If you still get errors:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB URI is accessible from Render's servers
4. Check that the build completes successfully (look for "Build successful" message)
