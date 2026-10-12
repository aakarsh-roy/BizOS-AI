import asyncio
from app.api.website import _process_crawl

async def test():
    # Mock company_id and document_id
    # Wait, we need the DB connection.
    from app.database import init_db
    import os
    os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
    
    await _process_crawl("https://example.com", 2, "test_company", "test_doc_id")

if __name__ == "__main__":
    asyncio.run(test())
