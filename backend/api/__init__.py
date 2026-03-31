from .core.database import Base, engine
from .models import User, Store, Product, Sale

Base.metadata.create_all(bind=engine)

__all__ = ["User", "Store", "Product", "Sale"]
