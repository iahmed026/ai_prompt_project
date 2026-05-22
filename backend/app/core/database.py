from typing import Generator

from sqlalchemy import inspect, text
from sqlalchemy import create_engine
from sqlalchemy.orm import (
    declarative_base,
    sessionmaker,
    Session,
)
from sqlalchemy.pool import StaticPool

from app.core.config import settings


# ==========================================
# DATABASE HELPERS
# ==========================================
def get_connect_args(database_url: str) -> dict:
    """
    Database-specific connection arguments.
    """

    if database_url.startswith("sqlite"):
        return {
            "check_same_thread": False,
        }

    return {}


def get_engine_kwargs(database_url: str) -> dict:
    """
    Database-specific engine configuration.
    """

    kwargs = {
        "connect_args": get_connect_args(database_url),

        # Automatically checks dead connections
        "pool_pre_ping": True,
    }

    # Special handling for in-memory SQLite
    if database_url in {
        "sqlite://",
        "sqlite:///:memory:",
    }:
        kwargs["poolclass"] = StaticPool

    return kwargs


# ==========================================
# ENGINE
# ==========================================
engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    **get_engine_kwargs(settings.DATABASE_URL),
)


# ==========================================
# SESSION
# ==========================================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,

    # SQLAlchemy 2.0 style
    future=True,
)


# ==========================================
# BASE MODEL
# ==========================================
Base = declarative_base()


# ==========================================
# DATABASE INITIALIZATION
# ==========================================
def init_db() -> None:
    """
    Initialize database tables.
    """

    from app.models import blog, prompt, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
    ensure_prompt_history_schema()

    # Demo articles make the blog module usable immediately in local/dev setups.
    from app.services.blog_service import seed_demo_blogs

    db = SessionLocal()

    try:
        seed_demo_blogs(db)
    finally:
        db.close()


def ensure_prompt_history_schema() -> None:
    """
    Add lightweight compatibility columns when an existing deployed database
    was created before the current model shape.
    """

    inspector = inspect(engine)

    if not inspector.has_table("prompt_history"):
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("prompt_history")
    }

    if "client_id" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE prompt_history "
                "ADD COLUMN client_id VARCHAR(120) NOT NULL DEFAULT 'legacy'"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_prompt_history_client_id "
                "ON prompt_history (client_id)"
            )
        )


# ==========================================
# DATABASE SESSION DEPENDENCY
# ==========================================
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI database dependency.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
