import pytest
from httpx import AsyncClient


class TestCompanyEndpoints:
    """Test company endpoints."""
    
    async def get_auth_headers(self, client: AsyncClient, user_data: dict) -> dict:
        """Helper to register user and get auth headers."""
        response = await client.post("/api/v1/auth/register", json=user_data)
        token = response.json()["data"]["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.asyncio
    async def test_register_company(self, client: AsyncClient, test_user_data, test_company_data):
        """Test company registration."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.post(
            "/api/v1/companies/register",
            json=test_company_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == test_company_data["name"]
        assert data["data"]["inn"] == test_company_data["inn"]
    
    @pytest.mark.asyncio
    async def test_register_company_duplicate_inn(self, client: AsyncClient, test_user_data, test_company_data):
        """Test company registration with duplicate INN fails."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # First registration
        await client.post(
            "/api/v1/companies/register",
            json=test_company_data,
            headers=headers
        )
        
        # Register another user
        user2 = {**test_user_data, "email": "test2@example.com"}
        headers2 = await self.get_auth_headers(client, user2)
        
        # Try to register with same INN
        response = await client.post(
            "/api/v1/companies/register",
            json=test_company_data,
            headers=headers2
        )
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_find_company_by_inn(self, client: AsyncClient, test_user_data, test_company_data):
        """Test finding company by INN."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Register company
        await client.post(
            "/api/v1/companies/register",
            json=test_company_data,
            headers=headers
        )
        
        # Find company
        response = await client.get(
            f"/api/v1/companies/find?inn={test_company_data['inn']}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["inn"] == test_company_data["inn"]
    
    @pytest.mark.asyncio
    async def test_find_nonexistent_company(self, client: AsyncClient, test_user_data):
        """Test finding non-existent company returns null."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.get(
            "/api/v1/companies/find?inn=999999999",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"] is None
