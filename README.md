# Kode Club Backend API

Backend API server for Kode Club platform.

## Features

- User registration with email/password
- Google OAuth authentication
- JWT-based authentication
- **MongoDB database** with Mongoose ODM
- RESTful API endpoints
- Connection pooling and error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `env.example`:
```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

Or manually create `.env` and copy the contents from `env.example`.

3. Configure environment variables in `.env`:
   - `MONGODB_URI`: MongoDB connection string
     - Local: `mongodb://localhost:27017/kode-club`
     - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/kode-club`
   - `JWT_SECRET`: Secret key for JWT tokens
   - `GOOGLE_CLIENT_ID`: Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
   - `FRONTEND_URL`: Frontend URL (default: http://localhost:3000)
   - `BACKEND_URL`: Backend URL (default: http://localhost:5000)

4. Run the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user (requires auth)

### User

- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (requires auth)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`
