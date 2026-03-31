from .auth import router as auth_router
from .stores import router as stores_router
from .products import router as products_router
from .sales import router as sales_router
from .forecasts import router as forecasts_router
from .alerts import router as alerts_router

__all__ = [
    "auth_router",
    "stores_router",
    "products_router",
    "sales_router",
    "forecasts_router",
    "alerts_router"
]
