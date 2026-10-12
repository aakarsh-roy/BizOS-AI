"""
BizOS AI — RAG Chain
Connects the retriever to the Gemini LLM for answer generation.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import get_settings
from app.rag.retriever import retrieve_relevant_chunks, format_context, extract_sources

settings = get_settings()

# Initialize Gemini LLM
_llm = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-flash-lite-latest",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
            max_output_tokens=2048,
        )
    return _llm


async def rag_query(
    query: str,
    company_id: str,
    system_prompt: str,
    conversation_history: list[dict] = None,
) -> dict:
    """
    Full RAG query pipeline:
    1. Retrieve relevant chunks
    2. Build prompt with context
    3. Generate answer with Gemini
    4. Return answer with sources
    """
    # Step 1: Retrieve context
    chunks = await retrieve_relevant_chunks(query, company_id)
    context = format_context(chunks)
    sources = extract_sources(chunks)

    # Step 2: Build messages
    combined_system_prompt = (
        f"{system_prompt}\n\n"
        f"Use the following knowledge base context to answer the user's question. "
        f"If the context doesn't contain relevant information, say so honestly. "
        f"Always cite your sources when using information from the context.\n\n"
        f"CONTEXT:\n{context}"
    )
    messages = [
        ("system", combined_system_prompt),
    ]

    # Add conversation history
    if conversation_history:
        for msg in conversation_history[-10:]:  # Last 10 messages for context
            role = "human" if msg["role"] == "user" else "ai"
            messages.append((role, msg["content"]))

    # Add current query
    messages.append(("human", query))

    # Step 3: Generate answer
    llm = get_llm()
    response = await llm.ainvoke(messages)

    return {
        "answer": response.content,
        "sources": sources,
    }


async def direct_query(
    query: str,
    system_prompt: str,
    conversation_history: list[dict] = None,
    additional_context: str = "",
) -> dict:
    """
    Direct LLM query without RAG (for data analysis agents).
    """
    combined_system_prompt = system_prompt
    if additional_context:
        combined_system_prompt += f"\n\nAdditional context:\n{additional_context}"

    messages = [
        ("system", combined_system_prompt),
    ]

    if conversation_history:
        for msg in conversation_history[-10:]:
            role = "human" if msg["role"] == "user" else "ai"
            messages.append((role, msg["content"]))

    messages.append(("human", query))

    llm = get_llm()
    response = await llm.ainvoke(messages)

    return {
        "answer": response.content,
        "sources": [],
    }
