"""
BizOS AI — Chatbot Tool Registry
Defines all callable tools the chatbot can invoke.
Each tool is an async function that operates on the database and is
tenant-scoped through an injected company_id.
"""

from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.database import get_database
from app.rag.retriever import retrieve_relevant_chunks


# ─── Tool allowlists ────────────────────────────────────────────────────────

# Tools exposed to the public website widget (safe for anonymous visitors).
PUBLIC_WIDGET_TOOLS = [
    "search_knowledge_base",
    "create_ticket",
    "create_lead",
]

# Additional tools available to the authenticated dashboard chat only.
DASHBOARD_TOOLS = [
    "search_knowledge_base",
    "create_ticket",
    "list_tickets",
    "update_ticket",
    "create_lead",
    "list_leads",
    "list_documents",
]


def resolve_tool_names(base_tools: list[str], enabled_actions: dict | None) -> list[str]:
    """Filter a tool list down to the chatbot's enabled actions."""
    enabled = enabled_actions or {}
    out = []
    for name in base_tools:
        if name == "create_lead" and not enabled.get("lead_capture", True):
            continue
        if name == "create_ticket" and not enabled.get("ticket_creation", True):
            continue
        out.append(name)
    return out


# ─── Tool Definitions ───────────────────────────────────────────────────────

TOOL_DEFINITIONS = {
    "search_knowledge_base": {
        "name": "search_knowledge_base",
        "description": (
            "Search the company's knowledge base (uploaded documents, website crawls) "
            "for information relevant to a query. Use this when you need to look up "
            "policies, product details, FAQs, or any other company knowledge."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to find relevant information.",
                },
            },
            "required": ["query"],
        },
    },
    "create_ticket": {
        "name": "create_ticket",
        "description": (
            "Create a new support ticket in the system. CRITICAL: ONLY use this AFTER you "
            "have asked the customer for all necessary details (e.g., reproduction steps, "
            "device/browser info, error messages). Do not create incomplete tickets."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Brief title summarizing the issue (2-200 chars).",
                },
                "description": {
                    "type": "string",
                    "description": "Detailed description of the issue or request.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Priority level. Default: medium.",
                },
            },
            "required": ["title", "description"],
        },
    },
    "list_tickets": {
        "name": "list_tickets",
        "description": (
            "List support tickets for the company, optionally filtered by status "
            "or priority. Use this to check on open issues, find ticket counts, "
            "or get an overview of the support queue."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["open", "in_progress", "resolved", "closed"],
                    "description": "Filter tickets by status. Omit for all.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Filter tickets by priority. Omit for all.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max number of tickets to return. Default: 10.",
                },
            },
            "required": [],
        },
    },
    "update_ticket": {
        "name": "update_ticket",
        "description": (
            "Update an existing support ticket's status or priority. Use this "
            "when a ticket needs to be escalated, resolved, or reassigned."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "ticket_id": {
                    "type": "string",
                    "description": "The ID of the ticket to update.",
                },
                "status": {
                    "type": "string",
                    "enum": ["open", "in_progress", "resolved", "closed"],
                    "description": "New status for the ticket.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "New priority for the ticket.",
                },
            },
            "required": ["ticket_id"],
        },
    },
    "create_lead": {
        "name": "create_lead",
        "description": (
            "Save a new sales lead in the CRM. CRITICAL: Use this ONLY AFTER naturally qualifying "
            "the lead during the conversation and obtaining their name and email. Do not ask for "
            "this info abruptly."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Full name of the lead.",
                },
                "email": {
                    "type": "string",
                    "description": "Email address of the lead.",
                },
                "phone": {
                    "type": "string",
                    "description": "Phone number (optional).",
                },
                "notes": {
                    "type": "string",
                    "description": "Notes about the lead's interests, needs, or context.",
                },
                "source": {
                    "type": "string",
                    "description": "How the lead was acquired. Default: 'chatbot'.",
                },
            },
            "required": ["name", "email"],
        },
    },
    "list_leads": {
        "name": "list_leads",
        "description": (
            "List sales leads for the company, optionally searching by name or email. "
            "Use this to check existing leads, avoid duplicates, or review the pipeline."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "search": {
                    "type": "string",
                    "description": "Search by name or email. Omit for all.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max leads to return. Default: 10.",
                },
            },
            "required": [],
        },
    },
    "list_documents": {
        "name": "list_documents",
        "description": (
            "List documents in the company's knowledge base. Use this to see "
            "what data has been uploaded and its processing status."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max documents to return. Default: 20.",
                },
            },
            "required": [],
        },
    },
}


