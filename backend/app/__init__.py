from app.core.database import Base, engine
from app.models import User, Store, Product, Sale

# Create database tables
Base.metadata.create_all(bind=engine)

__all__ = ["User", "Store", "Product", "Sale"]
