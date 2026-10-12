"""
BizOS AI — Company Model
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CompanyModel(BaseModel):
    """Company document schema for MongoDB."""
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
