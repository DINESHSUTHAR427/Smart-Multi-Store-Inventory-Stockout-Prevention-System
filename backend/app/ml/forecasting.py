"""
Demand Forecasting Module using Linear Regression

This module uses historical sales data to predict future demand
using a simple but effective Linear Regression model.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.product import Product


class DemandForecaster:
    """ML model for demand forecasting using Linear Regression."""
    
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = ['day_of_week', 'day_of_month', 'month', 'week_of_year']
    
    def prepare_features(self, dates: List[datetime]) -> pd.DataFrame:
        """Extract time-based features from dates."""
        df = pd.DataFrame({'date': pd.to_datetime(dates)})
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        
        # Add cyclical features for better pattern capture
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        return df[self.feature_columns + ['day_sin', 'day_cos', 'month_sin', 'month_cos']]
    
    def train(self, sales_data: List[Dict]) -> float:
        """
        Train the model on historical sales data.
        
        Args:
            sales_data: List of dicts with 'date' and 'quantity' keys
            
        Returns:
            Model accuracy score (R²)
        """
        if len(sales_data) < 7:
            raise ValueError("Need at least 7 days of sales data for training")
        
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate sales by date
        daily_sales = df.groupby('date')['quantity'].sum().reset_index()
        daily_sales = daily_sales.sort_values('date')
        
        # Prepare features
        X = self.prepare_features(daily_sales['date'].tolist())
        y = daily_sales['quantity'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Calculate accuracy
        score = self.model.score(X_scaled, y)
        return max(0.0, score)  # Ensure non-negative
    
    def predict(self, start_date: datetime, days: int) -> List[Dict]:
        """
        Predict demand for future dates.
        
        Args:
            start_date: Start date for predictions
            days: Number of days to predict
            
        Returns:
            List of predictions with dates and quantities
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        future_dates = [start_date + timedelta(days=i) for i in range(days)]
        X_future = self.prepare_features(future_dates)
        X_future_scaled = self.scaler.transform(X_future)
        
        predictions = self.model.predict(X_future_scaled)
        
        return [
            {
                'date': date.strftime('%Y-%m-%d'),
                'predicted_demand': max(0, round(pred, 2))
            }
            for date, pred in zip(future_dates, predictions)
        ]


def get_historical_sales(db: Session, product_id: int) -> List[Dict]:
    """Get historical sales data for a product."""
    sales = db.query(Sale).filter(
        Sale.product_id == product_id
    ).order_by(Sale.created_at).all()
    
    return [
        {
            'date': sale.created_at,
            'quantity': sale.quantity,
            'unit_price': sale.unit_price,
            'total': sale.total_amount
        }
        for sale in sales
    ]


def calculate_average_demand(sales_data: List[Dict], days: int = 30) -> float:
    """Calculate average daily demand from sales data."""
    if not sales_data:
        return 0.0
    
    df = pd.DataFrame(sales_data)
    df['date'] = pd.to_datetime(df['date'])
    
    # Get date range
    start_date = df['date'].min()
    end_date = df['date'].max()
    total_days = max(1, (end_date - start_date).days + 1)
    
    # Calculate total quantity sold
    total_quantity = df['quantity'].sum()
    
    # Calculate daily average
    daily_avg = total_quantity / total_days
    
    # Project to requested period
    projected = daily_avg * days
    return round(projected, 2)


def get_demand_forecast(db: Session, product_id: int, days: int = 30) -> Dict:
    """
    Generate demand forecast for a product.
    
    Args:
        db: Database session
        product_id: Product ID to forecast
        days: Number of days to forecast (default 30)
        
    Returns:
        Dictionary with forecast data and metrics
    """
    # Get product info
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product {product_id} not found")
    
    # Get historical sales
    sales_data = get_historical_sales(db, product_id)
    
    # Prepare result
    result = {
        'product_id': product_id,
        'product_name': product.name,
        'forecast_period': days,
        'forecasts': [],
        'average_daily_demand': 0.0,
        'model_accuracy': None,
        'has_enough_data': False
    }
    
    if len(sales_data) >= 7:
        try:
            # Train model
            forecaster = DemandForecaster()
            accuracy = forecaster.train(sales_data)
            
            # Make predictions
            start_date = datetime.now()
            predictions = forecaster.predict(start_date, days)
            
            result['forecasts'] = predictions
            result['average_daily_demand'] = round(
                sum(p['predicted_demand'] for p in predictions) / days, 2
            )
            result['model_accuracy'] = round(accuracy * 100, 2)
            result['has_enough_data'] = True
            
        except Exception as e:
            # Fallback to simple average if ML fails
            result['average_daily_demand'] = calculate_average_demand(sales_data, days)
            result['error'] = str(e)
    else:
        # Not enough data, use simple calculation
        result['average_daily_demand'] = calculate_average_demand(sales_data, days)
        result['message'] = f"Need more data (have {len(sales_data)} days, need 7)"
    
    return result


def calculate_reorder_suggestion(
    db: Session,
    product_id: int,
    safety_factor: float = 1.5
) -> Dict:
    """
    Calculate reorder suggestion for a product.
    
    Formula:
        required_stock = predicted_demand + safety_stock - current_stock
        safety_stock = average_daily_demand * safety_factor
    
    Args:
        db: Database session
        product_id: Product ID
        safety_factor: Multiplier for safety stock (default 1.5)
        
    Returns:
        Dictionary with reorder suggestion
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product {product_id} not found")
    
    # Get forecast
    forecast = get_demand_forecast(db, product_id, days=30)
    
    predicted_demand = forecast['average_daily_demand']
    current_stock = product.stock
    
    # Calculate safety stock (based on historical variability)
    safety_stock = max(1, int(predicted_demand * safety_factor))
    
    # Calculate required stock for next 30 days
    required_stock = predicted_demand + safety_stock
    
    # Calculate suggested order quantity
    if current_stock >= required_stock:
        suggested_order = 0
        confidence = "low"
    else:
        suggested_order = int(required_stock - current_stock)
        confidence = "high"
    
    return {
        'product_id': product_id,
        'product_name': product.name,
        'current_stock': current_stock,
        'predicted_demand': predicted_demand,
        'safety_stock': safety_stock,
        'required_stock': int(required_stock),
        'suggested_order_quantity': suggested_order,
        'confidence': confidence,
        'needs_reorder': suggested_order > 0
    }
