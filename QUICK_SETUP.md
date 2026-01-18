# Quick Setup Checklist

## ✅ Already Set
- Google OAuth Client ID: `your-google-client-id.apps.googleusercontent.com`
- MongoDB URI: (You mentioned you have this)

## ⚠️ Still Need These 2 Things:

### 1. Google OAuth Client Secret

**Get it from Google Cloud Console:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client Secret** (starts with `GOCSPX-`)

**Add to your `.env` file:**
```env
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

### 2. JWT Secret (Generate This)

**Generate using PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or generate using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Add to your `.env` file:**
```env
JWT_SECRET=your-generated-secret-here
```

## Your Complete .env File Should Look Like:

```env
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

MONGODB_URI=your-mongodb-connection-string

JWT_SECRET=your-generated-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Important: Don't Forget!

**Add Redirect URI in Google Cloud Console:**
- Go to: https://console.cloud.google.com/apis/credentials
- Click your OAuth Client ID
- Under "Authorized redirect URIs", add:
  ```
  http://localhost:5000/api/auth/google/callback
  ```
- Click **Save**

## Once Everything is Set:

```bash
cd backend
npm run dev
```

You should see:
- ✅ MongoDB connected successfully
- ✅ Server running on port 5000
- No warnings about missing credentials
