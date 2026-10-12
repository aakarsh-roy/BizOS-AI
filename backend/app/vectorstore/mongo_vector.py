"""
BizOS AI — MongoDB Atlas Vector Search Integration
Stores embeddings and performs similarity search.
"""

from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

from app.database import get_database
from app.config import get_settings

settings = get_settings()


class MongoVectorStore:
    """MongoDB Atlas Vector Search wrapper."""

    COLLECTION_NAME = "document_chunks"
    INDEX_NAME = "vector_index"
    EMBEDDING_FIELD = "embedding"
    DIMENSIONS = 3072  # Google embedding dimensions

    @staticmethod
    async def store_chunks(
        chunks: list[dict],
        company_id: str,
        document_id: str,
        source: str,
    ) -> int:
        """
        Store document chunks with embeddings in MongoDB.
        Returns the number of chunks stored.
        """
        db = get_database()

        documents = []
        for i, chunk in enumerate(chunks):
            documents.append({
                "document_id": document_id,
                "company_id": company_id,
                "content": chunk["content"],
                "embedding": chunk["embedding"],
                "source": source,
                "chunk_index": i,
                "created_at": datetime.now(timezone.utc),
            })

        if documents:
            await db[MongoVectorStore.COLLECTION_NAME].insert_many(documents)

        return len(documents)

    @staticmethod
    async def similarity_search(
        query_embedding: list[float],
        company_id: str,
        top_k: int = 5,
        min_score: float = 0.7,
    ) -> list[dict]:
        """
        Perform vector similarity search filtered by company_id.
        Uses MongoDB Atlas Vector Search ($vectorSearch aggregation).
        """
        db = get_database()

        pipeline = [
            {
                "$vectorSearch": {
                    "index": MongoVectorStore.INDEX_NAME,
                    "path": MongoVectorStore.EMBEDDING_FIELD,
                    "queryVector": query_embedding,
                    "numCandidates": top_k * 10,
                    "limit": top_k,
                    "filter": {
                        "company_id": company_id
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "content": 1,
                    "source": 1,
                    "chunk_index": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        results = []
        async for doc in db[MongoVectorStore.COLLECTION_NAME].aggregate(pipeline):
            if doc.get("score", 0) >= min_score:
                results.append(doc)

        return results

    @staticmethod
    async def delete_by_document(document_id: str) -> int:
        """Delete all chunks for a specific document."""
        db = get_database()
        result = await db[MongoVectorStore.COLLECTION_NAME].delete_many(
            {"document_id": document_id}
        )
        return result.deleted_count

    @staticmethod
    async def delete_by_company(company_id: str) -> int:
        """Delete all chunks for a company."""
        db = get_database()
        result = await db[MongoVectorStore.COLLECTION_NAME].delete_many(
            {"company_id": company_id}
        )
        return result.deleted_count
