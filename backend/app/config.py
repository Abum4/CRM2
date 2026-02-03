from pydantic_settings import BaseSettings
from typing import Optional, List
import secrets


class Settings(BaseSettings):
    # Debug
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/crm_db"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    ADMIN_TELEGRAM_CHAT_ID: Optional[str] = None
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Get list of allowed CORS origins."""
        origins = self.CORS_ORIGINS_STR.split(",")
        if self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return [o.strip() for o in origins if o.strip()]
    
    # Admin
    ADMIN_LOGIN: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
