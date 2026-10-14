"""
BizOS AI — Async MongoDB Connection
Uses Motor for async MongoDB operations.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import certifi
from app.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Initialize MongoDB connection."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
    db = client[settings.DATABASE_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("company_id")
    await db.companies.create_index("owner_id")
    await db.documents.create_index("company_id")
    await db.conversations.create_index("company_id")
    await db.conversations.create_index("user_id")
    await db.messages.create_index("conversation_id")
    await db.tickets.create_index("company_id")
    await db.leads.create_index("company_id")
    await db.document_chunks.create_index("company_id")
    await db.chatbots.create_index("company_id", unique=True)
    await db.chatbots.create_index("public_id", unique=True)

    print(f"[SUCCESS] Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("[DISCONNECTED] Disconnected from MongoDB")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return db
