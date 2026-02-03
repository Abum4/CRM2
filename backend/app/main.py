from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import os
from pathlib import Path

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting CRM Backend...")
    logger.info(f"PORT: {os.environ.get('PORT', 'not set')}")
    logger.info(f"DATABASE_URL set: {bool(settings.DATABASE_URL)}")
    
    # Initialize database with error handling
    try:
        from app.database import init_db
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Continue running - health check will still work
    
    # Generate admin code
    try:
        from app.utils.security import generate_admin_code
        admin_code = generate_admin_code()
        logger.info(f"Admin code generated: {admin_code}")
    except Exception as e:
        logger.error(f"Admin code generation failed: {e}")
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory: {upload_dir}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CRM Backend...")


# Create FastAPI application
app = FastAPI(
    title="CRM API",
    description="Backend API for CRM system",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
from app.api.v1 import api_router
app.include_router(api_router)

# Mount static files for uploads
upload_path = Path(settings.UPLOAD_DIR)
if upload_path.exists():
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Внутренняя ошибка сервера",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CRM Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/admin-code")
async def get_admin_code():
    """Get current admin code (for development/testing only)."""
    if not settings.DEBUG:
        return {"error": "Not available in production"}
    
    from app.utils.security import get_current_admin_code
    code = get_current_admin_code()
    return {"admin_code": code}
