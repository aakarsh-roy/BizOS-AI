"""
BizOS AI — Ticket Tests
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Create a user and return auth headers."""
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "Ticket Test User",
            "email": "ticket_test@example.com",
            "password": "testpassword123",
        },
    )
    data = response.json()
    token = data["access_token"]

    # Create company
    await client.post(
        "/api/companies/",
        json={
            "name": "Test Company",
            "industry": "Technology",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_create_ticket(client: AsyncClient, auth_headers: dict):
    """Test creating a support ticket."""
    response = await client.post(
        "/api/tickets/",
        json={
            "title": "Test Ticket",
            "description": "This is a test ticket",
            "priority": "high",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["ticket"]["title"] == "Test Ticket"
    assert data["ticket"]["status"] == "open"


@pytest.mark.anyio
async def test_list_tickets(client: AsyncClient, auth_headers: dict):
    """Test listing tickets."""
    response = await client.get("/api/tickets/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "tickets" in data
