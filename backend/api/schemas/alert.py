from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class AlertBase(BaseModel):
    """Base alert schema."""
    product_id: int
    message: str


class AlertResponse(AlertBase):
    """Schema for alert response."""
    id: int
    product_name: str
    current_stock: int
    reorder_level: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AlertEmailRequest(BaseModel):
    """Schema for sending alert email."""
    store_id: int
    recipient_email: Optional[EmailStr] = None


class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    total_products: int
    low_stock_count: int
    medium_stock_count: int
    high_stock_count: int
    total_stores: int
    today_sales: int
    today_revenue: float
