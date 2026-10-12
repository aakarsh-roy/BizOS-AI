"""
BizOS AI — Ticket API Routes
CRUD operations for support tickets.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.ticket import CreateTicketRequest, UpdateTicketRequest

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: CreateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new support ticket."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()

    ticket_doc = {
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "status": "open",
        "company_id": current_user["company_id"],
        "created_by": current_user["_id"],
        "assigned_to": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.tickets.insert_one(ticket_doc)

    return {
        "success": True,
        "ticket": {
            "id": str(result.inserted_id),
            **{k: v for k, v in ticket_doc.items() if k != "_id"},
            "created_at": ticket_doc["created_at"].isoformat(),
            "updated_at": ticket_doc["updated_at"].isoformat(),
        },
    }


@router.get("/")
async def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List all tickets for the current company."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="No company found")

    db = get_database()
    query = {"company_id": current_user["company_id"]}

    if status_filter:
        query["status"] = status_filter
    if priority:
        query["priority"] = priority

    cursor = db.tickets.find(query).sort("created_at", -1)

    tickets = []
    async for ticket in cursor:
        tickets.append({
            "id": str(ticket["_id"]),
            "title": ticket["title"],
            "description": ticket["description"],
            "priority": ticket["priority"],
            "status": ticket["status"],
            "company_id": ticket["company_id"],
            "created_by": ticket.get("created_by"),
            "created_at": ticket["created_at"].isoformat(),
            "updated_at": ticket["updated_at"].isoformat(),
        })

    return {"success": True, "tickets": tickets, "total": len(tickets)}


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific ticket."""
    db = get_database()

    ticket = await db.tickets.find_one({
        "_id": ObjectId(ticket_id),
        "company_id": current_user.get("company_id"),
    })

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return {
        "success": True,
        "ticket": {
            "id": str(ticket["_id"]),
            "title": ticket["title"],
            "description": ticket["description"],
            "priority": ticket["priority"],
            "status": ticket["status"],
            "company_id": ticket["company_id"],
            "created_by": ticket.get("created_by"),
            "created_at": ticket["created_at"].isoformat(),
            "updated_at": ticket["updated_at"].isoformat(),
        },
    }


@router.patch("/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    request: UpdateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update a ticket's status or details."""
    db = get_database()

    ticket = await db.tickets.find_one({
        "_id": ObjectId(ticket_id),
        "company_id": current_user.get("company_id"),
    })

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_data = {
        k: v for k, v in request.model_dump(exclude_unset=True).items() if v is not None
    }
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": update_data},
    )

    return {"success": True, "message": "Ticket updated"}
