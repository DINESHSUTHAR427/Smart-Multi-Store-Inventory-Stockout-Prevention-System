from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Product(Base):
    """Product model for inventory management."""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)
    stock = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    reorder_level = Column(Integer, default=10)
    category = Column(String(100), nullable=True)
    unit = Column(String(50), default="units")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    store = relationship("Store", back_populates="products")
    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")
    
    @property
    def stock_status(self) -> str:
        """Return stock status based on reorder level."""
        if self.stock <= self.reorder_level:
            return "low"
        elif self.stock <= self.reorder_level * 2:
            return "medium"
        else:
            return "high"
    
    @property
    def needs_reorder(self) -> bool:
        """Check if product needs reordering."""
        return self.stock <= self.reorder_level
    
    def __repr__(self):
        return f"<Product {self.name}>"
