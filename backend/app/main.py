"""Sybil Swarm — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routes.chat import router as chat_router
from app.routes.reports import router as reports_router
from app.routes.simulations import router as simulations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="Sybil Swarm",
    description="Meet your first 1,000 customers before you build",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(simulations_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sybil-swarm"}
