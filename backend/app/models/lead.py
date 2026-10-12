"""
BizOS AI — Lead Model
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class LeadModel(BaseModel):
    """Lead document schema for MongoDB."""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    notes: Optional[str] = None
    source: str = "sales_agent"  # how the lead was captured
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
