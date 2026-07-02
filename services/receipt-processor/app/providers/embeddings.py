from typing import Protocol

from app.models.embeddings import EmbeddingResult


class EmbeddingProvider(Protocol):
    """Embedding provider interface."""

    async def embed_text(self, text: str) -> EmbeddingResult:
        """Create an embedding vector for text."""


class MockEmbeddingProvider:
    """Deterministic local embedding provider."""

    async def embed_text(self, text: str) -> EmbeddingResult:
        length = float(min(len(text), 1000))
        return EmbeddingResult(provider_name="mock", vector=[length, 0.0, 1.0])
