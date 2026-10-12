import asyncio
from app.api.website import crawl_website

async def main():
    pages = await crawl_website("https://example.com", 1)
    print(pages)

if __name__ == "__main__":
    asyncio.run(main())
