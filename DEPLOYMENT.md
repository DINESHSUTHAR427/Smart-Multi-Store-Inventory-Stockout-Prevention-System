# Deployment Guide

This guide covers deploying the Smart Multi-Store Inventory & Stockout Prevention System to production.

## Option 1: Render (Recommended for Backend)

### Backend Deployment on Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Note the connection string (DATABASE_URL)

3. **Deploy Backend**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     ```
     DATABASE_URL=<your-postgresql-connection-string>
     SECRET_KEY=<generate-secure-random-key>
     SMTP_USER=<your-email>
     SMTP_PASSWORD=<your-app-password>
     DEBUG=False
     ```

4. **Get Backend URL**
   - Note your service URL (e.g., `https://your-app.onrender.com`)

---

### Frontend Deployment on Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Update API URL**
   - Create `.env` file:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```

3. **Deploy Frontend**
   - Dashboard → New Project
   - Import your repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add Environment Variable:
     - `VITE_API_URL` = your backend URL

4. **Update CORS in Backend**
   - In `backend/main.py`, update CORS origins to your Vercel URL:
     ```python
     allow_origins=["https://your-frontend.vercel.app"]
     ```

---

## Option 2: Railway

### Backend Deployment on Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - New Project → Provision PostgreSQL
   - Note the connection string

3. **Deploy Backend**
   - New Project → Deploy from GitHub repo
   - Configure environment variables in Railway dashboard

4. **Deploy Frontend**
   - Same as Vercel, use Railway URL for backend

---

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database URL

# Run the server
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run the development server
npm run dev
```

### Database Migrations

The app auto-creates tables on startup. For production, use Alembic:

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
APP_NAME=Smart Inventory System
DEBUG=False
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## Gmail SMTP Setup for Email Alerts

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this password as SMTP_PASSWORD

Or use services like:
- SendGrid
- Mailgun
- AWS SES
- Postmark

---

## Health Check

After deployment, verify:
- Backend: `https://your-backend.onrender.com/health`
- API Docs: `https://your-backend.onrender.com/docs`

---

## Troubleshooting

### CORS Errors
- Ensure backend CORS includes your frontend URL
- Check that you're using `https://` in production

### Database Connection
- Verify DATABASE_URL format
- Check that PostgreSQL allows connections from your host

### Email Not Sending
- Check SMTP credentials
- Ensure less secure app access is enabled (or use app password)
- Check spam folder

### Build Errors
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Clear Python cache (`__pycache__`)

---

## Security Checklist

- [ ] Change SECRET_KEY to a secure random value
- [ ] Enable DEBUG=False in production
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable database connection pooling
- [ ] Set up rate limiting (optional)
- [ ] Enable request logging
