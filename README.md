# Smart Multi-Store Inventory & Stockout Prevention System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.109-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

> A production-ready inventory management system with ML-powered demand forecasting for small retail stores. Prevent stockouts, track sales, and make data-driven decisions.

## ✨ Features

### 🏪 Multi-Store Management
- Manage multiple retail stores from a single dashboard
- Separate inventory tracking per store
- Quick store switching

### 📦 Inventory Control
- Real-time stock level monitoring
- Automatic stock deduction on sales
- SKU management and categorization
- Bulk CSV product import
- Low stock alerts with configurable thresholds

### 📊 Sales Analytics
- Track all transactions with detailed history
- Sales summary by date range
- Revenue tracking and reporting
- Visual charts with Chart.js

### 🤖 ML-Powered Forecasting
- **Linear Regression** demand prediction
- Automatic reorder suggestions
- Safety stock calculations
- Stockout prevention

### 🔐 Security
- JWT authentication
- bcrypt password hashing
- Protected API endpoints
- Input validation

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         React Frontend                               │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │    │
│  │   │   Auth  │  │ Stores  │  │Products │  │  Sales  │  │  Alerts │ │    │
│  │   │   Page  │  │  Page   │  │  Page   │  │  Page   │  │  Page   │ │    │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘ │    │
│  │        │            │            │            │            │          │    │
│  │        └────────────┴─────┬──────┴────────────┴────────────┘          │    │
│  │                           │                                              │    │
│  │                    ┌──────▼──────┐                                      │    │
│  │                    │  API Client │ (Axios + Interceptors)              │    │
│  │                    └──────┬──────┘                                      │    │
│  └───────────────────────────┼─────────────────────────────────────────────┘    │
│                              │                                                  │
└──────────────────────────────┼──────────────────────────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────┼──────────────────────────────────────────────────┐
│                         API LAYER                                             │
│  ┌──────────────────────────▼────────────────────────────────────────────┐    │
│  │                      FastAPI Backend                                   │    │
│  │                                                                   │    │
│  │   ┌─────────────────────────────────────────────────────────────┐  │    │
│  │   │                    CORS Middleware                        │  │    │
│  │   └─────────────────────────────────────────────────────────────┘  │    │
│  │   ┌─────────────────────────────────────────────────────────────┐  │    │
│  │   │                    Rate Limiter                            │  │    │
│  │   └─────────────────────────────────────────────────────────────┘  │    │
│  │   ┌─────────────────────────────────────────────────────────────┐  │    │
│  │   │                 Authentication (JWT)                        │  │    │
│  │   └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│    │
│  │   │   Auth   │ │  Stores  │ │ Products │ │  Sales   │ │ Alerts ││    │
│  │   │  Router  │ │  Router  │ │  Router  │ │  Router  │ │ Router ││    │
│  │   └───┬──────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│    │
│  │       │             │            │            │            │       │    │
│  │       └─────────────┴─────┬──────┴────────────┴───────────┘       │    │
│  │                           │                                         │    │
│  │                    ┌──────▼──────┐                                │    │
│  │                    │   Services  │                                 │    │
│  │                    │  ┌────────┐ │                                │    │
│  │                    │  │  Email │ │                                │    │
│  │                    │  │  CSV   │ │                                │    │
│  │                    │  │   ML   │ │                                │    │
│  │                    │  └────────┘ │                                │    │
│  │                    └──────┬──────┘                                │    │
│  └──────────────────────────┼────────────────────────────────────────┘    │
│                             │                                               │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                       DATA LAYER                                            │
│                                                                              │
│   ┌──────────────────────────▼──────────────────────────────────────────┐   │
│   │                      PostgreSQL / SQLite                             │   │
│   │                                                                       │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│   │   │    Users    │  │   Stores    │  │  Products   │  │  Sales   │ │   │
│   │   │    Table    │  │    Table    │  │    Table    │  │   Table  │ │   │
│   │   └─────────────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │   │
│   │                            │                 │              │       │   │
│   │                     ┌──────▼─────────────────▼──────────────▼─────┐ │   │
│   │                     │           Foreign Key Relationships          │ │   │
│   │                     │  users.id ← stores.user_id                 │ │   │
│   │                     │  stores.id ← products.store_id             │ │   │
│   │                     │  products.id ← sales.product_id            │ │   │
│   │                     └────────────────────────────────────────────┘ │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── components/          # Reusable UI Components
│   │   ├── Layout/         # Header, Sidebar, Footer
│   │   ├── Forms/          # Input, Select, Button
│   │   ├── Tables/         # DataTable, Pagination
│   │   ├── Charts/         # LineChart, BarChart, PieChart
│   │   └── Modals/         # ConfirmDialog, ProductModal
│   │
│   ├── pages/               # Route Pages
│   │   ├── Dashboard/      # Main dashboard view
│   │   ├── Auth/           # Login, Register
│   │   ├── Stores/         # Store management
│   │   ├── Products/       # Product CRUD
│   │   ├── Sales/          # Sales tracking
│   │   └── Forecasts/      # ML predictions
│   │
│   ├── contexts/            # React Context (State Management)
│   │   ├── AuthContext     # User authentication state
│   │   └── StoreContext    # Selected store state
│   │
│   ├── services/            # API Integration
│   │   └── api.js          # Axios instance & API methods
│   │
│   └── styles/              # Global Styles
│       └── globals.css      # Tailwind imports
```

#### Backend (FastAPI + SQLAlchemy)

```
backend/
├── api/                     # API Module (Vercel Compatible)
│   ├── api/
│   │   └── routes/         # API Endpoints
│   │       ├── auth.py     # Authentication routes
│   │       ├── stores.py   # Store management
│   │       ├── products.py # Product operations
│   │       ├── sales.py    # Sales tracking
│   │       ├── forecasts.py # ML forecasting
│   │       └── alerts.py   # Notifications
│   │
│   ├── core/               # Core Configuration
│   │   ├── config.py       # Settings & Environment
│   │   ├── database.py     # SQLAlchemy setup
│   │   └── security.py     # JWT & Password hashing
│   │
│   ├── models/             # Database Models
│   │   ├── user.py         # User ORM model
│   │   ├── store.py        # Store ORM model
│   │   ├── product.py      # Product ORM model
│   │   └── sale.py         # Sale ORM model
│   │
│   ├── schemas/            # Pydantic Schemas
│   │   ├── user.py         # User request/response
│   │   ├── store.py        # Store request/response
│   │   ├── product.py      # Product request/response
│   │   ├── sale.py         # Sale request/response
│   │   ├── forecast.py      # Forecast schemas
│   │   └── alert.py        # Alert schemas
│   │
│   ├── services/            # Business Logic
│   │   ├── email_service.py # SMTP email sending
│   │   └── csv_service.py  # CSV parsing & import
│   │
│   ├── ml/                 # Machine Learning
│   │   └── forecasting.py   # Linear Regression model
│   │
│   └── index.py            # Vercel entry point
│
├── main.py                  # FastAPI app (Local dev)
└── requirements.txt         # Python dependencies
```

### Data Flow

#### 1. User Authentication Flow

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Client │                    │  API   │                    │   DB   │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                              │                              │
    │  POST /api/auth/register    │                              │
    │ ─────────────────────────►  │                              │
    │                              │                              │
    │                              │  INSERT user                │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  Return user_id             │
    │                              │ ◄─────────────────────────  │
    │                              │                              │
    │  201 Created                 │                              │
    │ ◄─────────────────────────  │                              │
    │                              │                              │
    │  POST /api/auth/login       │                              │
    │ ─────────────────────────►  │                              │
    │                              │                              │
    │                              │  SELECT user WHERE email     │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  Verify password (bcrypt)    │
    │                              │ ◄─────────────────────────  │
    │                              │                              │
    │                              │  Generate JWT token          │
    │                              │                              │
    │  { access_token, token_type }│                              │
    │ ◄─────────────────────────  │                              │
```

