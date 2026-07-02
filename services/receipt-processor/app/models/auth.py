from pydantic import BaseModel, ConfigDict


class AuthenticatedUser(BaseModel):
    """Authenticated Supabase user identity."""

    model_config = ConfigDict(frozen=True)

    user_id: str
    email: str | None = None
