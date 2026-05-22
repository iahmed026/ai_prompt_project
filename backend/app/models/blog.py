from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func

from app.core.database import Base


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(220), nullable=False, index=True)
    slug = Column(String(260), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary = Column(String(500), nullable=False)
    image_url = Column(String(1000), default="", nullable=False)
    author = Column(String(120), default="Prompt Studio Team", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    published = Column(Boolean, default=True, nullable=False, index=True)
