# Fix OAuth Redirect Loop Issue

## Problem

After successful Google OAuth login, there's a redirect loop causing `redirect_uri_mismatch` error.

## Root Cause

The issue is likely that:
1. Google OAuth succeeds ✅
2. Backend redirects to `/auth/callback?token=...` ✅
3. Frontend callback page processes token ✅
4. But then something redirects back to Google OAuth again ❌

## Solution

### 1. Ensure Frontend URL is Correct

Check your Render environment variables:
- `FRONTEND_URL` should be your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- No trailing slash
- Use `https://` in production

### 2. Verify Google Cloud Console Redirect URIs

Make sure you have **ONLY** these redirect URIs:

**Production:**
```
https://backend-95ve.onrender.com/api/auth/google/callback
```

**Localhost (for testing):**
```
http://localhost:5000/api/auth/google/callback
```

**DO NOT ADD:**
- ❌ Frontend URLs (like `https://your-app.vercel.app/auth/callback`)
- ❌ Any other URLs
- ❌ URLs with trailing slashes

### 3. Check Frontend Callback Page

The callback page (`/auth/callback`) should:
- ✅ Receive token from query parameter
- ✅ Store token in localStorage
- ✅ Fetch user data
- ✅ Redirect to `/dashboard` (using `router.replace` not `router.push`)

### 4. Prevent Redirect Loops

The callback page now uses `router.replace()` instead of `router.push()` to prevent back navigation issues.

## Testing Steps

1. Clear browser cache and cookies
2. Go to login page
3. Click "Sign in with Google"
4. Complete Google authentication
5. Should redirect to `/auth/callback` → `/dashboard`
6. Should NOT redirect back to Google OAuth

## Debugging

Check Render logs for:
```
🟢 Google OAuth callback received
✅ Google OAuth successful for user: [email]
🔄 Redirecting to frontend: [frontend-url]/auth/callback?token=[token]
```

If you see multiple redirects or errors, check:
- Frontend URL in environment variables
- Browser console for JavaScript errors
- Network tab for redirect chain
