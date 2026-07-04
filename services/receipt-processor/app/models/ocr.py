from pydantic import BaseModel, Field


class OCRResult(BaseModel):
    """OCR provider result."""

    raw_text: str = ""
    provider_name: str
    duration_ms: int = Field(ge=0)
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    error: str | None = None
