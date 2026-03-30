from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class ForecastRequest(BaseModel):
    """Schema for forecast request."""
    days: int = 30


class ForecastData(BaseModel):
    """Schema for forecast data point."""
    date: str
    predicted_demand: float


class ForecastResponse(BaseModel):
    """Schema for forecast response."""
    product_id: int
    product_name: str
    forecast_period: int
    forecasts: List[ForecastData]
    average_daily_demand: float
    model_accuracy: Optional[float] = None


class ReorderSuggestion(BaseModel):
    """Schema for reorder suggestion."""
    product_id: int
    product_name: str
    current_stock: int
    predicted_demand: float
    safety_stock: int
    required_stock: int
    suggested_order_quantity: int
    confidence: str
