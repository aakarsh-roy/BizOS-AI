"""
BizOS AI — Authentication API Routes
POST /auth/register, POST /auth/login
"""

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.database import get_database
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.middleware.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    serialize_doc,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account."""
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user document
    user_doc = {
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "role": "owner",  # first user is always owner
        "company_id": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate JWT
    token = create_access_token(data={"sub": user_id, "email": request.email})

    return AuthResponse(
        access_token=token,
        user={
            "id": user_id,
            "name": request.name,
            "email": request.email,
            "role": "owner",
            "company_id": None,
        },
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT."""
    db = get_database()

    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    user_id = str(user["_id"])
    token = create_access_token(data={"sub": user_id, "email": user["email"]})

    return AuthResponse(
        access_token=token,
        user={
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "company_id": str(user["company_id"]) if user.get("company_id") else None,
        },
    )


@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user."""
    return {
        "success": True,
        "user": {
            "id": current_user["_id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "company_id": current_user.get("company_id"),
        },
    }
