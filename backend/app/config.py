from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/docuquery"
    ANTHROPIC_API_KEY: str = ""
    CHAT_MODEL: str = "claude-haiku-4-5"

    model_config = {"env_file": ".env"}


settings = Settings()
