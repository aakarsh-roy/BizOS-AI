"""
BizOS AI — Chatbot Configuration API
GET/PUT /api/chatbot (authenticated) and public branding endpoint.
"""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.chatbot import (
    ChatbotConfigUpdate,
    ChatbotConfigResponse,
    PublicChatbotConfigResponse,
)

router = APIRouter()

DEFAULT_WELCOME_MESSAGE = "Hi! I'm here to help. How can I assist you today?"


def default_chatbot_doc(company_id: str, company_name: str = "") -> dict:
    """Build a default chatbot configuration document."""
    now = datetime.now(timezone.utc)
    name = f"{company_name} Assistant".strip() if company_name else "AI Assistant"
    return {
        "company_id": company_id,
        "public_id": secrets.token_urlsafe(16),
        "name": name[:50],
        "welcome_message": DEFAULT_WELCOME_MESSAGE,
        "tone": "friendly",
        "system_instructions": "",
        "enabled_actions": {"lead_capture": True, "ticket_creation": True},
        "widget_color": "#2563eb",
        "allowed_origins": [],
        "created_at": now,
        "updated_at": now,
    }


async def get_or_create_chatbot(company_id: str) -> dict:
    """Fetch the chatbot config for a company, creating a default one if missing."""
    db = get_database()
    chatbot = await db.chatbots.find_one({"company_id": company_id})
    if chatbot:
        return chatbot

    # Derive a sensible default name from the company
    company_name = ""
    try:
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if company:
            company_name = company.get("name", "")
    except Exception:
        pass

    doc = default_chatbot_doc(company_id, company_name)
    await db.chatbots.insert_one(doc)
    # Retry if a concurrent request created one first
    existing = await db.chatbots.find_one({"company_id": company_id})
    return existing or doc


def serialize_chatbot(doc: dict) -> dict:
    """Convert a chatbot document into the API response shape."""
    return {
        "id": str(doc["_id"]),
        "company_id": doc["company_id"],
        "public_id": doc["public_id"],
        "name": doc.get("name", "AI Assistant"),
        "welcome_message": doc.get("welcome_message", DEFAULT_WELCOME_MESSAGE),
        "tone": doc.get("tone", "friendly"),
        "system_instructions": doc.get("system_instructions", ""),
        "enabled_actions": doc.get(
            "enabled_actions", {"lead_capture": True, "ticket_creation": True}
        ),
        "widget_color": doc.get("widget_color", "#2563eb"),
        "allowed_origins": doc.get("allowed_origins", []),
        "created_at": doc["created_at"].isoformat(),
        "updated_at": doc["updated_at"].isoformat(),
    }


@router.get("", response_model=ChatbotConfigResponse)
async def get_chatbot_config(current_user: dict = Depends(get_current_user)):
    """Get the current workspace's chatbot configuration."""
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    chatbot = await get_or_create_chatbot(company_id)
    return serialize_chatbot(chatbot)


@router.put("", response_model=ChatbotConfigResponse)
async def update_chatbot_config(
    request: ChatbotConfigUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the current workspace's chatbot configuration."""
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    chatbot = await get_or_create_chatbot(company_id)

    updates = request.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        return serialize_chatbot(chatbot)

    updates["updated_at"] = datetime.now(timezone.utc)
    await db.chatbots.update_one(
        {"_id": chatbot["_id"]},
        {"$set": updates},
    )
    updated = await db.chatbots.find_one({"_id": chatbot["_id"]})
    return serialize_chatbot(updated)


@router.get("/public/{public_id}", response_model=PublicChatbotConfigResponse)
async def get_public_chatbot_config(public_id: str):
    """
    Public branding endpoint for the embeddable widget.
    Exposes only visitor-safe fields — never instructions, origins, or business data.
    """
    db = get_database()
    chatbot = await db.chatbots.find_one({"public_id": public_id})
    if not chatbot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chatbot not found")

    return {
        "name": chatbot.get("name", "AI Assistant"),
        "welcome_message": chatbot.get("welcome_message", DEFAULT_WELCOME_MESSAGE),
        "tone": chatbot.get("tone", "friendly"),
        "widget_color": chatbot.get("widget_color", "#2563eb"),
    }
