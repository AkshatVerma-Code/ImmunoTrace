# Railway Deployment Guide

This guide helps you deploy ImmunoTrace to [Railway](https://railway.app).

## Prerequisites

- Railway account (free tier available)
- GitHub account with this repository
- MySQL database credentials from Railway
- API keys for:
  - Mistral AI (for OCR)
  - Google Gemini (for AI features)

## Step 1: Prepare Environment Variables

Before deploying, generate a secure JWT secret:

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Step 2: Connect to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize GitHub and select this repository (`AkshatVerma-Code/ImmunoTrcae`)
5. Railway will auto-detect Next.js and start building

## Step 3: Configure Environment Variables

In Railway Dashboard, go to **Variables** and add:

```
JWT_SECRET=<your-generated-secret>
DB_HOST=<railway-mysql-host>
DB_PORT=3306
DB_USER=<railway-mysql-user>
DB_PASSWORD=<railway-mysql-password>
DB_NAME=immunotrace
MISTRAL_API_KEY=<your-mistral-key>
MISTRAL_OCR_MODEL=pixtral-12b-latest
GEMINI_API_KEY=<your-gemini-key>
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=production
```

## Step 4: Set Up MySQL Database

1. In Railway Dashboard, add a **MySQL** service
2. Wait for it to be provisioned
3. Copy connection details to environment variables (DB_HOST, DB_USER, DB_PASSWORD)
4. Execute the schema:
   - Download `server/sql/schema.sql`
   - Connect to Railway MySQL using a client
   - Run the schema file to create tables

Alternatively, use Railway's SQL editor:
- In Railway MySQL service, go to **Data**
- Paste contents of `server/sql/schema.sql`
- Execute

## Step 5: Monitor Deployment

1. Railway will build and deploy automatically
2. View logs in **Deployments** tab
3. Check health at: `https://your-app.up.railway.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-11T...",
  "database": "connected"
}
```

## Step 6: Test Your App

- **Sign up**: `https://your-app.up.railway.app/`
- **Login**: Test authentication with your account
- **Records**: Upload prescription images for OCR testing
- **Diet Plan**: Generate AI-powered diet plans
- **Chat**: Use the Trace chatbot

## Troubleshooting

### Build fails
- Check logs: Railway Dashboard → Deployments → View Logs
- Ensure `package.json` has all dependencies
- Verify `next.config.ts` is valid

### Database connection error
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in environment variables
- Ensure MySQL service is running
- Check schema is initialized

### API returns 503
- Health check endpoint: `/api/health`
- Common causes: missing environment variables, database offline
- Check Railway logs

### CORS or API errors
- Ensure API routes have `export const runtime = "nodejs"`
- Check environment variables are set correctly

## Scaling & Optimization

### Auto-scaling
- Railway automatically scales based on CPU/memory
- Configure in **Settings** → **Resource Limits**

### Database backups
- Enable automated backups in Railway MySQL settings
- Recommended: Daily backups

### Monitoring
- Use Railway's built-in monitoring
- Set up alerts for high CPU/memory

## Rolling Back

If deployment fails:
1. Go to **Deployments**
2. Click a previous successful deployment
3. Select **Deploy** to rollback

## Security Checklist

- [x] `.env` never committed (in `.gitignore`)
- [x] `JWT_SECRET` is strong and random
- [x] API keys never hardcoded
- [x] HTTPS enforced (Railway auto-enables)
- [x] Security headers configured

## Support

- Railway Docs: https://docs.railway.app
- ImmunoTrace Repo: https://github.com/AkshatVerma-Code/ImmunoTrcae
- Issues: File an issue in the GitHub repository

---

**Last Updated:** June 2026  
**Status:** Ready for production deployment
