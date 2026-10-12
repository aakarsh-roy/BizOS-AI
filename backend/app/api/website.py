"""
BizOS AI — Website Knowledge Import API
Crawls a website, extracts text, and creates embeddings.
"""

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from bson import ObjectId
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from collections import deque

import httpx
from bs4 import BeautifulSoup

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.document import WebsiteCrawlRequest
from app.services.document_processor import chunk_text, generate_embeddings
from app.vectorstore.mongo_vector import MongoVectorStore

router = APIRouter()


async def crawl_website(base_url: str, max_pages: int = 20) -> list[dict]:
    """
    Crawl a website starting from base_url.
    Returns list of {url, text} dicts.
    Max 20 pages.
    """
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url

    visited = set()
    queue = deque([base_url])
    pages = []
    domain = urlparse(base_url).netloc

    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
    ) as client:
        while queue and len(pages) < max_pages:
            url = queue.popleft()
            if url in visited:
                continue
            visited.add(url)

            try:
                response = await client.get(url)
                if response.status_code != 200:
                    continue
                if "text/html" not in response.headers.get("content-type", ""):
                    continue

                soup = BeautifulSoup(response.text, "html.parser")

                # Remove script and style elements
                for tag in soup(["script", "style", "nav", "footer", "header"]):
                    tag.decompose()

                text = soup.get_text(separator="\n", strip=True)

                # Clean up text
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                clean_text = "\n".join(lines)

                if len(clean_text) > 20:  # Skip empty or nearly empty pages
                    pages.append({"url": url, "text": clean_text})

                # Find links on the same domain
                for link in soup.find_all("a", href=True):
                    href = urljoin(url, link["href"])
                    parsed = urlparse(href)
                    if parsed.netloc == domain and href not in visited:
                        # Clean URL (remove fragments)
                        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                        if clean_url not in visited:
                            visited.add(clean_url)
                            queue.append(clean_url)

            except Exception as e:
                print(f"Error crawling {url}: {e}")
                continue

    return pages


async def _process_crawl(
    base_url: str,
    max_pages: int,
    company_id: str,
    document_id: str,
):
    """Background task: crawl website and create embeddings."""
    db = get_database()

    try:
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "processing"}},
        )

        # Crawl website
        pages = await crawl_website(base_url, max_pages)

        if not pages:
            await db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"status": "failed"}},
            )
            return

        # Process each page
        total_chunks = 0
        for page in pages:
            chunks = chunk_text(page["text"])
            if not chunks:
                continue

            embeddings = await generate_embeddings(chunks)

            chunk_docs = [
                {"content": chunk, "embedding": embedding}
                for chunk, embedding in zip(chunks, embeddings)
            ]

            count = await MongoVectorStore.store_chunks(
                chunks=chunk_docs,
                company_id=company_id,
                document_id=document_id,
                source=page["url"],
            )
            total_chunks += count

        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "completed", "chunk_count": total_chunks}},
        )

    except Exception as e:
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "failed"}},
        )
        print(f"Website crawl failed: {e}")


@router.post("/crawl", status_code=status.HTTP_202_ACCEPTED)
async def crawl_website_endpoint(
    request: WebsiteCrawlRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Import knowledge from a website by crawling it."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    db = get_database()

    # Create document record for tracking
    doc = {
        "filename": f"Website: {request.url}",
        "file_url": request.url,
        "file_type": "website",
        "company_id": current_user["company_id"],
        "uploaded_by": current_user["_id"],
        "status": "pending",
        "chunk_count": 0,
        "uploaded_at": datetime.now(timezone.utc),
    }

    result = await db.documents.insert_one(doc)
    document_id = str(result.inserted_id)

    # Start crawl in background
    background_tasks.add_task(
        _process_crawl,
        request.url,
        request.max_pages,
        current_user["company_id"],
        document_id,
    )

    return {
        "success": True,
        "message": f"Crawling started for {request.url} (max {request.max_pages} pages)",
        "document_id": document_id,
    }
