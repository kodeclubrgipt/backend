# Fix Your .env File

## ❌ Current Issue Found

Your `.env` file has:
- ❌ `GOOGLE_CLIENT_ID` is **MISSING**
- ❌ `GOOGLE_CLIENT_SECRET` is set **TWICE** (duplicate)
- ✅ One of the `GOOGLE_CLIENT_SECRET` entries has your Client ID value

## ✅ Correct .env Configuration

Your `.env` file should have these lines (fix them):

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 🔧 How to Fix

1. Open your `.env` file in the `backend` folder
2. Find the line that says:
   ```
   GOOGLE_CLIENT_SECRET=your-client-id-value-here.apps.googleusercontent.com
   ```
3. **Change it to:**
   ```
   GOOGLE_CLIENT_ID=your-client-id-value-here.apps.googleusercontent.com
   ```
4. Make sure you only have **ONE** `GOOGLE_CLIENT_SECRET` line:
   ```
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   ```

## ✅ Complete Google OAuth Section Should Look Like:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## After Fixing

1. Save the `.env` file
2. Restart your server:
   ```bash
   npm run dev
   ```

The error should be gone!
