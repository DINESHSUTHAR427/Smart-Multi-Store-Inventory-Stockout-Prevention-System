# Smart Multi-Store Inventory & Stockout Prevention System

A production-ready inventory management system with ML-powered demand forecasting for small retail stores.

## Features

### Core Functionality
- **Multi-Store Support**: Manage multiple stores from a single account
- **Inventory Tracking**: Real-time stock monitoring with automatic updates
- **Sales Management**: Record sales with automatic stock deduction
- **Low Stock Alerts**: Automatic notifications when products need reordering
- **CSV Bulk Upload**: Import products quickly using CSV files

### ML-Powered Intelligence
- **Demand Forecasting**: Linear Regression model predicts future demand
- **Reorder Suggestions**: Data-driven recommendations for optimal stock levels
- **Sales Trends**: Visual analytics of sales patterns

### Technical Highlights
- JWT Authentication with secure password hashing
- RESTful API with comprehensive documentation
- Responsive React dashboard with Chart.js visualizations
- PostgreSQL database with SQLAlchemy ORM
- Email notifications via SMTP

---

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL

# Start server
uvicorn main:app --reload
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Configuration
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── ml/              # ML forecasting
│   ├── main.py              # FastAPI application
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── styles/          # CSS styles
│   ├── package.json
│   └── vite.config.js
│
├── postman/                  # API testing collection
├── README.md
├── DEPLOYMENT.md
└── .gitignore
```

---

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

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
| GET | `/api/sales/summary` | Get sales summary |
| GET | `/api/sales/by-date` | Sales grouped by date |

### Forecasts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forecasts/{id}` | Generate forecast |
| GET | `/api/forecasts/reorder-suggestion/{id}` | Get reorder suggestion |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List low stock alerts |
| POST | `/api/alerts/send` | Send alert email |
| GET | `/api/alerts/dashboard` | Dashboard statistics |

---

## Database Schema

### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Stores
```sql
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Products
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    stock INTEGER DEFAULT 0,
    price FLOAT DEFAULT 0.0,
    reorder_level INTEGER DEFAULT 10,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'units',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Sales
```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price FLOAT NOT NULL,
    total_amount FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ML Model: Demand Forecasting

The system uses Linear Regression to predict future demand based on historical sales data.

### Features Used
- Day of week
- Day of month
- Month
- Week of year
- Cyclical encoding (sin/cos)

### How It Works
1. Collects historical sales data
2. Extracts time-based features
3. Trains Linear Regression model
4. Predicts future demand
5. Calculates reorder suggestions

### Reorder Formula
```
required_stock = predicted_demand + safety_stock - current_stock
safety_stock = average_daily_demand × 1.5
```

---

## CSV Upload Format

```csv
name,stock,price,reorder_level,sku,category,unit
Widget A,100,9.99,20,WGT001,Electronics,units
Widget B,50,14.99,15,WGT002,Groceries,kg
```

**Required columns**: name, stock, price, reorder_level
**Optional columns**: sku, category, unit

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend**: Render, Railway, or Heroku
**Frontend**: Vercel or Netlify
**Database**: Render PostgreSQL, Railway PostgreSQL, or Supabase

---

## Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend
```env
VITE_API_URL=https://your-api-url.com/api
```

---

## Testing with Postman

1. Import `postman/Smart_Inventory_API.postman_collection.json`
2. Set `{{baseUrl}}` to your API URL
3. Run "Login" to get and store JWT token
4. All authenticated requests will use the token automatically

---

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation with Pydantic
- SQL injection prevention via SQLAlchemy ORM
- Secure environment variable management

---

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] Barcode/QR code scanning
- [ ] Supplier management
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Deep learning models
- [ ] Automated reordering with suppliers
- [ ] Integration with accounting software

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Support

For questions or support:
- Open an issue on GitHub

---

Built with for small shop owners
