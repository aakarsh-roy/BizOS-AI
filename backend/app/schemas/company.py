"""
BizOS AI — Company Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class CreateCompanyRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    industry: str = Field(..., min_length=2, max_length=100)
    website: Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)


class CompanyResponse(BaseModel):
    id: str
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    owner_id: str
    created_at: str
