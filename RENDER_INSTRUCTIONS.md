# 🚀 Portfolio Backend - Deployment Guide

## Supabase Configuration

This backend uses **Supabase** (PostgreSQL) as the database. 

### Prerequisites
1. A Supabase account ([https://supabase.com](https://supabase.com))
2. A Supabase project created

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase_schema.sql` and run it
4. This will create all necessary tables

### Environment Variables

Set these environment variables in your deployment platform:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxx.supabase.co`) | ✅ |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `PASSWORD_RESET_SECRET` | Secret code for password reset | ✅ |
| `PORT` | Server port (usually set by platform) | ❌ |
| `NODE_ENV` | Set to `production` | ❌ |

### Deployment Steps

#### Option 1: Render.com
1. Create a new Web Service
2. Connect your GitHub repository
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add environment variables
6. Deploy!

#### Option 2: Vercel
1. Import your repository
2. Set Framework Preset to "Other"
3. Add environment variables
4. Deploy!

#### Option 3: Railway
1. Create new project from GitHub
2. Add environment variables
3. Deploy automatically

### Post-Deployment

1. Run the seed script to add sample data:
```bash
node seed.js
```

2. Test the API:
```bash
curl https://your-domain.com/api/health
```

### Default Admin Credentials
- **Email**: azad79900@gmail.com
- **Password**: Admin@123

⚠️ **Important**: Change these credentials after first login!