#### 2. Sale Recording Flow

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Client │                    │  API   │                    │   DB   │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                              │                              │
    │  POST /api/sales            │                              │
    │  { product_id, quantity }   │                              │
    │ ─────────────────────────►  │                              │
    │                              │                              │
    │                              │  SELECT product              │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  Check: stock >= quantity?   │
    │                              │                              │
    │                              │  UPDATE product.stock -= qty │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  INSERT sale record          │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  COMMIT transaction         │
    │                              │                              │
    │  SaleResponse                │                              │
    │ ◄─────────────────────────  │                              │
    │                              │                              │
```

#### 3. ML Forecasting Flow

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Client │                    │  API   │                    │   DB   │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                              │                              │
    │  POST /api/forecasts/1      │                              │
    │ ─────────────────────────►  │                              │
    │                              │                              │
    │                              │  SELECT sales WHERE          │
    │                              │  product_id = 1             │
    │                              │ ─────────────────────────►  │
    │                              │                              │
    │                              │  ┌─────────────────────┐   │
    │                              │  │  Historical Data    │   │
    │                              │  │  ┌───────────────┐  │   │
    │                              │  │  │ date, qty     │  │   │
    │                              │  │  │ 2024-01-01, 5 │  │   │
    │                              │  │  │ 2024-01-02, 8 │  │   │
    │                              │  │  │ ...           │  │   │
    │                              │  │  └───────────────┘  │   │
    │                              │  └──────────┬──────────┘   │
    │                              │             │              │
    │                              │  ┌─────────▼───────────┐   │
    │                              │  │ Feature Extraction  │   │
    │                              │  │ day_of_week         │   │
    │                              │  │ day_of_month        │   │
    │                              │  │ month, week_of_year │   │
    │                              │  │ cyclical encoding   │   │
    │                              │  └─────────┬───────────┘   │
    │                              │            │               │
    │                              │  ┌─────────▼───────────┐   │
    │                              │  │ Linear Regression   │   │
    │                              │  │ Model Training     │   │
    │                              │  └─────────┬───────────┘   │
    │                              │            │               │
    │                              │  ┌─────────▼───────────┐   │
    │                              │  │ Future Predictions  │   │
    │                              │  │ Days 1-30          │   │
    │                              │  └─────────────────────┘   │
    │                              │                              │
    │  ForecastResponse            │                              │
    │  { forecasts[], accuracy }  │                              │
    │ ◄─────────────────────────  │                              │
```

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       users          │
├──────────────────────┤
│ id (PK)         SERIAL│
│ email           UNIQUE│
│ hashed_password       │
│ created_at             │
│ updated_at             │
└───────────┬───────────┘
            │ 1:N
            ▼
