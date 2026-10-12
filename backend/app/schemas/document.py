"""
BizOS AI — Document Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_url: str
    file_type: str
    status: str
    chunk_count: int
    uploaded_by: str
    uploaded_at: str


class DocumentListResponse(BaseModel):
    success: bool = True
    documents: list[DocumentResponse]
    total: int


class WebsiteCrawlRequest(BaseModel):
    url: str = Field(..., pattern=r"^https?://")
    max_pages: int = Field(default=20, ge=1, le=20)
