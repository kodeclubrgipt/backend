# Google OAuth Setup Guide - Fix redirect_uri_mismatch Error

## The Problem

Error: `redirect_uri_mismatch` means the redirect URI in Google Cloud Console doesn't match what your backend is sending.

## Your Backend Callback URL

Based on your backend code, the callback URL is:
```
https://backend-95ve.onrender.com/api/auth/google/callback
```

## Step-by-Step Fix

### Step 1: Verify Backend Environment Variable in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (`backend-95ve`)
3. Go to **Environment** tab
4. Make sure `BACKEND_URL` is set to:
   ```
   BACKEND_URL=https://backend-95ve.onrender.com
   ```
   ⚠️ **Important**: 
   - No trailing slash
   - Use `https://` (not `http://`)
   - Should NOT include `/api`

5. If you changed it, click **Save Changes** and wait for redeploy

### Step 2: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one with Client ID: `462986956172-frc64iehpfh3bat443ad93gni9ihockc`)
5. Click **Edit** (pencil icon)
6. Scroll down to **Authorized redirect URIs**
7. Click **+ ADD URI**
8. Add this **exact** URL:
   ```
   https://backend-95ve.onrender.com/api/auth/google/callback
   ```
   ⚠️ **Critical**: 
   - Must be **exact match** (including `https://`, no trailing slash)
   - Copy-paste to avoid typos
   - Case-sensitive

9. Click **SAVE**

### Step 3: Wait and Test

1. Wait 1-2 minutes for Google's changes to propagate
2. Check Render logs to see what callback URL is being used:
   - Go to Render Dashboard → Your Service → Logs
   - Look for: `🔧 Configuring Google OAuth Strategy`
   - Check what `Callback URL:` shows
3. Try signing in with Google again

## Additional Redirect URIs (Optional)

If you also want to test locally, add these additional redirect URIs:

```
http://localhost:5000/api/auth/google/callback
```

## Quick Checklist

- [ ] `BACKEND_URL` in Render = `https://backend-95ve.onrender.com` (no trailing slash)
- [ ] Redirect URI in Google Console = `https://backend-95ve.onrender.com/api/auth/google/callback` (exact match)
- [ ] Backend redeployed after changing `BACKEND_URL`
- [ ] Waited 1-2 minutes after saving in Google Console
- [ ] Tested Google sign-in again

## Common Mistakes

❌ **Wrong**: `https://backend-95ve.onrender.com/api/auth/google/callback/` (trailing slash)
✅ **Correct**: `https://backend-95ve.onrender.com/api/auth/google/callback`

❌ **Wrong**: `http://backend-95ve.onrender.com/api/auth/google/callback` (http instead of https)
✅ **Correct**: `https://backend-95ve.onrender.com/api/auth/google/callback`

❌ **Wrong**: `https://backend-95ve.onrender.com/auth/google/callback` (missing /api)
✅ **Correct**: `https://backend-95ve.onrender.com/api/auth/google/callback`

## Verify Your Backend is Using Correct URL

Check Render logs when the server starts. You should see:
```
🔧 Configuring Google OAuth Strategy
   Client ID: 462986956172-frc64ie...
   Callback URL: https://backend-95ve.onrender.com/api/auth/google/callback
```

If the callback URL in logs doesn't match what you added in Google Console, that's the problem!
