"""
BizOS AI — Ticket Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class CreateTicketRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=2, max_length=5000)
    priority: str = Field(default="medium", pattern=r"^(low|medium|high|urgent)$")


class UpdateTicketRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=2, max_length=5000)
    priority: Optional[str] = Field(None, pattern=r"^(low|medium|high|urgent)$")
    status: Optional[str] = Field(None, pattern=r"^(open|in_progress|resolved|closed)$")


class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    priority: str
    status: str
    company_id: str
    created_by: Optional[str] = None
    created_at: str
    updated_at: str


class TicketListResponse(BaseModel):
    success: bool = True
    tickets: list[TicketResponse]
    total: int
