from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import os
import sys
from pathlib import Path

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Log startup immediately
logger.info("=" * 50)
logger.info("CRM Backend Starting...")
logger.info(f"Python version: {sys.version}")
logger.info(f"PORT env: {os.environ.get('PORT', 'NOT SET')}")
logger.info(f"DATABASE_URL env set: {bool(os.environ.get('DATABASE_URL'))}")
logger.info("=" * 50)

# Import config with error handling
try:
    from app.config import settings
    logger.info("Config loaded successfully")
except Exception as e:
    logger.error(f"Failed to load config: {e}")
    raise


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
    admin_code = None
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
    
    # Send admin code via Telegram if configured (no polling - just send messages)
    if settings.TELEGRAM_BOT_TOKEN and admin_code and settings.ADMIN_TELEGRAM_CHAT_ID:
        try:
            from telegram import Bot
            
            logger.info("Sending admin code via Telegram...")
            
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
            await bot.send_message(
                chat_id=settings.ADMIN_TELEGRAM_CHAT_ID,
                text=f"🔐 <b>Код администратора</b>\n\n<code>{admin_code}</code>\n\n⏰ Действителен 24 часа",
                parse_mode='HTML'
            )
            logger.info("Admin code sent to Telegram successfully")
        except Exception as e:
            logger.error(f"Failed to send admin code to Telegram: {e}")
    elif not settings.TELEGRAM_BOT_TOKEN:
        logger.info("Telegram not configured (TELEGRAM_BOT_TOKEN not set)")
    
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

# Configure CORS - production settings
cors_origins = [
    "https://crm223.netlify.app",  # Old domian
    "https://crm555.netlify.app",  # New current domain
    "http://localhost:5173",        # Local development
    "http://localhost:3000",        # Alternative local
]
# Add origins from settings if any
cors_origins.extend([o for o in settings.CORS_ORIGINS if o not in cors_origins])
logger.info(f"CORS origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include API router with error handling
try:
    from app.api.v1 import api_router
    app.include_router(api_router)
    logger.info("API router loaded successfully")
except Exception as e:
    logger.error(f"Failed to load API router: {e}")
    import traceback
    traceback.print_exc()
    raise

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
