"""
BizOS AI — Lead Management API Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.lead import CreateLeadRequest

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_lead(
    request: CreateLeadRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new lead."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()

    lead_doc = {
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "notes": request.notes,
        "source": request.source,
        "company_id": current_user["company_id"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.leads.insert_one(lead_doc)

    return {
        "success": True,
        "lead": {
            "id": str(result.inserted_id),
            **{k: v for k, v in lead_doc.items() if k != "_id"},
            "created_at": lead_doc["created_at"].isoformat(),
            "updated_at": lead_doc["updated_at"].isoformat(),
        },
    }


@router.get("/")
async def list_leads(
    search: Optional[str] = None,
    source: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List all leads for the current company."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="No company found")

    db = get_database()
    query = {"company_id": current_user["company_id"]}

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if source:
        query["source"] = source

    cursor = db.leads.find(query).sort("created_at", -1)

    leads = []
    async for lead in cursor:
        leads.append({
            "id": str(lead["_id"]),
            "name": lead["name"],
            "email": lead["email"],
            "phone": lead.get("phone"),
            "notes": lead.get("notes"),
            "source": lead.get("source", "manual"),
            "company_id": lead["company_id"],
            "created_at": lead["created_at"].isoformat(),
        })

    return {"success": True, "leads": leads, "total": len(leads)}


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific lead."""
    db = get_database()

    lead = await db.leads.find_one({
        "_id": ObjectId(lead_id),
        "company_id": current_user.get("company_id"),
    })

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return {
        "success": True,
        "lead": {
            "id": str(lead["_id"]),
            "name": lead["name"],
            "email": lead["email"],
            "phone": lead.get("phone"),
            "notes": lead.get("notes"),
            "source": lead.get("source", "manual"),
            "company_id": lead["company_id"],
            "created_at": lead["created_at"].isoformat(),
        },
    }
