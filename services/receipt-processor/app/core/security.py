from dataclasses import dataclass
from typing import Protocol

import jwt
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.auth import AuthenticatedUser


class TokenVerifier(Protocol):
    """Interface for verifying bearer tokens."""

    def verify(self, token: str) -> AuthenticatedUser:
        """Verify a token and return the authenticated user."""


@dataclass(frozen=True)
class SupabaseJWTVerifier:
    """Verify Supabase JWTs using the configured project JWT secret."""

    settings: Settings

    def verify(self, token: str) -> AuthenticatedUser:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )
        if not self.settings.supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase JWT verification is not configured",
            )
        try:
            payload = jwt.decode(
                token,
                self.settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            ) from exc

        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            )
        return AuthenticatedUser(user_id=user_id, email=payload.get("email"))
