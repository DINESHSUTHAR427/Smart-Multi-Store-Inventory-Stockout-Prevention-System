"""
Smart Multi-Store Inventory & Stockout Prevention System
FastAPI Backend Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from cachetools import TTLCache

from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import (
    auth_router,
    stores_router,
    products_router,
    sales_router,
    forecasts_router,
    alerts_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    Smart Multi-Store Inventory & Stockout Prevention System API.
    
    Features:
    - Multi-store management
    - Inventory tracking with automatic stock updates
    - ML-powered demand forecasting (Linear Regression)
    - Low stock alerts with email notifications
    - CSV bulk upload for products
    - JWT authentication
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache
cache = TTLCache(maxsize=100, ttl=300)


def get_cache(key):
    return cache.get(key)


def set_cache(key, value):
    cache[key] = value


def clear_cache():
    cache.clear()


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation Error",
            "errors": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(stores_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(forecasts_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "auth": "/api/auth",
            "stores": "/api/stores",
            "products": "/api/products",
            "sales": "/api/sales",
            "forecasts": "/api/forecasts",
            "alerts": "/api/alerts"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "inventory-api", "cache_size": len(cache)}


@app.post("/cache/clear")
async def clear_cache_endpoint():
    clear_cache()
    return {"message": "Cache cleared"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
