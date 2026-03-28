# Healthcare Management System - Deployment Guide

## ✅ Local Development Setup (Both localhost & production)

### Frontend & Backend Structure
```
Frontend:  http://localhost:5173  (Vite dev server)
Backend:   http://localhost:5000  (Express API)
Database:  localhost:5432         (PostgreSQL local)
```

---

## 📝 Environment Files

### ✅ Already Created:

#### **Frontend:**
- `.env.local` → localhost URLs
- `.env.production` → Production URLs (update YOUR_RAILWAY_URL)

#### **Backend:**
- `.env.local` → localhost configuration
- `.env.production` → Production configuration

### 🔧 How It Works:
- **npm run dev** → uses `.env.local` (localhost)
- **npm run build** → uses `.env.production` (production)
- **npm start** → uses `.env.local` (development mode)

---

## 🚀 Deployment Steps

### Step 1: Frontend Deployment (Vercel)
```bash
1. Go to vercel.com
2. Sign in with GitHub
3. Connect your repository
4. Set Environment Variables:
   VITE_API_BASE_URL = https://your-railway-backend.railway.app
5. Deploy automatically
```

### Step 2: Backend Deployment (Railway)
```bash
1. Go to railway.app
2. Sign in with GitHub
3. Create new project → PostgreSQL
4. Create new service → Node.js
5. Connect GitHub repository
6. Set Environment Variables:
   NODE_ENV=production
   DB_HOST=[Railway provided]
   DB_USER=postgres
   DB_PASS=[Your password]
   DB_NAME=healthcare_management
   DB_PORT=5432
   PORT=5000
   JWT_SECRET=[Your secret]
   FRONTEND_URL=https://your-vercel-frontend.vercel.app
7. Deploy
```

### Step 3: Update Variables After Deployment
After Railway provides URLs, update **frontend .env.production**:
```
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app
```

Then redeploy to Vercel.

---

## 🧪 Local Testing (Both Modes)

### Development Mode:
```bash
# Terminal 1: Start Backend
cd hwm_backend
npm start

# Terminal 2: Start Frontend
cd hwm_frontend
npm run dev

✅ Accesses: http://localhost:5173 → http://localhost:5000 API
```

### Build Mode (Test Production):
```bash
# Frontend
cd hwm_frontend
npm run build
npm preview

✅ Accesses: built files → http://localhost:5000 API (still localhost)
```

---

## 📋 Checklist Before Deployment

- [ ] .env.local configured locally
- [ ] .env.production configured with Railway URLs
- [ ] .gitignore includes .env.local and .env.production.local
- [ ] Backend CORS configured correctly
- [ ] Database migrations support production
- [ ] JWT_SECRET is strong and unique
- [ ] Sensitive data NOT in .env.production (uploaded to Railway vars)
- [ ] Frontend build successful: `npm run build`
- [ ] Backend starts without errors: `npm start`

---

## 🔐 Security Notes

✅ Environment variables are NOT committed to Git
✅ Secrets stored in Railway dashboard (not in repo)
✅ CORS restricted to specific frontend domain
✅ Rate limiting enabled in production
✅ Helmet enabled for security headers

---

## ✨ New Features Added

### Frontend (`src/config/api.js`)
- Centralized API configuration
- Environment-based URLs
- Easy to update API endpoints

### Backend (Updated CORS)
- Dynamic CORS origin from `FRONTEND_URL` env var
- Credentials enabled for authentication
- Works with both localhost and production

---

## 💡 Quick Reference

| Setting | Local | Production |
|---------|-------|------------|
| Frontend URL | http://localhost:5173 | https://your-vercel.vercel.app |
| Backend URL | http://localhost:5000 | https://your-railway.railway.app |
| Database | localhost | Railway Postgres |
| Node Env | development | production |

---

## ❓ Troubleshooting

### "API calls failing" → Check:
1. Backend running on correct port
2. FRONTEND_URL in backend .env matches your frontend
3. VITE_API_BASE_URL in frontend .env matches your backend
4. CORS errors → Check browser console for Origin mismatch

### "Database connection failed" → Check:
1. PostgreSQL running (local dev)
2. DB credentials in .env.local correct
3. Database name created

### "Build fails" → Check:
1. `npm run build` output for errors
2. Missing imports in config/api.js
3. All env variables defined

---

**সাধারণ প্রশ্ন (FAQ):**

**Q: localhost ছাড়া production deploy করতে পারি?**
A: হ্যাঁ, উপরের Railway + Vercel steps follow করুন।

**Q: কি হবে .env.local এবং .env.production দুটো একসাথে থাকলে?**
A: npm automatically সঠিক একটি ব্যবহার করবে (dev mode = .local, build = production)

**Q: Secret variables কোথায় রাখব?**
A: Never commit secrets। Railway dashboard এ set করুন, repo এ না রেখে।
