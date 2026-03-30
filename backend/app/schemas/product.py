from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    """Base product schema."""
    name: str
    sku: Optional[str] = None
    stock: int = 0
    price: float = 0.0
    reorder_level: int = 10
    category: Optional[str] = None
    unit: str = "units"


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    store_id: int


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    name: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None
    reorder_level: Optional[int] = None
    category: Optional[str] = None
    unit: Optional[str] = None


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    store_id: int
    stock_status: Optional[str] = None
    needs_reorder: Optional[bool] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductBulkUpload(BaseModel):
    """Schema for bulk product upload."""
    products: List[ProductCreate]
