"""
BizOS AI — Company API Routes
POST /companies, GET /companies/me
"""

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.database import get_database
from app.schemas.company import CreateCompanyRequest, CompanyResponse
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_company(
    request: CreateCompanyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new company (onboarding)."""
    db = get_database()

    # Check if user already has a company
    if current_user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a company",
        )

    # Create company
    company_doc = {
        "name": request.name,
        "industry": request.industry,
        "website": request.website,
        "description": request.description,
        "owner_id": current_user["_id"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.companies.insert_one(company_doc)
    company_id = str(result.inserted_id)

    # Create the workspace's default chatbot configuration
    from app.api.chatbot import default_chatbot_doc
    await db.chatbots.insert_one(default_chatbot_doc(company_id, request.name))

    # Update user with company_id
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"company_id": company_id, "updated_at": datetime.now(timezone.utc)}},
    )

    return {
        "success": True,
        "company": {
            "id": company_id,
            "name": request.name,
            "industry": request.industry,
            "website": request.website,
            "description": request.description,
            "owner_id": current_user["_id"],
            "created_at": company_doc["created_at"].isoformat(),
        },
    }


@router.get("/me")
async def get_my_company(current_user: dict = Depends(get_current_user)):
    """Get the current user's company."""
    db = get_database()

    if not current_user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No company found. Please complete onboarding.",
        )

    company = await db.companies.find_one({"_id": ObjectId(current_user["company_id"])})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return {
        "success": True,
        "company": {
            "id": str(company["_id"]),
            "name": company["name"],
            "industry": company["industry"],
            "website": company.get("website"),
            "description": company.get("description"),
            "owner_id": str(company["owner_id"]),
            "created_at": company["created_at"].isoformat(),
        },
    }
