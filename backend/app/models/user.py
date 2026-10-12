"""
BizOS AI — User Model
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class UserModel(BaseModel):
    """User document schema for MongoDB."""
    email: EmailStr
    password_hash: str
    name: str
    role: UserRole = UserRole.MEMBER
    company_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
