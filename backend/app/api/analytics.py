"""
BizOS AI — Analytics API Routes
Provides aggregated stats and chart data for the dashboard.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta

from app.database import get_database
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    """Get aggregated analytics overview for the dashboard."""
    company_id = current_user.get("company_id")
    if not company_id:
        return {
            "success": True,
            "stats": {
                "total_documents": 0,
                "total_chats": 0,
                "total_tickets": 0,
                "total_leads": 0,
                "active_agents": 5,
            },
        }

    db = get_database()

    # Count all entities
    total_documents = await db.documents.count_documents({"company_id": company_id})
    total_chats = await db.conversations.count_documents({"company_id": company_id})
    total_tickets = await db.tickets.count_documents({"company_id": company_id})
    total_leads = await db.leads.count_documents({"company_id": company_id})

    # Ticket status breakdown
    open_tickets = await db.tickets.count_documents({"company_id": company_id, "status": "open"})
    in_progress_tickets = await db.tickets.count_documents({"company_id": company_id, "status": "in_progress"})
    resolved_tickets = await db.tickets.count_documents({"company_id": company_id, "status": "resolved"})

    return {
        "success": True,
        "stats": {
            "total_documents": total_documents,
            "total_chats": total_chats,
            "total_tickets": total_tickets,
            "total_leads": total_leads,
            "active_agents": 5,
            "open_tickets": open_tickets,
            "in_progress_tickets": in_progress_tickets,
            "resolved_tickets": resolved_tickets,
        },
    }


@router.get("/charts")
async def get_chart_data(current_user: dict = Depends(get_current_user)):
    """Get time-series data for analytics charts."""
    company_id = current_user.get("company_id")
    if not company_id:
        return {"success": True, "charts": {}}

    db = get_database()

    # Get data for the last 30 days
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Agent usage (conversations per agent type)
    agent_usage_pipeline = [
        {"$match": {"company_id": company_id}},
        {"$group": {"_id": "$agent_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    agent_usage = {}
    async for doc in db.conversations.aggregate(agent_usage_pipeline):
        agent_usage[doc["_id"]] = doc["count"]

    # Conversations per day (last 30 days)
    daily_chats_pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "created_at": {"$gte": thirty_days_ago},
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    daily_chats = []
    async for doc in db.conversations.aggregate(daily_chats_pipeline):
        daily_chats.append({"date": doc["_id"], "chats": doc["count"]})

    # Tickets by priority
    tickets_by_priority_pipeline = [
        {"$match": {"company_id": company_id}},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
    ]
    tickets_by_priority = {}
    async for doc in db.tickets.aggregate(tickets_by_priority_pipeline):
        tickets_by_priority[doc["_id"]] = doc["count"]

    # Leads per day (last 30 days)
    daily_leads_pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "created_at": {"$gte": thirty_days_ago},
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    daily_leads = []
    async for doc in db.leads.aggregate(daily_leads_pipeline):
        daily_leads.append({"date": doc["_id"], "leads": doc["count"]})

    return {
        "success": True,
        "charts": {
            "agent_usage": agent_usage,
            "daily_chats": daily_chats,
            "tickets_by_priority": tickets_by_priority,
            "daily_leads": daily_leads,
        },
    }
