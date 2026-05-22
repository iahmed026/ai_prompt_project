from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func

from app.core.database import Base


class PromptHistory(Base):
    __tablename__ = "prompt_history"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(120), default="legacy", index=True, nullable=False)
    niche_id = Column(String(80), index=True, nullable=False)
    context = Column(Text, default="", nullable=False)
    selection_json = Column(Text, default="{}", nullable=False)
    final_template = Column(Text, nullable=False)
    optimized_prompt = Column(Text, nullable=False)
    cached = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
