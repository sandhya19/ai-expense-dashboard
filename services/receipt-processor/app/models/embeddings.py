from pydantic import BaseModel


class EmbeddingResult(BaseModel):
    """Embedding provider result."""

    provider_name: str
    vector: list[float]
    metadata: dict[str, str | int | float | bool | None] = {}