# ─── Tool Implementations ───────────────────────────────────────────────────

async def _search_knowledge_base(company_id: str, query: str, **kwargs) -> dict:
    """Vector-search the knowledge base."""
    try:
        # Imported lazily to avoid a circular import (chatbot.py imports tools).
        from app.services.chatbot import RETRIEVAL_TOP_K, RETRIEVAL_MIN_SCORE
        results = await retrieve_relevant_chunks(
            query=query,
            company_id=company_id,
            top_k=RETRIEVAL_TOP_K,
            min_score=RETRIEVAL_MIN_SCORE,
        )
        if not results:
            return {"found": 0, "message": "No relevant information found in the knowledge base."}
        return {
            "found": len(results),
            "results": [
                {"content": r["content"], "source": r.get("source", "Unknown"), "relevance": round(r.get("score", 0), 3)}
                for r in results
            ],
        }
    except Exception as e:
        return {"found": 0, "error": f"Knowledge base search failed: {str(e)}"}


async def _create_ticket(company_id: str, title: str, description: str, priority: str = "medium", **kwargs) -> dict:
    """Create a support ticket in MongoDB."""
    if priority not in ("low", "medium", "high", "urgent"):
        priority = "medium"
    db = get_database()
    ticket_doc = {
        "title": title,
        "description": description,
        "priority": priority,
        "status": "open",
        "company_id": company_id,
        "created_by": "chatbot",
        "assigned_to": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.tickets.insert_one(ticket_doc)
    return {
        "success": True,
        "ticket_id": str(result.inserted_id),
        "title": title,
        "priority": priority,
        "status": "open",
        "message": f"Ticket '{title}' created successfully with {priority} priority.",
    }


async def _list_tickets(company_id: str, status: str = None, priority: str = None, limit: int = 10, **kwargs) -> dict:
    """List tickets from MongoDB."""
    db = get_database()
    query = {"company_id": company_id}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    try:
        limit = max(1, min(int(limit), 50))
    except (TypeError, ValueError):
        limit = 10

    cursor = db.tickets.find(query).sort("created_at", -1).limit(limit)
    tickets = []
    async for ticket in cursor:
        tickets.append({
            "id": str(ticket["_id"]),
            "title": ticket["title"],
            "description": ticket["description"][:100] + "..." if len(ticket.get("description", "")) > 100 else ticket.get("description", ""),
            "priority": ticket["priority"],
            "status": ticket["status"],
            "created_at": ticket["created_at"].isoformat(),
        })

    total = await db.tickets.count_documents({"company_id": company_id})
    open_count = await db.tickets.count_documents({"company_id": company_id, "status": "open"})
    in_progress = await db.tickets.count_documents({"company_id": company_id, "status": "in_progress"})

    return {
        "tickets": tickets,
        "count": len(tickets),
        "total_in_system": total,
        "open": open_count,
        "in_progress": in_progress,
    }


async def _update_ticket(company_id: str, ticket_id: str, status: str = None, priority: str = None, **kwargs) -> dict:
    """Update a ticket's status or priority."""
    db = get_database()
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        return {"success": False, "error": "Invalid ticket id."}
    ticket = await db.tickets.find_one({"_id": oid, "company_id": company_id})
    if not ticket:
        return {"success": False, "error": f"Ticket {ticket_id} not found."}

    update_data = {"updated_at": datetime.now(timezone.utc)}
    if status:
        update_data["status"] = status
    if priority:
        update_data["priority"] = priority

    await db.tickets.update_one({"_id": oid}, {"$set": update_data})
    return {
        "success": True,
        "ticket_id": ticket_id,
        "title": ticket["title"],
        "updated_fields": {k: v for k, v in update_data.items() if k != "updated_at"},
        "message": f"Ticket '{ticket['title']}' updated successfully.",
    }


async def _create_lead(company_id: str, name: str, email: str, phone: str = None, notes: str = None, source: str = "chatbot", **kwargs) -> dict:
    """Create a lead in MongoDB."""
    db = get_database()

    existing = await db.leads.find_one({"company_id": company_id, "email": email})
    if existing:
        return {
            "success": False,
            "message": f"Lead with email {email} already exists.",
            "existing_lead": {
                "id": str(existing["_id"]),
                "name": existing["name"],
                "email": existing["email"],
            },
        }

    lead_doc = {
        "name": name,
        "email": email,
        "phone": phone,
        "notes": notes,
        "source": source,
        "company_id": company_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.leads.insert_one(lead_doc)
    return {
        "success": True,
        "lead_id": str(result.inserted_id),
        "name": name,
        "email": email,
        "message": f"Lead '{name}' ({email}) saved successfully.",
    }


async def _list_leads(company_id: str, search: str = None, limit: int = 10, **kwargs) -> dict:
    """List leads from MongoDB."""
    db = get_database()
    query = {"company_id": company_id}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    try:
        limit = max(1, min(int(limit), 50))
    except (TypeError, ValueError):
        limit = 10

    cursor = db.leads.find(query).sort("created_at", -1).limit(limit)
    leads = []
    async for lead in cursor:
        leads.append({
            "id": str(lead["_id"]),
            "name": lead["name"],
            "email": lead["email"],
            "phone": lead.get("phone"),
            "source": lead.get("source", "manual"),
            "created_at": lead["created_at"].isoformat(),
        })

    total = await db.leads.count_documents({"company_id": company_id})
    return {"leads": leads, "count": len(leads), "total_in_system": total}


async def _list_documents(company_id: str, limit: int = 20, **kwargs) -> dict:
    """List documents in the knowledge base."""
    db = get_database()
    try:
        limit = max(1, min(int(limit), 50))
    except (TypeError, ValueError):
        limit = 20

    cursor = db.documents.find({"company_id": company_id}).sort("uploaded_at", -1).limit(limit)
    docs = []
    async for doc in cursor:
        docs.append({
            "id": str(doc["_id"]),
            "filename": doc["filename"],
            "file_type": doc.get("file_type", "unknown"),
            "status": doc.get("status", "unknown"),
            "chunk_count": doc.get("chunk_count", 0),
            "uploaded_at": doc.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
        })

    total = await db.documents.count_documents({"company_id": company_id})
    return {"documents": docs, "count": len(docs), "total_in_system": total}


# ─── Tool Executor ──────────────────────────────────────────────────────────

TOOL_FUNCTIONS = {
    "search_knowledge_base": _search_knowledge_base,
    "create_ticket": _create_ticket,
    "list_tickets": _list_tickets,
    "update_ticket": _update_ticket,
    "create_lead": _create_lead,
    "list_leads": _list_leads,
    "list_documents": _list_documents,
}


async def execute_tool(tool_name: str, tool_args: dict, company_id: str) -> dict:
    """
    Execute a tool by name with the given arguments.
    Automatically injects company_id for data isolation.
    """
    func = TOOL_FUNCTIONS.get(tool_name)
    if not func:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        result = await func(company_id=company_id, **tool_args)
        return result
    except Exception as e:
        return {"error": f"Tool '{tool_name}' failed: {str(e)}"}


def get_tool_definitions(tool_names: list[str]) -> list[dict]:
    """Get tool definitions for a list of tool names."""
    return [TOOL_DEFINITIONS[name] for name in tool_names if name in TOOL_DEFINITIONS]
