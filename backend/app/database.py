from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Supabase y otras DBs cloud requieren SSL; localhost no lo necesita
_is_local = any(h in settings.DATABASE_URL for h in ("localhost", "127.0.0.1"))
_connect_args = {} if _is_local else {"sslmode": "require"}

engine = create_async_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
