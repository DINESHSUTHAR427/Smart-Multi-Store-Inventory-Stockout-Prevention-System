"""
Product Management API Routes
Handles CRUD operations for products including bulk CSV upload.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.csv_service import csv_service

router = APIRouter(prefix="/products", tags=["Products"])


def verify_store_access(store_id: int, user_id: int, db: Session) -> Store:
    """Verify user has access to the store."""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == user_id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found or access denied"
        )
    
    return store


@router.get("", response_model=List[ProductResponse])
async def list_products(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Show only low stock products"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all products for the user's stores."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    if not store_ids:
        return []
    
    # Build query
    query = db.query(Product).filter(Product.store_id.in_(store_ids))
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        query = query.filter(Product.store_id == store_id)
    
    if category:
        query = query.filter(Product.category == category)
    
    if low_stock_only:
        query = query.filter(Product.stock <= Product.reorder_level)
    
    products = query.order_by(Product.name).all()
    
    # Add computed fields
    result = []
    for product in products:
        product_dict = {
            "id": product.id,
            "store_id": product.store_id,
            "name": product.name,
            "sku": product.sku,
            "stock": product.stock,
            "price": product.price,
            "reorder_level": product.reorder_level,
            "category": product.category,
            "unit": product.unit,
            "created_at": product.created_at,
            "stock_status": product.stock_status,
            "needs_reorder": product.needs_reorder
        }
        result.append(ProductResponse(**product_dict))
    
    return result


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product."""
    # Verify store access
    verify_store_access(product_data.store_id, current_user.id, db)
    
    # Check for duplicate SKU
    if product_data.sku:
        existing = db.query(Product).filter(
            Product.store_id == product_data.store_id,
            Product.sku == product_data.sku
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists"
            )
    
    # Create product
    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return ProductResponse(
        id=new_product.id,
        store_id=new_product.store_id,
        name=new_product.name,
        sku=new_product.sku,
        stock=new_product.stock,
        price=new_product.price,
        reorder_level=new_product.reorder_level,
        category=new_product.category,
        unit=new_product.unit,
        created_at=new_product.created_at,
        stock_status=new_product.stock_status,
        needs_reorder=new_product.needs_reorder
    )


@router.post("/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_products(
    store_id: int = Query(..., description="Store ID to upload products to"),
    file: UploadFile = File(..., description="CSV file with products"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk upload products from CSV file.
    
    Expected CSV format:
    - name, stock, price, reorder_level, [sku], [category], [unit]
    - First row must be headers
    - Required: name, stock, price, reorder_level
    - Optional: sku, category, unit
    """
    # Verify store access
    verify_store_access(store_id, current_user.id, db)
    
    # Read file
    contents = await file.read()
    
    # Parse CSV
    products, errors = csv_service.parse_csv(contents)
    
    if not products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV: {'; '.join(errors)}"
        )
    
    # Create products
    result = csv_service.bulk_create_products(db, products, store_id)
    
    if not result['success'] and result['created'] == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['errors']
        )
    
    return {
        "message": f"Successfully created {result['created']} products",
        "created_count": result['created'],
        "errors": result['errors']
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify access
    verify_store_access(product.store_id, current_user.id, db)
    
    return ProductResponse(
        id=product.id,
        store_id=product.store_id,
        name=product.name,
        sku=product.sku,
        stock=product.stock,
        price=product.price,
        reorder_level=product.reorder_level,
        category=product.category,
        unit=product.unit,
        created_at=product.created_at,
        stock_status=product.stock_status,
        needs_reorder=product.needs_reorder
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify access
    verify_store_access(product.store_id, current_user.id, db)
    
    # Check SKU uniqueness if updating
    if product_data.sku and product_data.sku != product.sku:
        existing = db.query(Product).filter(
            Product.store_id == product.store_id,
            Product.sku == product_data.sku,
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists"
            )
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        store_id=product.store_id,
        name=product.name,
        sku=product.sku,
        stock=product.stock,
        price=product.price,
        reorder_level=product.reorder_level,
        category=product.category,
        unit=product.unit,
        created_at=product.created_at,
        stock_status=product.stock_status,
        needs_reorder=product.needs_reorder
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify access
    verify_store_access(product.store_id, current_user.id, db)
    
    db.delete(product)
    db.commit()
    
    return None
