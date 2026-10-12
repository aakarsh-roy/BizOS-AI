"""
BizOS AI — Chat & Message Models
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AgentType(str, Enum):
    SUPPORT = "support"
    SALES = "sales"
    REVENUE = "revenue"
    FINANCE = "finance"
    OPERATIONS = "operations"


class ConversationModel(BaseModel):
    """Conversation document schema for MongoDB."""
    title: str = "New Conversation"
    agent_type: AgentType
    company_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageModel(BaseModel):
    """Message document schema for MongoDB."""
    conversation_id: str
    role: MessageRole
    content: str
    sources: list[dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
