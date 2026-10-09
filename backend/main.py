import sys
from pathlib import Path

# Add backend directory and project root to sys.path so imports work from anywhere
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
for p in [str(PROJECT_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from backend.config import settings
    from backend.services.database import db_service
    from backend.services.ml_service import ml_service
    from backend.routers import transactions, budget, prediction, advice
    from backend.routers.deps import coordinator
except (ImportError, ValueError):
    from config import settings
    from services.database import db_service
    from services.ml_service import ml_service
    from routers import transactions, budget, prediction, advice
    from routers.deps import coordinator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up server, training ML classifier and initializing agents...")
    ml_service.train()
    await db_service.connect()
    yield
    logger.info("Shutting down server...")
    await db_service.disconnect()


app = FastAPI(
    title=settings.app_name,
    description="Multi-Agent System for Personal Finance & Expense Advice",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(transactions.router)
app.include_router(budget.router)
app.include_router(prediction.router)
app.include_router(advice.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": f"Welcome to {settings.app_name} API",
        "agents": ["Coordinator"] + [name for _, name, _ in coordinator.PIPELINE],
        "ml_classifier": ml_service.info,
        "storage": "in-memory" if db_service.use_memory else "mongodb",
    }
