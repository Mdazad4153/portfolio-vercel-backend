# Portfolio Backend API

Node.js + Express backend for MD Azad Ansari's portfolio website with Supabase (PostgreSQL) database.

## 🚀 Features

- **RESTful API** for portfolio management
- **JWT Authentication** for admin panel
- **Session Management** with device tracking
- **File Upload** support (images, resume, PDFs)
- **Rate Limiting** for security
- **Email Notifications** (contact form)
- **Database**: Supabase (PostgreSQL)
- **Security**: Helmet, CORS, bcrypt password hashing

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Supabase Account** (free tier available)

## 🔧 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/your-username/portfolio.git
cd portfolio/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase Database

1. **Create Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database initialization

2. **Run Database Schema:**
   - Open Supabase Dashboard → SQL Editor
   - Copy entire content from `supabase_schema.sql`
   - Run the SQL script
   - Verify tables are created (admins, profiles, projects, etc.)

3. **Get API Credentials:**
   - Go to: Settings → API
   - Copy **Project URL** (SUPABASE_URL)
   - Copy **service_role key** (SUPABASE_SERVICE_KEY)

### 4. Environment Configuration

Create `.env` file in backend directory:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
# Required
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_generated_jwt_secret

# Password Reset Secret (change this!)
PASSWORD_RESET_SECRET=your_custom_secret

# Optional (Email)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Create Admin Account

Run the backend:
```bash
npm run dev
```

Then make a POST request to register admin:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "your_secure_password"
  }'
```

### 6. Start Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server runs on: `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase client configuration
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── upload.js            # File upload (multer) configuration
├── models/
│   └── *.js                 # Database models (legacy, using Supabase now)
├── routes/
│   ├── auth.js              # Authentication & sessions
│   ├── profile.js           # Profile management
│   ├── projects.js          # Projects CRUD
│   ├── skills.js            # Skills CRUD
│   ├── education.js         # Education CRUD
│   ├── services.js          # Services CRUD
│   ├── certificates.js      # Certificates CRUD
│   ├── contact.js           # Contact form
│   └── backup.js            # Data export/backup
├── uploads/                 # Uploaded files (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example environment file
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── server.js                # Main server file
└── supabase_schema.sql      # Database schema
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current admin
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/sessions` - Get active sessions
- `DELETE /api/auth/sessions` - Logout from devices

### Profile
- `GET /api/profile` - Get profile (public)
- `PUT /api/profile` - Update profile (admin)
- `POST /api/profile/image` - Upload profile photo (admin)
- `POST /api/profile/resume` - Upload resume (admin)
- `DELETE /api/profile/image` - Delete photo (admin)
- `DELETE /api/profile/resume` - Delete resume (admin)

### Projects
- `GET /api/projects` - Get visible projects
- `GET /api/projects/all` - Get all projects (admin)
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

### Skills, Education, Services, Certificates
Similar CRUD operations for each resource.

### Contact
- `POST /api/contact` - Submit contact form (public)
- `GET /api/contact` - Get all messages (admin)
- `PUT /api/contact/:id/read` - Mark as read (admin)
- `PUT /api/contact/:id/reply` - Reply to message (admin)
- `DELETE /api/contact/:id` - Delete message (admin)

## 🛡️ Security Features

- **JWT** authentication with session tracking
- **bcrypt** password hashing
- **Helmet** security headers
- **Rate limiting** on all API routes
- **CORS** protection
- **File upload** validation
- **Input sanitization**

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "Latest Supabase client
  "express": "Web framework",
  "jsonwebtoken": "JWT authentication",
  "bcryptjs": "Password hashing",
  "multer": "File uploads",
  "nodemailer": "Email sending",
  "cors": "CORS middleware",
  "helmet": "Security headers",
  "express-rate-limit": "Rate limiting",
  "dotenv": "Environment variables"
}
```

## 🚀 Deployment

### Vercel (Recommended for Backend)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Render / Railway
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | **Yes** | Supabase service role key |
| `JWT_SECRET` | **Yes** | JWT signing secret |
| `PASSWORD_RESET_SECRET` | **Yes** | Password reset code |
| `EMAIL_HOST` | No | SMTP host for emails |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check Supabase dashboard for project status
- Ensure database schema is properly executed

### File Upload Errors
- Check `uploads/` directory permissions
- Verify file size limits in `.env`
- Ensure `multer` is properly configured

### Authentication Failures
- Clear browser localStorage
- Check JWT_SECRET matches between logins
- Verify `admin_sessions` table exists

## 📄 License

MIT License - feel free to use for your own portfolio!

## 👤 Author

**MD Azad Ansari**
- GitHub: [@mdazad4153](https://github.com/mdazad4153)
- LinkedIn: [mdazad4153](https://linkedin.com/in/mdazad4153)

## 🙏 Acknowledgments

- Supabase for amazing backend-as-a-service
- Express.js community
- All open-source contributors
