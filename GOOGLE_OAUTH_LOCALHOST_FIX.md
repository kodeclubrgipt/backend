# Fix Google OAuth redirect_uri_mismatch on Localhost

## The Problem

When testing locally, Google OAuth fails with `redirect_uri_mismatch` because the localhost callback URL is not added to Google Cloud Console.

## Your Localhost Callback URL

When running locally, your backend uses:
```
http://localhost:5000/api/auth/google/callback
```

## Quick Fix: Add Localhost Redirect URI

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth Client ID

1. Find your OAuth 2.0 Client ID (Client ID: `462986956172-frc64iehpfh3bat443ad93gni9ihockc`)
2. Click **Edit** (pencil icon)

### Step 3: Add Localhost Redirect URI

1. Scroll down to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Add this URL:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   ⚠️ **Important**: 
   - Use `http://` (not `https://`) for localhost
   - No trailing slash
   - Exact path: `/api/auth/google/callback`

4. Click **SAVE**

### Step 4: Verify Your Redirect URIs

You should now have **TWO** redirect URIs:

1. **Production**: `https://backend-95ve.onrender.com/api/auth/google/callback`
2. **Localhost**: `http://localhost:5000/api/auth/google/callback`

### Step 5: Test Locally

1. Make sure your backend is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the console output - you should see:
   ```
   🔧 Configuring Google OAuth Strategy
   Callback URL: http://localhost:5000/api/auth/google/callback
   ```

3. Try signing in with Google from your frontend

## Complete List of Redirect URIs

Add these to Google Cloud Console:

### Production
```
https://backend-95ve.onrender.com/api/auth/google/callback
```

### Localhost (Development)
```
http://localhost:5000/api/auth/google/callback
```

## Verify Backend Configuration

Make sure your `.env` file (or Render environment) has:

**For Localhost:**
```env
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

**For Production (Render):**
```env
BACKEND_URL=https://backend-95ve.onrender.com
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Troubleshooting

### Still getting redirect_uri_mismatch?

1. ✅ Check Render logs to see what callback URL is being used
2. ✅ Verify the URL in Google Console matches exactly (no trailing slash)
3. ✅ Make sure you saved changes in Google Console
4. ✅ Wait 1-2 minutes after saving (Google needs time to propagate)
5. ✅ Clear browser cache and try again

### Check What URL Your Backend is Using

When you start your backend, check the logs:
```
🔧 Configuring Google OAuth Strategy
   Callback URL: http://localhost:5000/api/auth/google/callback
```

This is the exact URL that must be in Google Cloud Console!

## Quick Checklist

- [ ] Added `http://localhost:5000/api/auth/google/callback` to Google Cloud Console
- [ ] Added `https://backend-95ve.onrender.com/api/auth/google/callback` to Google Cloud Console
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-2 minutes after saving
- [ ] Backend running locally on port 5000
- [ ] Tested Google sign-in again
