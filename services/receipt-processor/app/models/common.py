from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response shape."""

    detail: str
