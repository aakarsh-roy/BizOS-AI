"""
BizOS AI — Chat API Routes
Handles conversations with AI agents, message persistence, and streaming.
Supports real tool-calling agents with action tracking.
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
import json
import asyncio

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.chat import ChatMessageRequest, WidgetChatMessageRequest
from app.agents.router_agent import RouterAgent
from app.agents.support_agent import SupportAgent
from app.agents.sales_agent import SalesAgent
from app.agents.revenue_agent import RevenueAgent
from app.agents.finance_agent import FinanceAgent
from app.agents.operations_agent import OperationsAgent
from app.agents.widget_agent import WidgetAgent
from app.services.data_analysis import parse_data_file

router = APIRouter()

# Agent factory
AGENT_MAP = {
    "support": SupportAgent,
    "sales": SalesAgent,
    "revenue": RevenueAgent,
    "finance": FinanceAgent,
    "operations": OperationsAgent,
}


def get_agent(agent_type: str, company_id: str):
    """Get the appropriate agent instance."""
    agent_class = AGENT_MAP.get(agent_type)
    if not agent_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid agent type: {agent_type}. Valid types: {', '.join(AGENT_MAP.keys())}",
        )
    return agent_class(company_id=company_id)


@router.post("/unified/stream")
async def unified_chat_stream(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message to the Orchestrator Router Agent (Authenticated)."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    company_id = current_user["company_id"]

    conversation_id = request.conversation_id
    if conversation_id:
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "company_id": company_id,
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_doc = {
            "title": request.message[:50] + ("..." if len(request.message) > 50 else ""),
            "agent_type": "unified",
            "company_id": company_id,
            "user_id": current_user["_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.conversations.insert_one(conv_doc)
        conversation_id = str(result.inserted_id)

    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.message,
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg)

    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    async def event_generator():
        agent = RouterAgent(company_id=company_id)
        full_response = ""
        all_sources = []
        all_actions = []

        yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\n\n"

        try:
            async for event in agent.process_message_stream(
                message=request.message,
                conversation_history=history[:-1],
            ):
                event_type = event["type"]
                if event_type == "content":
                    full_response += event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "sources":
                    all_sources = event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type in ["tool_call", "tool_result", "actions", "router_info"]:
                    if event_type == "actions":
                        all_actions = event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "done":
                    yield f"data: {json.dumps(event)}\n\n"

            assistant_msg = {
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": full_response,
                "sources": all_sources,
                "actions": all_actions,
                "created_at": datetime.now(timezone.utc),
            }
            await db.messages.insert_one(assistant_msg)
            await db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"updated_at": datetime.now(timezone.utc)}},
            )

        except Exception as e:
            print(f"Error in unified stream: {e}")
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/widget/stream")
async def widget_chat_stream(
    request: WidgetChatMessageRequest,
):
    """External unauthenticated endpoint for website widget."""
    db = get_database()
    company_id = request.company_id
    
    # Verify company exists
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    conversation_id = request.conversation_id
    if conversation_id:
        try:
            conversation = await db.conversations.find_one({
                "_id": ObjectId(conversation_id),
                "company_id": company_id,
            })
            if not conversation:
                conversation_id = None
        except Exception:
            # Invalid ObjectId format (e.g. string "null" from JS storage bugs)
            conversation_id = None
            
    if not conversation_id:
        conv_doc = {
            "title": request.message[:50] + ("..." if len(request.message) > 50 else ""),
            "agent_type": "widget",
            "company_id": company_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_widget": True,
        }
        result = await db.conversations.insert_one(conv_doc)
        conversation_id = str(result.inserted_id)

    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.message,
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg)

    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    async def event_generator():
        agent = WidgetAgent(company_id=company_id)
        full_response = ""
        all_sources = []
        all_actions = []

        yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\n\n"

        try:
            async for event in agent.process_message_stream(
                message=request.message,
                conversation_history=history[:-1],
            ):
                event_type = event["type"]
                if event_type == "content":
                    full_response += event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "sources":
                    all_sources = event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type in ["tool_call", "tool_result", "actions", "router_info"]:
                    if event_type == "actions":
                        all_actions = event["data"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "done":
                    yield f"data: {json.dumps(event)}\n\n"

            assistant_msg = {
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": full_response,
                "sources": all_sources,
                "actions": all_actions,
                "created_at": datetime.now(timezone.utc),
            }
            await db.messages.insert_one(assistant_msg)
            await db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"updated_at": datetime.now(timezone.utc)}},
            )

        except Exception as e:
            print(f"Error in widget stream: {e}")
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/{agent_type}")
async def chat_with_agent(
    agent_type: str,
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message to an AI agent and get a response."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    company_id = current_user["company_id"]

    # Get or create conversation
    conversation_id = request.conversation_id
    if conversation_id:
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "company_id": company_id,
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conv_doc = {
            "title": request.message[:50] + ("..." if len(request.message) > 50 else ""),
            "agent_type": agent_type,
            "company_id": company_id,
            "user_id": current_user["_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.conversations.insert_one(conv_doc)
        conversation_id = str(result.inserted_id)

    # Save user message
    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.message,
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg)

    # Get conversation history
    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    # Get agent response (now with tool calling!)
    agent = get_agent(agent_type, company_id)
    result = await agent.process_message(
        message=request.message,
        conversation_history=history[:-1],  # Exclude the message we just added
    )

    # Save assistant message
    assistant_msg = {
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": result["answer"],
        "sources": result.get("sources", []),
        "actions": result.get("actions", []),
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(assistant_msg)

    # Update conversation timestamp
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


@router.post("/{agent_type}/stream")
async def chat_with_agent_stream(
    agent_type: str,
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message and receive a streamed response via SSE with real-time tool call events."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()
    company_id = current_user["company_id"]

    # Get or create conversation
    conversation_id = request.conversation_id
    if conversation_id:
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "company_id": company_id,
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_doc = {
            "title": request.message[:50] + ("..." if len(request.message) > 50 else ""),
            "agent_type": agent_type,
            "company_id": company_id,
            "user_id": current_user["_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.conversations.insert_one(conv_doc)
        conversation_id = str(result.inserted_id)

    # Save user message
    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.message,
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg)

    # Get conversation history
    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    async def event_generator():
        agent = get_agent(agent_type, company_id)
        full_response = ""
        all_sources = []
        all_actions = []

        # Send conversation_id first
        yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\n\n"

        try:
            async for event in agent.process_message_stream(
                message=request.message,
                conversation_history=history[:-1],
            ):
                event_type = event["type"]

                if event_type == "tool_call":
                    # Agent is calling a tool — send to frontend for live UI
                    yield f"data: {json.dumps({'type': 'tool_call', 'data': event['data']}, default=str)}\n\n"

                elif event_type == "tool_result":
                    # Tool finished — send result summary
                    yield f"data: {json.dumps({'type': 'tool_result', 'data': event['data']}, default=str)}\n\n"

                elif event_type == "content":
                    # Real streaming content token
                    full_response += event["data"]
                    yield f"data: {json.dumps({'type': 'content', 'data': event['data']})}\n\n"

                elif event_type == "sources":
                    all_sources = event["data"]
                    yield f"data: {json.dumps({'type': 'sources', 'data': all_sources}, default=str)}\n\n"

                elif event_type == "actions":
                    all_actions = event["data"]
                    yield f"data: {json.dumps({'type': 'actions', 'data': all_actions}, default=str)}\n\n"

                elif event_type == "done":
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
            full_response = f"I encountered an error while processing your request: {str(e)}"

        # Save assistant message
        assistant_msg = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": full_response,
            "sources": all_sources,
            "actions": all_actions,
            "created_at": datetime.now(timezone.utc),
        }
        await db.messages.insert_one(assistant_msg)

        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.now(timezone.utc)}},
        )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{agent_type}/upload")
async def chat_with_data_upload(
    agent_type: str,
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Chat with data file upload (for Revenue and Finance agents)."""
    if agent_type not in ("revenue", "finance"):
        raise HTTPException(
            status_code=400,
            detail="File upload is only supported for Revenue and Finance agents",
        )

    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    # Validate file type
    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

    # Read and parse file
    file_bytes = await file.read()
    data_summary = parse_data_file(file_bytes, file.filename)

    if not data_summary:
        raise HTTPException(status_code=400, detail="Failed to parse data file")

    db = get_database()
    company_id = current_user["company_id"]

    # Get or create conversation
    if conversation_id:
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "company_id": company_id,
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_doc = {
            "title": f"Data Analysis: {file.filename}",
            "agent_type": agent_type,
            "company_id": company_id,
            "user_id": current_user["_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.conversations.insert_one(conv_doc)
        conversation_id = str(result.inserted_id)

    # Save user message
    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": f"[Uploaded: {file.filename}]\n{message}",
        "sources": [],
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg)

    # Get conversation history
    history = []
    cursor = db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(20)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    # Get agent response with data context (agent can also use tools!)
    agent = get_agent(agent_type, company_id)
    result = await agent.process_message(
        message=message,
        conversation_history=history[:-1],
        additional_context=data_summary,
    )

    # Save assistant message
    assistant_msg = {
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": result["answer"],
        "sources": result.get("sources", []),
        "actions": result.get("actions", []),
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(assistant_msg)

    return {
        "success": True,
        "conversation_id": conversation_id,
        "message": result["answer"],
        "sources": result.get("sources", []),
        "actions": result.get("actions", []),
    }


@router.get("/conversations")
async def list_conversations(
    agent_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List all conversations for the current user."""
    db = get_database()

    query = {
        "company_id": current_user.get("company_id"),
        "user_id": current_user["_id"],
    }
    if agent_type:
        query["agent_type"] = agent_type

    cursor = db.conversations.find(query).sort("updated_at", -1)

    conversations = []
    async for conv in cursor:
        conversations.append({
            "id": str(conv["_id"]),
            "title": conv["title"],
            "agent_type": conv["agent_type"],
            "created_at": conv["created_at"].isoformat(),
            "updated_at": conv["updated_at"].isoformat(),
        })

    return {"success": True, "conversations": conversations}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all messages in a conversation."""
    db = get_database()

    # Verify conversation belongs to user's company
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
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
