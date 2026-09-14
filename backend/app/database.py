from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings

is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
# NullPool: no mantiene conexiones abiertas entre pedidos. Con pooling normal, una conexión
# ociosa queda viva indefinidamente y eso le impide a Neon autosuspender su compute entre usos,
# aunque el backend esté inactivo. Sin pooling, cada request abre y cierra su propia conexión,
# así Neon puede dormir en los huecos sin tráfico real.
engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    poolclass=None if is_sqlite else NullPool,
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
