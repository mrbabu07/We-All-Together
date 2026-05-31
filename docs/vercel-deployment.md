# Vercel Deployment

Deploy this app as two Vercel projects from the same GitHub repository.

## Backend API

Create a Vercel project for the Express API.

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Framework Preset | Other |
| Build Command | Leave empty |
| Output Directory | Leave empty |
| Install Command | `npm install` |

The backend uses `server/api/index.js` as the Vercel serverless function. Routes are handled by `server/vercel.json`, so these URLs work after deployment:

```text
https://your-backend.vercel.app/
https://your-backend.vercel.app/api/v1/health
```

Add these environment variables in the backend Vercel project:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
JWT_ACCESS_SECRET=use_a_long_random_secret
JWT_ACCESS_EXPIRES_IN=7d
IMGBB_API_KEY=your_imgbb_key
ADMIN_BOOTSTRAP_SECRET=use_a_temporary_admin_setup_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_FROM=+19794935165
TWILIO_WHATSAPP_FROM=
```

`CLIENT_URL` supports multiple comma-separated origins:

```env
CLIENT_URL=https://your-frontend.vercel.app,https://your-preview-domain.vercel.app
```

## Frontend

Create a second Vercel project for the React app.

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Add these environment variables in the frontend Vercel project:

```env
VITE_API_BASE_URL=https://your-backend.vercel.app/api/v1
VITE_ENABLE_SOCKET=false
```

`VITE_ENABLE_SOCKET=false` is recommended for a Vercel serverless backend because Vercel functions do not keep Socket.IO websocket servers running. The app still works normally without the live presence widget.

## After Deploy

1. Deploy the backend first.
2. Copy the backend domain into frontend `VITE_API_BASE_URL`.
3. Deploy the frontend.
4. Copy the frontend domain into backend `CLIENT_URL`.
5. Redeploy the backend after changing `CLIENT_URL`.
6. Open `https://your-backend.vercel.app/api/v1/health` and confirm it returns JSON.
7. Open the frontend and log in.

## Notes

- MongoDB Atlas must allow connections from Vercel. For the simplest setup, allow `0.0.0.0/0` in Atlas Network Access.
- Vercel serverless functions do not run always-on background jobs. Manual API actions work, but long-running Socket.IO presence, scheduled reminders, and auto-backup jobs need a dedicated Node host such as Render, Railway, or a VPS if you require them in production.
- Never commit `.env` files or real credentials.
