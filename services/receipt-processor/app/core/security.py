from dataclasses import dataclass
from typing import Protocol

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.auth import AuthenticatedUser


class TokenVerifier(Protocol):
    """Interface for verifying bearer tokens."""

    async def verify(self, token: str) -> AuthenticatedUser:
        """Verify a token and return the authenticated user."""


@dataclass(frozen=True)
class SupabaseAuthTokenVerifier:
    """Verify Supabase access tokens through the Supabase Auth server."""

    settings: Settings

    async def verify(self, token: str) -> AuthenticatedUser:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )

        if not self.settings.supabase_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase URL is not configured",
            )

        if not self.settings.supabase_publishable_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase publishable key is not configured",
            )

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.settings.supabase_url}/auth/v1/user",
                    headers={
                        "apikey": self.settings.supabase_publishable_key,
                        "Authorization": f"Bearer {token}",
                    },
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to verify Supabase token",
            ) from exc

        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to verify Supabase token",
            )

        payload = response.json()
        user_id = payload.get("id")

        if not isinstance(user_id, str) or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            )

        email = payload.get("email")

        return AuthenticatedUser(
            user_id=user_id,
            email=email if isinstance(email, str) else None,
        )
