import asyncio
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from typing import Optional

logger = logging.getLogger(__name__)


class CRMTelegramBot:
    def __init__(self, token: str, admin_chat_id: Optional[str] = None):
        self.token = token
        self.admin_chat_id = admin_chat_id
        self.application: Optional[Application] = None
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        await update.message.reply_text(
            "👋 Привет! Я бот CRM системы.\n\n"
            "Доступные команды:\n"
            "/status - Проверить статус бота\n"
            "/help - Показать помощь"
        )
    
    async def status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command."""
        await update.message.reply_text("✅ Бот работает нормально")
    
    async def help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command."""
        await update.message.reply_text(
            "🤖 CRM Telegram Bot\n\n"
            "Этот бот используется для:\n"
            "• Получения кода для входа в админ-панель\n"
            "• Уведомлений о важных событиях в системе\n\n"
            "Если вы администратор, код для входа будет отправлен вам автоматически при запуске сервера."
        )
    
    async def send_message(self, chat_id: str, message: str):
        """Send a message to a specific chat."""
        if self.application:
            await self.application.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode='HTML'
            )
    
    async def send_admin_code(self, code: str):
        """Send admin code to the admin chat."""
        if self.admin_chat_id:
            await self.send_message(
                self.admin_chat_id,
                f"🔐 <b>Код администратора</b>\n\n"
                f"<code>{code}</code>\n\n"
                f"⏰ Действителен 24 часа"
            )
    
    async def send_notification(self, chat_id: str, title: str, message: str, notification_type: str = "info"):
        """Send a notification to a user."""
        icons = {
            "info": "ℹ️",
            "success": "✅",
            "warning": "⚠️",
            "error": "❌"
        }
        icon = icons.get(notification_type, "📣")
        
        await self.send_message(
            chat_id,
            f"{icon} <b>{title}</b>\n\n{message}"
        )
    
    def run(self):
        """Run the bot."""
        self.application = Application.builder().token(self.token).build()
        
        # Add handlers
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("status", self.status))
        self.application.add_handler(CommandHandler("help", self.help))
        
        logger.info("Starting Telegram bot...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


async def send_telegram_message(token: str, chat_id: str, message: str):
    """Utility function to send a message without running the full bot."""
    from telegram import Bot
    bot = Bot(token=token)
    await bot.send_message(chat_id=chat_id, text=message, parse_mode='HTML')


if __name__ == "__main__":
    import sys
    sys.path.insert(0, "..")
    
    from app.config import settings
    
    if not settings.TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not set in environment")
        sys.exit(1)
    
    logging.basicConfig(
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        level=logging.INFO
    )
    
    bot = CRMTelegramBot(
        token=settings.TELEGRAM_BOT_TOKEN,
        admin_chat_id=settings.ADMIN_TELEGRAM_CHAT_ID
    )
    bot.run()
