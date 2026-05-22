from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PromptGenerateRequest(BaseModel):
    niche_id: str = Field(..., min_length=1, max_length=80)
    selection: Dict[str, Any] = Field(default_factory=dict)
    context: str = Field(default="", max_length=4000)
    tone: Optional[str] = Field(default=None, max_length=80)
    length: Optional[str] = Field(default=None, max_length=80)
    extra: Dict[str, Any] = Field(default_factory=dict)


class PromptGenerateResponse(BaseModel):
    optimized_prompt: str
    final_template: str
    cached: bool = False


class PromptHistoryItem(BaseModel):
    id: int
    niche_id: str
    context: str
    selection: Dict[str, Any]
    final_template: str
    optimized_prompt: str
    cached: bool
    created_at: Optional[datetime]


class PromptHistoryResponse(BaseModel):
    history: List[PromptHistoryItem]