┌──────────────────────┐
│       stores         │
├──────────────────────┤
│ id (PK)         SERIAL│
│ user_id (FK)    ─────┼──► users.id
│ name                  │
│ location              │
│ created_at             │
│ updated_at             │
└───────────┬───────────┘
            │ 1:N
            ▼
┌──────────────────────┐
│     products         │
├──────────────────────┤
│ id (PK)         SERIAL│
│ store_id (FK)   ─────┼──► stores.id
│ name                  │
│ sku                   │
│ stock                 │
│ price                 │
│ reorder_level         │
│ category              │
│ unit                  │
│ created_at             │
│ updated_at             │
└───────────┬───────────┘
            │ 1:N
            ▼
┌──────────────────────┐
│       sales          │
├──────────────────────┤
│ id (PK)         SERIAL│
│ product_id (FK) ─────┼──► products.id
│ quantity             │
│ unit_price           │
│ total_amount          │
│ created_at            │
└──────────────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                        REQUEST FLOW                                  │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   Client Request                                                           │
│        │                                                                   │
│        ▼                                                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│   │   CORS      │───►│   Rate      │───►│  JWT Auth   │                   │
│   │   Check     │    │   Limit     │    │   Verify    │                   │
│   └─────────────┘    └─────────────┘    └──────┬──────┘                   │
│        │                                           │                        │
│        │                                           │                        │
│        ▼                                           ▼                        │
│   ┌─────────────┐                          ┌─────────────┐                   │
│   │  Reject if  │                          │  Extract    │                   │
│   │  no origin  │                          │  user_id    │                   │
│   └─────────────┘                          └──────┬──────┘                   │
│                                                   │                          │
│                                                   ▼                          │
│                                           ┌─────────────┐                   │
│                                           │   Route     │                   │
│                                           │  Handler    │                   │
│                                           └─────────────┘                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                     PROTECTION MECHANISMS                            │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│   │   bcrypt    │    │    JWT      │    │   CORS      │                   │
│   │  (Password) │    │  (Tokens)   │    │ (Origins)   │                   │
│   ├─────────────┤    ├─────────────┤    ├─────────────┤                   │
│   │ • Salt      │    │ • Expiry    │    │ • Whitelist │                   │
│   │ • Hash      │    │ • Signature │    │ • Methods   │                   │
│   │ • Verify    │    │ • Claims    │    │ • Headers   │                   │
│   └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│   │  Pydantic   │    │ SQLAlchemy  │    │ Environment │                   │
│   │ (Validate)  │    │   (ORM)      │    │   Secrets   │                   │
│   ├─────────────┤    ├─────────────┤    ├─────────────┤                   │
│   │ • Types     │    │ • Parameterized Queries │ • No secrets │            │
│   │ • Range     │    │ • Prevent SQL Injection │ in code    │              │
│   │ • Required  │    │ • Relationships  │      │ • .env files│             │
│   └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Software | Version | Notes |
|----------|---------|-------|
| Python | 3.9+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| PostgreSQL | 13+ | Production database |
| npm/yarn | Latest | Package management |

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Smart Multi-Store Inventory & Stockout Prevention System"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 📁 Project Structure

