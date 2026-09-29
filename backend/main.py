import sys
from pathlib import Path

# Add backend directory and project root to sys.path so imports work from anywhere
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
for p in [str(PROJECT_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from backend.config import settings
    from backend.services.database import db_service
    from backend.routers import transactions, budget, prediction, advice
except (ImportError, ValueError):
    from config import settings
    from services.database import db_service
    from routers import transactions, budget, prediction, advice
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="Multi-Agent System for Personal Finance & Expense Advice",
    version="1.0.0"
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

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up server and initializing agents...")
    await db_service.connect()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down server...")
    await db_service.disconnect()

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": f"Welcome to {settings.app_name} API"}
