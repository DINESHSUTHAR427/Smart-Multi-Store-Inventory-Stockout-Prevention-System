"""
Alerts API Routes
Low stock alerts and email notifications.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.models.sale import Sale
from app.schemas.alert import AlertResponse, AlertEmailRequest, DashboardStats
from app.services.email_service import email_service
from app.ml.forecasting import calculate_reorder_suggestion

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_low_stock_alerts(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all products with low stock (below reorder level)."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    if not store_ids:
        return []
    
    # Build query for low stock products
    query = db.query(Product).filter(
        Product.store_id.in_(store_ids),
        Product.stock <= Product.reorder_level
    )
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        query = query.filter(Product.store_id == store_id)
    
    products = query.order_by(Product.stock).all()
    
    return [
        AlertResponse(
            id=product.id,
            product_id=product.id,
            product_name=product.name,
            current_stock=product.stock,
            reorder_level=product.reorder_level,
            message=f"Low stock: {product.name} has only {product.stock} units (reorder at {product.reorder_level})",
            created_at=product.updated_at or product.created_at
        )
        for product in products
    ]


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_alert_email(
    request: AlertEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send low stock alert email for a store.
    
    - If recipient_email is not provided, sends to the user's email
    - Includes all products below reorder level
    """
    # Verify store access
    store = db.query(Store).filter(
        Store.id == request.store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found or access denied"
        )
    
    # Get low stock products
    low_stock_products = db.query(Product).filter(
        Product.store_id == request.store_id,
        Product.stock <= Product.reorder_level
    ).all()
    
    if not low_stock_products:
        return {
            "success": True,
            "message": "No low stock products found",
            "alert_count": 0
        }
    
    # Prepare alerts
    alerts = []
    for product in low_stock_products:
        try:
            suggestion = calculate_reorder_suggestion(db, product.id)
            suggested_qty = suggestion.get('suggested_order_quantity', 0)
        except:
            suggested_qty = product.reorder_level - product.stock
        
        alerts.append({
            'product_name': product.name,
            'current_stock': product.stock,
            'reorder_level': product.reorder_level,
            'suggested_quantity': max(0, suggested_qty) if suggested_qty else 'N/A'
        })
    
    # Send email
    recipient = request.recipient_email or current_user.email
    result = email_service.send_low_stock_alert(
        to_email=recipient,
        store_name=store.name,
        alerts=alerts
    )
    
    return {
        "success": result['success'],
        "message": result['message'],
        "alert_count": len(alerts),
        "recipients": recipient
    }


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the user."""
    # Get user's stores
    user_stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    store_ids = [s.id for s in user_stores]
    
    total_stores = len(store_ids)
    
    if not store_ids:
        return DashboardStats(
            total_products=0,
            low_stock_count=0,
            medium_stock_count=0,
            high_stock_count=0,
            total_stores=0,
            today_sales=0,
            today_revenue=0.0
        )
    
    # Get products
    products_query = db.query(Product).filter(Product.store_id.in_(store_ids))
    
    if store_id:
        if store_id not in store_ids:
            raise HTTPException(status_code=403, detail="Access denied to this store")
        products_query = products_query.filter(Product.store_id == store_id)
    
    products = products_query.all()
    
    total_products = len(products)
    low_stock_count = sum(1 for p in products if p.stock_status == "low")
    medium_stock_count = sum(1 for p in products if p.stock_status == "medium")
    high_stock_count = sum(1 for p in products if p.stock_status == "high")
    
    # Get today's sales
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    sales_query = db.query(Sale).join(Product).filter(
        Product.store_id.in_(store_ids),
        Sale.created_at >= today_start
    )
    
    if store_id:
        sales_query = sales_query.filter(Product.store_id == store_id)
    
    today_sales_data = sales_query.all()
    today_sales = len(today_sales_data)
    today_revenue = sum(sale.total_amount for sale in today_sales_data)
    
    return DashboardStats(
        total_products=total_products,
        low_stock_count=low_stock_count,
        medium_stock_count=medium_stock_count,
        high_stock_count=high_stock_count,
        total_stores=total_stores,
        today_sales=today_sales,
        today_revenue=round(today_revenue, 2)
    )
