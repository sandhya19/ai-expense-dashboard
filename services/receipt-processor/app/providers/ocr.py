import asyncio
import base64
import logging
import time
from typing import Protocol

import httpx

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


class QwenVLOCRProvider:
    """Alibaba Model Studio Qwen vision OCR provider."""

    name = "qwen_vl"

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        timeout_seconds: float,
        max_retries: int,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    async def extract_text(self, content: bytes, mime_type: str) -> OCRResult:
        started = time.perf_counter()

        if not self.api_key:
            return OCRResult(
                provider_name=self.name,
                duration_ms=0,
                error="Qwen API key is not configured",
            )

        if mime_type not in {"image/jpeg", "image/png"}:
            return OCRResult(
                provider_name=self.name,
                duration_ms=0,
                error="Qwen OCR currently supports JPG and PNG uploads",
            )

        for attempt in range(self.max_retries + 1):
            try:
                raw_text = await self._request_ocr(content, mime_type)
                return OCRResult(
                    raw_text=raw_text,
                    provider_name=self.name,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                    metadata={
                        "mime_type": mime_type,
                        "attempt": attempt + 1,
                        "model": self.model,
                    },
                )
            except httpx.TimeoutException:
                logger.warning(
                    "ocr_provider_timeout provider=%s attempt=%s",
                    self.name,
                    attempt + 1,
                )
                if attempt >= self.max_retries:
                    return OCRResult(
                        provider_name=self.name,
                        duration_ms=int((time.perf_counter() - started) * 1000),
                        error="Qwen OCR provider timed out",
                    )
                await asyncio.sleep(0.2 * (attempt + 1))
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code >= 500 and attempt < self.max_retries:
                    await asyncio.sleep(0.2 * (attempt + 1))
                    continue
                return OCRResult(
                    provider_name=self.name,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                    error=f"Qwen OCR failed with status {exc.response.status_code}",
                )
            except Exception as exc:  # pragma: no cover - defensive provider boundary
                raise ExternalProviderError("Qwen OCR failed") from exc

        return OCRResult(
            provider_name=self.name,
            duration_ms=int((time.perf_counter() - started) * 1000),
            error="Qwen OCR provider failed",
        )

    async def _request_ocr(self, content: bytes, mime_type: str) -> str:
        image_data = base64.b64encode(content).decode("ascii")
        data_uri = f"data:{mime_type};base64,{image_data}"
        url = f"{self.base_url}/chat/completions"
        prompt = (
            "Read this receipt image and transcribe all visible text line by line. "
            "Keep each product and its price in visual order; do not merge or reorder lines. "
            "Preserve merchant names, dates, item names, subtotal, tax, total, "
            "currency symbols, and payment details. Return only plain text."
        )
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_uri}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return self._extract_content(response.json())

    def _extract_content(self, payload: object) -> str:
        if not isinstance(payload, dict):
            raise ExternalProviderError("Qwen OCR response was not an object")

        choices = payload.get("choices")
        if not isinstance(choices, list) or not choices:
            raise ExternalProviderError("Qwen OCR response did not include choices")

        first_choice = choices[0]
        if not isinstance(first_choice, dict):
            raise ExternalProviderError("Qwen OCR choice was not an object")

        message = first_choice.get("message")
        if not isinstance(message, dict):
            raise ExternalProviderError("Qwen OCR response did not include a message")

        content = message.get("content")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts = [
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and isinstance(item.get("text"), str)
            ]
            return "\n".join(part.strip() for part in parts if part.strip())

        raise ExternalProviderError("Qwen OCR response content was empty")


def create_ocr_provider(settings: Settings) -> OCRProvider:
    """Create the configured OCR provider."""
    if settings.ocr_provider == "google_vision":
        return GoogleVisionOCRProvider(settings.ocr_timeout_seconds, settings.ocr_max_retries)
    if settings.ocr_provider == "qwen_vl":
        return QwenVLOCRProvider(
            api_key=settings.qwen_api_key,
            base_url=settings.qwen_base_url,
            model=settings.qwen_model,
            timeout_seconds=settings.ocr_timeout_seconds,
            max_retries=settings.ocr_max_retries,
        )
    return MockOCRProvider()
