"""
BizOS AI — Document Model
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentModel(BaseModel):
    """Document metadata schema for MongoDB."""
    filename: str
    file_url: str
    file_type: str
    company_id: str
    uploaded_by: str
    status: DocumentStatus = DocumentStatus.PENDING
    chunk_count: int = 0
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


class DocumentChunkModel(BaseModel):
    """Document chunk with embedding for vector search."""
    document_id: str
    company_id: str
    content: str
    embedding: list[float]
    source: str  # filename or URL
    chunk_index: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
