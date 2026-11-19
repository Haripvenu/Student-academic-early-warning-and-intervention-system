import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .db import init_db, SessionLocal
from .api.router import api_router
from .models import ModelArtifact, PublishedAssessment, User

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Supervised Machine Learning Early Warning System for Higher Education",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
app.include_router(api_router)

@app.get("/health")
def health_check():
    db = SessionLocal()
    try:
        active_models = db.query(ModelArtifact).filter(ModelArtifact.is_active == True).count()
        total_assessed = db.query(PublishedAssessment).count()
        db_ok = True
    except Exception as e:
        db_ok = False
        active_models = 0
        total_assessed = 0
    finally:
        db.close()

    return {
        "status": "healthy" if db_ok else "unhealthy",
        "app_env": settings.APP_ENV,
        "database_connected": db_ok,
        "active_models_count": active_models,
        "total_published_assessments": total_assessed
    }

# Mount frontend build if running in static production mode
frontend_dist = os.path.abspath(os.path.join(settings.BASE_DIR, "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
