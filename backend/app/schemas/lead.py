"""
BizOS AI — Lead Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class CreateLeadRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=2000)
    source: str = "manual"


class LeadResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    source: str
    company_id: str
    created_at: str


class LeadListResponse(BaseModel):
    success: bool = True
    leads: list[LeadResponse]
    total: int
