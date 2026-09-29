from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application configuration settings."""
    app_name: str = "AI-Powered Personal Finance & Expense Advisor"
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "finance_advisor"
    cors_origins: list[str] = ["*"]
    
    model_config = {
        "env_file": ".env"
    }

settings = Settings()
