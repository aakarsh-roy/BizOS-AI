"""
BizOS AI — RAG Retriever
Retrieves relevant document chunks based on query similarity.
"""

from app.services.document_processor import get_embeddings_model
from app.vectorstore.mongo_vector import MongoVectorStore


async def retrieve_relevant_chunks(
    query: str,
    company_id: str,
    top_k: int = 5,
    min_score: float = 0.65,
) -> list[dict]:
    """
    Retrieve relevant document chunks for a query.
    1. Generate query embedding
    2. Perform vector similarity search
    3. Return top-k relevant chunks with metadata
    """
    # Generate query embedding
    model = get_embeddings_model()
    query_embedding = await model.aembed_query(query)

    # Search vector store
    results = await MongoVectorStore.similarity_search(
        query_embedding=query_embedding,
        company_id=company_id,
        top_k=top_k,
        min_score=min_score,
    )

    return results


def format_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    if not chunks:
        return "No relevant information found in the knowledge base."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source", "Unknown")
        content = chunk.get("content", "")
        context_parts.append(f"[Source {i}: {source}]\n{content}")

    return "\n\n---\n\n".join(context_parts)


def extract_sources(chunks: list[dict]) -> list[dict]:
    """Extract source citations from chunks."""
    sources = []
    seen = set()
    for chunk in chunks:
        source = chunk.get("source", "Unknown")
        if source not in seen:
            seen.add(source)
            sources.append({
                "source": source,
                "relevance": round(chunk.get("score", 0), 3),
            })
    return sources
