# Vercel Deployment Guide

Quick deployment to Vercel (Next.js optimized hosting).

## Prerequisites
- Vercel account: https://vercel.com
- GitHub account with this repository
- MySQL database (Railway, PlanetScale, or AWS RDS)
- API keys (Mistral, Gemini)

## Deployment Steps

### Step 1: Connect to Vercel
```bash
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Select: AkshatVerma-Code/ImmunoTrace
5. Click "Import"
```

### Step 2: Configure Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

```
JWT_SECRET=<your-generated-secret>
DB_HOST=<your-mysql-host>
DB_PORT=3306
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=immunotrace
MISTRAL_API_KEY=<your-mistral-key>
MISTRAL_OCR_MODEL=pixtral-12b-latest
GEMINI_API_KEY=<your-gemini-key>
GEMINI_MODEL=gemini-2.5-flash
```

### Step 3: Deploy
```
1. Click "Deploy"
2. Vercel builds and deploys automatically
3. Wait 2-3 minutes
4. You'll get a live URL: https://immunotrace.vercel.app
```

### Step 4: Initialize Database (if not done yet)
- Execute `server/sql/schema.sql` in your MySQL database
- Or use Railway MySQL dashboard

## Database Options with Vercel

### Option A: Railway MySQL (Recommended)
- Already set up ✅
- Connection details in environment variables
- Keep using it with Vercel

### Option B: PlanetScale (MySQL compatible)
- Free tier available
- https://planetscale.com
- Get connection string, add to env vars

### Option C: AWS RDS
- Professional option
- More expensive
- Full MySQL support

## Testing After Deployment

```bash
# Health check
curl https://your-vercel-url.vercel.app/api/health

# Expected response:
# {"status": "healthy", "database": "connected"}
```

## Vercel vs Railway Comparison

| Feature | Railway | Vercel |
|---------|---------|--------|
| **Best for** | Full-stack apps | Next.js apps |
| **Built-in MySQL** | ✅ Yes | ❌ No (use external) |
| **Free tier** | Generous | Limited |
| **Cold starts** | None | Possible |
| **Setup time** | Medium | Fast |
| **Custom domain** | ✅ | ✅ |
| **Deployment** | Auto | Auto |

## Custom Domain

### Add Domain in Vercel
```
1. Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records (follow Vercel instructions)
4. Wait 24-48 hours for propagation
```

### Example
```
vercel.json points to:
- immunotrace.vercel.app (default)
- yourdomain.com (custom, optional)
```

## Troubleshooting

### Build fails
- Check environment variables
- Ensure `package.json` and `package-lock.json` are committed
- View logs in Vercel Dashboard

### Database connection error
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in env vars
- Test connection locally first
- Ensure firewall allows Vercel IP

### Slow API responses
- May be database latency
- Check database is in same region
- Consider PlanetScale if using Railway from far away

## Next Steps

1. ✅ Code pushed to GitHub
2. ⏳ Connect Vercel to GitHub
3. ⏳ Set environment variables
4. ⏳ Deploy
5. ⏳ Test at live URL
6. ⏳ Verify database connection

---

**Default Vercel URL:** https://immunotrace.vercel.app  
**Custom domain:** Update DNS and add in Vercel settings

Happy deploying! 🚀
