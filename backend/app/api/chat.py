"""
BizOS AI — Chat API Routes
One conversational orchestration flow for the dashboard and the public widget:
streaming + non-streaming chat, conversation history, tenant-scoped persistence.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
import json

from app.middleware.rate_limit import limiter

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.chat import ChatMessageRequest, WidgetChatMessageRequest
from app.services.chatbot import Chatbot
from app.services.tools import PUBLIC_WIDGET_TOOLS, DASHBOARD_TOOLS, resolve_tool_names
from app.api.chatbot import get_or_create_chatbot

router = APIRouter()


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _get_or_create_conversation(
    db,
    conversation_id: Optional[str],
    company_id: str,
    title: str,
    source: str,
    user_id=None,
) -> str:
    """Resolve an existing conversation (tenant-scoped) or create a new one."""
    if conversation_id:
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "company_id": company_id,
        })
        if conversation:
            return conversation_id

    conv_doc = {
        "title": title[:50] + ("..." if len(title) > 50 else ""),
        "agent_type": source,  # "chatbot" (dashboard) or "widget" (public embed)
        "company_id": company_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    if user_id:
        conv_doc["user_id"] = user_id
    if source == "widget":
        conv_doc["is_widget"] = True

    result = await db.conversations.insert_one(conv_doc)
    return str(result.inserted_id)


async def _load_history(db, conversation_id: str) -> list[dict]:
    """Load the last 20 messages of a conversation as history."""
    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})
    return history


async def _save_user_message(db, conversation_id: str, content: str):
    await db.messages.insert_one({
        "conversation_id": conversation_id,
        "role": "user",
        "content": content,
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    })


async def _event_generator(
    chatbot: Chatbot,
    message: str,
    history: list[dict],
    conversation_id: str,
    db,
):
    """
    Shared SSE generator for all chat streams.
    Persists the assistant message once the stream completes.
    """
    full_response = ""
    all_sources = []
    all_actions = []

    yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\n\n"

    try:
        async for event in chatbot.process_message_stream(
            message=message,
            conversation_history=history[:-1] if history else history,
        ):
            event_type = event["type"]
            if event_type == "content":
                full_response += event["data"]
            elif event_type == "sources":
                all_sources = event["data"]
            elif event_type == "actions":
                all_actions = event["data"]

            yield f"data: {json.dumps(event, default=str)}\n\n"

        # Persist only substantive responses
        if full_response.strip() or all_actions:
            await db.messages.insert_one({
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": full_response,
                "sources": all_sources,
                "actions": all_actions,
                "created_at": datetime.now(timezone.utc),
            })
            await db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"updated_at": datetime.now(timezone.utc)}},
            )

    except Exception as e:
        # Never expose internal error details to clients (especially public widget visitors)
        print(f"Error in chat stream (conversation {conversation_id}): {e}")
        yield (
            "data: "
            + json.dumps({
                "type": "error",
                "data": "Sorry, something went wrong while processing your message. Please try again.",
            })
            + "\n\n"
        )


# ─── Dashboard chat (authenticated) ────────────────────────────────────────

@router.post("/stream")
async def chat_stream(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Stream a chatbot reply for the authenticated dashboard chat (SSE)."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    company_id = current_user["company_id"]

    conversation_id = await _get_or_create_conversation(
        db,
        request.conversation_id,
        company_id,
        request.message,
        source="chatbot",
        user_id=current_user["_id"],
    )
    await _save_user_message(db, conversation_id, request.message)
    history = await _load_history(db, conversation_id)

    chatbot_config = await get_or_create_chatbot(company_id)
    tool_names = resolve_tool_names(DASHBOARD_TOOLS, chatbot_config.get("enabled_actions"))
    chatbot = Chatbot(company_id=company_id, tool_names=tool_names, config=chatbot_config)

    return StreamingResponse(
        _event_generator(chatbot, request.message, history, conversation_id, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("")
async def chat(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Non-streaming fallback for the dashboard chat."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    company_id = current_user["company_id"]

    conversation_id = await _get_or_create_conversation(
        db,
        request.conversation_id,
        company_id,
        request.message,
        source="chatbot",
        user_id=current_user["_id"],
    )
    await _save_user_message(db, conversation_id, request.message)
    history = await _load_history(db, conversation_id)

    chatbot_config = await get_or_create_chatbot(company_id)
    tool_names = resolve_tool_names(DASHBOARD_TOOLS, chatbot_config.get("enabled_actions"))
    chatbot = Chatbot(company_id=company_id, tool_names=tool_names, config=chatbot_config)

    try:
        result = await chatbot.process_message(
            message=request.message,
            conversation_history=history[:-1],
        )
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to process message")

    await db.messages.insert_one({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": result["answer"],
        "sources": result.get("sources", []),
        "actions": result.get("actions", []),
        "created_at": datetime.now(timezone.utc),
    })
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    return {
        "success": True,
        "conversation_id": conversation_id,
        "message": result["answer"],
        "sources": result.get("sources", []),
        "actions": result.get("actions", []),
    }


# ─── Public widget chat (unauthenticated) ──────────────────────────────────

async def _resolve_widget_chatbot(payload: WidgetChatMessageRequest, request: Request):
    """Resolve a public widget request to (company_id, chatbot_config)."""
    db = get_database()

    if payload.chatbot_id:
        chatbot = await db.chatbots.find_one({"public_id": payload.chatbot_id})
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        company_id = chatbot["company_id"]
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Chatbot not found")
    elif payload.company_id:
        # Legacy identifier support
        try:
            company_oid = ObjectId(payload.company_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        company = await db.companies.find_one({"_id": company_oid})
        if not company:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        company_id = payload.company_id
        chatbot = await get_or_create_chatbot(company_id)
    else:
        raise HTTPException(status_code=400, detail="Missing chatbot identifier")

    # Origin policy (when configured): browser requests must come from allowed sites
    allowed_origins = chatbot.get("allowed_origins") or []
    if allowed_origins:
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") not in allowed_origins:
            raise HTTPException(status_code=403, detail="Origin not allowed")

    return company_id, chatbot


@router.post("/widget/stream")
@limiter.limit("30/minute")
async def widget_chat_stream(
    request: Request,
    payload: WidgetChatMessageRequest,
):
    """Public, rate-limited streaming endpoint for the embeddable website widget."""
    db = get_database()
    company_id, chatbot_config = await _resolve_widget_chatbot(payload, request)

    conversation_id = await _get_or_create_conversation(
        db,
        payload.conversation_id,
        company_id,
        payload.message,
        source="widget",
    )
    await _save_user_message(db, conversation_id, payload.message)
    history = await _load_history(db, conversation_id)

    tool_names = resolve_tool_names(PUBLIC_WIDGET_TOOLS, chatbot_config.get("enabled_actions"))
    chatbot = Chatbot(company_id=company_id, tool_names=tool_names, config=chatbot_config)

    return StreamingResponse(
        _event_generator(chatbot, payload.message, history, conversation_id, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ─── Conversation history ──────────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    """List conversations for the current workspace."""
    db = get_database()

    query: dict = {"company_id": current_user.get("company_id")}
    # Dashboard users see their own chat; widget conversations are listed too
    # so the business can review visitor conversations.
    cursor = db.conversations.find(query).sort("updated_at", -1)

    conversations = []
    async for conv in cursor:
        conversations.append({
            "id": str(conv["_id"]),
            "title": conv["title"],
            "agent_type": conv.get("agent_type", "chatbot"),
            "created_at": conv["created_at"].isoformat(),
            "updated_at": conv["updated_at"].isoformat(),
        })

    return {"success": True, "conversations": conversations}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all messages in a conversation (tenant-scoped)."""
    db = get_database()

    try:
        conv_oid = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation = await db.conversations.find_one({
        "_id": conv_oid,
        "company_id": current_user.get("company_id"),
    })
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1)

    messages = []
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "role": msg["role"],
            "content": msg["content"],
            "sources": msg.get("sources", []),
            "actions": msg.get("actions", []),
            "created_at": msg["created_at"].isoformat(),
        })

    return {"success": True, "messages": messages}
