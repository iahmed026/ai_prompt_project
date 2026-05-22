from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class BlogBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=220)
    content: str = Field(..., min_length=10)
    summary: str = Field(..., min_length=10, max_length=500)
    image_url: str = Field(default="", max_length=1000)
    author: str = Field(default="Prompt Studio Team", min_length=1, max_length=120)
    published: bool = True


class BlogCreate(BlogBase):
    pass


class BlogUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=220)
    content: Optional[str] = Field(default=None, min_length=10)
    summary: Optional[str] = Field(default=None, min_length=10, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=1000)
    author: Optional[str] = Field(default=None, min_length=1, max_length=120)
    published: Optional[bool] = None


class BlogRead(BlogBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class BlogListItem(BaseModel):
    id: int
    title: str
    slug: str
    summary: str
    image_url: str
    author: str
    created_at: datetime
    updated_at: datetime
    published: bool

    model_config = {
        "from_attributes": True,
    }


class BlogListResponse(BaseModel):
    items: List[BlogListItem]
    total: int
    page: int
    page_size: int
    pages: int
