import asyncio
from app.api.website import crawl_website

async def test():
    pages = await crawl_website("example.com", 2)
    print("Result for example.com:", pages)

if __name__ == "__main__":
    asyncio.run(test())