```
Smart Multi-Store Inventory & Stockout Prevention System/
├── backend/
│   ├── api/                    # API module (Vercel deployment)
│   │   ├── api/routes/         # API endpoints
│   │   ├── core/               # Config, database, security
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── ml/                 # ML forecasting module
│   │   └── index.py            # Vercel entry point
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── vercel.json             # Vercel config
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   ├── services/           # API integration
│   │   ├── styles/             # Global styles
│   │   └── App.jsx             # Main app component
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── postman/                    # Postman API collection
├── DEPLOYMENT.md               # Deployment guide
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance web framework |
| **SQLAlchemy** | Database ORM |
| **PostgreSQL** | Relational database |
| **Pydantic** | Data validation |
| **python-jose** | JWT authentication |
| **scikit-learn** | ML forecasting |
| **pandas** | Data processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Chart.js** | Data visualization |
| **React Router** | Routing |
| **Axios** | HTTP client |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/auth/me` | Get current user |

### Stores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List all stores |
| POST | `/api/stores` | Create new store |
| GET | `/api/stores/{id}` | Get store details |
| PUT | `/api/stores/{id}` | Update store |
| DELETE | `/api/stores/{id}` | Delete store |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| POST | `/api/products/bulk-upload` | CSV bulk upload |
| GET | `/api/products/{id}` | Get product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Record sale |
| GET | `/api/sales/summary` | Sales summary |
| GET | `/api/sales/by-date` | Sales by date |

### Forecasts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forecasts/{id}` | Generate forecast |
| GET | `/api/forecasts/{id}` | Get forecast |
| GET | `/api/forecasts/reorder-suggestion/{id}` | Reorder suggestion |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List low stock alerts |
| POST | `/api/alerts/send` | Send alert email |
| GET | `/api/alerts/dashboard` | Dashboard stats |

---

## 🤖 ML Demand Forecasting

### How It Works

```
Historical Sales Data → Feature Extraction → Linear Regression → Demand Prediction
                                                           ↓
                                              Reorder Suggestions
```

### Features Used
- Day of week (cyclical encoding)
- Day of month
- Month (cyclical encoding)
- Week of year

### Reorder Formula

```
required_stock = predicted_demand + safety_stock - current_stock
safety_stock = average_daily_demand × 1.5
```

### Requirements
- Minimum 7 days of historical sales data for model training
- Falls back to simple average if insufficient data

---

## 📊 CSV Bulk Upload Format

```csv
name,stock,price,reorder_level,sku,category,unit
Widget A,100,9.99,20,WGT001,Electronics,units
Widget B,50,14.99,15,WGT002,Groceries,kg
Widget C,200,4.99,50,WGT003,Beverages,liters
```

| Column | Required | Description |
|--------|----------|-------------|
| name | ✅ | Product name |
| stock | ✅ | Current stock quantity |
| price | ✅ | Price per unit |
| reorder_level | ✅ | Minimum stock threshold |
| sku | ❌ | Stock keeping unit |
| category | ❌ | Product category |
| unit | ❌ | Unit of measurement |

---

## ⚙️ Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
# For development: sqlite:///./inventory.db

# Security
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=true
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

---

## 🌐 Deployment

### Vercel (Frontend)

1. Connect your GitHub repository
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy

### Backend Deployment Options

#### Option 1: Vercel (Serverless)

```json
// backend/vercel.json
{
  "builds": [
    { "src": "api/index.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.py" }
  ]
}
```

#### Option 2: Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Option 3: Railway

1. New Project → Deploy from GitHub
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with salt |
| Authentication | JWT tokens with expiration |
| CORS Protection | Configured allowed origins |
| Input Validation | Pydantic schemas |
| SQL Injection Prevention | SQLAlchemy ORM |
| Secure Headers | FastAPI middleware |

---

## 🧪 Testing

### Postman Collection

1. Import `postman/Smart_Inventory_API.postman_collection.json`
2. Set `{{baseUrl}}` variable
3. Run "Login" request to get JWT token
4. Other requests will use stored token

### Manual Testing

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📈 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Push notifications (PWA)
- [ ] Advanced analytics dashboard
- [ ] Barcode/QR code scanning
- [ ] Supplier management module
- [ ] Multi-currency support
- [ ] React Native mobile app
- [ ] Deep learning forecasting models
- [ ] Automated supplier reordering
- [ ] Accounting software integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built with ❤️ for small retail store owners

---

<p align="center">
  <strong>Star ⭐ this repo if you find it useful!</strong>
</p>
