"""
Sales API Routes
Handles sales transactions and automatic stock updates.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleResponse, SalesSummary, SalesByDate

router = APIRouter(prefix="/sales", tags=["Sales"])


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


@router.get("", response_model=List[SaleResponse])
async def list_sales(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, le=500, description="Max results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List sales with optional filters."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    if not store_ids:
        return []
    
    # Build query
    query = db.query(Sale).join(Product).filter(Product.store_id.in_(store_ids))
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        query = query.filter(Product.store_id == store_id)
    
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product and product.store_id in store_ids:
            query = query.filter(Sale.product_id == product_id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Sale.created_at >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Sale.created_at < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    sales = query.order_by(Sale.created_at.desc()).limit(limit).all()
    
    return [
        SaleResponse(
            id=sale.id,
            product_id=sale.product_id,
            quantity=sale.quantity,
            unit_price=sale.unit_price,
            total_amount=sale.total_amount,
            created_at=sale.created_at,
            product_name=sale.product.name
        )
        for sale in sales
    ]


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_data: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a sale transaction.
    
    Automatically updates product stock:
    - New stock = Current stock - quantity_sold
    - Rejects sale if stock is insufficient
    """
    # Get product
    product = db.query(Product).filter(Product.id == sale_data.product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify store access
    verify_store_access(product.store_id, current_user.id, db)
    
    # Check sufficient stock
    if product.stock < sale_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.stock}, Requested: {sale_data.quantity}"
        )
    
    # Calculate total
    total_amount = sale_data.quantity * product.price
    
    # Create sale
    new_sale = Sale(
        product_id=sale_data.product_id,
        quantity=sale_data.quantity,
        unit_price=product.price,
        total_amount=total_amount
    )
    
    # Update product stock
    product.stock -= sale_data.quantity
    
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    
    return SaleResponse(
        id=new_sale.id,
        product_id=new_sale.product_id,
        quantity=new_sale.quantity,
        unit_price=new_sale.unit_price,
        total_amount=new_sale.total_amount,
        created_at=new_sale.created_at,
        product_name=product.name
    )


@router.get("/summary", response_model=SalesSummary)
async def get_sales_summary(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    days: int = Query(7, ge=1, le=90, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sales summary for a time period."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    if not store_ids:
        return SalesSummary(total_sales=0, total_revenue=0.0, sales=[])
    
    # Build query
    start_date = datetime.utcnow() - timedelta(days=days)
    query = db.query(Sale).join(Product).filter(
        Product.store_id.in_(store_ids),
        Sale.created_at >= start_date
    )
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        query = query.filter(Product.store_id == store_id)
    
    sales = query.order_by(Sale.created_at.desc()).all()
    
    total_revenue = sum(sale.total_amount for sale in sales)
    
    return SalesSummary(
        total_sales=len(sales),
        total_revenue=round(total_revenue, 2),
        sales=[
            SaleResponse(
                id=sale.id,
                product_id=sale.product_id,
                quantity=sale.quantity,
                unit_price=sale.unit_price,
                total_amount=sale.total_amount,
                created_at=sale.created_at,
                product_name=sale.product.name
            )
            for sale in sales
        ]
    )


@router.get("/by-date", response_model=List[SalesByDate])
async def get_sales_by_date(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    days: int = Query(7, ge=1, le=90, description="Number of days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sales grouped by date."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    if not store_ids:
        return []
    
    # Build query
    start_date = datetime.utcnow() - timedelta(days=days)
    query = db.query(Sale).join(Product).filter(
        Product.store_id.in_(store_ids),
        Sale.created_at >= start_date
    )
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        query = query.filter(Product.store_id == store_id)
    
    # Group by date
    sales = query.all()
    
    daily_data = {}
    for sale in sales:
        date_str = sale.created_at.strftime('%Y-%m-%d')
        if date_str not in daily_data:
            daily_data[date_str] = {'total_quantity': 0, 'total_revenue': 0.0}
        daily_data[date_str]['total_quantity'] += sale.quantity
        daily_data[date_str]['total_revenue'] += sale.total_amount
    
    result = [
        SalesByDate(
            date=date,
            total_quantity=data['total_quantity'],
            total_revenue=round(data['total_revenue'], 2)
        )
        for date, data in sorted(daily_data.items())
    ]
    
    return result


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific sale by ID."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    
    # Verify access
    verify_store_access(sale.product.store_id, current_user.id, db)
    
    return SaleResponse(
        id=sale.id,
        product_id=sale.product_id,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        total_amount=sale.total_amount,
        created_at=sale.created_at,
        product_name=sale.product.name
    )
