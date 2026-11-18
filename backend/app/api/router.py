from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .enrollments import router as enrollments_router
from .patterns import router as patterns_router
from .interventions import router as interventions_router
from .imports import router as imports_router
from .monitoring import router as monitoring_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(enrollments_router)
api_router.include_router(patterns_router)
api_router.include_router(interventions_router)
api_router.include_router(imports_router)
api_router.include_router(monitoring_router)
