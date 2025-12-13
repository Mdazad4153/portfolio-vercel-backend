# 🚀 Backend Deployment Guide

## ✅ Pre-Deployment Checklist

Your backend is **READY** for deployment! Here's what's already configured:

- ✅ `vercel.json` configured
- ✅ `.gitignore` properly set up
- ✅ `package.json` with proper scripts
- ✅ Environment variables in `.env.example`
- ✅ Supabase integration ready

---

## 🌐 Option 1: Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Backend
```bash
cd backend
vercel
```

### Step 4: Add Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all variables from `.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PORT` (set to 5000)

### Step 5: Redeploy
```bash
vercel --prod
```

Your backend will be live at: `https://your-project.vercel.app`

---

## 🎯 Option 2: Deploy to Render

### Step 1: Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Backend ready for deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder
5. Set:
   - **Name:** `portfolio-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Step 3: Add Environment Variables
In Render dashboard, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Click "Create Web Service" and wait for deployment!

---

## 🔧 Option 3: Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Deploy
```bash
cd backend
railway init
railway up
```

### Step 4: Add Environment Variables
```bash
railway variables set SUPABASE_URL=your_supabase_url
railway variables set SUPABASE_SERVICE_KEY=your_service_key
railway variables set JWT_SECRET=your_jwt_secret
railway variables set ADMIN_EMAIL=your_email
railway variables set ADMIN_PASSWORD=your_password
```

---

## 📝 After Deployment

### Update Frontend API URL

1. Open `frontend/js/admin.js`
2. Find line 2:
   ```javascript
   const API = 'http://localhost:5000/api';
   ```
3. Replace with your deployed backend URL:
   ```javascript
   const API = 'https://your-backend.vercel.app/api';
   ```

4. Do the same in `frontend/js/app.js`

### Update CORS (if needed)

If you get CORS errors, update `backend/server.js`:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://your-frontend-domain.com'  // Add your frontend URL
  ],
  credentials: true
};
```

---

## 🧪 Test Your Deployment

1. Visit: `https://your-backend.vercel.app/`
   - You should see: `{"message":"Md Azad Portfolio API v3.0"}`

2. Check health endpoint: `https://your-backend.vercel.app/api/health`
   - Should return: `{"status":"OK"}`

3. Test admin login from your frontend

---

## 🔐 Security Checklist

- ✅ `.env` is in `.gitignore`
- ✅ Never commit `.env` to GitHub
- ✅ Use strong `JWT_SECRET` (random 64+ chars)
- ✅ Use strong `ADMIN_PASSWORD`
- ✅ Supabase RLS policies enabled
- ✅ CORS configured properly

---

## 📊 Recommended Deployment

**For Free Tier:**
- Backend → Vercel (Free, unlimited bandwidth)
- Frontend → Netlify/Vercel (Free, auto-deploy from Git)
- Database → Supabase (Free tier: 500MB, 2 databases)

---

## 🆘 Troubleshooting

### Issue: "Module not found"
**Fix:** Make sure all dependencies are in `package.json`, not `devDependencies`

### Issue: "Cannot connect to Supabase"
**Fix:** Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables

### Issue: "Port already in use"
**Fix:** Remove `PORT` from environment variables (Vercel handles it automatically)

### Issue: "JWT verification failed"
**Fix:** Ensure `JWT_SECRET` is the same in both local and deployed environments

---

## ✅ You're Ready!

Your backend is **100% deployment-ready**. Choose your preferred platform and follow the steps above.

**Need help?** Check:
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)

---

**Created by:** Md Azad Ansari  
**Version:** 3.0  
**Last Updated:** December 2024
