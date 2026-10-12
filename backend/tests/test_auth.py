"""
BizOS AI — Authentication Tests
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


@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.anyio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


@pytest.mark.anyio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate emails are rejected."""
    # Register first user
    await client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "duplicate@example.com",
            "password": "testpassword123",
        },
    )

    # Try to register with same email
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "Another User",
            "email": "duplicate@example.com",
            "password": "testpassword456",
        },
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_login(client: AsyncClient):
    """Test user login."""
    # Register first
    await client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "testpassword123",
        },
    )

    # Login
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient):
    """Test login with wrong password."""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_me_unauthorized(client: AsyncClient):
    """Test /me endpoint without token."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 403  # No bearer token
