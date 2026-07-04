import httpx
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.security import SupabaseAuthTokenVerifier

RealAsyncClient = httpx.AsyncClient


class MockAsyncClient:
    def __init__(self, transport: httpx.MockTransport) -> None:
        self.client = RealAsyncClient(transport=transport)

    async def __aenter__(self) -> "MockAsyncClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.client.aclose()

    async def get(
        self,
        url: str,
        headers: dict[str, str],
    ) -> httpx.Response:
        return await self.client.get(url, headers=headers)


def test_upload_requires_authentication(unauthenticated_client: TestClient) -> None:
    response = unauthenticated_client.post(
        "/v1/receipts",
        files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_supabase_auth_verifier_requires_publishable_key() -> None:
    verifier = SupabaseAuthTokenVerifier(
        Settings(
            supabase_url="https://example.supabase.co",
            supabase_publishable_key="",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        await verifier.verify("token")

    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_supabase_auth_verifier_rejects_invalid_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"message": "invalid"})

    transport = httpx.MockTransport(handler)

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **_: MockAsyncClient(transport),
    )

    verifier = SupabaseAuthTokenVerifier(
        Settings(
            supabase_url="https://example.supabase.co",
            supabase_publishable_key="publishable",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        await verifier.verify("bad-token")

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_supabase_auth_verifier_returns_user(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["apikey"] == "publishable"
        assert request.headers["authorization"] == "Bearer good-token"
        return httpx.Response(
            200,
            json={
                "id": "user-1",
                "email": "user@example.com",
            },
        )

    transport = httpx.MockTransport(handler)

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **_: MockAsyncClient(transport),
    )

    verifier = SupabaseAuthTokenVerifier(
        Settings(
            supabase_url="https://example.supabase.co",
            supabase_publishable_key="publishable",
        )
    )

    user = await verifier.verify("good-token")

    assert user.user_id == "user-1"
    assert user.email == "user@example.com"
