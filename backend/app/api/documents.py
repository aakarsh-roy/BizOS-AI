"""
BizOS AI — Document Upload & Management API
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, BackgroundTasks
from bson import ObjectId
from datetime import datetime, timezone

from app.database import get_database
from app.middleware.auth import get_current_user
from app.config import get_settings
from app.services.document_processor import process_document
from app.vectorstore.mongo_vector import MongoVectorStore

settings = get_settings()
router = APIRouter()

# Allowed file types
ALLOWED_TYPES = {"pdf", "docx", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def init_cloudinary():
    """Initialize Cloudinary configuration."""
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )


async def _process_and_update(
    file_bytes: bytes,
    file_type: str,
    document_id: str,
    company_id: str,
    filename: str,
):
    """Background task: process document and update status."""
    db = get_database()
    try:
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "processing"}},
        )

        chunk_count = await process_document(
            file_bytes=file_bytes,
            file_type=file_type,
            document_id=document_id,
            company_id=company_id,
            source=filename,
        )

        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "completed", "chunk_count": chunk_count}},
        )
    except Exception as e:
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "failed"}},
        )
        print(f"Document processing failed: {e}")


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a document to the knowledge base."""
    if not current_user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete company onboarding first",
        )

    # Validate file type
    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit",
        )

    # Upload to Cloudinary
    try:
        init_cloudinary()
        import io
        import cloudinary.uploader
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(file_bytes),
            resource_type="raw",
            folder=f"bizos/{current_user['company_id']}",
            public_id=file.filename,
        )
        file_url = upload_result["secure_url"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}",
        )

    # Store metadata in MongoDB
    doc = {
        "filename": file.filename,
        "file_url": file_url,
        "file_type": file_ext,
        "company_id": current_user["company_id"],
        "uploaded_by": current_user["_id"],
        "status": "pending",
        "chunk_count": 0,
        "uploaded_at": datetime.now(timezone.utc),
    }

    result = await get_database().documents.insert_one(doc)
    document_id = str(result.inserted_id)

    # Process document in background
    background_tasks.add_task(
        _process_and_update,
        file_bytes,
        file_ext,
        document_id,
        current_user["company_id"],
        file.filename,
    )

    return {
        "success": True,
        "document": {
            "id": document_id,
            "filename": file.filename,
            "file_url": file_url,
            "file_type": file_ext,
            "status": "pending",
            "uploaded_at": doc["uploaded_at"].isoformat(),
        },
    }


@router.get("/")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all documents for the current company."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="No company found")

    db = get_database()
    cursor = db.documents.find(
        {"company_id": current_user["company_id"]}
    ).sort("uploaded_at", -1)

    documents = []
    async for doc in cursor:
        documents.append({
            "id": str(doc["_id"]),
            "filename": doc["filename"],
            "file_url": doc["file_url"],
            "file_type": doc["file_type"],
            "status": doc["status"],
            "chunk_count": doc.get("chunk_count", 0),
            "uploaded_by": str(doc["uploaded_by"]),
            "uploaded_at": doc["uploaded_at"].isoformat(),
        })

    return {
        "success": True,
        "documents": documents,
        "total": len(documents),
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a document and its vector chunks."""
    db = get_database()

    doc = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "company_id": current_user.get("company_id"),
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete vector chunks
    await MongoVectorStore.delete_by_document(document_id)

    # Delete document metadata
    await db.documents.delete_one({"_id": ObjectId(document_id)})

    return {"success": True, "message": "Document deleted"}
