"""
BizOS AI — Chatbot Configuration Schemas
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class EnabledActions(BaseModel):
    lead_capture: bool = True
    ticket_creation: bool = True


class ChatbotConfigUpdate(BaseModel):
    """Partial update of the chatbot configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    welcome_message: Optional[str] = Field(None, min_length=1, max_length=500)
    tone: Optional[Literal["friendly", "professional", "concise"]] = None
    system_instructions: Optional[str] = Field(None, max_length=2000)
    enabled_actions: Optional[EnabledActions] = None
    widget_color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    allowed_origins: Optional[list[str]] = Field(None, max_length=50)

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, v):
        if v is None:
            return v
        cleaned = []
        for origin in v:
            origin = origin.strip().rstrip("/")
            if not origin:
                continue
            if not origin.startswith(("http://", "https://")):
                raise ValueError(f"Invalid origin: {origin}")
            cleaned.append(origin)
        return cleaned


class ChatbotConfigResponse(BaseModel):
    """Full chatbot configuration (authenticated business owners only)."""
    id: str
    company_id: str
    public_id: str
    name: str
    welcome_message: str
    tone: str
    system_instructions: str
    enabled_actions: EnabledActions
    widget_color: str
    allowed_origins: list[str] = []
    created_at: str
    updated_at: str


class PublicChatbotConfigResponse(BaseModel):
    """Minimal branding information safe to expose to website visitors."""
    name: str
    welcome_message: str
    tone: str
    widget_color: str
