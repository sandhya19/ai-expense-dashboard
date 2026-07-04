import asyncio
import logging
import time
from typing import Protocol

from app.core.config import Settings
from app.core.exceptions import ExternalProviderError, TemporaryProviderError
from app.models.ocr import OCRResult

logger = logging.getLogger(__name__)


class OCRProvider(Protocol):
    """OCR provider interface."""

    @property
    def name(self) -> str:
        """Provider name."""

    async def extract_text(self, content: bytes, mime_type: str) -> OCRResult:
        """Extract text from receipt bytes."""


class MockOCRProvider:
    """Local and test OCR provider."""

    name = "mock"

    async def extract_text(self, content: bytes, mime_type: str) -> OCRResult:
        started = time.perf_counter()
        await asyncio.sleep(0)
        text = "Mock Merchant\nSubtotal 10.00\nTax 2.00\nTotal 12.00\nCurrency GBP"
        return OCRResult(
            raw_text=text,
            provider_name=self.name,
            duration_ms=int((time.perf_counter() - started) * 1000),
            metadata={"mime_type": mime_type, "bytes": len(content)},
        )


class GoogleVisionOCRProvider:
    """Google Cloud Vision OCR provider with timeout and retry handling."""

    name = "google_vision"

    def __init__(self, timeout_seconds: float, max_retries: int) -> None:
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    async def extract_text(self, content: bytes, mime_type: str) -> OCRResult:
        started = time.perf_counter()
        for attempt in range(self.max_retries + 1):
            try:
                raw_text = await asyncio.wait_for(
                    asyncio.to_thread(self._extract_text_sync, content),
                    timeout=self.timeout_seconds,
                )
                return OCRResult(
                    raw_text=raw_text,
                    provider_name=self.name,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                    metadata={"mime_type": mime_type, "attempt": attempt + 1},
                )
            except TimeoutError:
                logger.warning(
                    "ocr_provider_timeout provider=%s attempt=%s",
                    self.name,
                    attempt + 1,
                )
                if attempt >= self.max_retries:
                    return OCRResult(
                        provider_name=self.name,
                        duration_ms=int((time.perf_counter() - started) * 1000),
                        error="OCR provider timed out",
                    )
                await asyncio.sleep(0.2 * (attempt + 1))
            except TemporaryProviderError:
                if attempt >= self.max_retries:
                    raise
                await asyncio.sleep(0.2 * (attempt + 1))
            except Exception as exc:  # pragma: no cover - defensive provider boundary
                raise ExternalProviderError("Google Vision OCR failed") from exc
        return OCRResult(
            provider_name=self.name,
            duration_ms=int((time.perf_counter() - started) * 1000),
            error="OCR provider failed",
        )

    def _extract_text_sync(self, content: bytes) -> str:
        try:
            from google.cloud import vision
        except ImportError as exc:  # pragma: no cover - depends on production optional setup
            raise ExternalProviderError("google-cloud-vision is not installed") from exc

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        response = client.text_detection(image=image)
        if response.error.message:
            raise ExternalProviderError(response.error.message)
        return response.full_text_annotation.text or ""


def create_ocr_provider(settings: Settings) -> OCRProvider:
    """Create the configured OCR provider."""
    if settings.ocr_provider == "google_vision":
        return GoogleVisionOCRProvider(settings.ocr_timeout_seconds, settings.ocr_max_retries)
    return MockOCRProvider()
