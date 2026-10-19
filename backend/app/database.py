from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings

is_sqlite = settings.database_url.startswith("sqlite")
# El pooler de Neon (PgBouncer) no acepta parámetros de arranque como idle_session_timeout.
is_neon_pooler = "-pooler" in settings.database_url

if is_sqlite:
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
elif is_neon_pooler:
    # NullPool: cada request abre y cierra su conexión, así Neon puede dormir entre usos.
    # Es lento (~1,6 s por request): abrir la conexión cuesta varios viajes de red.
    engine = create_engine(settings.database_url, pool_pre_ping=True, poolclass=NullPool)
else:
    # Conexión directa: reutiliza conexiones mientras se usa la app, y Postgres cierra las que
    # quedan 2 min ociosas para que Neon pueda autosuspender su compute igual que con NullPool.
    # pool_pre_ping descarta las que Postgres ya cerró.
    engine = create_engine(
        settings.database_url,
        connect_args={"options": "-c idle_session_timeout=120000"},
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=3,
    )
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
