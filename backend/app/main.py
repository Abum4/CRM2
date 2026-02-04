from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import os
import asyncio
from pathlib import Path

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global reference to bot for shutdown
_telegram_bot = None
_bot_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    global _telegram_bot, _bot_task
    
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
    
    # Start Telegram bot if configured
    if settings.TELEGRAM_BOT_TOKEN:
        try:
            from telegram import Bot
            from telegram.ext import Application, CommandHandler
            
            logger.info("Starting Telegram bot...")
            
            # Create bot application
            application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
            
            # Add command handlers
            async def start_command(update, context):
                await update.message.reply_text(
                    "👋 Привет! Я бот CRM системы.\n\n"
                    "Доступные команды:\n"
                    "/status - Проверить статус бота\n"
                    "/help - Показать помощь"
                )
            
            async def status_command(update, context):
                await update.message.reply_text("✅ Бот работает нормально")
            
            async def help_command(update, context):
                await update.message.reply_text(
                    "🤖 CRM Telegram Bot\n\n"
                    "Этот бот используется для:\n"
                    "• Получения кода для входа в админ-панель\n"
                    "• Уведомлений о важных событиях в системе"
                )
            
            application.add_handler(CommandHandler("start", start_command))
            application.add_handler(CommandHandler("status", status_command))
            application.add_handler(CommandHandler("help", help_command))
            
            # Initialize and start polling
            await application.initialize()
            await application.start()
            
            # Start polling in background
            async def poll_updates():
                try:
                    await application.updater.start_polling(drop_pending_updates=True)
                except Exception as e:
                    logger.error(f"Telegram polling error: {e}")
            
            _bot_task = asyncio.create_task(poll_updates())
            _telegram_bot = application
            
            logger.info("Telegram bot started successfully")
            
            # Send admin code if configured
            if admin_code and settings.ADMIN_TELEGRAM_CHAT_ID:
                try:
                    await application.bot.send_message(
                        chat_id=settings.ADMIN_TELEGRAM_CHAT_ID,
                        text=f"🔐 <b>Код администратора</b>\n\n<code>{admin_code}</code>\n\n⏰ Действителен 24 часа",
                        parse_mode='HTML'
                    )
                    logger.info("Admin code sent to Telegram")
                except Exception as e:
                    logger.error(f"Failed to send admin code to Telegram: {e}")
        except Exception as e:
            logger.error(f"Telegram bot initialization failed: {e}")
    else:
        logger.info("Telegram bot not configured (TELEGRAM_BOT_TOKEN not set)")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CRM Backend...")
    
    # Stop Telegram bot
    if _telegram_bot:
        try:
            await _telegram_bot.updater.stop()
            await _telegram_bot.stop()
            await _telegram_bot.shutdown()
            logger.info("Telegram bot stopped")
        except Exception as e:
            logger.error(f"Error stopping Telegram bot: {e}")


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
