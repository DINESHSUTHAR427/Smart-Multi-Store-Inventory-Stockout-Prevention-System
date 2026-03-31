"""
CSV Upload Service for bulk product imports.
Handles parsing and validation of CSV files.
"""

import csv
import io
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session

from ..models.product import Product
from ..models.store import Store


class CSVService:
    """Service for handling CSV file operations."""
    
    REQUIRED_HEADERS = ['name', 'stock', 'price', 'reorder_level']
    OPTIONAL_HEADERS = ['sku', 'category', 'unit']
    ALL_HEADERS = REQUIRED_HEADERS + OPTIONAL_HEADERS
    
    def parse_csv(self, file_content: bytes) -> Tuple[List[Dict], List[str]]:
        """
        Parse CSV content and validate.
        
        Args:
            file_content: Raw CSV bytes
            
        Returns:
            Tuple of (valid_products, errors)
        """
        products = []
        errors = []
        
        try:
            # Decode and parse CSV
            content = file_content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))
            
            # Validate headers
            if not reader.fieldnames:
                errors.append("CSV file is empty or has no headers")
                return [], errors
            
            # Check for required headers
            missing_headers = set(self.REQUIRED_HEADERS) - set(reader.fieldnames)
            if missing_headers:
                errors.append(f"Missing required headers: {', '.join(missing_headers)}")
            
            # Parse rows
            for row_num, row in enumerate(reader, start=2):
                try:
                    product = self._parse_row(row, row_num)
                    if product:
                        products.append(product)
                except ValueError as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    
        except UnicodeDecodeError:
            errors.append("File must be UTF-8 encoded")
        except Exception as e:
            errors.append(f"Error parsing CSV: {str(e)}")
        
        return products, errors
    
    def _parse_row(self, row: Dict, row_num: int) -> Dict:
        """Parse and validate a single CSV row."""
        product = {}
        
        # Required fields
        for field in self.REQUIRED_HEADERS:
            value = row.get(field, '').strip()
            if not value:
                raise ValueError(f"Missing required field: {field}")
            
            if field == 'name':
                product['name'] = value
            elif field == 'stock':
                try:
                    product['stock'] = int(value)
                    if product['stock'] < 0:
                        raise ValueError("Stock cannot be negative")
                except ValueError:
                    raise ValueError(f"Invalid stock value: {value}")
            elif field == 'price':
                try:
                    product['price'] = float(value)
                    if product['price'] < 0:
                        raise ValueError("Price cannot be negative")
                except ValueError:
                    raise ValueError(f"Invalid price value: {value}")
            elif field == 'reorder_level':
                try:
                    product['reorder_level'] = int(value)
                    if product['reorder_level'] < 0:
                        raise ValueError("Reorder level cannot be negative")
                except ValueError:
                    raise ValueError(f"Invalid reorder_level value: {value}")
        
        # Optional fields
        for field in self.OPTIONAL_HEADERS:
            value = row.get(field, '').strip()
            if value:
                if field == 'sku':
                    product['sku'] = value
                elif field == 'category':
                    product['category'] = value
                elif field == 'unit':
                    product['unit'] = value
        
        # Set defaults for optional fields
        product.setdefault('sku', None)
        product.setdefault('category', None)
        product.setdefault('unit', 'units')
        
        return product
    
    def bulk_create_products(
        self,
        db: Session,
        products: List[Dict],
        store_id: int
    ) -> Dict[str, any]:
        """
        Create multiple products in bulk.
        
        Args:
            db: Database session
            products: List of product dictionaries
            store_id: Store ID to associate products with
            
        Returns:
            Dictionary with success count and errors
        """
        # Verify store exists
        store = db.query(Store).filter(Store.id == store_id).first()
        if not store:
            return {
                'success': False,
                'created': 0,
                'errors': ['Store not found']
            }
        
        created_products = []
        errors = []
        
        for idx, product_data in enumerate(products):
            try:
                # Check for duplicate SKU
                if product_data.get('sku'):
                    existing = db.query(Product).filter(
                        Product.store_id == store_id,
                        Product.sku == product_data['sku']
                    ).first()
                    if existing:
                        errors.append(f"Row {idx + 1}: SKU {product_data['sku']} already exists")
                        continue
                
                # Create product
                product = Product(
                    store_id=store_id,
                    name=product_data['name'],
                    sku=product_data.get('sku'),
                    stock=product_data['stock'],
                    price=product_data['price'],
                    reorder_level=product_data['reorder_level'],
                    category=product_data.get('category'),
                    unit=product_data.get('unit', 'units')
                )
                db.add(product)
                created_products.append(product)
                
            except Exception as e:
                errors.append(f"Row {idx + 1}: {str(e)}")
        
        # Commit all successfully parsed products
        if created_products:
            try:
                db.commit()
                return {
                    'success': True,
                    'created': len(created_products),
                    'errors': errors if errors else None
                }
            except Exception as e:
                db.rollback()
                return {
                    'success': False,
                    'created': 0,
                    'errors': [f"Database error: {str(e)}"]
                }
        
        return {
            'success': False,
            'created': 0,
            'errors': errors
        }


csv_service = CSVService()
