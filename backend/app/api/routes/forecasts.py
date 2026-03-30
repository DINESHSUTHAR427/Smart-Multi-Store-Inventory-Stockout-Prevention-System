"""
Demand Forecasting API Routes
ML-powered demand prediction and reorder suggestions.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.schemas.forecast import ForecastResponse, ForecastData, ReorderSuggestion
from app.ml.forecasting import get_demand_forecast, calculate_reorder_suggestion

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])


@router.post("/{product_id}", response_model=ForecastResponse)
async def generate_forecast(
    product_id: int,
    days: int = Query(30, ge=7, le=90, description="Days to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate demand forecast for a product.
    
    Uses Linear Regression model trained on historical sales data.
    Returns predictions for the specified number of days.
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify store access
    store = db.query(Store).filter(
        Store.id == product.store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this product"
        )
    
    # Get forecast
    forecast_data = get_demand_forecast(db, product_id, days)
    
    return ForecastResponse(
        product_id=product_id,
        product_name=forecast_data['product_name'],
        forecast_period=days,
        forecasts=[ForecastData(**f) for f in forecast_data['forecasts']],
        average_daily_demand=forecast_data['average_daily_demand'],
        model_accuracy=forecast_data.get('model_accuracy')
    )


@router.get("/{product_id}", response_model=ForecastResponse)
async def get_forecast(
    product_id: int,
    days: int = Query(30, ge=7, le=90, description="Days to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get existing forecast data for a product."""
    return await generate_forecast(product_id, days, current_user, db)


@router.get("/reorder-suggestion/{product_id}", response_model=ReorderSuggestion)
async def get_reorder_suggestion(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get reorder suggestion for a product.
    
    Formula:
        required_stock = predicted_demand + safety_stock - current_stock
        safety_stock = average_daily_demand * 1.5
    
    Returns the quantity to order to prevent stockouts.
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify store access
    store = db.query(Store).filter(
        Store.id == product.store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this product"
        )
    
    # Get reorder suggestion
    suggestion = calculate_reorder_suggestion(db, product_id)
    
    return ReorderSuggestion(**suggestion)
