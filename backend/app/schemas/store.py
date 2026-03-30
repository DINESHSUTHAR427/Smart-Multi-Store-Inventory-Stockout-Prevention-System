from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StoreBase(BaseModel):
    """Base store schema."""
    name: str
    location: Optional[str] = None


class StoreCreate(StoreBase):
    """Schema for creating a new store."""
    pass


class StoreUpdate(BaseModel):
    """Schema for updating a store."""
    name: Optional[str] = None
    location: Optional[str] = None


class StoreResponse(StoreBase):
    """Schema for store response."""
    id: int
    user_id: int
    created_at: datetime
    product_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
