from app.api.routes.auth import router as auth_router
from app.api.routes.stores import router as stores_router
from app.api.routes.products import router as products_router
from app.api.routes.sales import router as sales_router
from app.api.routes.forecasts import router as forecasts_router
from app.api.routes.alerts import router as alerts_router

__all__ = [
    "auth_router",
    "stores_router",
    "products_router",
    "sales_router",
    "forecasts_router",
    "alerts_router"
]
