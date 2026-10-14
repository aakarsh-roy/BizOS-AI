"""
BizOS AI — Chat Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None


class WidgetChatMessageRequest(BaseModel):
    chatbot_id: Optional[str] = Field(None, max_length=64)
    company_id: Optional[str] = None  # legacy identifier
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    conversation_id: str
    message: str
    sources: list[dict] = []


class ConversationResponse(BaseModel):
    id: str
    title: str
    agent_type: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] = []
    created_at: str


class ConversationListResponse(BaseModel):
    success: bool = True
    conversations: list[ConversationResponse]
