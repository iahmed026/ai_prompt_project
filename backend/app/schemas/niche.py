from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class OptionCreate(BaseModel):
    field: Literal["tasks", "constraints", "output_formats"]
    option: str = Field(..., min_length=1, max_length=160)


class NicheCreate(BaseModel):
    label: str = Field(..., min_length=2, max_length=80)
    description: str = Field(default="", max_length=300)


class NicheSchema(BaseModel):
    id: str
    label: str
    description: str = ""
    tasks: List[str] = []
    constraints: List[str] = []
    output_formats: List[str] = []
    best_practices: List[str] = []


class UISchema(BaseModel):
    version: str = "1.0"
    global_: Dict[str, Any] = Field(default_factory=dict, alias="global")
    niches: List[NicheSchema] = []

    class Config:
        populate_by_name = True
