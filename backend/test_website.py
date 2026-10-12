import asyncio
from app.api.website import crawl_website

async def test():
    pages = await crawl_website("https://example.com", 2)
    print(pages)

if __name__ == "__main__":
    asyncio.run(test())
