from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - Neon PostgreSQL (update with your connection string)
    DATABASE_URL: str = "postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-abc123xyz789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # SMTP (Email)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Application
    APP_NAME: str = "Smart Inventory System"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
