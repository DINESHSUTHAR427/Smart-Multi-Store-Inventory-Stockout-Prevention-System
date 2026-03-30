"""
Store Management API Routes
Handles CRUD operations for stores.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.schemas.store import StoreCreate, StoreUpdate, StoreResponse

router = APIRouter(prefix="/stores", tags=["Stores"])


@router.get("", response_model=List[StoreResponse])
async def list_stores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all stores for the current user."""
    stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    
    # Add product count to each store
    result = []
    for store in stores:
        product_count = db.query(Product).filter(Product.store_id == store.id).count()
        store_dict = {
            "id": store.id,
            "user_id": store.user_id,
            "name": store.name,
            "location": store.location,
            "created_at": store.created_at,
            "product_count": product_count
        }
        result.append(StoreResponse(**store_dict))
    
    return result


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_data: StoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new store."""
    new_store = Store(
        user_id=current_user.id,
        name=store_data.name,
        location=store_data.location
    )
    
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    
    return StoreResponse(
        id=new_store.id,
        user_id=new_store.user_id,
        name=new_store.name,
        location=new_store.location,
        created_at=new_store.created_at,
        product_count=0
    )


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific store by ID."""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    product_count = db.query(Product).filter(Product.store_id == store.id).count()
    
    return StoreResponse(
        id=store.id,
        user_id=store.user_id,
        name=store.name,
        location=store.location,
        created_at=store.created_at,
        product_count=product_count
    )


@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: int,
    store_data: StoreUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a store."""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Update fields
    if store_data.name is not None:
        store.name = store_data.name
    if store_data.location is not None:
        store.location = store_data.location
    
    db.commit()
    db.refresh(store)
    
    product_count = db.query(Product).filter(Product.store_id == store.id).count()
    
    return StoreResponse(
        id=store.id,
        user_id=store.user_id,
        name=store.name,
        location=store.location,
        created_at=store.created_at,
        product_count=product_count
    )


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a store and all associated products."""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    db.delete(store)
    db.commit()
    
    return None
