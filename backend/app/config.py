from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/docuquery"
    ANTHROPIC_API_KEY: str = ""
    CHAT_MODEL: str = "claude-haiku-4-5"
    # Orígenes CORS permitidos, separados por coma.
    # En prod sobreescribir con la URL de Cloudflare Pages.
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()
