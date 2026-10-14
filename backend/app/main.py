"""
BizOS AI — FastAPI Application Entry Point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

import sys
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    # Prevent aiohttp from hanging on import in Windows Python 3.13
    sys.modules['aiohttp'] = None

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection
from app.middleware.rate_limit import limiter

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered business assistant platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handlers ──────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"success": False, "message": "Resource not found"},
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        detail = str(exc)
    else:
        detail = "An unexpected error occurred"
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": detail},
    )


# ─── Import & Register Routers ──────────────────────────────────────────────

from app.api.auth import router as auth_router
from app.api.company import router as company_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.chatbot import router as chatbot_router
from app.api.tickets import router as tickets_router
from app.api.leads import router as leads_router
from app.api.analytics import router as analytics_router
from app.api.website import router as website_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(company_router, prefix="/api/companies", tags=["Companies"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(tickets_router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(leads_router, prefix="/api/leads", tags=["Leads"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(website_router, prefix="/api/knowledge", tags=["Knowledge"])


@app.get("/api/health")
async def health_check():
    return {"success": True, "message": "BizOS AI is running"}
