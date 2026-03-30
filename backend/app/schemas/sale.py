from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SaleBase(BaseModel):
    """Base sale schema."""
    quantity: int = Field(..., gt=0)


class SaleCreate(SaleBase):
    """Schema for creating a new sale."""
    product_id: int


class SaleResponse(SaleBase):
    """Schema for sale response."""
    id: int
    product_id: int
    unit_price: float
    total_amount: float
    created_at: datetime
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class SalesSummary(BaseModel):
    """Schema for sales summary."""
    total_sales: int
    total_revenue: float
    sales: List[SaleResponse]


class SalesByDate(BaseModel):
    """Schema for sales grouped by date."""
    date: str
    total_quantity: int
    total_revenue: float
